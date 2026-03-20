import React, { useState, useEffect } from 'react';
import { moviesAPI } from '../services/api';
import MovieCard from '../components/MovieCard';

const Trending = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingSeries, setTrendingSeries] = useState([]);
  const [topLiked, setTopLiked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('movies');

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      setLoading(true);
      const response = await moviesAPI.getTrending();
      setTrendingMovies(response.data.trending_movies || []);
      setTrendingSeries(response.data.trending_series || []);
      setTopLiked(response.data.top_liked || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentContent = () => {
    switch (activeTab) {
      case 'movies':
        return trendingMovies;
      case 'series':
        return trendingSeries;
      case 'liked':
        return topLiked;
      default:
        return trendingMovies;
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-20">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-900 via-dark-900 to-dark-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-display text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-4">
              Trending Now
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              See what everyone is watching and loving right now!
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-dark-800 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setActiveTab('movies')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'movies'
                  ? 'bg-orange-600 text-white'
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              Trending Movies
            </button>
            <button
              onClick={() => setActiveTab('series')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'series'
                  ? 'bg-orange-600 text-white'
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              Trending Series
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'liked'
                  ? 'bg-orange-600 text-white'
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              Most Liked
            </button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : getCurrentContent().length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-gray-400 text-lg">No trending content yet</p>
            <p className="text-gray-500 text-sm mt-2">Start watching to make content trending!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getCurrentContent().map((movie, index) => (
              <div
                key={movie.id}
                className="animate-fade-in relative"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Rank Badge */}
                <div className="absolute top-2 left-2 z-10 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">#{index + 1}</span>
                </div>
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trending;
