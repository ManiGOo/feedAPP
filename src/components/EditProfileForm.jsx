import { useState, useEffect } from "react";
import { Save, X, Upload, Trash2, Check, AlertCircle } from "lucide-react";

export default function EditProfileForm({ user, onCancel, onSave, isLoading = false }) {
  const [formData, setFormData] = useState({
    username: user.username || "",
    email: user.email || "",
    bio: user.bio || "",
    avatarFile: null,
    removeAvatar: false,
  });

  const [previewUrl, setPreviewUrl] = useState(user.avatar_url || null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Sync preview when avatar changes
  useEffect(() => {
    if (formData.avatarFile) {
      const url = URL.createObjectURL(formData.avatarFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (formData.removeAvatar) {
      setPreviewUrl(null);
    } else {
      setPreviewUrl(user.avatar_url || null);
    }
  }, [formData.avatarFile, formData.removeAvatar, user.avatar_url]);

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 30) {
      newErrors.username = "Username must not exceed 30 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (formData.bio && formData.bio.length > 160) {
      newErrors.bio = "Bio must not exceed 160 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    setTouched({ ...touched, [field]: true });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors({ ...errors, avatar: "Please select an image file" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, avatar: "Image must be under 5MB" });
        return;
      }
      setFormData({ ...formData, avatarFile: file, removeAvatar: false });
      setErrors({ ...errors, avatar: undefined });
    }
  };

  const handleRemoveAvatar = () => {
    setFormData({ ...formData, avatarFile: null, removeAvatar: true });
    setErrors({ ...errors, avatar: undefined });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-4 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <Upload className="w-8 h-8 mb-1" />
                  <span className="text-xs">No image</span>
                </div>
              )}
            </div>

            {/* Avatar Actions */}
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute -bottom-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                title="Remove avatar"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              Change Photo
            </span>
          </label>

          {errors.avatar && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.avatar}
            </p>
          )}
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={handleInputChange("username")}
            onBlur={() => setTouched({ ...touched, username: true })}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.username && touched.username
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 transition-colors`}
            placeholder="johndoe"
            disabled={isLoading}
          />
          {errors.username && touched.username && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.username}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange("email")}
            onBlur={() => setTouched({ ...touched, email: true })}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.email && touched.email
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 transition-colors`}
            placeholder="john@example.com"
            disabled={isLoading}
          />
          {errors.email && touched.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bio <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="bio"
            rows={3}
            value={formData.bio}
            onChange={handleInputChange("bio")}
            onBlur={() => setTouched({ ...touched, bio: true })}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.bio && touched.bio
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 resize-none transition-colors`}
            placeholder="Tell us about yourself..."
            maxLength={160}
            disabled={isLoading}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.bio && touched.bio ? (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.bio}
              </p>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formData.bio.length}/160
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Success Indicator (Optional) */}
        {/* You can pass `success` from parent if needed */}
      </form>
    </div>
  );
}