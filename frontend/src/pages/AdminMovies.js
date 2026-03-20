import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { moviesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isYouTubeUrl, getYouTubeThumbnail } from '../utils/youtube';

const AdminMovies = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    video_url: '',
    video_360p: '',
    video_720p: '',
    video_1080p: '',
    trailer_url: '',
    subtitle_url: '',
    subtitle_language: '',
    price: 0,
    genre: '',
    release_year: '',
    language: '',
    is_active: true,
    is_free: false,
    content_type: 'movie', // 'movie', 'series', 'free_movie', 'free_series'
    is_featured: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
      return;
    }

    fetchMovies();
  }, [isAuthenticated, isAdmin]);

  const fetchMovies = async () => {
    try {
      const response = await moviesAPI.getAll({ limit: 100 });
      console.log('Movies response:', response.data);
      setMovies(response.data.movies || []);
    } catch (error) {
      console.error('Error fetching movies:', error);
      console.error('Error response:', error.response?.data);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // If is_free is checked, automatically set price to 0
    if (name === 'is_free') {
      setFormData(prev => ({
        ...prev,
        is_free: checked,
        price: checked ? 0 : prev.price,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const openModal = (movie = null) => {
    if (movie) {
      setEditingMovie(movie);
      setFormData({
        title: movie.title,
        description: movie.description || '',
        thumbnail_url: movie.thumbnail_url || '',
        video_url: movie.video_url || '',
        video_360p: movie.video_360p || '',
        video_720p: movie.video_720p || '',
        video_1080p: movie.video_1080p || '',
        trailer_url: movie.trailer_url || '',
        subtitle_url: movie.subtitle_url || '',
        subtitle_language: movie.subtitle_language || '',
        price: movie.price,
        genre: movie.genre || '',
        release_year: movie.release_year || '',
        language: movie.language || '',
        is_active: movie.is_active,
        is_free: movie.is_free || false,
      });
    } else {
      setEditingMovie(null);
      setFormData({
        title: '',
        description: '',
        thumbnail_url: '',
        video_url: '',
        video_360p: '',
        video_720p: '',
        video_1080p: '',
        trailer_url: '',
        subtitle_url: '',
        subtitle_language: '',
        price: '',
        genre: '',
        release_year: '',
        language: '',
        is_active: true,
        is_free: false,
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Ensure price is a number, default to 0 if is_free
      const priceValue = formData.is_free ? 0 : (formData.price ? parseFloat(formData.price) : 0);
      
      const data = {
        ...formData,
        price: priceValue,
        release_year: formData.release_year ? parseInt(formData.release_year) : null,
      };

      if (editingMovie) {
        await moviesAPI.update(editingMovie.id, data);
      } else {
        await moviesAPI.create(data);
      }

      setShowModal(false);
      fetchMovies();
    } catch (err) {
      console.error('Error saving movie:', err);
      const errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === 'string') {
        setError(errorDetail);
      } else if (Array.isArray(errorDetail)) {
        setError(errorDetail.map(e => e.msg || JSON.stringify(e)).join(', '));
      } else if (errorDetail?.msg) {
        setError(errorDetail.msg);
      } else {
        setError('Failed to save movie. Please check your input.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) return;

    try {
      await moviesAPI.delete(id);
      fetchMovies();
      alert('Movie deleted successfully!');
    } catch (error) {
      console.error('Error deleting movie:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      alert(`Failed to delete movie: ${errorMessage}`);
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title || '',
      description: movie.description || '',
      thumbnail_url: movie.thumbnail_url || '',
      video_url: movie.video_url || '',
      video_360p: movie.video_360p || '',
      video_720p: movie.video_720p || '',
      video_1080p: movie.video_1080p || '',
      trailer_url: movie.trailer_url || '',
      subtitle_url: movie.subtitle_url || '',
      subtitle_language: movie.subtitle_language || '',
      price: movie.price || 0,
      genre: movie.genre || '',
      release_year: movie.release_year || '',
      language: movie.language || '',
      is_active: movie.is_active !== false,
      is_free: movie.is_free || false,
      content_type: movie.content_type || 'movie',
      is_featured: movie.is_featured || false,
    });
    setShowModal(true);
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin" className="text-gray-400 hover:text-white mb-2 inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="font-display text-3xl font-bold text-white">Manage Movies</h1>
          </div>
          <button onClick={() => openModal()} className="btn btn-primary">
            Add Movie
          </button>
        </div>

        {/* Movies Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Movie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Genre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {movies.map((movie) => (
                  <tr key={movie.id} className="hover:bg-dark-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 h-12 bg-dark-600 rounded overflow-hidden mr-4">
                          {movie.thumbnail_url && (
                            (isYouTubeUrl(movie.thumbnail_url) ? (
                              <img src={getYouTubeThumbnail(movie.thumbnail_url)} alt={movie.title} className="w-full h-full object-cover" />
                            ) : (
                              <img src={movie.thumbnail_url} alt={movie.title} className="w-full h-full object-cover" />
                            ))
                          )}
                        </div>
                        <span className="text-white font-medium">{movie.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">KES {movie.price}</td>
                    <td className="px-6 py-4 text-gray-300">{movie.genre || '-'}</td>
                    <td className="px-6 py-4 text-gray-300">{movie.views}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        movie.is_active ? 'bg-accent-500/20 text-accent-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {movie.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openModal(movie)}
                        className="text-primary-400 hover:text-primary-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(movie.id)}
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="font-display text-2xl font-bold text-white mb-6">
                  {editingMovie ? 'Edit Movie' : 'Add Movie'}
                </h2>

                {error && (
                  <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="input"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Price (KES)
                        {formData.is_free && <span className="text-accent-400 ml-2">(Free Movie - Price set to 0)</span>}
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price === 0 ? 0 : formData.price}
                        onChange={handleChange}
                        required={!formData.is_free}
                        disabled={formData.is_free}
                        step="0.01"
                        className={`input ${formData.is_free ? 'bg-dark-700 opacity-50' : ''}`}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_free"
                        id="is_free"
                        checked={formData.is_free}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-gray-600 bg-dark-700 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="is_free" className="text-sm font-medium text-gray-300">
                        Free Movie (anyone can watch without payment)
                      </label>
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
                      <label className="block text-sm font-medium text-gray-300 mb-1">Language</label>
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        className="input"
                      >
                        <option value="">Select Language</option>
                        <option value="swahili">Swahili</option>
                        <option value="english">English</option>
                        <option value="luo">Luo</option>
                        <option value="kikuyu">Kikuyu</option>
                        <option value="kalenjin">Kalenjin</option>
                        <option value="luhya">Luhya</option>
                        <option value="meru">Meru</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Content Type</label>
                      <select
                        name="content_type"
                        value={formData.content_type}
                        onChange={handleChange}
                        className="input"
                      >
                        <option value="movie">Movie</option>
                        <option value="series">TV Series</option>
                        <option value="free_movie">Free Movie</option>
                        <option value="free_series">Free Series</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleChange}
                        className="w-4 h-4 rounded bg-dark-700 border-dark-600"
                      />
                      <label className="text-sm text-gray-300">Show in Featured Section</label>
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
                      <label className="block text-sm font-medium text-gray-300 mb-1">Video URL (Default)</label>
                      <input
                        type="url"
                        name="video_url"
                        value={formData.video_url}
                        onChange={handleChange}
                        className="input"
                        placeholder="Main video URL"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">360p Video URL</label>
                      <input
                        type="url"
                        name="video_360p"
                        value={formData.video_360p}
                        onChange={handleChange}
                        className="input"
                        placeholder="Low quality URL"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">720p Video URL</label>
                      <input
                        type="url"
                        name="video_720p"
                        value={formData.video_720p}
                        onChange={handleChange}
                        className="input"
                        placeholder="HD quality URL"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">1080p Video URL</label>
                      <input
                        type="url"
                        name="video_1080p"
                        value={formData.video_1080p}
                        onChange={handleChange}
                        className="input"
                        placeholder="Full HD quality URL"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Trailer URL (YouTube)</label>
                      <input
                        type="url"
                        name="trailer_url"
                        value={formData.trailer_url}
                        onChange={handleChange}
                        className="input"
                        placeholder="YouTube trailer URL"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Subtitle URL (VTT)</label>
                      <input
                        type="url"
                        name="subtitle_url"
                        value={formData.subtitle_url}
                        onChange={handleChange}
                        className="input"
                        placeholder="CC/Subtitles file URL"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Subtitle Language</label>
                      <input
                        type="text"
                        name="subtitle_language"
                        value={formData.subtitle_language}
                        onChange={handleChange}
                        className="input"
                        placeholder="e.g., English, Swahili"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        <span className="text-gray-300">Active</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary"
                    >
                      {saving ? 'Saving...' : 'Save Movie'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMovies;
