import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [isAuthenticated, isAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers({ limit: 100 });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
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
        <div className="mb-8">
          <Link to="/admin" className="text-gray-400 hover:text-white mb-2 inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Manage Users</h1>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-dark-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-white font-medium">{user.username}</span>
                          {user.full_name && (
                            <p className="text-gray-500 text-sm">{user.full_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{user.email}</td>
                    <td className="px-6 py-4 text-gray-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_admin ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary-500/20 text-secondary-400">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-dark-600 text-gray-300">
                          User
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
