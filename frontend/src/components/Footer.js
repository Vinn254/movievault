import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark-900 border-t border-dark-700 w-full">
      <div className="max-w-full w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-display font-bold text-lg text-white">MovieVault</span>
          </div>

          {/* Links - responsive */}
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-gray-400 text-sm">
            <a href="/privacy" className="hover:text-white transition-colors whitespace-nowrap">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition-colors whitespace-nowrap">Terms of Service</a>
            <a href="/contact" className="hover:text-white transition-colors whitespace-nowrap">Contact</a>
          </div>

          {/* Copyright */}
          <div className="text-gray-500 text-sm text-center">
            <p>© 2026 MovieVault. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
