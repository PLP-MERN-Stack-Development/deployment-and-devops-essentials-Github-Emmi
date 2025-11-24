import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { LogOut, Settings, Bell, BellOff } from 'lucide-react';
import { useState } from 'react';
import SettingsModal from './SettingsModal';
import SearchBar from './SearchBar';

const Header = () => {
  const { user, logout } = useAuth();
  const { isConnected, unreadCount, setUnreadCount } = useChat();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    if (unreadCount > 0) {
      setUnreadCount(0);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left section */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={isConnected ? 'Connected' : 'Disconnected'}
            ></div>
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <SearchBar />
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* Notifications */}
          <button
            onClick={toggleNotifications}
            className="relative p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
            title={
              notificationsEnabled
                ? 'Disable notifications'
                : 'Enable notifications'
            }
          >
            {notificationsEnabled ? (
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <BellOff className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            {unreadCount > 0 && notificationsEnabled && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User info */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}`}
              alt={user?.username}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
            />
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:inline">
              {user?.username}
            </span>
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </header>
  );
};

export default Header;
