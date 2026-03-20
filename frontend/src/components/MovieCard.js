import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { moviesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isStreamingSiteUrl, getYouTubeEmbedUrl, getYouTubeThumbnail } from '../utils/youtube';

const MovieCard = ({ movie, onUpdate }) => {
  const { id, title, thumbnail_url, video_url, video_360p, video_720p, video_1080p, price, duration, genre, release_year, likes, dislikes, user_liked, user_disliked, user_subscribed } = movie;
  const { isAuthenticated } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [isPlaying, setIsPlaying] = useState(false);
  const [movieLikes, setMovieLikes] = useState(likes || 0);
  const [movieDislikes, setMovieDislikes] = useState(dislikes || 0);
  const [isLiked, setIsLiked] = useState(user_liked || false);
  const [isDisliked, setIsDisliked] = useState(user_disliked || false);
  const [isSubscribed, setIsSubscribed] = useState(user_subscribed || false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Check if video URL or thumbnail_url is from any supported streaming site
  const isStreamingSite = isStreamingSiteUrl(video_url) || isStreamingSiteUrl(thumbnail_url);
  const youtubeEmbedUrl = isStreamingSite ? getYouTubeEmbedUrl(video_url || thumbnail_url) : null;
  
  // Get thumbnail - use streaming site thumbnail if thumbnail_url is a streaming URL or not set
  const isThumbnailStreaming = isStreamingSiteUrl(thumbnail_url);
  const displayThumbnail = (!thumbnail_url || isThumbnailStreaming) && isStreamingSite 
    ? getYouTubeThumbnail(video_url || thumbnail_url) 
    : thumbnail_url;

  // Get video URL based on selected quality
  const getVideoUrl = () => {
    if (selectedQuality === '1080p' && video_1080p) return video_1080p;
    if (selectedQuality === '720p' && video_720p) return video_720p;
    if (selectedQuality === '360p' && video_360p) return video_360p;
    return video_url;
  };

  // Handle mouse enter - start playing preview after delay
  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
      if (video_url || video_720p || video_360p || video_1080p) {
        setIsPlaying(true);
      }
    }, 500); // 500ms delay before starting preview
  };

  // Handle mouse leave - stop preview
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(false);
    setIsPlaying(false);
    setShowQualityMenu(false);
  };

  // Stop video when quality menu is shown
  useEffect(() => {
    if (showQualityMenu) {
      setIsPlaying(false);
    }
  }, [showQualityMenu]);

  // Available quality options
  const qualities = [];
  if (video_360p) qualities.push({ label: '360p', url: video_360p });
  if (video_720p) qualities.push({ label: '720p', url: video_720p });
  if (video_1080p) qualities.push({ label: '1080p', url: video_1080p });
  if (video_url && qualities.length === 0) qualities.push({ label: 'HD', url: video_url });

  // Handle like/dislike
  const handleLike = async (e, reaction) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Please login to like or dislike movies');
      return;
    }
    
    try {
      setIsLoading(true);
      await moviesAPI.likeMovie(id, reaction);
      
      // Update local state
      if (reaction === 'like') {
        if (isLiked) {
          setIsLiked(false);
          setMovieLikes(Math.max(0, movieLikes - 1));
        } else {
          setIsLiked(true);
          setMovieLikes(movieLikes + 1);
          if (isDisliked) {
            setIsDisliked(false);
            setMovieDislikes(Math.max(0, movieDislikes - 1));
          }
        }
      } else if (reaction === 'dislike') {
        if (isDisliked) {
          setIsDisliked(false);
          setMovieDislikes(Math.max(0, movieDislikes - 1));
        } else {
          setIsDisliked(true);
          setMovieDislikes(movieDislikes + 1);
          if (isLiked) {
            setIsLiked(false);
            setMovieLikes(Math.max(0, movieLikes - 1));
          }
        }
      }
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating reaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle subscribe
  const handleSubscribe = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Please login to subscribe to movies');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await moviesAPI.subscribeMovie(id);
      setIsSubscribed(response.data.subscribed);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link 
      to={`/movie/${id}`} 
      className="movie-card group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="aspect-video relative overflow-hidden bg-dark-700 rounded-lg">
        {displayThumbnail ? (
          <img
            src={displayThumbnail}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-300 ${isHovered ? 'scale-105' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
        )}
        
        {/* Streaming Site Embed Preview on Hover - only for non-thumbnail streaming URLs */}
        {isHovered && isStreamingSite && youtubeEmbedUrl && !isThumbnailStreaming && (
          <div className="absolute inset-0 bg-black">
            <iframe
              src={`${youtubeEmbedUrl}?autoplay=1&mute=1&controls=0&loop=1`}
              className="w-full h-full object-contain"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          </div>
        )}
        
        {/* Video Preview Overlay for Non-Streaming Site Videos */}
        {isHovered && isPlaying && !isStreamingSite && (video_url || video_720p || video_360p || video_1080p) && (
          <div className="absolute inset-0 bg-black">
            <video
              ref={videoRef}
              src={getVideoUrl()}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-contain"
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        )}
        
        {/* Quality Selector Button */}
        {(video_360p || video_720p || video_1080p) && isHovered && (
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQualityMenu(!showQualityMenu);
              }}
              className="px-2 py-1 bg-black/70 hover:bg-black/90 text-white text-xs rounded flex items-center gap-1 transition-colors"
            >
              {selectedQuality}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Quality Dropdown Menu */}
            {showQualityMenu && (
              <div className="absolute top-full right-0 mt-1 bg-dark-800 rounded shadow-lg overflow-hidden min-w-[100px] z-20">
                {qualities.map((q) => (
                  <button
                    key={q.label}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedQuality(q.label);
                      setShowQualityMenu(false);
                      setIsPlaying(true);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-dark-700 transition-colors ${
                      selectedQuality === q.label ? 'text-primary-400 bg-dark-700' : 'text-white'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {duration} min
          </div>
        )}
        
        {/* Price badge - show FREE or SUBSCRIPTION */}
        <div className="absolute top-2 left-2 bg-accent-600 text-white px-2 py-1 rounded-md text-sm font-medium">
          {movie.is_free ? 'FREE' : 'SUBSCRIPTION'}
        </div>
        
        {/* Play overlay */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
          {title}
        </h3>
        
        <div className="mt-2 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            {genre && <span>{genre}</span>}
            {release_year && <span>• {release_year}</span>}
          </div>
          {/* Show available qualities */}
          {qualities.length > 0 && (
            <div className="flex items-center gap-1">
              {qualities.map((q, i) => (
                <span key={q.label} className="text-xs bg-dark-700 px-1.5 py-0.5 rounded">
                  {q.label}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Like/Dislike and Subscribe Buttons */}
        <div className="mt-3 flex items-center justify-between border-t border-dark-700 pt-3">
          <div className="flex items-center gap-3">
            {/* Like Button */}
            <button
              onClick={(e) => handleLike(e, 'like')}
              disabled={isLoading || !isAuthenticated}
              className={`flex items-center gap-1 text-sm transition-colors ${
                isLiked ? 'text-green-500' : 'text-gray-400 hover:text-green-400'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span>{movieLikes}</span>
            </button>
            
            {/* Dislike Button */}
            <button
              onClick={(e) => handleLike(e, 'dislike')}
              disabled={isLoading || !isAuthenticated}
              className={`flex items-center gap-1 text-sm transition-colors ${
                isDisliked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-4 h-4" fill={isDisliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
              <span>{movieDislikes}</span>
            </button>
          </div>
          
          {/* Subscribe Button */}
          <button
            onClick={(e) => handleSubscribe(e)}
            disabled={isLoading || !isAuthenticated}
            className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full transition-colors ${
              isSubscribed 
                ? 'bg-primary-600 text-white' 
                : 'bg-dark-700 text-gray-300 hover:bg-primary-600'
            } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-4 h-4" fill={isSubscribed ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
