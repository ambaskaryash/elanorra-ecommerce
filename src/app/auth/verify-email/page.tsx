'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified' | 'check-email'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const messageParam = searchParams.get('message');

  useEffect(() => {
    if (messageParam === 'check-email') {
      setStatus('check-email');
      setMessage('Please check your email for a verification link');
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    verifyEmail(token);
  }, [token, messageParam]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        toast.success('Email verified successfully!');
      } else {
        if (data.error === 'Email is already verified') {
          setStatus('already-verified');
          setMessage('Your email is already verified');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
          toast.error(data.error || 'Verification failed');
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred during verification');
      toast.error('An error occurred during verification');
    }
  };

  const handleContinue = () => {
    router.push('/auth/login');
  };

  const handleResendVerification = () => {
    router.push('/auth/resend-verification');
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Verifying your email...</h2>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold mb-2 text-green-800">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button 
              onClick={handleContinue} 
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Continue to Sign In
            </button>
          </div>
        );

      case 'already-verified':
          return (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold mb-2 text-blue-800">Already Verified</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button 
                onClick={handleContinue} 
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue to Sign In
              </button>
            </div>
          );

        case 'error':
          return (
            <div className="text-center">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h2 className="text-xl font-semibold mb-2 text-red-800">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <button 
                  onClick={handleResendVerification} 
                  className="w-full bg-white text-gray-700 py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </button>
                <button 
                  onClick={handleContinue} 
                  className="w-full bg-transparent text-gray-600 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          );

        case 'check-email':
          return (
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold mb-2 text-blue-800">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={handleResendVerification} 
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </button>
                <button 
                  onClick={handleContinue} 
                  className="w-full bg-transparent text-gray-600 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-center p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Email Verification</h1>
            <p className="text-gray-600 mt-2">
              Verify your email address to complete your account setup
            </p>
          </div>
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}