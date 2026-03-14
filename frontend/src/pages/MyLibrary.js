import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { moviesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MyLibrary = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [purchases, setPurchases] = useState([]);
  const [movies, setMovies] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchPurchases();
  }, [isAuthenticated]);

  const fetchPurchases = async () => {
    try {
      const response = await moviesAPI.getPurchases();
      const purchasesData = response.data;
      setPurchases(purchasesData);

      // Fetch movie details for each purchase
      const moviePromises = purchasesData.map(p => moviesAPI.getById(p.movie_id));
      const movieResponses = await Promise.all(moviePromises);
      
      const moviesMap = {};
      movieResponses.forEach(response => {
        moviesMap[response.data.id] = response.data;
      });
      setMovies(moviesMap);
    } catch (error) {
      console.error('Error fetching purchases:', error);
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

  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-white mb-8">My Library</h1>

        {purchases.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-24 h-24 mx-auto text-dark-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-400 text-lg mb-4">You haven't purchased any movies yet</p>
            <Link to="/" className="btn btn-primary">
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {purchases.map((purchase) => {
              const movie = movies[purchase.movie_id];
              if (!movie) return null;

              const isExpired = new Date(purchase.expires_at) < new Date();

              return (
                <div key={purchase.id} className="movie-card">
                  <div className="aspect-video relative overflow-hidden bg-dark-700">
                    {movie.thumbnail_url ? (
                      <img
                        src={movie.thumbnail_url}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Status badge */}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium ${
                      isExpired ? 'bg-red-600' : 'bg-accent-600'
                    }`}>
                      {isExpired ? 'Expired' : 'Active'}
                    </div>
                    
                    {/* Play overlay */}
                    <Link
                      to={`/stream/${movie.id}`}
                      className={`absolute inset-0 bg-black/50 flex items-center justify-center ${
                        isExpired ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </Link>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-white truncate">
                      {movie.title}
                    </h3>
                    
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {isExpired ? 'Expired' : 'Expires'}
                      </span>
                      <span className="text-gray-500">
                        {new Date(purchase.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {!isExpired && (
                      <Link
                        to={`/stream/${movie.id}`}
                        className="mt-3 w-full btn btn-primary py-2 text-center block"
                      >
                        Watch Now
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLibrary;
