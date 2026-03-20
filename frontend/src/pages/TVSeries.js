import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { moviesAPI } from '../services/api';
import MovieCard from '../components/MovieCard';

const GENRES = ['All', 'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'];

const TVSeries = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const featuredRef = useRef(null);
  const featuredIntervalRef = useRef(null);

  useEffect(() => {
    fetchSeries();
  }, [searchQuery, selectedGenre]);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const params = { content_type: 'series' };
      if (searchQuery) params.search = searchQuery;
      if (selectedGenre) params.genre = selectedGenre;

      const response = await moviesAPI.getAll(params);
      setSeries(response.data.movies || []);
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get trending/featured series (sorted by views and likes)
  const featuredSeries = [...series]
    .sort((a, b) => (b.views || 0) + (b.likes || 0) * 10 - ((a.views || 0) + (a.likes || 0) * 10))
    .slice(0, 5);

  // Auto-play featured slider
  useEffect(() => {
    if (isAutoPlaying && featuredSeries.length > 1) {
      featuredIntervalRef.current = setInterval(() => {
        setFeaturedIndex((prev) => (prev + 1) % featuredSeries.length);
      }, 5000);
    }
    return () => {
      if (featuredIntervalRef.current) {
        clearInterval(featuredIntervalRef.current);
      }
    };
  }, [isAutoPlaying, featuredSeries.length]);

  return (
    <div className="min-h-screen bg-dark-900 pt-20">
      {/* Hero Section with TV Icon */}
      <div className="relative bg-gradient-to-r from-blue-900 via-dark-900 to-dark-900 py-16">
        <div className="absolute top-4 right-8 opacity-20">
          <svg className="w-64 h-64 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              TV Series
            </h1>
          </div>
          <p className="text-xl text-gray-400 mb-8 text-center">
            Binge-watch your favorite TV series with new episodes regularly added!
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search TV series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-12 w-full"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Series Slider */}
      {featuredSeries.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="card overflow-hidden relative">
            <div 
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${featuredIndex * 100}%)` }}
              ref={featuredRef}
            >
              {featuredSeries.map((show) => (
                <div key={show.id} className="w-full flex-shrink-0 relative">
                  <div className="aspect-[21/9] bg-gradient-to-r from-blue-900 to-dark-800 flex items-center">
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative z-10 flex items-center gap-8 px-12 w-full">
                      <Link to={`/movie/${show.id}`} className="w-64 flex-shrink-0">
                        <div className="aspect-[3/4] bg-dark-700 rounded-lg overflow-hidden shadow-2xl hover:scale-105 transition-transform">
                          {show.thumbnail_url ? (
                            <img src={show.thumbnail_url} alt={show.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-20 h-20 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">Featured</span>
                          {show.is_free && (
                            <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">Free</span>
                          )}
                          <span className="px-3 py-1 bg-dark-700 text-gray-300 text-xs font-medium rounded-full">TV Series</span>
                        </div>
                        <Link to={`/movie/${show.id}`}>
                          <h2 className="text-3xl font-bold text-white hover:text-blue-400 mb-2 transition-colors">{show.title}</h2>
                        </Link>
                        <p className="text-gray-300 mb-4 line-clamp-2">{show.description}</p>
                        <div className="flex items-center gap-4 mb-4">
                          {show.genre && <span className="px-3 py-1 bg-dark-700 rounded-full text-sm text-gray-300">{show.genre}</span>}
                          {show.release_year && <span className="text-gray-400">{show.release_year}</span>}
                          {show.duration && <span className="text-gray-400">{show.duration} min/ep</span>}
                        </div>
                        <div className="flex items-center gap-4">
                          <Link
                            to={`/movie/${show.id}`}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>Watch Now</span>
                          </Link>
                          <div className="flex items-center gap-1 text-gray-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                            <span>{show.likes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            <span>{show.views || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Slider Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {featuredSeries.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setFeaturedIndex(index);
                    setIsAutoPlaying(false);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${index === featuredIndex ? 'bg-blue-500' : 'bg-gray-500'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Genre Filter */}
      <div className="bg-dark-800 border-b border-dark-700 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-evenly gap-2 overflow-x-auto scrollbar-hide">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre === 'All' ? '' : genre)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-1 ${
                  (genre === 'All' && !selectedGenre) || selectedGenre === genre
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Series Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <p className="text-gray-400 text-lg">No TV series found</p>
            <p className="text-gray-500 text-sm mt-2">Check back soon for new content!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {series.map((show, index) => (
              <div
                key={show.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MovieCard movie={show} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default TVSeries;
