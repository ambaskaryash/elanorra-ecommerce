'use client';

import { useAuth } from '@/lib/contexts/auth-context';
import {
  createRazorpayOptions,
  loadRazorpayScript,
  RazorpayOrderData,
  RazorpayResponse
} from '@/lib/razorpay';
import { useCartStore } from '@/lib/store/cart-store';
import { useOrderStore } from '@/lib/store/order-store';
import { formatPrice } from '@/lib/utils';
import {
  ArrowPathIcon,
  BanknotesIcon,
  CalendarIcon,
  CheckCircleIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  StarIcon,
  TruckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

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
  email?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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

export default function CheckoutContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, totalPrice, subtotalPrice, taxAmount, shippingAmount, appliedCoupon, clearCart } = useCartStore();
  const { createOrder } = useOrderStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
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
    email: '',
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
    email: '',
  });
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [selectedDelivery, setSelectedDelivery] = useState('standard');
  const [orderNotes, setOrderNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    if (items.length === 0) {
      router.push('/shop');
    }
  }, [items.length, router]);

  useEffect(() => {
    if (user) {
      setBillingAddress(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleAddressChange = (field: keyof Address, value: string, type: 'billing' | 'shipping') => {
    if (type === 'billing') {
      setBillingAddress(prev => ({ ...prev, [field]: value }));
      if (sameAsBilling) {
        setShippingAddress(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setShippingAddress(prev => ({ ...prev, [field]: value }));
    }
  };

  const handlePaymentSuccess = async (response: RazorpayResponse) => {
    try {
      const verifyResponse = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });

      if (verifyResponse.ok) {
        await createOrderInSystem(response);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed. Please contact support.');
      setIsProcessing(false);
    }
  };

  const processOnlinePayment = async () => {
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          currency: 'INR',
          customer: {
            name: `${billingAddress.firstName} ${billingAddress.lastName}`,
            email: user?.email || billingAddress.email || '',
            contact: billingAddress.phone,
          },
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const orderData: RazorpayOrderData = await orderResponse.json();

      const options = createRazorpayOptions(
        orderData,
        {
          name: `${billingAddress.firstName} ${billingAddress.lastName}`,
          email: user?.email || billingAddress.email || '',
          contact: billingAddress.phone,
        },
        handlePaymentSuccess,
        () => {
          setIsProcessing(false);
          toast.error('Payment cancelled');
        }
      );

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Payment processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const processCODOrder = async () => {
    await createOrderInSystem();
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      const requiredFields = ['firstName', 'lastName', 'address1', 'city', 'state', 'pincode', 'phone'];
      const missingFields = requiredFields.filter(field => !billingAddress[field as keyof Address]);

      if (missingFields.length > 0) {
        toast.error(`Please fill in: ${missingFields.join(', ')}`);
        setIsProcessing(false);
        return;
      }

      if (!/^[0-9]{6}$/.test(billingAddress.pincode)) {
        toast.error('Please enter a valid 6-digit PIN code');
        setIsProcessing(false);
        return;
      }

      if (!/^[0-9]{10}$/.test(billingAddress.phone)) {
        toast.error('Please enter a valid 10-digit phone number');
        setIsProcessing(false);
        return;
      }

      if (selectedPayment === 'cod') {
        await processCODOrder();
      } else {
        await processOnlinePayment();
      }
    } catch (error) {
      console.error('Order processing error:', error);
      toast.error('Failed to process order. Please try again.');
      setIsProcessing(false);
    }
  };

  const createOrderInSystem = async (paymentResponse?: RazorpayResponse) => {
    try {
      const orderData = {
        email: user?.email || billingAddress.email || '',
        lineItems: items.map(item => ({
          id: item.productId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
          title: item.product.name,
          totalDiscount: 0,
          image: item.product.images[0]?.src || '',
          product: {
            name: item.product.name,
            slug: item.product.slug,
            images: item.product.images,
          },
        })),
        shippingAddress: {
          firstName: billingAddress.firstName,
          lastName: billingAddress.lastName,
          company: billingAddress.company,
          address1: billingAddress.address1,
          address2: billingAddress.address2,
          city: billingAddress.city,
          state: billingAddress.state,
          zipCode: billingAddress.pincode,
          country: 'India',
          phone: billingAddress.phone,
        },
        billingAddress: {
          firstName: billingAddress.firstName,
          lastName: billingAddress.lastName,
          company: billingAddress.company,
          address1: billingAddress.address1,
          address2: billingAddress.address2,
          city: billingAddress.city,
          state: billingAddress.state,
          zipCode: billingAddress.pincode,
          country: 'India',
          phone: billingAddress.phone,
        },
        subtotal: subtotalPrice,
        taxes: taxAmount,
        shipping: shippingAmount,
        totalPrice: totalPrice,
        currency: 'INR',
      };

      const result = await createOrder(orderData);
      
      if (result.success) {
        clearCart();
        toast.success('Order placed successfully!');
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
          <p className="text-gray-600 mb-8">Add some items to your cart to proceed with checkout.</p>
          <Link
            href="/shop"
            className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Secure Checkout Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="font-bold text-xl text-gray-900">Elanorra</span>
              </Link>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <LockClosedIcon className="w-4 h-4 text-green-600" />
                <span>Secure Checkout</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Order Total</p>
                <p className="text-lg font-bold text-gray-900">{formatPrice(totalPrice)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, title: 'Delivery', icon: TruckIcon },
              { step: 2, title: 'Payment', icon: CreditCardIcon },
              { step: 3, title: 'Review', icon: CheckCircleIcon },
            ].map(({ step, title, icon: Icon }) => (
              <motion.div
                key={step}
                className="flex items-center space-x-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: step * 0.1 }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  currentStep >= step
                    ? 'bg-rose-600 border-rose-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step ? (
                    <CheckCircleIconSolid className="w-6 h-6" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  currentStep >= step ? 'text-rose-600' : 'text-gray-400'
                }`}>
                  {title}
                </span>
                {step < 3 && (
                  <div className={`w-16 h-0.5 ml-4 ${
                    currentStep > step ? 'bg-rose-600' : 'bg-gray-300'
                  }`} />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Delivery Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                    <TruckIcon className="w-5 h-5 text-rose-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Delivery Information</h2>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <input
                      type="text"
                      id="firstName"
                      value={billingAddress.firstName}
                      onChange={(e) => handleAddressChange('firstName', e.target.value, 'billing')}
                      className="peer w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder-transparent"
                      placeholder="First Name"
                      required
                    />
                    <label
                      htmlFor="firstName"
                      className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-700 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-rose-600"
                    >
                      First Name *
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      id="lastName"
                      value={billingAddress.lastName}
                      onChange={(e) => handleAddressChange('lastName', e.target.value, 'billing')}
                      className="peer w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder-transparent"
                      placeholder="Last Name"
                      required
                    />
                    <label
                      htmlFor="lastName"
                      className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-700 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-rose-600"
                    >
                      Last Name *
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    id="address1"
                    value={billingAddress.address1}
                    onChange={(e) => handleAddressChange('address1', e.target.value, 'billing')}
                    className="peer w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder-transparent"
                    placeholder="Street Address"
                    required
                  />
                  <label
                    htmlFor="address1"
                    className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-700 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-rose-600"
                  >
                    Street Address *
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative">
                    <input
                      type="text"
                      id="city"
                      value={billingAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value, 'billing')}
                      className="peer w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder-transparent"
                      placeholder="City"
                      required
                    />
                    <label
                      htmlFor="city"
                      className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-700 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-rose-600"
                    >
                      City *
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      id="state"
                      value={billingAddress.state}
                      onChange={(e) => handleAddressChange('state', e.target.value, 'billing')}
                      className="peer w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder-transparent"
                      placeholder="State"
                      required
                    />
                    <label
                      htmlFor="state"
                      className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-700 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-rose-600"
                    >
                      State *
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      id="pincode"
                      value={billingAddress.pincode}
                      onChange={(e) => handleAddressChange('pincode', e.target.value, 'billing')}
                      className="peer w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder-transparent"
                      placeholder="PIN Code"
                      required
                    />
                    <label
                      htmlFor="pincode"
                      className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-700 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-rose-600"
                    >
                      PIN Code *
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    id="phone"
                    value={billingAddress.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value, 'billing')}
                    className="peer w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder-transparent"
                    placeholder="Phone Number"
                    required
                  />
                  <label
                    htmlFor="phone"
                    className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-700 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-rose-600"
                  >
                    Phone Number *
                  </label>
                </div>
              </div>
            </motion.div>

            {/* Delivery Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Delivery Options</h2>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {deliveryOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
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
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedDelivery === option.id ? 'bg-rose-100' : 'bg-gray-100'
                        }`}>
                          <option.icon className={`w-5 h-5 ${
                            selectedDelivery === option.id ? 'text-rose-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{option.name}</h3>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {option.price === 0 ? 'Free' : formatPrice(option.price)}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCardIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                  <div className="flex items-center space-x-2 ml-auto">
                    <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Secure Payment</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
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
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedPayment === method.id ? 'bg-rose-100' : 'bg-gray-100'
                        }`}>
                          <method.icon className={`w-5 h-5 ${
                            selectedPayment === method.id ? 'text-rose-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{method.name}</h3>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                  <p className="text-sm text-gray-600 mt-1">{items.length} items</p>
                </div>

                <div className="p-6">
                  {/* Order Items */}
                  <div className="space-y-4 mb-6">
                    {items.slice(0, 3).map((item) => (
                      <div key={item.productId} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                        <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden shadow-sm">
                          <Image
                            src={item.product.images[0]?.src || '/placeholder.jpg'}
                            alt={item.product.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPrice(item.product.price)} each
                          </p>
                        </div>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="text-center py-2">
                        <span className="text-sm text-gray-500">
                          +{items.length - 3} more items
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 py-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatPrice(subtotalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery</span>
                      <span className="font-medium">
                        {shippingAmount === 0 ? 'Free' : formatPrice(shippingAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST (18%)</span>
                      <span className="font-medium">{formatPrice(taxAmount)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({appliedCoupon})</span>
                        <span className="font-medium">-{formatPrice(100)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-rose-600">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div className="py-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      />
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="w-full bg-rose-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <LockClosedIcon className="w-5 h-5" />
                        <span>Continue to Payment</span>
                      </>
                    )}
                  </button>

                  {/* Trust Indicators */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <ShieldCheckIcon className="w-8 h-8 text-green-600" />
                        <span className="text-xs text-gray-600">Secure Payment</span>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <TruckIcon className="w-8 h-8 text-blue-600" />
                        <span className="text-xs text-gray-600">Free Returns</span>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                        <span className="text-sm text-gray-600 ml-2">4.8/5 Customer Rating</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}