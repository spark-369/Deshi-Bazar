'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock, FaStore, FaUserShield, FaBox, FaArrowRight, FaShieldAlt, FaBolt, FaPhone } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { Input, Button, Card } from '@/components/common';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const defaultRole = searchParams.get('role')?.toUpperCase() || 'BUYER';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: defaultRole,
    latitude: null,
    longitude: null,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, role: defaultRole }));
  }, [defaultRole]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Automatically capture location on submit
    let latitude = formData.latitude;
    let longitude = formData.longitude;

    if (latitude == null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            enableHighAccuracy: false,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        // Geolocation failed or denied — continue without it
      }
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        latitude,
        longitude,
      });
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, register, router]);

  const roles = [
    {
      value: 'BUYER',
      label: 'Buyer',
      description: 'Shop and buy products',
      icon: <FaUser className="text-2xl" />,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      value: 'SELLER',
      label: 'Seller',
      description: 'List and sell products',
      icon: <FaStore className="text-2xl" />,
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      value: 'ADMIN',
      label: 'Admin',
      description: 'Manage the platform',
      icon: <FaUserShield className="text-2xl" />,
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Info */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl mb-8">
              <FaBox className="text-5xl lg:text-6xl text-white" />
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {defaultRole === 'SELLER' ? 'Start Selling Today' : 'Create Your Account'}
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
              {defaultRole === 'SELLER'
                ? 'Join thousands of sellers on our AI-powered marketplace. List your products and reach millions of buyers.'
                : 'Join our AI-powered marketplace and experience smart shopping with intelligent price negotiation and personalized recommendations.'
              }
            </p>

            {/* Benefits List */}
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <FaStore className="text-green-600" />
                </div>
                <span className="text-sm">Free to join - No upfront costs</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <FaShieldAlt className="text-blue-600" />
                </div>
                <span className="text-sm">Secure payments with buyer protection</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <FaBolt className="text-purple-600" />
                </div>
                <span className="text-sm">AI-powered tools to boost your sales</span>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div>
            <Card className="p-8 lg:p-10 shadow-xl shadow-blue-500/10 border-0">
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Create Account
                </h2>
                <p className="text-gray-600 mt-2">
                  {defaultRole === 'SELLER'
                    ? 'Become a seller and start listing products'
                    : 'Join our AI-powered marketplace'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-in fade-in">
                    {error}
                  </div>
                )}

                <Input
                  label="Full Name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  icon={<FaUser className="text-gray-400" />}
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="h-12"
                />

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  icon={<FaEnvelope className="text-gray-400" />}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-12"
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  icon={<FaPhone className="text-gray-400" />}
                  value={formData.phone}
                  onChange={handleChange}
                  className="h-12"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    icon={<FaLock className="text-gray-400" />}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />

                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    icon={<FaLock className="text-gray-400" />}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />
                </div>

                {/* Hidden lat/lng fields */}
                <input
                  type="hidden"
                  name="latitude"
                  value={formData.latitude ?? ''}
                />
                <input
                  type="hidden"
                  name="longitude"
                  value={formData.longitude ?? ''}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    I want to register as:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map((role) => (
                      <label
                        key={role.value}
                        className={`
                          cursor-pointer border-2 rounded-xl p-4 text-center transition-all duration-300 relative overflow-hidden group
                          ${formData.role === role.value
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={formData.role === role.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className={`mx-auto mb-2 w-10 h-10 rounded-xl flex items-center justify-center ${formData.role === role.value ? role.gradient : 'bg-gray-100'} text-white`}>
                          {role.icon}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{role.label}</div>
                        <div className="text-xs text-gray-500 mt-1 leading-tight">{role.description}</div>
                        {formData.role === role.value && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  loading={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 group">
                    Sign in
                    <FaArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </p>
              </div>
            </Card>

            {defaultRole === 'SELLER' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  By creating a seller account, you agree to our{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-700">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
