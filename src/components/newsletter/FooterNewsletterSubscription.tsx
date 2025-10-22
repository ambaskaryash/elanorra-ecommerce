'use client';

import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';

const subscriptionSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  preferences: z.object({
    categories: z.array(z.string()).optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  }).optional(),
});

type SubscriptionData = z.infer<typeof subscriptionSchema>;

interface FooterNewsletterSubscriptionProps {
  className?: string;
}

export default function FooterNewsletterSubscription({
  className = '',
}: FooterNewsletterSubscriptionProps) {
  const [formData, setFormData] = useState<SubscriptionData>({
    email: '',
    firstName: '',
    lastName: '',
    preferences: {
      categories: [],
      frequency: 'weekly',
    },
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate form data
      const validatedData = subscriptionSchema.parse(formData);
      
      // Add source to the data
      const submissionData = {
        ...validatedData,
        source: 'footer',
      };

      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to subscribe');
      }

      // Show success toast
      toast.success('🎉 Welcome to the ElanorraLiving community!', {
        description: 'Check your email for exclusive offers and updates.',
        duration: 5000,
      });

      setIsSuccess(true);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        preferences: {
          categories: [],
          frequency: 'weekly',
        },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorMessage = err.errors[0].message;
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        const errorMessage = 'An unexpected error occurred';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`text-center ${className}`}>
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-600 rounded-full">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Welcome to the Community! 🎉
        </h3>
        <p className="text-gray-300 mb-4">
          Thank you for subscribing! Check your email for a welcome message with exclusive offers.
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="text-rose-400 hover:text-rose-300 font-medium underline"
        >
          Subscribe another email
        </button>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <h3 className="text-2xl font-bold mb-4 text-white">Join the ElanorraLiving Community</h3>
      <p className="text-gray-300 mb-6">
        Subscribe for exclusive offers, design inspiration, and the latest in luxury home living.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Enter your email"
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Subscribing...
            </>
          ) : (
            'Subscribe'
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-900/50 border border-red-700 rounded-md p-3 max-w-md mx-auto">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Privacy Notice */}
      <p className="text-xs text-gray-400 text-center mt-4 max-w-md mx-auto">
        By subscribing, you agree to receive marketing emails from ElanorraLiving. 
        You can unsubscribe at any time. View our{' '}
        <a href="/privacy" className="text-rose-400 hover:text-rose-300 underline">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}