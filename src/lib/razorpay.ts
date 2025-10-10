'use client';

// Razorpay Configuration
export const razorpayConfig = {
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_your_key_here',
  currency: 'INR',
  name: 'Elanorraa Living',
  description: 'Premium Home Decor & Lifestyle',
  image: '/logo.png', // Your company logo
  order_id: '',
  prefill: {
    name: '',
    email: '',
    contact: '',
  },
  notes: {
    address: 'Elanorraa Living Corporate Office',
  },
  theme: {
    color: '#e11d48', // Rose-600 color
  },
};

export interface RazorpayOptions extends Omit<typeof razorpayConfig, 'key_id'> {
  key: string;
  amount: number;
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOrderData {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

// Utility function to format amount for Razorpay (in paise)
export const formatAmountForRazorpay = (amount: number): number => {
  return Math.round(amount * 100); // Convert rupees to paise
};

// Utility function to format amount from Razorpay (from paise to rupees)
export const formatAmountFromRazorpay = (amount: number): number => {
  return amount / 100; // Convert paise to rupees
};

// Load Razorpay script dynamically
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if script is already loaded
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// Create Razorpay order options
export const createRazorpayOptions = (
  orderData: RazorpayOrderData,
  userDetails: {
    name: string;
    email: string;
    contact: string;
  },
  onSuccess: (response: RazorpayResponse) => void,
  onDismiss: () => void
): RazorpayOptions => {
  return {
    key: razorpayConfig.key_id,
    amount: orderData.amount,
    currency: orderData.currency,
    name: razorpayConfig.name,
    description: razorpayConfig.description,
    image: razorpayConfig.image,
    order_id: orderData.id,
    handler: onSuccess,
    prefill: {
      name: userDetails.name,
      email: userDetails.email,
      contact: userDetails.contact,
    },
    notes: razorpayConfig.notes,
    theme: razorpayConfig.theme,
    modal: {
      ondismiss: onDismiss,
    },
  };
};

// TypeScript declaration for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}