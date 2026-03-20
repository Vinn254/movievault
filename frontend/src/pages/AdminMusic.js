import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { musicAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminMusic = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    thumbnail_url: '',
    audio_url: '',
    duration: '',
    genre: '',
    release_year: '',
    price: 0,
    is_free: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
      return;
    }

    fetchTracks();
  }, [isAuthenticated, isAdmin]);

  const fetchTracks = async () => {
    try {
      const response = await musicAPI.getAll({ limit: 100 });
      setTracks(response.data.tracks || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const openModal = (track = null) => {
    if (track) {
      setEditingTrack(track);
      setFormData({
        title: track.title,
        artist: track.artist,
        album: track.album || '',
        thumbnail_url: track.thumbnail_url || '',
        audio_url: track.audio_url || '',
        duration: track.duration || '',
        genre: track.genre || '',
        release_year: track.release_year || '',
        price: track.price || 0,
        is_free: track.is_free !== false,
      });
    } else {
      setEditingTrack(null);
      setFormData({
        title: '',
        artist: '',
        album: '',
        thumbnail_url: '',
        audio_url: '',
        duration: '',
        genre: '',
        release_year: '',
        price: 0,
        is_free: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const data = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : null,
        release_year: formData.release_year ? parseInt(formData.release_year) : null,
        price: parseFloat(formData.price) || 0,
      };

      if (editingTrack) {
        await musicAPI.update(editingTrack.id, data);
      } else {
        await musicAPI.create(data);
      }

      setShowModal(false);
      fetchTracks();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save track');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (trackId) => {
    if (!window.confirm('Are you sure you want to delete this track?')) return;

    try {
      await musicAPI.delete(trackId);
      fetchTracks();
    } catch (error) {
      console.error('Error deleting track:', error);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-display text-3xl font-bold text-white">Manage Music</h1>
          <button
            onClick={() => openModal()}
            className="btn btn-primary"
          >
            Add New Track
          </button>
        </div>

        {/* Tracks Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Artist</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Album</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Genre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Free</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Views</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {tracks.map((track) => (
                <tr key={track.id} className="hover:bg-dark-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-dark-700 rounded flex-shrink-0 overflow-hidden mr-3">
                        {track.thumbnail_url ? (
                          <img src={track.thumbnail_url} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="text-white font-medium">{track.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">{track.artist}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">{track.album || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">{track.genre || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">{formatDuration(track.duration)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${track.is_free ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {track.is_free ? 'Free' : 'Paid'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">{track.views || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => openModal(track)}
                      className="text-primary-400 hover:text-primary-300 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(track.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingTrack ? 'Edit Track' : 'Add New Track'}
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Artist *</label>
                  <input
                    type="text"
                    name="artist"
                    value={formData.artist}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Album</label>
                  <input
                    type="text"
                    name="album"
                    value={formData.album}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Genre</label>
                  <input
                    type="text"
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Release Year</label>
                  <input
                    type="number"
                    name="release_year"
                    value={formData.release_year}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Duration (seconds)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Thumbnail URL</label>
                  <input
                    type="url"
                    name="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Audio URL</label>
                  <input
                    type="url"
                    name="audio_url"
                    value={formData.audio_url}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    name="is_free"
                    checked={formData.is_free}
                    onChange={handleChange}
                    className="w-4 h-4 rounded bg-dark-700 border-dark-600"
                  />
                  <label className="text-sm text-gray-300">Free to stream</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMusic;
