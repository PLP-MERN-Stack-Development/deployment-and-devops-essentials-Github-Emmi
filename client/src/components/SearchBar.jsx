import { useState, useCallback, useEffect } from 'react';
import { Search, X, UserPlus, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const SearchBar = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');

  const { sendFriendRequest, joinRoom } = useChat();
  const { user } = useAuth();

  // Debounced search function
  const searchUser = useCallback(async (email) => {
    if (!email || email === user?.email) {
      setSearchResult(null);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/friends/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResult(data.user);
        setShowResults(true);
      } else {
        setError(data.message || 'User not found');
        setSearchResult(null);
        setShowResults(true);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search user');
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  }, [user]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchEmail.trim()) {
        searchUser(searchEmail.trim());
      } else {
        setSearchResult(null);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchEmail, searchUser]);

  const handleSendRequest = async () => {
    if (!searchResult) return;

    try {
      await sendFriendRequest(searchResult._id);
      toast.success(`Friend request sent to ${searchResult.username}`);
      
      // Update local state to show pending
      setSearchResult({
        ...searchResult,
        hasPendingRequest: true,
        requestSentByMe: true,
      });
    } catch (err) {
      toast.error(err.message || 'Failed to send friend request');
    }
  };

  const handleOpenChat = () => {
    if (searchResult?.conversationId) {
      joinRoom(searchResult.conversationId);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchEmail('');
    setSearchResult(null);
    setShowResults(false);
    setError('');
  };

  const getActionButton = () => {
    if (!searchResult) return null;

    if (searchResult.isFriend) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Already friends</span>
          </div>
          <button
            onClick={handleOpenChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Open Chat
          </button>
        </div>
      );
    }

    if (searchResult.hasPendingRequest) {
      return (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <Clock className="w-4 h-4" />
          <span>
            {searchResult.requestSentByMe
              ? 'Friend request pending'
              : 'This user sent you a request'}
          </span>
        </div>
      );
    }

    return (
      <button
        onClick={handleSendRequest}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Send Friend Request
      </button>
    );
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </div>
        <input
          type="email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          placeholder="Search by email..."
          className="w-full pl-9 sm:pl-10 pr-10 py-2 sm:py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        />
        {searchEmail && (
          <button
            onClick={handleClose}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* Search Results Modal */}
      {showResults && (
        <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-w-md">
          <div className="p-4">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">{error}</p>
              </div>
            ) : searchResult ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <img
                    src={searchResult.avatar}
                    alt={searchResult.username}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate text-sm sm:text-base">
                      {searchResult.username}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">
                      {searchResult.email}
                    </p>
                    {searchResult.bio && (
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                        {searchResult.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                {getActionButton()}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClose}
        />
      )}
    </div>
  );
};

export default SearchBar;
