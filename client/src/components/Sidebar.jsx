import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime } from '../utils/helpers';
import { Users, Hash, MessageCircle } from 'lucide-react';

const Sidebar = () => {
  const { rooms, currentRoom, joinRoom, onlineUsers, startDirectChat, unreadRooms } = useChat();
  const { user } = useAuth();

  // Separate rooms and direct messages
  const groupRooms = rooms.filter((room) => room.roomType !== 'direct');
  const directMessages = rooms.filter((room) => room.roomType === 'direct');

  const getDirectChatName = (room) => {
    if (room.roomType === 'direct' && room.members) {
      const otherMember = room.members.find((m) => m._id !== user?._id);
      return otherMember?.username || 'Unknown User';
    }
    return room.name;
  };

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">EmmiDev-Chat</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {onlineUsers.length} online
        </p>
      </div>

      {/* Rooms list */}
      <div className="flex-1 overflow-y-auto">
        {/* Group Rooms */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            Rooms
          </h3>
          <div className="space-y-1">
            {groupRooms.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No rooms yet
              </p>
            ) : (
              groupRooms.map((room) => (
                <button
                  key={room._id}
                  onClick={() => joinRoom(room._id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    currentRoom === room._id
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{room.name}</div>
                      {room.lastMessage && (
                        <div className="text-xs opacity-75 truncate">
                          Last activity: {formatRelativeTime(room.updatedAt)}
                        </div>
                      )}
                    </div>
                    {unreadRooms[room._id] > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {unreadRooms[room._id] > 99 ? '99+' : unreadRooms[room._id]}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Direct Messages */}
        {directMessages.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Direct Messages
            </h3>
            <div className="space-y-1">
              {directMessages.map((dm) => (
                <button
                  key={dm._id}
                  onClick={() => joinRoom(dm._id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    currentRoom === dm._id
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{getDirectChatName(dm)}</div>
                      {dm.lastMessage && (
                        <div className="text-xs opacity-75 truncate">
                          Last activity: {formatRelativeTime(dm.updatedAt)}
                        </div>
                      )}
                    </div>
                    {unreadRooms[dm._id] > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {unreadRooms[dm._id] > 99 ? '99+' : unreadRooms[dm._id]}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Online users */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center">
            <Users className="w-3 h-3 mr-1" />
            Online ({onlineUsers.length})
          </h3>
          <div className="space-y-2">
            {onlineUsers.map((onlineUser) => (
              <button
                key={onlineUser.userId}
                onClick={() => onlineUser.userId !== user?._id && startDirectChat(onlineUser.userId)}
                disabled={onlineUser.userId === user?._id}
                className={`w-full flex items-center space-x-2 text-sm px-2 py-1 rounded transition-colors ${
                  onlineUser.userId === user?._id
                    ? 'cursor-default'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer'
                }`}
                title={onlineUser.userId === user?._id ? 'You' : `Chat with ${onlineUser.username}`}
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={`flex-1 text-left truncate ${
                  onlineUser.userId === user?._id
                    ? 'text-gray-500 dark:text-gray-500'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {onlineUser.username} {onlineUser.userId === user?._id && '(You)'}
                </span>
                {onlineUser.userId !== user?._id && (
                  <MessageCircle className="w-3 h-3 text-gray-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
