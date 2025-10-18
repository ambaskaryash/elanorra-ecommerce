'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = emailSchema.parse({ email });
      setIsLoading(true);

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success('Verification email sent successfully!');
      } else {
        toast.error(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    router.push('/auth/signin');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-center p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
              <p className="text-gray-600 mt-2">
                We've sent a new verification link to your email
              </p>
            </div>
            <div className="p-6">
              <div className="text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h2 className="text-xl font-semibold mb-2 text-blue-800">Verification Email Sent!</h2>
                <p className="text-gray-600 mb-6">
                  Please check your email inbox and click the verification link to activate your account.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Don't see the email? Check your spam folder or wait a few minutes for it to arrive.
                </p>
                <button 
                  onClick={handleBackToSignIn} 
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-center p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Resend Verification</h1>
            <p className="text-gray-600 mt-2">
              Enter your email to receive a new verification link
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email address"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Verification Email
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToSignIn}
                className="w-full bg-transparent text-gray-600 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}