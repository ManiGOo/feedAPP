import { useState, useEffect, useMemo } from "react";
import { Save, X, Upload, Trash2, AlertCircle } from "lucide-react";

export default function EditProfileForm({ user, onCancel, onSave, isLoading = false }) {
  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");
  const [bio, setBio] = useState(user.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(user.avatar_url || null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Update preview when avatar changes
  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (removeAvatar) {
      setPreviewUrl(null);
    } else {
      setPreviewUrl(user.avatar_url || null);
    }
  }, [avatarFile, removeAvatar, user.avatar_url]);

  // Pure validation: Computes errors without side effects
  const getValidationErrors = useMemo(() => {
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (username.length > 30) {
      newErrors.username = "Username must not exceed 30 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email address";
    }

    if (bio && bio.length > 160) {
      newErrors.bio = "Bio must not exceed 160 characters";
    }

    return newErrors;
  }, [username, email, bio]);  // Recompute only when inputs change

  // Derived: Is form valid? (pure, no side effects)
  const isValid = useMemo(() => {
    return Object.keys(getValidationErrors).length === 0;
  }, [getValidationErrors]);

  // Side effect: Update errors on blur (only for touched fields)
  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    const fieldErrors = { [field]: getValidationErrors[field] };
    setErrors(prev => ({ ...prev, ...fieldErrors }));
  };

  // Side effect: Full validation on submit
  const validateAndSetErrors = () => {
    const newErrors = getValidationErrors;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAndSetErrors()) {  // Now safe: sets errors only here
      console.log("Submitting:", { username, email, bio, avatarFile: !!avatarFile, removeAvatar });
      onSave({ username, email, bio, avatarFile, removeAvatar });
    }
  };

  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    if (field === "username") setUsername(value);
    if (field === "email") setEmail(value);
    if (field === "bio") setBio(value);
    // Don't set errors on change – only on blur/submit
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
      setAvatarFile(file);
      setRemoveAvatar(false);
      setErrors(prev => { const { avatar, ...rest } = prev; return rest; });  // Clear avatar error
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setRemoveAvatar(true);
    setErrors(prev => { const { avatar, ...rest } = prev; return rest; });  // Clear avatar error
  };

  // Show error for a field only if touched
  const getFieldError = (field) => touched[field] ? errors[field] : undefined;

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

            {/* Remove Button */}
            {previewUrl && !isLoading && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute -bottom-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                title="Remove avatar"
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
            value={username}
            onChange={handleInputChange("username")}
            onBlur={() => handleBlur("username")}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              getFieldError("username")
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 transition-colors`}
            placeholder="johndoe"
            disabled={isLoading}
          />
          {getFieldError("username") && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {getFieldError("username")}
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
            value={email}
            onChange={handleInputChange("email")}
            onBlur={() => handleBlur("email")}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              getFieldError("email")
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 transition-colors`}
            placeholder="john@example.com"
            disabled={isLoading}
          />
          {getFieldError("email") && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {getFieldError("email")}
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
            value={bio}
            onChange={handleInputChange("bio")}
            onBlur={() => handleBlur("bio")}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              getFieldError("bio")
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 resize-none transition-colors`}
            placeholder="Tell us about yourself..."
            maxLength={160}
            disabled={isLoading}
          />
          <div className="flex justify-between items-center mt-1">
            {getFieldError("bio") ? (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {getFieldError("bio")}
              </p>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {bio.length}/160
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading || !isValid}  // Now safe: uses memoized pure value
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
      </form>
    </div>
  );
}