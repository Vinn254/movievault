import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  // Close menu when clicking outside or on escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'];

  const handleCategoryClick = (genre) => {
    // Navigate to home with genre query parameter
    navigate(`/?genre=${encodeURIComponent(genre)}`);
    setIsCategoryMenuOpen(false);
  };

  return (
    <nav className="bg-dark-900/95 backdrop-blur-sm border-b border-dark-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-white">Winning Creatives</span>
          </Link>

          {/* Desktop Navigation - Hidden, all items in sliding menu */}
          {/* Spacer - pushes menu to right */}
          <div className="flex-1" />

          {/* Menu button - visible on ALL screen sizes */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 flex items-center gap-2"
          >
            <span className="text-sm font-medium">Menu</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Sliding Menu Overlay */}
      {/* Highest z-index to appear above everything */}
      <div 
        className={`fixed inset-0 z-[99999] ${isMenuOpen ? '' : 'pointer-events-none'}`}
        style={{ visibility: isMenuOpen ? 'visible' : 'hidden' }}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60" 
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Sliding Panel */}
        <div 
          className={`absolute top-0 right-0 h-screen w-80 max-w-[85vw] bg-dark-900 border-l border-dark-700 shadow-2xl flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-out`}
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
            <span className="font-display font-bold text-xl text-white">Menu</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Content */}
          <div className="px-4 py-6 space-y-2 overflow-y-auto h-[calc(100%-64px)]">
            {/* Home Link */}
            <Link
              to="/"
              className="block px-4 py-3 text-gray-300 hover:bg-dark-800 hover:text-white rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>

            {/* Categories Section */}
            <div className="border-t border-dark-700 pt-4 mt-4">
              <button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="flex items-center justify-between w-full px-4 py-3 text-gray-300 hover:bg-dark-800 hover:text-white rounded-lg transition-colors"
              >
                <span>Categories</span>
                <svg className={`w-4 h-4 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Category Submenu */}
              <div className={`overflow-hidden transition-all duration-300 ${isCategoryMenuOpen ? 'max-h-96 mt-2' : 'max-h-0'}`}>
                <button
                  onClick={() => {
                    navigate('/');
                    setIsCategoryMenuOpen(false);
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left pl-8 pr-4 py-2 text-gray-400 hover:bg-dark-800 hover:text-white rounded-lg transition-colors text-sm"
                >
                  All Movies
                </button>
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => {
                      handleCategoryClick(genre);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left pl-8 pr-4 py-2 text-gray-400 hover:bg-dark-800 hover:text-white rounded-lg transition-colors text-sm"
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Music Section */}
            <Link
              to="/music"
              className="block px-4 py-3 text-gray-300 hover:bg-dark-800 hover:text-white rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Music
              </span>
            </Link>

            {/* TV Series Section */}
            <Link
              to="/tv-series"
              className="block px-4 py-3 text-gray-300 hover:bg-dark-800 hover:text-white rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                TV Series
              </span>
            </Link>

            {/* Trending */}
            <Link
              to="/trending"
              className="block px-4 py-3 text-gray-300 hover:bg-dark-800 hover:text-white rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Trending
              </span>
            </Link>

            {/* Auth Section */}
            <div className="border-t border-dark-700 pt-4 mt-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/library"
                    className="block px-4 py-3 text-gray-300 hover:bg-dark-800 hover:text-white rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Library
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-4 py-3 text-gray-300 hover:bg-dark-800 hover:text-white rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="px-4 py-3 text-gray-400 text-sm">
                    Signed in as <span className="text-white font-medium">{user?.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-red-400 hover:bg-dark-800 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-gray-300 hover:bg-dark-800 hover:text-white rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-3 bg-primary-600 text-white hover:bg-primary-500 rounded-lg transition-colors text-center font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
