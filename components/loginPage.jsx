'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      toast.success('Welcome! Signed in with Google.', {
        duration: 3000,
        position: 'top-center',
      });
      router.push('/dashboard');
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setError('Failed to sign in with Google. Please try again.');
        toast.error('Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        setError('Email not verified yet. Please verify your email first.');
        toast.error('Email not verified yet. Please check your inbox and verify your email before logging in.', {
          duration: 5000,
          position: 'top-center',
        });
      } else {
        setError(error.message || 'Failed to login. Please check your credentials.');
        toast.error('Failed to login. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F5F7' }}>
      <Toaster />
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="text-4xl font-bold" style={{ color: '#299D91' }}>
              {/* Replace this with your logo image */}
                <img src="/assets/logo/logo.png" alt="Logo" className="h-20 w-auto" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3 font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#299D91', borderRadius: '8px' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or sign in with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-gray-700 py-3 font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#E4E7EB', borderRadius: '8px' }}
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          <Link href="/forgot-password" className="text-sm font-medium block text-center mt-3 hover:opacity-80" style={{ color: '#299D91' }}>
            Forgot password?
          </Link>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium hover:opacity-80" style={{ color: '#299D91' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
