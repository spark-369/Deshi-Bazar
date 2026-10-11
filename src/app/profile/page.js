"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services";
import { locationService } from "@/services/locationService";
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
  FaStar,
  FaChartLine,
  FaShieldAlt,
} from "react-icons/fa";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    division: "",
    district: "",
    state: "",
    zipCode: "",
    postalCode: "",
    country: "Bangladesh",
    avatar: "",
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
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FACodeInput, setShow2FACodeInput] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAMessage, setTwoFAMessage] = useState({ type: "", text: "" });
  const [twoFALoading, setTwoFALoading] = useState(false);

  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [postalError, setPostalError] = useState("");

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

        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.profile?.address || "",
          city: data.profile?.city || "",
          division: data.profile?.division || "",
          district: data.profile?.district || "",
          state: data.profile?.state || "",
          zipCode: data.profile?.zipCode || "",
          postalCode: data.profile?.postalCode || "",
          country: data.profile?.country || "Bangladesh",
          avatar: data.profile?.avatar || "",
        });

        if (data.profile) {
          setStats({
            orders: data.profile.orders || 0,
            wishlist: data.profile.wishlist || 0,
            reviews: data.profile.reviews || 0,
            totalSpent: data.profile.totalSpent || 0,
          });
        }

        setTwoFactorEnabled(data.twoFactorEnabled || false);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated]);

  useEffect(() => {
    const loadDivisions = async () => {
      try {
        const data = await locationService.getDivisions();
        setDivisions(data.divisions || []);
      } catch (error) {
        console.error("Error fetching divisions:", error);
      }
    };
    loadDivisions();
  }, []);

  useEffect(() => {
    const loadDistricts = async () => {
      if (!formData.division) {
        setDistricts([]);
        return;
      }
      try {
        const data = await locationService.getDistricts(formData.division);
        setDistricts(data.districts || []);
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };
    loadDistricts();
  }, [formData.division]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "division") {
        next.district = "";
        next.postalCode = "";
      }
      if (name === "district") {
        next.postalCode = "";
      }
      return next;
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file.");
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      setUploadingAvatar(true);
      setAvatarError("");

      const response = await fetch("/api/upload-image?folder=avatars", {
        method: "POST",
        body: uploadFormData,
      });
      const result = await response.json();

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Upload failed");
      }

      const avatarUrl = result.url;
      setFormData((prev) => ({ ...prev, avatar: avatarUrl }));

      const updated = await authService.updateProfile({ ...formData, avatar: avatarUrl });
      setProfile(updated);
      setUser(updated);
    } catch (error) {
      console.error("Upload failed:", error);
      setAvatarError(error.message || "Upload failed. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setPostalError("");

    const postal = formData.postalCode?.toString().trim();
    if (postal && !/^\d{4}$/.test(postal)) {
      setPostalError("Postal code must be a 4-digit number (1000–9999).");
      setSaving(false);
      return;
    }

    try {
      const updated = await authService.updateProfile(formData);
      setProfile(updated);
      setUser(updated);

      if (updated.profile) {
        setFormData((prev) => ({
          ...prev,
          avatar: updated.profile.avatar || prev.avatar,
        }));
      }

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
      alert(error.data?.error || error.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FA = async () => {
    setTwoFALoading(true);
    setTwoFAMessage({ type: "", text: "" });
    try {
      const data = await authService.enable2FA();
      setShow2FACodeInput(true);
      setTwoFAMessage({
        type: "success",
        text: `Verification code sent to ${data.email}`,
      });
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      setTwoFAMessage({
        type: "error",
        text: error.data?.error || error.message || "Failed to send verification code",
      });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFACode || twoFACode.length !== 6) {
      alert("Please enter a valid 6-digit code");
      return;
    }

    setTwoFALoading(true);
    setTwoFAMessage({ type: "", text: "" });
    try {
      await authService.verify2FACode(twoFACode);
      setTwoFactorEnabled(true);
      setShow2FACodeInput(false);
      setTwoFACode("");
      setTwoFAMessage({
        type: "success",
        text: "Two-factor authentication enabled successfully!",
      });
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      setTwoFAMessage({
        type: "error",
        text: error.data?.error || error.message || "Failed to verify code",
      });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (
      !window.confirm(
        "Are you sure you want to disable two-factor authentication? This will make your account less secure.",
      )
    ) {
      return;
    }

    setTwoFALoading(true);
    setTwoFAMessage({ type: "", text: "" });
    try {
      await authService.disable2FA();
      setTwoFactorEnabled(false);
      setShow2FACodeInput(false);
      setTwoFACode("");
      setTwoFAMessage({
        type: "success",
        text: "Two-factor authentication disabled successfully",
      });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      setTwoFAMessage({
        type: "error",
        text: error.data?.error || error.message || "Failed to disable 2FA",
      });
    } finally {
      setTwoFALoading(false);
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 sm:p-6 lg:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center text-2xl sm:text-4xl font-bold overflow-hidden">
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  ) : formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile.name?.charAt(0) || "U"
                  )}
                </div>
                <label className={`absolute bottom-0 right-0 bg-white text-blue-600 p-1.5 sm:p-2 rounded-full shadow-lg cursor-pointer ${uploadingAvatar ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <FaCamera className="text-xs sm:text-sm" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingAvatar}
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              {avatarError && (
                <p className="text-xs text-red-200 mt-2 text-center">{avatarError}</p>
              )}
            <div className="text-center sm:text-left min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
                {profile.name}
              </h1>
              <p className="opacity-90 text-sm sm:text-base truncate">
                {profile.email}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs sm:text-sm">
                  {profile.role}
                </span>
                <span className="text-xs sm:text-sm opacity-90">
                  Member since{" "}
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4 lg:p-6 text-center">
            <FaShoppingBag className="text-lg sm:text-xl lg:text-2xl text-blue-600 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.orders}</p>
            <p className="text-xs sm:text-sm text-gray-500">Orders</p>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6 text-center">
            <FaHeart className="text-lg sm:text-xl lg:text-2xl text-red-500 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.wishlist}</p>
            <p className="text-xs sm:text-sm text-gray-500">Wishlist</p>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6 text-center">
            <FaStar className="text-lg sm:text-xl lg:text-2xl text-yellow-500 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.reviews}</p>
            <p className="text-xs sm:text-sm text-gray-500">Reviews</p>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6 text-center">
            <FaChartLine className="text-lg sm:text-xl lg:text-2xl text-green-600 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-lg sm:text-xl lg:text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
            <p className="text-xs sm:text-sm text-gray-500">Total Spent</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide border-b border-gray-200 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2.5 sm:pb-3 px-2 sm:px-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "profile"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaUser className="inline mr-1.5 sm:mr-2 text-xs sm:text-sm" />
            <span className="hidden xs:inline">Profile</span>
            <span className="xs:hidden">Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`pb-2.5 sm:pb-3 px-2 sm:px-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "password"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaLock className="inline mr-1.5 sm:mr-2 text-xs sm:text-sm" />
            <span className="hidden xs:inline">Security</span>
            <span className="xs:hidden">Security</span>
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`pb-2.5 sm:pb-3 px-2 sm:px-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "preferences"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaUser className="inline mr-1.5 sm:mr-2 text-xs sm:text-sm" />
            <span className="hidden xs:inline">Preferences</span>
            <span className="xs:hidden">Prefs</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          <Card>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Personal Information
                </h2>
                {!editing && (
                  <Button variant="outline" onClick={() => setEditing(true)} className="w-full sm:w-auto">
                    <FaEdit className="mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Country
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-70"
                  >
                    <option value="Bangladesh">Bangladesh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Division
                  </label>
                  <select
                    name="division"
                    value={formData.division}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-70"
                  >
                    <option value="">Select Division</option>
                    {divisions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    District / City
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    disabled={!editing || !formData.division}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-70"
                  >
                    <option value="">
                      {formData.division ? "Select District" : "Select Division first"}
                    </option>
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Address
                  </label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!editing}
                    icon={<FaMapMarker />}
                    placeholder="House, road, area"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Postal Code
                  </label>
                  <Input
                    name="postalCode"
                    type="number"
                    min="1000"
                    max="9999"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    disabled={!editing}
                    icon={<FaMapMarker />}
                    placeholder="e.g. 1205"
                  />
                  {postalError && (
                    <p className="mt-1 text-xs text-red-500">{postalError}</p>
                  )}
                </div>
              </div>

              {editing && (
                <div className="flex flex-col-reverse xs:flex-row gap-2 mt-4 sm:mt-6">
                  <Button onClick={handleSaveProfile} loading={saving} className="w-full xs:w-auto">
                    <FaSave className="mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)} className="w-full xs:w-auto">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === "password" && (
          <Card>
            <div className="p-4 sm:p-5 lg:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                Change Password
              </h2>

              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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

                <Button onClick={handleChangePassword} loading={saving} className="w-full sm:w-auto">
                  Update Password
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "preferences" && (
          <Card>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <FaShieldAlt className="text-lg sm:text-xl text-blue-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Two-Factor Authentication
                </h2>
              </div>

              <div className="max-w-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      {twoFactorEnabled ? "2FA is enabled" : "2FA is disabled"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {twoFactorEnabled
                        ? "Your account is protected with two-factor authentication"
                        : "Add an extra layer of security to your account"}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 w-fit ${
                      twoFactorEnabled
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {twoFactorEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>

                {twoFAMessage.text && (
                  <div
                    className={`mt-3 p-3 rounded-lg text-sm ${
                      twoFAMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {twoFAMessage.text}
                  </div>
                )}

                {!twoFactorEnabled && !show2FACodeInput && (
                  <Button
                    onClick={handleEnable2FA}
                    loading={twoFALoading}
                    className="w-full sm:w-auto mt-3 sm:mt-4"
                  >
                    <FaShieldAlt className="mr-2" />
                    Enable 2FA
                  </Button>
                )}

                {!twoFactorEnabled && show2FACodeInput && (
                  <div className="mt-3 sm:mt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Enter Verification Code
                      </label>
                      <Input
                        type="text"
                        value={twoFACode}
                        onChange={(e) =>
                          setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="000000"
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                      />
                    </div>
                    <div className="flex flex-col-reverse xs:flex-row gap-2">
                      <Button
                        onClick={handleVerify2FA}
                        loading={twoFALoading}
                        className="w-full xs:w-auto"
                      >
                        Verify & Enable
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShow2FACodeInput(false);
                          setTwoFACode("");
                          setTwoFAMessage({ type: "", text: "" });
                        }}
                        className="w-full xs:w-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {twoFactorEnabled && (
                  <Button
                    variant="outline"
                    onClick={handleDisable2FA}
                    loading={twoFALoading}
                    className="w-full sm:w-auto mt-3 sm:mt-4"
                  >
                    Disable 2FA
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
