'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { theme } from '@/lib/theme';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'manager',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      toast.success('Account created with Google! Welcome to the dashboard.', {
        duration: 3000,
        position: 'top-center',
      });
      router.push('/dashboard');
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setError('Failed to sign up with Google. Please try again.');
        toast.error('Failed to sign up with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      return setError('Please agree to the Terms of Service to continue');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 8) {
      return setError('Password must be at least 8 characters');
    }

    setLoading(true);

    try {
      await signup(formData.email, formData.password, formData.name, formData.role);
      toast.success('Verification email sent! Please check your inbox and verify before logging in.', {
        duration: 6000,
        position: 'top-center',
      });
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to create account. Please try again.');
      toast.error('Failed to create account. Please try again.');
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Create an Account</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition text-gray-700"
              >
                <span className="capitalize">{formData.role}</span>
                <svg
                  className="w-5 h-5 text-gray-500 transition-transform duration-200"
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  {['manager', 'owner'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, role: option });
                        setDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left capitalize hover:bg-gray-50 transition first:rounded-t-lg last:rounded-b-lg text-gray-700"
                      style={{
                        backgroundColor: formData.role === option ? theme.colors.background : 'transparent',
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-12"
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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                {showConfirmPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              id="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className=" w-4 h-4 rounded cursor-pointer"
              style={{
                accentColor: theme.colors.primary,
              }}
            />
            <label htmlFor="terms" className="text-xs text-gray-600 cursor-pointer">
              By continuing, you agree to our <span style={{ color: theme.colors.primary }} className="font-medium">Terms of Service</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3 font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
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
            Already have an account?{' '}
            <Link href="/login" className="font-medium hover:opacity-80" style={{ color: theme.colors.primary }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
