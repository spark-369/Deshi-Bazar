"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services";
import { Card, Button, Input } from "@/components/common";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarker,
  FaCamera,
  FaEdit,
  FaSave,
  FaLock,
  FaShoppingBag,
  FaHeart,
  FaBox,
  FaStar,
  FaChartLine,
} from "react-icons/fa";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [stats, setStats] = useState({
    orders: 0,
    wishlist: 0,
    reviews: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const data = await authService.getProfile();
        setProfile(data);

        // Set form data
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.profile.address || "",
          city: data.profile.city || "",
          state: data.profile.state || "",
          zipCode: data.profile.zipCode || "",
          country: data.profile.country || "",
        });

        // Set stats from profile
        if (data.profile) {
          setStats({
            orders: data.profile.purchaseCount || 0,
            wishlist: data.profile.wishlistCount || 0,
            reviews: data.profile.reviewCount || 0,
            totalSpent: data.profile.totalSpent || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await authService.updateProfile(formData);
      setProfile(updated);
      setUser(updated);
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      alert("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      alert(error.response?.data?.error || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold">
                {profile.name?.charAt(0) || "U"}
              </div>
              <button className="absolute bottom-0 right-0 bg-white text-blue-600 p-2 rounded-full shadow-lg">
                <FaCamera />
              </button>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              <p className="opacity-90">{profile.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {profile.role}
                </span>
                <span className="text-sm">
                  Member since{" "}
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <FaShoppingBag className="text-2xl text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.orders}</p>
            <p className="text-sm text-gray-500">Orders</p>
          </Card>
          <Card className="p-4 text-center">
            <FaHeart className="text-2xl text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.wishlist}</p>
            <p className="text-sm text-gray-500">Wishlist</p>
          </Card>
          <Card className="p-4 text-center">
            <FaStar className="text-2xl text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.reviews}</p>
            <p className="text-sm text-gray-500">Reviews</p>
          </Card>
          <Card className="p-4 text-center">
            <FaChartLine className="text-2xl text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Total Spent</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === "profile"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaUser className="inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === "password"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaLock className="inline mr-2" />
            Security
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === "preferences"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaUser className="inline mr-2" />
            Preferences
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Personal Information
              </h2>
              {!editing && (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <FaEdit className="mr-2" />
                  Edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!editing}
                  icon={<FaUser />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!editing}
                  icon={<FaEnvelope />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!editing}
                  icon={<FaPhone />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!editing}
                  icon={<FaMapMarker />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP/Postal Code
                </label>
                <Input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <Input
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              </div>
            </div>

            {editing && (
              <div className="flex gap-2 mt-6">
                <Button onClick={handleSaveProfile} loading={saving}>
                  <FaSave className="mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </Card>
        )}

        {activeTab === "password" && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Change Password
            </h2>

            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <Input
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  icon={<FaLock />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <Input
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  icon={<FaLock />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <Input
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  icon={<FaLock />}
                />
              </div>

              <Button onClick={handleChangePassword} loading={saving}>
                Update Password
              </Button>
            </div>
          </Card>
        )}

        {activeTab === "preferences" && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Preferences
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    Email Notifications
                  </p>
                  <p className="text-sm text-gray-500">
                    Receive updates about your orders
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-500">
                    Receive SMS for order updates
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Marketing Emails</p>
                  <p className="text-sm text-gray-500">
                    Receive promotional offers
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    AI Recommendations
                  </p>
                  <p className="text-sm text-gray-500">
                    Get personalized product suggestions
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
