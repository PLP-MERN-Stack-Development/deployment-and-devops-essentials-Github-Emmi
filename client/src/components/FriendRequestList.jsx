import { Check, X, UserPlus } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { toast } from 'react-hot-toast';

const FriendRequestList = () => {
  const { friendRequests, acceptFriendRequest, declineFriendRequest } = useChat();

  const handleAccept = async (requestId, senderName) => {
    try {
      await acceptFriendRequest(requestId);
      toast.success(`You are now friends with ${senderName}!`);
    } catch (err) {
      toast.error(err.message || 'Failed to accept friend request');
    }
  };

  const handleDecline = async (requestId, senderName) => {
    try {
      await declineFriendRequest(requestId);
      toast.success(`Declined friend request from ${senderName}`);
    } catch (err) {
      toast.error(err.message || 'Failed to decline friend request');
    }
  };

  if (!friendRequests || friendRequests.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-700">
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          <h3 className="text-white font-semibold text-sm sm:text-base">
            Friend Requests
          </h3>
          <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
            {friendRequests.length}
          </span>
        </div>

        <div className="space-y-2">
          {friendRequests.map((request) => (
            <div
              key={request._id}
              className="bg-gray-700 rounded-lg p-3 flex items-center gap-3 hover:bg-gray-600 transition-colors"
            >
              {/* Avatar */}
              <img
                src={request.sender.avatar}
                alt={request.sender.username}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
              />

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm sm:text-base truncate">
                  {request.sender.username}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm truncate">
                  {request.sender.email}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAccept(request._id, request.sender.username)}
                  className="bg-green-600 hover:bg-green-700 text-white p-1.5 sm:p-2 rounded-lg transition-colors group"
                  title="Accept"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => handleDecline(request._id, request.sender.username)}
                  className="bg-red-600 hover:bg-red-700 text-white p-1.5 sm:p-2 rounded-lg transition-colors group"
                  title="Decline"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FriendRequestList;
