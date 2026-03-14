import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, googleProvider, signInWithPopup } from '../services/firebase';
import { authAPI } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    profile_photo: '',
  });
  const [profilePreview, setProfilePreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const { register, setUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfilePreview(previewUrl);
      
      // Upload to Cloudinary
      uploadProfilePhoto(file);
    }
  };

  const uploadProfilePhoto = async (file) => {
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('upload_preset', 'movievault'); // You'll need to create this in Cloudinary
    
    try {
      // Try Cloudinary upload
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload',
        {
          method: 'POST',
          body: formDataUpload,
        }
      );
      const data = await response.json();
      if (data.secure_url) {
        setFormData({ ...formData, profile_photo: data.secure_url });
      }
    } catch (err) {
      console.log('Cloudinary upload failed, using local preview');
      // Keep local preview URL as profile photo (for demo)
      setFormData({ ...formData, profile_photo: file.name });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
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

    setLoading(true);

    try {
      await register({
        email: formData.email,
        username: formData.username,
        full_name: formData.full_name,
        password: formData.password,
        profile_photo: formData.profile_photo || profilePreview || '',
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await signInWithPopup(auth, googleProvider).catch(err => {
        throw err;
      });
      const user = result.user;
      
      // Get the Google ID token
      const idToken = await user.getIdToken();
      
      // Send the token to your backend for verification and account creation
      const response = await authAPI.googleLogin(idToken);
      const { access_token } = response.data;
      
      // Store the token
      localStorage.setItem('token', access_token);
      
      // Get user info
      const userResponse = await authAPI.getMe();
      setUser(userResponse.data);
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      
      // Redirect to home
      navigate('/');
      // Force page reload to ensure auth state is fully updated
      setTimeout(() => window.location.reload(), 100);
    } catch (err) {
      console.error('Google Sign-In error:', err);
      // Handle specific error cases
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site or use email registration.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google Sign-In. Contact the administrator.');
      } else {
        setError(err.response?.data?.detail || 'Google Sign-In failed. Try email registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold text-white">Create Account</h2>
          <p className="text-gray-400 mt-2">Join MovieVault to start watching</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full mb-6 py-3 px-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark-800 text-gray-400">Or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-dark-700 flex items-center justify-center overflow-hidden border-2 border-dark-600">
                  {profilePreview ? (
                    <img 
                      src={profilePreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-10 h-10 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center text-white transition-colors"
                  disabled={uploading}
                >
                  {uploading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-gray-500 text-sm mt-2">Click to add profile photo</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input"
                placeholder="johndoe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name (Optional)
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="input"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
