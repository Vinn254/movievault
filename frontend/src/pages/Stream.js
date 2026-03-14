import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { moviesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isStreamingSiteUrl, getEmbedUrl, getYouTubeThumbnail, isYouTubeUrl, getYouTubeEmbedUrl } from '../utils/youtube';

// Related Movies Component
const RelatedMovies = ({ currentMovieId }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get thumbnail - use streaming site thumbnail if thumbnail_url is empty or is a streaming URL
  const getDisplayThumbnail = (movie) => {
    const { thumbnail_url, video_url } = movie;
    const isThumbnailStreaming = isStreamingSiteUrl(thumbnail_url);
    // Use thumbnail from video_url if thumbnail_url is not set or is a streaming URL
    if ((!thumbnail_url || isThumbnailStreaming) && isStreamingSiteUrl(video_url)) {
      return getYouTubeThumbnail(video_url);
    }
    return thumbnail_url;
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await moviesAPI.getAll({ limit: 6 });
        // Filter out current movie
        const otherMovies = response.data.movies.filter(m => m.id !== currentMovieId);
        setMovies(otherMovies.slice(0, 5));
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [currentMovieId]);

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading...</div>;
  }

  if (movies.length === 0) {
    return <div className="text-gray-500 text-sm">No other movies available</div>;
  }

  return (
    <>
      {movies.map((movie) => {
        const displayThumbnail = getDisplayThumbnail(movie);
        return (
        <Link
          key={movie.id}
          to={movie.is_free || movie.price === 0 ? `/stream/${movie.id}` : `/movie/${movie.id}`}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-dark-700/50 transition-colors"
        >
          <div className="w-16 h-10 bg-dark-600 rounded overflow-hidden flex-shrink-0">
            {displayThumbnail ? (
              <img src={displayThumbnail} alt={movie.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-6 h-6 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{movie.title}</p>
            <p className="text-gray-500 text-xs">
              {movie.is_free ? 'Free' : `KES ${movie.price}`}
            </p>
          </div>
        </Link>
      )})}
    </>
  );
};

const Stream = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  
  const [movie, setMovie] = useState(null);
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [availableQualities, setAvailableQualities] = useState([]);
  const [isMinimized, setIsMinimized] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);

  // Sample comments for demo (in production, this would come from backend)
  useEffect(() => {
    if (movie) {
      setComments([
        { id: 1, user: 'User1', text: 'Great movie!', time: '2 hours ago' },
        { id: 2, user: 'User2', text: 'The quality is amazing', time: '1 hour ago' },
        { id: 3, user: 'User3', text: 'Love this film', time: '30 min ago' },
      ]);
    }
  }, [movie]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchStream();
    
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (streamData?.video_url && videoRef.current) {
      initializePlayer();
    }
  }, [streamData, selectedQuality]);

  const fetchStream = async () => {
    try {
      // First get movie details
      const movieResponse = await moviesAPI.getById(id);
      const movieData = movieResponse.data;
      setMovie(movieData);
      
      // Check if video URL exists
      if (!movieData.video_url && !movieData.video_720p && !movieData.video_360p && !movieData.video_1080p) {
        setError('No video available for this movie. Please upload a video first.');
        setLoading(false);
        return;
      }
      
      // Check if this is a supported streaming site video
      const isStreamingSite = isStreamingSiteUrl(movieData.video_url);
      if (isStreamingSite) {
        // For streaming site videos, we don't need to call the stream endpoint
        setStreamData({ video_url: movieData.video_url, isStreamingSite: true });
        setLoading(false);
        return;
      }
      
      // Determine available qualities for non-YouTube videos
      const qualities = [];
      if (movieData.video_360p) qualities.push({ label: '360p', url: movieData.video_360p });
      if (movieData.video_720p) qualities.push({ label: '720p', url: movieData.video_720p });
      if (movieData.video_1080p) qualities.push({ label: '1080p', url: movieData.video_1080p });
      if (movieData.video_url && qualities.length === 0) qualities.push({ label: 'HD', url: movieData.video_url });
      
      setAvailableQualities(qualities);
      
      // Set default quality to highest available
      if (movieData.video_1080p) setSelectedQuality('1080p');
      else if (movieData.video_720p) setSelectedQuality('720p');
      else if (movieData.video_360p) setSelectedQuality('360p');
      
      // Then get streaming URL
      const streamResponse = await moviesAPI.stream(id);
      setStreamData(streamResponse.data);
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load stream';
      if (message.includes('purchase')) {
        navigate(`/movie/${id}`);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getVideoUrl = () => {
    if (!movie) return streamData?.video_url;
    
    if (selectedQuality === '1080p' && movie.video_1080p) return movie.video_1080p;
    if (selectedQuality === '720p' && movie.video_720p) return movie.video_720p;
    if (selectedQuality === '360p' && movie.video_360p) return movie.video_360p;
    return movie.video_url || streamData?.video_url;
  };

  const initializePlayer = () => {
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    const videoUrl = getVideoUrl();
    if (!videoUrl || !videoRef.current) return;

    playerRef.current = videojs(videoRef.current, {
      controls: true,
      autoplay: false,
      preload: 'auto',
      fluid: true,
      sources: [{
        src: videoUrl,
        type: 'video/mp4',
      }],
      playbackRates: [0.5, 1, 1.5, 2],
      tracks: movie?.subtitle_url ? [{
        kind: 'captions',
        src: movie.subtitle_url,
        srclang: movie.subtitle_language || 'en',
        label: movie.subtitle_language || 'Subtitles',
        default: true
      }] : []
    });

    playerRef.current.on('error', () => {
      setError('Video playback error. Please try again later.');
    });
  };

  const handleQualityChange = (quality) => {
    setSelectedQuality(quality);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now(),
      user: user?.username || 'You',
      text: newComment,
      time: 'Just now'
    };
    
    setComments([comment, ...comments]);
    setNewComment('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <Link to={`/movie/${id}`} className="btn btn-primary">
            Back to Movie
          </Link>
        </div>
      </div>
    );
  }

  // Check if this is a streaming site video
  const isStreamingSite = streamData?.isStreamingSite || isStreamingSiteUrl(movie?.video_url);
  const streamingEmbedUrl = isStreamingSite ? getEmbedUrl(movie?.video_url) : null;

  return (
    <div className="min-h-screen bg-dark-900 py-4">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Back button */}
        <Link
          to={`/movie/${id}`}
          className="inline-flex items-center text-gray-400 hover:text-white mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Video Player Section */}
          <div className="lg:col-span-3">
            {/* Video Player */}
            <div className="card overflow-hidden">
              {/* Minimize/Maximize Button */}
              <div className="relative">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="absolute top-2 right-2 z-10 p-2 bg-dark-800/80 rounded-lg text-white hover:bg-dark-700 transition-colors"
                  title={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  )}
                </button>
              </div>
              <div className={`bg-black transition-all duration-300 ${isMinimized ? 'h-64 sm:h-80 md:h-96' : 'aspect-video'}`}>
                {/* Streaming Site Embed */}
                {isStreamingSite && streamingEmbedUrl ? (
                  <iframe
                    src={`${streamingEmbedUrl}?autoplay=1`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={movie?.title}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    className="video-js vjs-big-play-centered vjs-theme-forest w-full h-full"
                    playsInline
                  />
                )}
              </div>
              
              {/* Quality Selector */}
              {availableQualities.length > 1 && (
                <div className="p-3 bg-dark-800 border-t border-dark-700">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs">Quality:</span>
                    <div className="flex gap-1">
                      {availableQualities.map((q) => (
                        <button
                          key={q.label}
                          onClick={() => handleQualityChange(q.label)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            selectedQuality === q.label
                              ? 'bg-primary-600 text-white'
                              : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                          }`}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Movie Info */}
              <div className="p-4">
                <h1 className="font-display text-xl font-bold text-white mb-1">
                  {movie?.title}
                </h1>
                
                <div className="flex flex-wrap gap-3 text-gray-400 text-sm">
                  {movie?.genre && <span>{movie.genre}</span>}
                  {streamData?.expires_at && (
                    <span className="text-accent-400 text-xs">
                      Expires: {new Date(streamData.expires_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Comments & Related Movies */}
          <div className="lg:col-span-1 space-y-4">
            {/* Comments Section */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Live Comments</h3>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  {showComments ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showComments && (
                <>
                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="input text-sm flex-1"
                      />
                      <button
                        type="submit"
                        className="btn btn-primary text-sm px-3"
                      >
                        Post
                      </button>
                    </div>
                  </form>
                  
                  {/* Comments List */}
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-dark-700/50 p-2 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-primary-400 text-sm font-medium">{comment.user}</span>
                          <span className="text-gray-500 text-xs">{comment.time}</span>
                        </div>
                        <p className="text-gray-300 text-sm">{comment.text}</p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">No comments yet</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Related Movies */}
            <div className="card p-4">
              <h3 className="font-semibold text-white mb-4">More Movies</h3>
              <div className="space-y-2">
                <RelatedMovies currentMovieId={id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stream;
