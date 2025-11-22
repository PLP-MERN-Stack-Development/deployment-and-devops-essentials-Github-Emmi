import { useState, useEffect } from 'react';
import { X, Shield, UserMinus, Trash2, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const RoomSettingsModal = ({ isOpen, onClose, room, onRoomUpdated, onRoomDeleted }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [roomDetails, setRoomDetails] = useState(null);

  useEffect(() => {
    if (isOpen && room) {
      fetchRoomDetails();
    }
  }, [isOpen, room]);

  const fetchRoomDetails = async () => {
    try {
      const response = await api.get(`/rooms/${room._id}`);
      setRoomDetails(response.data.data);
    } catch (error) {
      toast.error('Failed to load room details');
    }
  };

  const isAdmin = roomDetails?.admins?.some((admin) => admin._id === user?._id);
  const isCreator = roomDetails?.creator?._id === user?._id;

  const handleAddAdmin = async (userId) => {
    setLoading(true);
    try {
      await api.put(`/rooms/${room._id}/admins`, { userId });
      toast.success('Admin added successfully');
      await fetchRoomDetails();
      onRoomUpdated?.();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add admin');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;

    setLoading(true);
    try {
      await api.delete(`/rooms/${room._id}/admins/${userId}`);
      toast.success('Admin removed successfully');
      await fetchRoomDetails();
      onRoomUpdated?.();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove admin');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    setLoading(true);
    try {
      await api.delete(`/rooms/${room._id}/members/${userId}`);
      toast.success('Member removed successfully');
      await fetchRoomDetails();
      onRoomUpdated?.();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) return;

    setLoading(true);
    try {
      await api.delete(`/rooms/${room._id}`);
      toast.success('Room deleted successfully');
      onRoomDeleted?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !roomDetails) return null;

  // Don't show settings for direct messages
  if (roomDetails.roomType === 'direct') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Room Settings: {roomDetails.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isAdmin && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200">
                You must be an admin to manage this room.
              </p>
            </div>
          )}

          {/* Room Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Room Information
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Type:</span> {roomDetails.roomType}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Description:</span>{' '}
                {roomDetails.description || 'No description'}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Members:</span> {roomDetails.members?.length || 0}
              </p>
            </div>
          </div>

          {/* Members List */}
          {isAdmin && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Members & Admins
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {roomDetails.members?.map((member) => {
                  const isMemberAdmin = roomDetails.admins?.some((admin) => admin._id === member._id);
                  const isMemberCreator = roomDetails.creator?._id === member._id;

                  return (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={member.avatar || `https://ui-avatars.com/api/?name=${member.username}`}
                          alt={member.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-800 dark:text-white">
                              {member.username}
                            </span>
                            {isMemberCreator && (
                              <span className="flex items-center text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded">
                                <Crown className="w-3 h-3 mr-1" />
                                Creator
                              </span>
                            )}
                            {isMemberAdmin && !isMemberCreator && (
                              <span className="flex items-center text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {member.email}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      {member._id !== user?._id && (
                        <div className="flex items-center space-x-2">
                          {!isMemberCreator && (
                            <>
                              {isMemberAdmin ? (
                                <button
                                  onClick={() => handleRemoveAdmin(member._id)}
                                  disabled={loading}
                                  className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors disabled:opacity-50"
                                  title="Remove admin"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAddAdmin(member._id)}
                                  disabled={loading}
                                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50"
                                  title="Make admin"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveMember(member._id)}
                                disabled={loading}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                                title="Remove from room"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {isCreator && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center">
                <Trash2 className="w-5 h-5 mr-2" />
                Danger Zone
              </h3>
              <button
                onClick={handleDeleteRoom}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete Room</span>
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This action cannot be undone. All messages will be lost.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomSettingsModal;
