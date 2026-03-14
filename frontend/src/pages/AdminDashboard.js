import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
      return;
    }

    fetchStats();
  }, [isAuthenticated, isAdmin]);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/admin/movies" className="card p-6 hover:border-primary-500 transition-colors">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Manage Movies</h3>
                <p className="text-gray-400 text-sm">Add, edit, or remove movies</p>
              </div>
            </div>
          </Link>

          <Link to="/admin/users" className="card p-6 hover:border-primary-500 transition-colors">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-secondary-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Manage Users</h3>
                <p className="text-gray-400 text-sm">View and manage user accounts</p>
              </div>
            </div>
          </Link>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-accent-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">View Reports</h3>
                <p className="text-gray-400 text-sm">See payment and usage reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6">
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="font-display text-3xl font-bold text-white mt-2">{stats?.total_users || 0}</p>
          </div>

          <div className="card p-6">
            <p className="text-gray-400 text-sm">Total Movies</p>
            <p className="font-display text-3xl font-bold text-white mt-2">{stats?.total_movies || 0}</p>
          </div>

          <div className="card p-6">
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <p className="font-display text-3xl font-bold text-accent-400 mt-2">
              KES {stats?.total_payments?.toLocaleString() || 0}
            </p>
          </div>

          <div className="card p-6">
            <p className="text-gray-400 text-sm">Total Purchases</p>
            <p className="font-display text-3xl font-bold text-primary-400 mt-2">{stats?.total_purchases || 0}</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 card p-6">
          <h2 className="font-semibold text-white text-lg mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">Platform Status</p>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-accent-500 rounded-full mr-2"></span>
                <span className="text-white">Operational</span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">Payment System</p>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-accent-500 rounded-full mr-2"></span>
                <span className="text-white">M-Pesa Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
