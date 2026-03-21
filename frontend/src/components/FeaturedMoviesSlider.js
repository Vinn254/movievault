import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isYouTubeUrl, getYouTubeThumbnail } from '../utils/youtube';

const KENYA_LANGUAGES = [
  { id: 'all', name: 'All Languages', flag: '🇰🇪' },
  { id: 'swahili', name: 'Swahili', flag: '🇰🇪' },
  { id: 'english', name: 'English', flag: '🇬🇧' },
  { id: 'luo', name: 'Luo', flag: '🇰🇪' },
  { id: 'kikuyu', name: 'Kikuyu', flag: '🇰🇪' },
  { id: 'kalenjin', name: 'Kalenjin', flag: '🇰🇪' },
  { id: 'luhya', name: 'Luhya', flag: '🇰🇪' },
  { id: 'meru', name: 'Meru', flag: '🇰🇪' },
];

const FeaturedMoviesSlider = ({ movies = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredQuality, setHoveredQuality] = useState('720p');
  const [showQualityMenu, setShowQualityMenu] = useState(null);
  const [isHoverPlaying, setIsHoverPlaying] = useState(false);
  const sliderRef = useRef(null);
  const intervalRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Get video URL based on selected quality
  const getVideoUrl = (movie, quality) => {
    if (quality === '1080p' && movie.video_1080p) return movie.video_1080p;
    if (quality === '720p' && movie.video_720p) return movie.video_720p;
    if (quality === '360p' && movie.video_360p) return movie.video_360p;
    return movie.video_url;
  };

  // Handle mouse enter for video preview
  const handleMouseEnter = (index, movie) => {
    const isYouTube = isYouTubeUrl(movie.video_url);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredIndex(index);
      if (!isYouTube && (movie.video_url || movie.video_720p || movie.video_360p || movie.video_1080p)) {
        setIsHoverPlaying(true);
      }
    }, 500);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredIndex(null);
    setIsHoverPlaying(false);
    setShowQualityMenu(null);
  };

  // Filter movies by language and show movies with trailer or thumbnail
  useEffect(() => {
    let filtered = movies;
    
    // Show movies that have either trailer or thumbnail in featured section
    filtered = filtered.filter(movie => 
      (movie.trailer_url && isYouTubeUrl(movie.trailer_url)) || 
      movie.thumbnail_url || 
      (movie.video_url && isYouTubeUrl(movie.video_url))
    );
    
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(movie => 
        movie.language?.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }
    setFilteredMovies(filtered);
  }, [movies, selectedLanguage]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedLanguage]);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && filteredMovies.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredMovies.length);
      }, 5000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, filteredMovies.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredMovies.length) % filteredMovies.length);
    setIsAutoPlaying(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredMovies.length);
    setIsAutoPlaying(false);
  };

  const scrollToMovie = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    if (sliderRef.current) {
      const scrollAmount = index * 280; // card width + gap
      sliderRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Get movies for background (all movies, not just trailer ones)
  const backgroundMovies = movies.filter(movie => {
    if (movie.thumbnail_url) return true;
    if (movie.video_url && isYouTubeUrl(movie.video_url)) return true;
    return false;
  });

  // Show section if there are background movies, even if no trailer movies
  const showSection = backgroundMovies.length > 0;

  if (!showSection) {
    return null;
  }

  const currentMovie = filteredMovies.length > 0 ? filteredMovies[currentIndex] : backgroundMovies[0];
  const backgroundMovie = backgroundMovies[currentIndex] || backgroundMovies[0];
  
  // Get thumbnail for current movie - prefer trailer, then thumbnail_url, then video_url
  const getThumbnail = (movie) => {
    // First check if there's a trailer URL
    if (movie.trailer_url && isYouTubeUrl(movie.trailer_url)) {
      return getYouTubeThumbnail(movie.trailer_url);
    }
    // Then check thumbnail_url
    if (movie.thumbnail_url) {
      if (isYouTubeUrl(movie.thumbnail_url)) {
        return getYouTubeThumbnail(movie.thumbnail_url);
      }
      return movie.thumbnail_url;
    }
    // Finally check video_url
    if (movie.video_url && isYouTubeUrl(movie.video_url)) {
      return getYouTubeThumbnail(movie.video_url);
    }
    return null;
  };
  
  return (
    <div className="relative bg-dark-800 overflow-hidden">
      {/* Language Filter Tabs */}
      <div className="border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-gray-400 text-sm mr-2">Languages:</span>
            {KENYA_LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLanguage(lang.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  selectedLanguage === lang.id
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:text-white'
                }`}
              >
                {lang.flag} {lang.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Slider */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        {/* Background Image with Ken Burns Effect */}
        {backgroundMovie && (
          <Link to={currentMovie?.trailer_url && isYouTubeUrl(currentMovie.trailer_url) ? `/trailer/${currentMovie.id}` : `/movie/${currentMovie?.id}`} className="absolute inset-0">
            {getThumbnail(backgroundMovie) ? (
              <img
                src={getThumbnail(backgroundMovie)}
                alt={backgroundMovie.title}
                className="w-full h-full object-cover animate-ken-burns"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-dark-800 via-dark-700 to-dark-900" />
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/70 to-dark-900/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-900/90 via-transparent to-dark-900/50" />
          </Link>
        )}

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="w-full md:w-2/3 lg:w-1/2">
            {/* Featured Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-primary-600 text-white text-sm font-medium rounded-full animate-pulse">
                ★ Featured
              </span>
              {currentMovie?.language && (
                <span className="px-3 py-1 bg-dark-700/80 backdrop-blur text-gray-300 text-sm rounded-full">
                  {KENYA_LANGUAGES.find(l => l.id === currentMovie.language?.toLowerCase())?.flag || '🎬'} {currentMovie.language}
                </span>
              )}
            </div>

            {/* Movie Title */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-slide-up">
              {currentMovie?.title}
            </h2>

            {/* Movie Details */}
            <div className="flex items-center gap-4 text-gray-300 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              {currentMovie?.release_year && <span>{currentMovie.release_year}</span>}
              {currentMovie?.duration && <span>• {currentMovie.duration} min</span>}
              {currentMovie?.genre && <span>• {currentMovie.genre}</span>}
              {currentMovie?.rating && <span>• ★ {currentMovie.rating}/10</span>}
            </div>

            {/* Description */}
            <p className="text-gray-400 text-lg mb-8 line-clamp-3 max-w-xl animate-slide-up" style={{ animationDelay: '200ms' }}>
              {currentMovie?.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <Link
                to={`/movie/${currentMovie?.id}`}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-primary-600/30"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Now
              </Link>
              <Link
                to={`/movie/${currentMovie?.id}`}
                className="px-8 py-3 bg-dark-700/80 backdrop-blur hover:bg-dark-600 text-white font-semibold rounded-lg transition-all duration-300 border border-dark-500"
              >
                See Details
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-dark-700/80 backdrop-blur hover:bg-dark-600 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-dark-700/80 backdrop-blur hover:bg-dark-600 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Progress Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {filteredMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToMovie(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-primary-600 w-8'
                  : 'bg-dark-500 hover:bg-dark-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Horizontal Movie Scroll - See More Section */}
      <div className="bg-dark-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">
              {selectedLanguage === 'all' 
                ? 'All Featured Movies' 
                : `Featured in ${KENYA_LANGUAGES.find(l => l.id === selectedLanguage)?.name}`}
            </h3>
            <Link
              to="/"
              className="text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1 transition-colors"
            >
              See More
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Scrollable Movie Cards */}
          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
            style={{ scrollBehavior: 'smooth' }}
          >
            {filteredMovies.map((movie, index) => (
              <Link
                key={movie.id}
                to={`/movie/${movie.id}`}
                className="flex-shrink-0 w-64 snap-start group"
                onMouseEnter={() => handleMouseEnter(index, movie)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-dark-700 mb-3">
                  {movie.thumbnail_url ? (
                    <img
                      src={movie.thumbnail_url}
                      alt={movie.title}
                      className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${hoveredIndex === index ? 'opacity-0' : 'opacity-100'}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Video Preview Overlay */}
                  {hoveredIndex === index && isHoverPlaying && (movie.video_url || movie.video_720p || movie.video_360p || movie.video_1080p) && (
                    <div className="absolute inset-0 bg-black">
                      <video
                        src={getVideoUrl(movie, hoveredQuality)}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Quality Selector */}
                  {(movie.video_360p || movie.video_720p || movie.video_1080p) && hoveredIndex === index && (
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowQualityMenu(showQualityMenu === index ? null : index);
                        }}
                        className="px-2 py-1 bg-black/70 hover:bg-black/90 text-white text-xs rounded flex items-center gap-1 transition-colors"
                      >
                        {hoveredQuality}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showQualityMenu === index && (
                        <div className="absolute top-full right-0 mt-1 bg-dark-800 rounded shadow-lg overflow-hidden min-w-[80px] z-20">
                          {movie.video_360p && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setHoveredQuality('360p');
                                setShowQualityMenu(null);
                                setIsHoverPlaying(true);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-dark-700 transition-colors ${hoveredQuality === '360p' ? 'text-primary-400 bg-dark-700' : 'text-white'}`}
                            >
                              360p
                            </button>
                          )}
                          {movie.video_720p && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setHoveredQuality('720p');
                                setShowQualityMenu(null);
                                setIsHoverPlaying(true);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-dark-700 transition-colors ${hoveredQuality === '720p' ? 'text-primary-400 bg-dark-700' : 'text-white'}`}
                            >
                              720p
                            </button>
                          )}
                          {movie.video_1080p && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setHoveredQuality('1080p');
                                setShowQualityMenu(null);
                                setIsHoverPlaying(true);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-dark-700 transition-colors ${hoveredQuality === '1080p' ? 'text-primary-400 bg-dark-700' : 'text-white'}`}
                            >
                              1080p
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center ${hoveredIndex === index && isHoverPlaying ? 'opacity-0' : ''}`}>
                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <h4 className="text-white font-medium truncate group-hover:text-primary-400 transition-colors">
                  {movie.title}
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  {movie.release_year && <span>{movie.release_year}</span>}
                  {movie.duration && <span>• {movie.duration} min</span>}
                  {/* Show available qualities */}
                  {(movie.video_360p || movie.video_720p || movie.video_1080p) && (
                    <div className="flex items-center gap-1 ml-auto">
                      {movie.video_360p && <span className="text-xs bg-dark-600 px-1 rounded">360p</span>}
                      {movie.video_720p && <span className="text-xs bg-dark-600 px-1 rounded">720p</span>}
                      {movie.video_1080p && <span className="text-xs bg-dark-600 px-1 rounded">1080p</span>}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes ken-burns {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-ken-burns {
          animation: ken-burns 10s ease-in-out infinite alternate;
        }
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default FeaturedMoviesSlider;
