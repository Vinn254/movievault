import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { musicAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Music = () => {
  const { isAuthenticated, user } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const featuredRef = useRef(null);
  const featuredIntervalRef = useRef(null);

  useEffect(() => {
    fetchTracks();
  }, []);

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

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'free') return matchesSearch && track.is_free;
    if (filter === 'paid') return matchesSearch && !track.is_free;
    return matchesSearch;
  });

  const handlePlay = (track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioElement?.pause();
        setIsPlaying(false);
      } else {
        audioElement?.play();
        setIsPlaying(true);
      }
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      
      const audio = new Audio(track.audio_url);
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTrack(null);
      });
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setIsPlaying(false);
      });
      
      setAudioElement(audio);
      setCurrentTrack(track);
      setIsPlaying(true);
      audio.play();
    }
  };

  const handleLike = async (trackId) => {
    if (!isAuthenticated) {
      alert('Please login to like tracks');
      return;
    }
    
    try {
      await musicAPI.like(trackId, 'like');
      fetchTracks();
    } catch (error) {
      console.error('Error liking track:', error);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get trending/featured tracks (sorted by views and likes)
  const featuredTracks = [...tracks]
    .sort((a, b) => (b.views || 0) + (b.likes || 0) * 10 - ((a.views || 0) + (a.likes || 0) * 10))
    .slice(0, 5);

  // Auto-play featured slider
  useEffect(() => {
    if (isAutoPlaying && featuredTracks.length > 1) {
      featuredIntervalRef.current = setInterval(() => {
        setFeaturedIndex((prev) => (prev + 1) % featuredTracks.length);
      }, 5000);
    }
    return () => {
      if (featuredIntervalRef.current) {
        clearInterval(featuredIntervalRef.current);
      }
    };
  }, [isAutoPlaying, featuredTracks.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      {/* Hero Section with Music Icon */}
      <div className="relative bg-gradient-to-b from-purple-900/50 to-dark-900 py-16">
        <div className="absolute top-4 right-8 opacity-20 flex gap-4">
          <svg className="w-64 h-64 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          <svg className="w-48 h-48 text-purple-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          <svg className="w-40 h-40 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white">
              Music Library
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl">
            Stream your favorite music. Free trial for 24 hours on premium content.
          </p>
        </div>
      </div>

      {/* Featured Music Slider */}
      {featuredTracks.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="card overflow-hidden relative">
            <div 
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${featuredIndex * 100}%)` }}
              ref={featuredRef}
            >
              {featuredTracks.map((track, index) => (
                <div key={track.id} className="w-full flex-shrink-0 relative">
                  <div className="aspect-[21/9] bg-gradient-to-r from-purple-900 to-dark-800 flex items-center">
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative z-10 flex items-center gap-8 px-12 w-full">
                      <div className="w-48 h-48 bg-dark-700 rounded-lg overflow-hidden flex-shrink-0 shadow-2xl">
                        {track.thumbnail_url ? (
                          <img src={track.thumbnail_url} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-20 h-20 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">Featured</span>
                          {track.is_free && (
                            <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">Free</span>
                          )}
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">{track.title}</h2>
                        <p className="text-xl text-gray-300 mb-4">{track.artist}</p>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handlePlay(track)}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-2 transition-colors"
                          >
                            {currentTrack?.id === track.id && isPlaying ? (
                              <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                <span>Play Now</span>
                              </>
                            )}
                          </button>
                          <div className="flex items-center gap-1 text-gray-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                            <span>{track.likes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            <span>{track.views || 0}</span>
                          </div>
                        </div>
                      </div>
                      {/* Person with headphones image on right */}
                      <div className="hidden lg:block w-64 h-64 flex-shrink-0 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent rounded-lg" />
                        <img 
                          src="https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400&h=400&fit=crop" 
                          alt="Person listening to music" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center">
                          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                            </svg>
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
              {featuredTracks.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setFeaturedIndex(index);
                    setIsAutoPlaying(false);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${index === featuredIndex ? 'bg-purple-500' : 'bg-gray-500'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search songs or artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-dark-800 text-gray-300 hover:bg-dark-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('free')}
              className={`px-4 py-2 rounded-lg ${filter === 'free' ? 'bg-green-600 text-white' : 'bg-dark-800 text-gray-300 hover:bg-dark-700'}`}
            >
              Free
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg ${filter === 'paid' ? 'bg-primary-600 text-white' : 'bg-dark-800 text-gray-300 hover:bg-dark-700'}`}
            >
              Premium
            </button>
          </div>
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              className={`card p-4 hover:border-purple-500 transition-all ${currentTrack?.id === track.id ? 'border-purple-500' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-dark-700 rounded-lg flex-shrink-0 overflow-hidden relative group">
                  {track.thumbnail_url ? (
                    <img src={track.thumbnail_url} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Play Button Overlay */}
                  <button
                    onClick={() => handlePlay(track)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{track.title}</h3>
                  <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500 text-xs">{formatDuration(track.duration)}</span>
                    {track.is_free ? (
                      <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">Free</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">Premium</span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleLike(track.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <svg className="w-6 h-6" fill={track.likes > 0 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTracks.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-gray-400 text-lg">No tracks found</p>
          </div>
        )}
      </div>

      {/* Now Playing Bar */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <div className="w-12 h-12 bg-dark-700 rounded flex-shrink-0 overflow-hidden">
              {currentTrack.thumbnail_url ? (
                <img src={currentTrack.thumbnail_url} alt={currentTrack.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold truncate">{currentTrack.title}</h4>
              <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
            </div>
            
            <button
              onClick={() => handlePlay(currentTrack)}
              className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors"
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Music;
