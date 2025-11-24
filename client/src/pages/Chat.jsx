import { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import RoomHeader from '../components/RoomHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import CreateRoomModal from '../components/CreateRoomModal';
import { Plus } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';

const Chat = () => {
  const { fetchRooms, currentRoom, loadRoomMessages } = useChat();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Request notification permission
  useNotifications();

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Load messages when room changes
  useEffect(() => {
    if (currentRoom) {
      loadRoomMessages(currentRoom);
    }
  }, [currentRoom, loadRoomMessages]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col">
          {currentRoom ? (
            <>
              <RoomHeader />
              <MessageList />
              <MessageInput />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Welcome to EmmiDev-Chat
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Select a room to start chatting or create a new one
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Room
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating create room button */}
      {currentRoom && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-all hover:scale-110 flex items-center justify-center"
          title="Create new room"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Create room modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default Chat;
