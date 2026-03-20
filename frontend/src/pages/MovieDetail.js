import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { moviesAPI, paymentsAPI, subscriptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isStreamingSiteUrl, isYouTubeUrl, getYouTubeEmbedUrl, getYouTubeThumbnail } from '../utils/youtube';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchMovie();
    fetchSubscriptionStatus();
    fetchPlans();
  }, [id]);

  const fetchMovie = async () => {
    try {
      const response = await moviesAPI.getById(id);
      setMovie(response.data);
    } catch (error) {
      console.error('Error fetching movie:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await subscriptionAPI.getMyStatus();
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await subscriptionAPI.getPlans();
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleSubscribe = async (planName) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!phone) {
      setShowSubscriptionModal(true);
      setSelectedPlan(planName);
      return;
    }

    await processSubscriptionPayment(planName);
  };

  const processSubscriptionPayment = async (planName) => {
    setError('');
    setSuccess('');
    setProcessingPayment(true);

    try {
      const paymentType = planName === 'yearly' ? 'yearly_subscription' : 'monthly_subscription';
      const response = await paymentsAPI.initiate({
        payment_type: paymentType,
        phone_number: phone,
      });
      
      setCheckoutRequestId(response.data.checkout_request_id);
      setSuccess('Payment request sent! Check your phone and enter your M-Pesa PIN.');
      setPolling(true);
      pollPaymentStatus(response.data.checkout_request_id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initiate payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!phone) {
      setError('Please enter your phone number');
      return;
    }

    setError('');
    setSuccess('');
    setProcessingPayment(true);

    try {
      const response = await paymentsAPI.initiate({
        movie_id: id,
        phone_number: phone,
      });
      
      setCheckoutRequestId(response.data.checkout_request_id);
      setSuccess('Payment request sent! Check your phone and enter your M-Pesa PIN.');
      setPolling(true);
      
      // Start polling for payment status
      pollPaymentStatus(response.data.checkout_request_id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initiate payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const pollPaymentStatus = async (checkoutId) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      if (!polling) return;
      
      try {
        const response = await paymentsAPI.checkStatus(checkoutId);
        const status = response.data.status;

        if (status === 'completed') {
          setPolling(false);
          setSuccess('Payment successful! Redirecting to stream...');
          setPurchased(true);
          setTimeout(() => {
            navigate(`/stream/${id}`);
          }, 2000);
        } else if (status === 'failed') {
          setPolling(false);
          setError('Payment failed. Please try again.');
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 3000);
        } else {
          setPolling(false);
          setError('Payment timeout. Please check your phone and try again.');
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    };

    poll();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Movie not found</p>
          <Link to="/" className="text-primary-400 hover:text-primary-300 mt-4 inline-block">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  // Check if video URL or thumbnail_url is from any supported streaming site
  const isStreamingSite = isStreamingSiteUrl(movie.video_url) || isStreamingSiteUrl(movie.thumbnail_url);
  
  // Check if there's a trailer URL
  const hasTrailer = movie.trailer_url && isYouTubeUrl(movie.trailer_url);
  const trailerEmbedUrl = hasTrailer ? getYouTubeEmbedUrl(movie.trailer_url) : null;
  
  // Get streaming thumbnail - check both thumbnail_url and video_url for streaming URLs
  const getStreamingThumbnail = () => {
    if (isYouTubeUrl(movie.thumbnail_url)) return getYouTubeThumbnail(movie.thumbnail_url);
    if (isYouTubeUrl(movie.video_url)) return getYouTubeThumbnail(movie.video_url);
    return null;
  };
  const streamingThumbnail = isStreamingSite ? getStreamingThumbnail() : null;
  
  // Display thumbnail: use streaming thumbnail if thumbnail_url is a streaming URL, otherwise use thumbnail_url
  const isThumbnailStreaming = isStreamingSiteUrl(movie.thumbnail_url);
  const displayThumbnail = (!movie.thumbnail_url || isThumbnailStreaming) && streamingThumbnail 
    ? streamingThumbnail 
    : movie.thumbnail_url;

  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Movie Info */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              {/* Trailer Section */}
              {hasTrailer && trailerEmbedUrl ? (
                <div className="aspect-video">
                  <iframe
                    src={`${trailerEmbedUrl}?autoplay=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Trailer"
                  />
                </div>
              ) : (
                <>
                  {/* Thumbnail */}
                  <div className="aspect-video bg-dark-700 relative">
                    {displayThumbnail ? (
                      <img
                        src={displayThumbnail}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-24 h-24 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                      </div>
                    )}
                    {/* Streaming Site Play Button Overlay */}
                    {isStreamingSite && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center transform hover:scale-110 transition-transform">
                          <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              <div className="p-8">
                <h1 className="font-display text-3xl font-bold text-white mb-4">
                  {movie.title}
                </h1>
                
                <div className="flex flex-wrap gap-4 text-gray-400 mb-6">
                  {movie.genre && <span className="px-3 py-1 bg-dark-700 rounded-full">{movie.genre}</span>}
                  {movie.release_year && <span>{movie.release_year}</span>}
                  {movie.duration && <span>{movie.duration} min</span>}
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {movie.views} views
                  </span>
                </div>
                
                {movie.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <p className="text-gray-400 leading-relaxed">{movie.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Purchase Section */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              {/* Show watch button if free or user has subscription */}
              {subscriptionStatus?.has_subscription || movie.is_free ? (
                <Link
                  to={`/stream/${id}`}
                  className="block w-full btn btn-accent py-3 text-center"
                >
                  {movie.is_free ? 'Watch Free' : 'Watch Now'}
                </Link>
              ) : (
                <div className="text-center mb-4">
                  <p className="text-gray-400 mb-2">Subscribe to watch this content</p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-accent-500/20 border border-accent-500 rounded-lg text-accent-400 text-sm">
                  {success}
                </div>
              )}

              <div className="mt-4 text-center text-gray-500 text-sm">
                {movie.is_free ? (
                  <p>Watch this movie for free</p>
                ) : subscriptionStatus?.has_subscription ? (
                  <p className="text-green-400">✓ You have an active subscription</p>
                ) : (
                  <p>Subscribe to unlock all content</p>
                )}
              </div>

              {/* Subscription Plans Section */}
              <div className="mt-6 pt-6 border-t border-dark-700">
                {!subscriptionStatus?.has_subscription && (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-4 text-center">Subscribe to Watch</h3>
                    <div className="space-y-3">
                      {plans.map((plan) => (
                        <button
                          key={plan._id}
                          onClick={() => handleSubscribe(plan.name)}
                          disabled={processingPayment}
                          className="w-full flex items-center justify-between p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                        >
                          <div className="text-left">
                            <p className="text-white font-medium">{plan.display_name}</p>
                            <p className="text-gray-400 text-sm">{plan.duration_days} days access</p>
                          </div>
                          <div className="text-right">
                            <p className="text-primary-400 font-bold">KES {plan.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Complete Subscription</h3>
            <p className="text-gray-400 mb-4">Enter your M-Pesa phone number to subscribe</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="254XXXXXXXXX"
                className="input"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="flex-1 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSubscriptionModal(false);
                  processSubscriptionPayment(selectedPlan);
                }}
                disabled={!phone || processingPayment}
                className="flex-1 btn btn-primary py-2"
              >
                Pay with M-Pesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail;
