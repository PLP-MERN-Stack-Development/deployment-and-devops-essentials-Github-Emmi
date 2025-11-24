import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Settings, Hash, MessageCircle, LogOut, Trash2 } from 'lucide-react';
import RoomSettingsModal from './RoomSettingsModal';
import api from '../utils/api';
import toast from 'react-hot-toast';

const RoomHeader = () => {
  const { rooms, currentRoom, fetchRooms, leaveRoom } = useChat();
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  const room = rooms.find((r) => r._id === currentRoom);

  if (!room) return null;

  const isAdmin = room.admins?.some((admin) => admin._id === user?._id || admin === user?._id);
  const isCreator = room.creator?._id === user?._id || room.creator === user?._id;
  const isDirect = room.roomType === 'direct';
  const isMember = room.members?.some((member) => member._id === user?._id || member === user?._id);

  // For direct messages, show the other user's name
  const getRoomName = () => {
    if (isDirect && room.members) {
      const otherMember = room.members.find((m) => m._id !== user?._id);
      return otherMember?.username || room.name;
    }
    return room.name;
  };

  const handleRoomUpdated = () => {
    // Refresh room data if needed
  };

  const handleRoomDeleted = () => {
    // Navigate away from deleted room
    window.location.reload(); // Simple approach
  };

  const handleLeaveRoom = async () => {
    const action = isCreator ? 'delete' : 'leave';
    const confirmMessage = isCreator 
      ? `Are you sure you want to delete ${room.name}? This will remove all members and cannot be undone.`
      : `Are you sure you want to leave ${room.name}? You will no longer see messages from this group.`;
    
    if (!confirm(confirmMessage)) return;

    setLoading(true);
    try {
      if (isCreator) {
        // Delete the room
        await api.delete(`/rooms/${room._id}`);
        toast.success('Room deleted successfully');
      } else {
        // Leave the room
        await api.post(`/rooms/${room._id}/leave`);
        toast.success('Left room successfully');
      }
      
      leaveRoom(room._id);
      await fetchRooms();
    } catch (error) {
      console.error(`${action} room error:`, error);
      toast.error(error.response?.data?.error || `Failed to ${action} room`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDM = async () => {
    const otherMember = room.members?.find((m) => m._id !== user?._id);
    const confirmMessage = `Are you sure you want to delete this conversation with ${otherMember?.username || 'this user'}? This will remove the chat from your list. You can start a new chat by clicking on them again.`;
    
    if (!confirm(confirmMessage)) return;

    setLoading(true);
    try {
      // Delete the DM room
      await api.delete(`/rooms/${room._id}`);
      toast.success('Conversation deleted successfully');
      
      leaveRoom(room._id);
      await fetchRooms();
    } catch (error) {
      console.error('Delete DM error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            {isDirect ? (
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500 flex-shrink-0" />
            ) : (
              <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white truncate">
                {getRoomName()}
              </h2>
              {room.description && !isDirect && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {room.description}
                </p>
              )}
              {isDirect && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Direct Message
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Delete DM button - show only for direct messages */}
            {isDirect && (
              <button
                onClick={handleDeleteDM}
                disabled={loading}
                className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 border border-gray-300 dark:border-gray-600"
                title="Delete Conversation"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Delete Chat</span>
                <span className="text-xs font-medium sm:hidden">Del</span>
              </button>
            )}

            {/* Leave/Delete room button - show for all members in group rooms only */}
            {!isDirect && (
              <button
                onClick={handleLeaveRoom}
                disabled={loading}
                className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 border border-gray-300 dark:border-gray-600"
                title={isCreator ? "Delete Group" : "Leave Room"}
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">
                  {isCreator ? 'Delete' : 'Leave'}
                </span>
              </button>
            )}

            {/* Settings button - only show for admins in group rooms */}
            {isAdmin && !isDirect && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Room Settings"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Room Settings Modal */}
      <RoomSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        room={room}
        onRoomUpdated={handleRoomUpdated}
        onRoomDeleted={handleRoomDeleted}
      />
    </>
  );
};

export default RoomHeader;
