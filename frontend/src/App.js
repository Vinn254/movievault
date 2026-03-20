import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetail from './pages/MovieDetail';
import Stream from './pages/Stream';
import MyLibrary from './pages/MyLibrary';
import AdminDashboard from './pages/AdminDashboard';
import AdminMovies from './pages/AdminMovies';
import AdminUsers from './pages/AdminUsers';
import AdminMusic from './pages/AdminMusic';
import Trailer from './pages/Trailer';
import Music from './pages/Music';
import TVSeries from './pages/TVSeries';
import Trending from './pages/Trending';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/stream/:id" element={<Stream />} />
              <Route path="/trailer/:id" element={<Trailer />} />
              <Route path="/library" element={<MyLibrary />} />
              <Route path="/music" element={<Music />} />
              <Route path="/tv-series" element={<TVSeries />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/movies" element={<AdminMovies />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/music" element={<AdminMusic />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
