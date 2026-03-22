import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { moviesAPI } from '../services/api';

const Trending = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingSeries, setTrendingSeries] = useState([]);
  const [trendingMusic, setTrendingMusic] = useState([]);
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
      setTrendingMusic(response.data.trending_music || []);
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
      case 'music':
        return trendingMusic;
      default:
        return trendingMovies;
    }
  };

  const tabs = [
    { id: 'movies', label: 'Movies', icon: '🎬', color: 'orange' },
    { id: 'series', label: 'Series', icon: '📺', color: 'orange' },
    { id: 'liked', label: 'Most Liked', icon: '❤️', color: 'red' },
    { id: 'music', label: 'Music', icon: '🎵', color: 'purple' },
  ];

  // Movie/Series Card Component
  const ContentCard = ({ item, index, type }) => {
    const isMovie = !item.audio_url;
    const isFree = item.is_free || item.price === 0;
    
    return (
      <Link
        to={`/movie/${item.id}`}
        className="group relative block bg-dark-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-orange-500 transition-all duration-300 transform hover:scale-105"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Rank Badge */}
        <div className={`absolute top-2 left-2 z-20 w-8 h-8 rounded-full flex items-center justify-center ${type === 'music' ? 'bg-purple-600' : 'bg-orange-600'} shadow-lg`}>
          <span className="text-white font-bold text-sm">#{index + 1}</span>
        </div>
        
        {/* Thumbnail */}
        <div className="aspect-[2/3] relative overflow-hidden">
          {item.thumbnail_url ? (
            <img 
              src={item.thumbnail_url} 
              alt={item.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
              <span className="text-4xl">{isMovie ? '🎬' : '📺'}</span>
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-bold text-lg truncate mb-1">{item.title}</h3>
            <div className="flex items-center gap-2 text-gray-300 text-sm mb-2">
              {item.release_year && <span>{item.release_year}</span>}
              {item.duration && <span>• {item.duration} min</span>}
              {item.genre && <span>• {item.genre}</span>}
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {isFree && (
                <span className="px-2 py-1 text-xs font-medium bg-green-600/80 text-white rounded-full">
                  FREE
                </span>
              )}
              {item.is_featured && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-600/80 text-white rounded-full">
                  Featured
                </span>
              )}
              {item.likes > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-red-600/80 text-white rounded-full">
                  ❤️ {item.likes}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  // Music Card Component
  const MusicCard = ({ item, index }) => (
    <Link
      to={`/music/${item.id}`}
      className="group relative flex items-center gap-4 bg-dark-800 rounded-xl p-4 hover:bg-dark-700 transition-all duration-300"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Rank */}
      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-sm">#{index + 1}</span>
      </div>
      
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-dark-700">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl">🎵</span>
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold truncate">{item.title}</h3>
        <p className="text-gray-400 text-sm truncate">{item.artist || 'Unknown Artist'}</p>
        <div className="flex items-center gap-2 mt-1">
          {item.likes > 0 && (
            <span className="text-xs text-purple-400">❤️ {item.likes}</span>
          )}
          {item.is_free && (
            <span className="px-2 py-0.5 text-xs bg-green-600/80 text-white rounded-full">FREE</span>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-dark-900 pt-16">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-900 via-purple-900 to-dark-900 py-12 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Trending Now
            </h1>
          </div>
          <p className="text-gray-400 text-center text-lg max-w-2xl mx-auto">
            Discover what everyone's watching and loving right now!
          </p>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">{trendingMovies.length}</p>
              <p className="text-gray-500 text-sm">Movies</p>
            </div>
            <div className="w-px h-12 bg-dark-700" />
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">{trendingSeries.length}</p>
              <p className="text-gray-500 text-sm">Series</p>
            </div>
            <div className="w-px h-12 bg-dark-700" />
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-500">{trendingMusic.length}</p>
              <p className="text-gray-500 text-sm">Music</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Horizontal Scroll on Mobile */}
      <div className="sticky top-16 z-30 bg-dark-900/95 backdrop-blur-sm border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? tab.color === 'purple' 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-black/20">
                  {tab.id === 'movies' ? trendingMovies.length : 
                   tab.id === 'series' ? trendingSeries.length :
                   tab.id === 'liked' ? topLiked.length : trendingMusic.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : getCurrentContent().length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-dark-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-gray-400 text-xl mb-2">No {activeTab === 'music' ? 'music' : 'content'} trending yet</p>
            <p className="text-gray-500 text-sm">Start watching to make content trending!</p>
          </div>
        ) : activeTab === 'music' ? (
          /* Music List - Vertical Stack */
          <div className="grid gap-3 max-w-3xl mx-auto">
            {getCurrentContent().map((item, index) => (
              <MusicCard key={item.id} item={item} index={index} />
            ))}
          </div>
        ) : (
          /* Movies/Series Grid - Responsive */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {getCurrentContent().map((item, index) => (
              <ContentCard key={item.id} item={item} index={index} type={activeTab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trending;
