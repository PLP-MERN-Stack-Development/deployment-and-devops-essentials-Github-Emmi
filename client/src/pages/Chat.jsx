import { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import RoomHeader from '../components/RoomHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import CreateRoomModal from '../components/CreateRoomModal';
import { Plus, Menu, X } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';

const Chat = () => {
  const { fetchRooms, currentRoom, loadRoomMessages } = useChat();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

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

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-primary-500 text-white rounded-lg shadow-lg hover:bg-primary-600 transition-colors"
          aria-label="Toggle sidebar"
        >
          {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar - Mobile overlay, Desktop static */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:mt-0 mt-16
        `}>
          <Sidebar onClose={() => setShowSidebar(false)} />
        </div>

        {/* Overlay for mobile */}
        {showSidebar && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 mt-16"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentRoom ? (
            <>
              <RoomHeader />
              <MessageList />
              <MessageInput />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md">
                <div className="text-4xl sm:text-6xl mb-4">💬</div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Welcome to EmmiDev-Chat
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
                  Select a room to start chatting or create a new one
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Create Room
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating create room button - Only show on desktop when chat is open, or always show when no chat */}
      {!currentRoom && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="lg:hidden fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-all hover:scale-110 flex items-center justify-center z-30"
          title="Create new room"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
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
