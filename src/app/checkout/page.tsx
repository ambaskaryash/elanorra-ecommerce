'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  TruckIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useCartStore } from '@/lib/store/cart-store';
import { useOrderStore } from '@/lib/store/order-store';
import { useAuth } from '@/lib/contexts/auth-context';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  loadRazorpayScript, 
  createRazorpayOptions, 
  formatAmountForRazorpay, 
  RazorpayResponse, 
  RazorpayOrderData 
} from '@/lib/razorpay';

interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  enabled: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: CreditCardIcon,
    description: 'Pay securely with your credit or debit card',
    enabled: true,
  },
  {
    id: 'upi',
    name: 'UPI Payment',
    icon: DevicePhoneMobileIcon,
    description: 'Pay using UPI apps like GPay, PhonePe, Paytm',
    enabled: true,
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    icon: BanknotesIcon,
    description: 'Pay directly from your bank account',
    enabled: true,
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    icon: TruckIcon,
    description: 'Pay when your order is delivered',
    enabled: true,
  },
];

const deliveryOptions = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: '5-7 business days',
    price: 200,
    icon: TruckIcon,
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: '2-3 business days',
    price: 500,
    icon: TruckIcon,
  },
  {
    id: 'premium',
    name: 'White Glove Delivery',
    description: 'Professional installation & setup',
    price: 1500,
    icon: CalendarIcon,
  },
];

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const { createOrder, isLoading: orderLoading } = useOrderStore();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [billingAddress, setBillingAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  const [shippingAddress, setShippingAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [selectedDelivery, setSelectedDelivery] = useState('standard');
  const [orderNotes, setOrderNotes] = useState('');

  // Payment form states
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });

  useEffect(() => {
    if (items.length === 0) {
      toast.error('Your cart is empty!');
      router.push('/shop');
      return;
    }
    
    // If user is authenticated, pre-fill billing address
    if (isAuthenticated && user && user.addresses.length > 0) {
      const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
      setBillingAddress({
        firstName: defaultAddress.firstName,
        lastName: defaultAddress.lastName,
        company: defaultAddress.company || '',
        address1: defaultAddress.address1,
        address2: defaultAddress.address2 || '',
        city: defaultAddress.city,
        state: defaultAddress.province,
        pincode: defaultAddress.zip,
        phone: defaultAddress.phone || user.phone || '',
      });
    }
  }, [items, isAuthenticated, user, router]);

  const handleAddressChange = (
    type: 'billing' | 'shipping',
    field: keyof Address,
    value: string
  ) => {
    const setter = type === 'billing' ? setBillingAddress : setShippingAddress;
    setter(prev => ({ ...prev, [field]: value }));
  };

  const selectedDeliveryOption = deliveryOptions.find(option => option.id === selectedDelivery);
  const deliveryPrice = selectedDeliveryOption?.price || 0;
  const taxAmount = Math.round(totalPrice * 0.18); // 18% GST
  const finalTotal = totalPrice + deliveryPrice + taxAmount;

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    setIsProcessing(true);

    try {
      // Validate required fields
      const requiredBillingFields = ['firstName', 'lastName', 'address1', 'city', 'state', 'pincode', 'phone'];
      const missingBillingFields = requiredBillingFields.filter(field => 
        !billingAddress[field as keyof Address]
      );

      if (missingBillingFields.length > 0) {
        toast.error('Please fill in all required billing address fields');
        setCurrentStep(1);
        setIsProcessing(false);
        return;
      }

      // Check if selected payment method is online payment
      if (['card', 'upi', 'netbanking'].includes(selectedPayment)) {
        await processOnlinePayment();
      } else if (selectedPayment === 'cod') {
        await processCODOrder();
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processOnlinePayment = async () => {
    // Load Razorpay script
    const razorpayLoaded = await loadRazorpayScript();
    if (!razorpayLoaded) {
      toast.error('Failed to load payment gateway. Please try again.');
      return;
    }

    // Create Razorpay order
    const orderResponse = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: finalTotal,
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        notes: {
          customer_name: `${billingAddress.firstName} ${billingAddress.lastName}`,
          customer_email: user?.email || 'guest@example.com',
        },
      }),
    });

    const orderData = await orderResponse.json();
    
    if (!orderData.success) {
      toast.error('Failed to create payment order');
      return;
    }

    // Configure Razorpay options
    const options = createRazorpayOptions(
      orderData.order,
      {
        name: `${billingAddress.firstName} ${billingAddress.lastName}`,
        email: user?.email || 'guest@example.com',
        contact: billingAddress.phone,
      },
      (response: RazorpayResponse) => {
        handlePaymentSuccess(response, orderData.order);
      },
      () => {
        toast.error('Payment was cancelled');
        setIsProcessing(false);
      }
    );

    // Open Razorpay checkout
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handlePaymentSuccess = async (response: RazorpayResponse, orderData: RazorpayOrderData) => {
    try {
      // Verify payment
      const verificationResponse = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          order_data: orderData,
        }),
      });

      const verificationData = await verificationResponse.json();
      
      if (verificationData.success) {
        // Create order in your system
        await createOrderInSystem(response, orderData);
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed');
    }
  };

  const processCODOrder = async () => {
    // Create order directly for COD
    await createOrderInSystem(null, null);
  };

  const createOrderInSystem = async (paymentResponse?: RazorpayResponse | null, razorpayOrder?: RazorpayOrderData | null) => {
    try {
      // Create order line items
      const lineItems = items.map(item => ({
        id: `${item.productId}-${Date.now()}`,
        productId: item.productId,
        title: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        totalDiscount: 0,
        image: item.product.images[0]?.src || '',
      }));

      const orderData = {
        email: user?.email || 'guest@example.com',
        lineItems,
        billingAddress: {
          ...billingAddress,
          id: 'billing-' + Date.now(),
          country: 'India',
          province: billingAddress.state,
          zip: billingAddress.pincode,
          isDefault: false,
        },
        shippingAddress: sameAsBilling ? {
          ...billingAddress,
          id: 'shipping-' + Date.now(),
          country: 'India',
          province: billingAddress.state,
          zip: billingAddress.pincode,
          isDefault: false,
        } : {
          ...shippingAddress,
          id: 'shipping-' + Date.now(),
          country: 'India',
          province: shippingAddress.state,
          zip: shippingAddress.pincode,
          isDefault: false,
        },
        subtotalPrice: totalPrice,
        totalTax: taxAmount,
        totalShipping: deliveryPrice,
        totalPrice: finalTotal,
        currency: 'INR',
        paymentMethod: selectedPayment,
        paymentStatus: selectedPayment === 'cod' ? 'pending' : 'paid',
        razorpayPaymentId: paymentResponse?.razorpay_payment_id,
        razorpayOrderId: paymentResponse?.razorpay_order_id,
      };

      const result = await createOrder(orderData);
      
      if (result.success) {
        // Clear cart and show success
        clearCart();
        toast.success('Order placed successfully!');
        
        // Redirect to order confirmation page
        router.push(`/order-confirmation/${result.orderId}`);
      } else {
        throw new Error(result.error || 'Order creation failed');
      }
      
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Failed to create order. Please contact support.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add some products to continue with checkout</p>
          <Link
            href="/shop"
            className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <div className="text-sm text-gray-500">
              Order Total: <span className="font-bold text-gray-900">{formatPrice(finalTotal)}</span>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-8">
            <div className="flex items-center space-x-8">
              {[
                { step: 1, name: 'Delivery', completed: currentStep > 1 },
                { step: 2, name: 'Payment', completed: currentStep > 2 },
                { step: 3, name: 'Review', completed: false },
              ].map((step, index) => (
                <div key={step.step} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      currentStep >= step.step
                        ? 'bg-rose-600 border-rose-600 text-white'
                        : 'border-gray-300 text-gray-400'
                    }`}
                  >
                    {step.completed ? '✓' : step.step}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      currentStep >= step.step ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.name}
                  </span>
                  {index < 2 && (
                    <div
                      className={`ml-8 w-16 h-0.5 ${
                        currentStep > step.step ? 'bg-rose-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Step 1: Delivery Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Information</h2>
                
                {/* Billing Address */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={billingAddress.firstName}
                        onChange={(e) => handleAddressChange('billing', 'firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={billingAddress.lastName}
                        onChange={(e) => handleAddressChange('billing', 'lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
                      <input
                        type="text"
                        value={billingAddress.company}
                        onChange={(e) => handleAddressChange('billing', 'company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                      <input
                        type="text"
                        value={billingAddress.address1}
                        onChange={(e) => handleAddressChange('billing', 'address1', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        value={billingAddress.address2}
                        onChange={(e) => handleAddressChange('billing', 'address2', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        value={billingAddress.city}
                        onChange={(e) => handleAddressChange('billing', 'city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <select
                        value={billingAddress.state}
                        onChange={(e) => handleAddressChange('billing', 'state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        required
                      >
                        <option value="">Select State</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Gujarat">Gujarat</option>
                        {/* Add more states */}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                      <input
                        type="text"
                        value={billingAddress.pincode}
                        onChange={(e) => handleAddressChange('billing', 'pincode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={billingAddress.phone}
                        onChange={(e) => handleAddressChange('billing', 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Options */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Options</h3>
                  <div className="space-y-3">
                    {deliveryOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedDelivery === option.id
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          value={option.id}
                          checked={selectedDelivery === option.id}
                          onChange={(e) => setSelectedDelivery(e.target.value)}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <option.icon className="h-6 w-6 ml-3 text-gray-400" />
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">{option.name}</span>
                            <span className="font-medium text-gray-900">
                              {option.price === 0 ? 'Free' : formatPrice(option.price)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-rose-600 text-white py-3 rounded-md font-medium hover:bg-rose-700 transition-colors"
                >
                  Continue to Payment
                </button>
              </motion.div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
                
                <div className="space-y-4 mb-8">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPayment === method.id
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={selectedPayment === method.id}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <method.icon className="h-6 w-6 ml-3 text-gray-400" />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{method.name}</div>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Card Details Form */}
                {selectedPayment === 'card' && (
                  <div className="mb-8 p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-4">Card Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-md font-medium hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 bg-rose-600 text-white py-3 rounded-md font-medium hover:bg-rose-700 transition-colors"
                  >
                    Review Order
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review & Place Order */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Order</h2>
                
                {/* Order Summary */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.productId} className="flex items-center space-x-4">
                        <div className="h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
                          <Image
                            src={item.product.images[0]?.src || '/images/placeholder.jpg'}
                            alt={item.product.name}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="font-medium text-gray-900">
                          {formatPrice(item.product.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes (Optional)</label>
                  <textarea
                    rows={3}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Any special instructions for your order..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-md font-medium hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="flex-1 bg-rose-600 text-white py-3 rounded-md font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : `Place Order - ${formatPrice(finalTotal)}`}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{deliveryPrice === 0 ? 'Free' : formatPrice(deliveryPrice)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span>{formatPrice(taxAmount)}</span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Secure Checkout</p>
                    <p className="text-xs text-green-600">Your payment information is protected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}