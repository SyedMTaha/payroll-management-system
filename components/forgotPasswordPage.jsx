'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast, { Toaster } from 'react-hot-toast';
import { theme } from '@/lib/theme';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
      toast.success('Password reset email sent! Check your inbox.', {
        duration: 5000,
        position: 'top-center',
      });
    } catch (error) {
      let errorMessage = 'Failed to send reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.colors.background }}>
        <Toaster />
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center my-8">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Sent!</h1>
            <p className="text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          <div className="rounded-lg p-4 mb-6 text-sm text-gray-700 border" style={{ backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }}>
            <p>
              Check your inbox and spam folder for the reset link. Click it to create a new password.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-block text-white py-2 px-6 font-semibold hover:opacity-90 transition"
            style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.colors.background }}>
      <Toaster />
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md my-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="text-4xl font-bold" style={{ color: theme.colors.primary }}>
              {/* Replace this with your logo image */}
              <img src="/assets/logo/logo.png" alt="Logo" className="h-20 w-auto" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your email address to get the password reset link</p>
        </div>

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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3 font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Remember your password?{' '}
            <Link href="/login" className="font-medium hover:opacity-80" style={{ color: theme.colors.primary }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
