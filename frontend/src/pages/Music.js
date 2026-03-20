import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { musicAPI } from '../services/api';

const GENRES = ['All', 'Pop', 'Rock', 'Hip Hop', 'RnB', 'Gospel', 'Afrobeat', 'Jazz', 'Classical'];

const Music = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [playingTrack, setPlayingTrack] = useState(null);

  useEffect(() => {
    fetchMusic();
  }, [searchQuery, selectedGenre]);

  const fetchMusic = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedGenre) params.genre = selectedGenre;

      const response = await musicAPI.getAll(params);
      setTracks(response.data.tracks || []);
    } catch (error) {
      console.error('Error fetching music:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track) => {
    setPlayingTrack(playingTrack?.id === track.id ? null : track);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-20">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-900 via-dark-900 to-dark-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-display text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-4">
              Music Library
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Stream your favorite music anytime, anywhere. Free to listen!
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search music..."
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
      </div>

      {/* Genre Filter */}
      <div className="bg-dark-800 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-evenly gap-2 overflow-x-auto scrollbar-hide">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre === 'All' ? '' : genre)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-1 ${
                  (genre === 'All' && !selectedGenre) || selectedGenre === genre
                    ? 'bg-purple-600 text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Music List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-gray-400 text-lg">No music tracks found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className={`flex items-center gap-4 p-4 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors ${
                  playingTrack?.id === track.id ? 'border border-purple-500' : ''
                }`}
              >
                {/* Play Button */}
                <button
                  onClick={() => handlePlay(track)}
                  className="w-12 h-12 flex items-center justify-center bg-purple-600 hover:bg-purple-500 rounded-full transition-colors flex-shrink-0"
                >
                  {playingTrack?.id === track.id ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Thumbnail */}
                <div className="w-12 h-12 rounded bg-dark-600 flex-shrink-0 overflow-hidden">
                  {track.thumbnail_url ? (
                    <img src={track.thumbnail_url} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{track.title}</h3>
                  <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                </div>

                {/* Album */}
                <div className="hidden md:block flex-1 min-w-0">
                  <p className="text-gray-400 text-sm truncate">{track.album || 'Single'}</p>
                </div>

                {/* Genre */}
                <div className="hidden lg:block w-24">
                  <span className="text-gray-400 text-sm">{track.genre || '--'}</span>
                </div>

                {/* Duration */}
                <div className="w-16 text-right">
                  <span className="text-gray-400 text-sm">{formatDuration(track.duration)}</span>
                </div>

                {/* Like Button */}
                <button className="p-2 text-gray-400 hover:text-purple-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
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

export default Music;
