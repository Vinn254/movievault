import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { moviesAPI } from '../services/api';
import { isYouTubeUrl, getYouTubeEmbedUrl } from '../utils/youtube';

const Trailer = () => {
  const { id } = useParams();
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMovie();
  }, [id]);

  const fetchMovie = async () => {
    try {
      const response = await moviesAPI.getById(id);
      setMovie(response.data);
    } catch (err) {
      setError('Failed to load movie');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">{error || 'Movie not found'}</p>
          <Link to="/" className="text-primary-400 hover:text-primary-300 mt-4 inline-block">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  // Get trailer embed URL
  const trailerUrl = movie.trailer_url;
  const isTrailerYouTube = isYouTubeUrl(trailerUrl);
  const embedUrl = isTrailerYouTube ? getYouTubeEmbedUrl(trailerUrl) : null;

  if (!embedUrl) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">No trailer available</p>
          <Link to={`/movie/${id}`} className="text-primary-400 hover:text-primary-300 mt-4 inline-block">
            Go back to movie
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          to={`/movie/${id}`}
          className="inline-flex items-center text-gray-400 hover:text-white mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to movie details
        </Link>

        {/* Movie Title */}
        <h1 className="text-3xl font-bold text-white mb-6">
          {movie.title} - Trailer
        </h1>

        {/* Trailer Video */}
        <div className="card overflow-hidden">
          <div className="aspect-video">
            <iframe
              src={`${embedUrl}?autoplay=1`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${movie.title} Trailer`}
            />
          </div>
        </div>

        {/* Movie Info */}
        <div className="mt-6 card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">{movie.title}</h2>
          <div className="flex flex-wrap gap-4 text-gray-400 mb-4">
            {movie.genre && <span className="px-3 py-1 bg-dark-700 rounded-full">{movie.genre}</span>}
            {movie.release_year && <span>{movie.release_year}</span>}
            {movie.duration && <span>{movie.duration} min</span>}
          </div>
          {movie.description && (
            <p className="text-gray-400">{movie.description}</p>
          )}
          
          {/* Watch Full Movie Button */}
          <Link
            to={`/movie/${id}`}
            className="inline-block mt-6 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all"
          >
            Watch Full Movie (KES {movie.price})
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Trailer;
