'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { MdEdit, MdCheck, MdClose, MdCameraAlt, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import toast from 'react-hot-toast';
import { theme } from '@/lib/theme';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export default function SettingsPage() {
  const { user, userRole, auth } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null); // 'role', 'currency', 'timezone', or null
  const [profileImage, setProfileImage] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    username: user?.displayName?.toLowerCase().replace(/\s+/g, '.') || '',
    role: userRole || '',
    companyName: '',
    registrationNumber: '',
    currency: 'AED',
    timezone: 'Asia/Dubai',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        displayName: user.displayName || '',
        email: user.email || '',
        role: userRole || '',
        username: user.displayName?.toLowerCase().replace(/\s+/g, '.') || '',
      }));
    }
  }, [user, userRole]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setLoading(true);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: formData.displayName,
        phone: formData.phone,
        username: formData.username,
        role: formData.role,
        companyName: formData.companyName,
        registrationNumber: formData.registrationNumber,
        currency: formData.currency,
        timezone: formData.timezone,
        updatedAt: new Date().toISOString(),
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(prev => ({
      ...prev,
      displayName: user?.displayName || '',
      email: user?.email || '',
      phone: '',
      username: user?.displayName?.toLowerCase().replace(/\s+/g, '.') || '',
      role: userRole || '',
    }));
    setIsEditing(false);
    setDropdownOpen(null);
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        toast.success('Profile picture updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordData.newPassword);
      
      toast.success('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Error updating password: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('account');
              setIsEditing(false);
            }}
            className={`pb-4 font-semibold text-lg transition-all ${
              activeTab === 'account'
                ? 'text-gray-800 border-b-2'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{
              borderBottomColor: activeTab === 'account' ? theme.colors.primary : 'transparent',
            }}
          >
            Account
          </button>
          <button
            onClick={() => {
              setActiveTab('business');
              setIsEditing(false);
            }}
            className={`pb-4 font-semibold text-lg transition-all ${
              activeTab === 'business'
                ? 'text-gray-800 border-b-2'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{
              borderBottomColor: activeTab === 'business' ? theme.colors.primary : 'transparent',
            }}
          >
            Business Information
          </button>
          <button
            onClick={() => {
              setActiveTab('security');
              setIsEditing(false);
            }}
            className={`pb-4 font-semibold text-lg transition-all ${
              activeTab === 'security'
                ? 'text-gray-800 border-b-2'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{
              borderBottomColor: activeTab === 'security' ? theme.colors.primary : 'transparent',
            }}
          >
            Security
          </button>
        </div>
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-xl shadow-md p-8" style={{ backgroundColor: theme.colors.background }}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Information</h2>
                <p className="text-gray-600 text-sm">Update your personal details</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                  style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
                >
                  <MdEdit className="w-5 h-5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: Form Fields */}
              <div className="md:col-span-2 space-y-5">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Username</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder="username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder="+971 50 123 4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Role</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setDropdownOpen(dropdownOpen === 'role' ? null : 'role')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition text-gray-700"
                        >
                          <span className="capitalize">{formData.role}</span>
                          <svg
                            className="w-5 h-5 text-gray-500 transition-transform duration-200"
                            style={{
                              transform: dropdownOpen === 'role' ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </button>
                        {dropdownOpen === 'role' && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                            {['manager', 'owner'].map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, role: option });
                                  setDropdownOpen(null);
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

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
                      >
                        <MdCheck className="w-5 h-5" />
                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                        style={{ backgroundColor: '#9CA3AF', borderRadius: theme.radius.button }}
                      >
                        <MdClose className="w-5 h-5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Full Name</label>
                      <p className="text-gray-900 text-lg">{formData.displayName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Email</label>
                      <p className="text-gray-900 text-lg">{formData.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Username</label>
                      <p className="text-gray-900 text-lg">{formData.username || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Phone Number</label>
                      <p className="text-gray-900 text-lg">{formData.phone || 'Not provided'}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column: Profile Picture */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-full max-w-xs">
                  <label className="block text-sm font-semibold text-gray-800 mb-4 text-center">Your Profile Picture</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                      id="profile-image-input"
                    />
                    <label htmlFor="profile-image-input" className="cursor-pointer block">
                      {profileImage ? (
                        <div className="flex flex-col items-center">
                          <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-lg object-cover mb-2" />
                          <span className="text-xs text-gray-600 group-hover:text-gray-800">Change photo</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <MdCameraAlt className="w-12 h-12 text-gray-300 mb-2 group-hover:text-gray-400 transition" />
                          <span className="text-sm text-gray-600 group-hover:text-gray-800 transition">Upload your photo</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Business Information Tab */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-8" style={{ backgroundColor: theme.colors.background }}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Business Information</h2>
                <p className="text-gray-600 text-sm">Your company details and preferences</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                  style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
                >
                  <MdEdit className="w-5 h-5" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Business registration number"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Currency</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(dropdownOpen === 'currency' ? null : 'currency')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition text-gray-700"
                      >
                        <span>{formData.currency}</span>
                        <svg
                          className="w-5 h-5 text-gray-500 transition-transform duration-200"
                          style={{
                            transform: dropdownOpen === 'currency' ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </button>
                      {dropdownOpen === 'currency' && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                          {['AED', 'USD', 'EUR', 'GBP', 'PKR'].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, currency: option });
                                setDropdownOpen(null);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition first:rounded-t-lg last:rounded-b-lg text-gray-700"
                              style={{
                                backgroundColor: formData.currency === option ? theme.colors.background : 'transparent',
                              }}
                            >
                              {option === 'AED' && 'AED - United Arab Emirates Dirham'}
                              {option === 'USD' && 'USD - US Dollar'}
                              {option === 'EUR' && 'EUR - Euro'}
                              {option === 'GBP' && 'GBP - British Pound'}
                              {option === 'PKR' && 'PKR - Pakistani Rupee'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Timezone</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(dropdownOpen === 'timezone' ? null : 'timezone')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition text-gray-700"
                      >
                        <span>{formData.timezone}</span>
                        <svg
                          className="w-5 h-5 text-gray-500 transition-transform duration-200"
                          style={{
                            transform: dropdownOpen === 'timezone' ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </button>
                      {dropdownOpen === 'timezone' && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                          {[
                            { value: 'Asia/Dubai', label: 'Dubai - Asia/Dubai' },
                            { value: 'Asia/Karachi', label: 'Karachi - Asia/Karachi' },
                            { value: 'Europe/London', label: 'London - Europe/London' },
                            { value: 'America/New_York', label: 'New York - America/New_York' },
                            { value: 'Asia/Singapore', label: 'Singapore - Asia/Singapore' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, timezone: option.value });
                                setDropdownOpen(null);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition first:rounded-t-lg last:rounded-b-lg text-gray-700"
                              style={{
                                backgroundColor: formData.timezone === option.value ? theme.colors.background : 'transparent',
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
                  >
                    <MdCheck className="w-5 h-5" />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                    style={{ backgroundColor: '#9CA3AF', borderRadius: theme.radius.button }}
                  >
                    <MdClose className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(41, 157, 145, 0.05)' }}>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Company Name</label>
                  <p className="text-gray-900">{formData.companyName || 'Not set'}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(41, 157, 145, 0.05)' }}>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Registration Number</label>
                  <p className="text-gray-900">{formData.registrationNumber || 'Not set'}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(41, 157, 145, 0.05)' }}>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Currency</label>
                  <p className="text-gray-900">{formData.currency}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(41, 157, 145, 0.05)' }}>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Timezone</label>
                  <p className="text-gray-900">{formData.timezone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change Password Section */}
          <div className="bg-white rounded-xl shadow-md p-8" style={{ backgroundColor: theme.colors.background }}>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Change Password</h2>
            <p className="text-gray-600 text-sm mb-6">Update your password to keep your account secure</p>

            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.current ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="Enter your new password (min. 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
                  >
                    <MdCheck className="w-5 h-5" />
                    <span>{loading ? 'Updating...' : 'Update Password'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="flex items-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                    style={{ backgroundColor: '#9CA3AF', borderRadius: theme.radius.button }}
                  >
                    <MdClose className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Two-Factor Authentication Section */}
          <div className="bg-white rounded-xl shadow-md p-8" style={{ backgroundColor: theme.colors.background }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-800">Two-Factor Authentication</h3>
              <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(41, 157, 145, 0.1)', color: theme.colors.primary }}>
                Available Soon
              </span>
            </div>
            <p className="text-gray-600 text-sm">Add an extra layer of security to your account</p>
          </div>
        </div>
      )}
    </div>
  );
}
