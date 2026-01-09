'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { theme } from '@/lib/theme';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-[#4B5768]"
              placeholder="john@gmail.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link href="/forgot-password" className="text-sm font-medium hover:opacity-80" style={{ color: theme.colors.primary }}>
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-12 text-[#4B5768]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="keepSignedIn"
              type="checkbox"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer"
              style={{ accentColor: theme.colors.primary }}
            />
            <label htmlFor="keepSignedIn" className="ml-2 text-sm text-gray-600 cursor-pointer">
              Keep me signed in
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3 font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="relative mb-6">
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
            style={{ backgroundColor: theme.colors.secondary, borderRadius: theme.radius.button }}
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium hover:opacity-80" style={{ color: theme.colors.primary }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
