import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPromote, setShowPromote] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteSecret, setPromoteSecret] = useState('');
  const [promoteMsg, setPromoteMsg] = useState('');
  const [promoteLoading, setPromoteLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePromote = async (e) => {
    e.preventDefault();
    setPromoteMsg('');
    setPromoteLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/auth/promote?email=${encodeURIComponent(promoteEmail)}&secret=${encodeURIComponent(promoteSecret)}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setPromoteMsg('✓ ' + data.message);
      } else {
        setPromoteMsg('Error: ' + (data.detail || 'Failed'));
      }
    } catch (err) {
      setPromoteMsg('Error: ' + err.message);
    } finally {
      setPromoteLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-gray-400 mt-2">Sign in to access your movies</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300">
                Sign up
              </Link>
            </p>
          </div>

          {/* Admin Promote Section */}
          <div className="mt-8 pt-6 border-t border-dark-700">
            <button
              type="button"
              onClick={() => setShowPromote(!showPromote)}
              className="text-sm text-gray-500 hover:text-gray-400"
            >
              {showPromote ? '▼ Hide' : '▶'} Need admin access?
            </button>
            
            {showPromote && (
              <form onSubmit={handlePromote} className="mt-4 space-y-3">
                <p className="text-xs text-gray-500">Enter your email and admin secret to promote your account:</p>
                <input
                  type="email"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  required
                  className="input text-sm"
                  placeholder="Your email"
                />
                <input
                  type="password"
                  value={promoteSecret}
                  onChange={(e) => setPromoteSecret(e.target.value)}
                  required
                  className="input text-sm"
                  placeholder="Admin secret key"
                />
                <button
                  type="submit"
                  disabled={promoteLoading}
                  className="w-full btn btn-secondary py-2 text-sm"
                >
                  {promoteLoading ? 'Promoting...' : 'Promote to Admin'}
                </button>
                {promoteMsg && (
                  <p className={`text-sm ${promoteMsg.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>
                    {promoteMsg}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
