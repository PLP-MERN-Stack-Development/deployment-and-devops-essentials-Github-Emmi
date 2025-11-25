import { formatMessageTime } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useState, useRef, useEffect } from 'react';

const Message = ({ message }) => {
  const { user } = useAuth();
  const { addReaction } = useChat();
  const isSent = message.sender._id === user._id;

  // Mobile gesture states
  const [showMobilePicker, setShowMobilePicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, isAbove: false });
  const [isLongPressing, setIsLongPressing] = useState(false);
  
  const touchStartRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const lastTapRef = useRef(0);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const messageRef = useRef(null);

  const handleReaction = (emoji) => {
    addReaction(message._id, emoji);
    setShowMobilePicker(false);
  };

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🎉'];
  const mobileReactions = ['😀', '❤️', '👍', '😂', '😮', '➕'];

  // Calculate smart positioning for emoji picker
  const calculatePickerPosition = () => {
    if (!messageRef.current) return;
    
    const messageRect = messageRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const messageCenter = messageRect.top + messageRect.height / 2;
    
    // Show picker above if message is in bottom 50% of viewport
    const isAbove = messageCenter > viewportHeight / 2;
    
    setPickerPosition({
      top: isAbove ? -60 : messageRect.height + 8,
      isAbove
    });
  };

  // Touch event handlers
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = Date.now();
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    setIsLongPressing(false);

    // Start long press timer (500ms)
    longPressTimerRef.current = setTimeout(() => {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      setIsLongPressing(true);
      calculatePickerPosition();
      setShowMobilePicker(true);
    }, 500);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);

    // Cancel long press if moved >10px
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setIsLongPressing(false);
    }

    // Swipe right detection (>50px horizontal)
    if (deltaX > 50 && deltaY < 30 && touch.clientX > touchStartPosRef.current.x) {
      // Cancel long press
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      // Trigger swipe right action (reply)
      // TODO: Implement reply functionality in ChatContext
      console.log('Swipe right to reply:', message._id);
      
      // Haptic feedback for swipe
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }
  };

  const handleTouchEnd = (e) => {
    const touchDuration = Date.now() - touchStartRef.current;
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Double tap detection (<300ms between taps)
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300 && touchDuration < 200) {
      // Double tap detected - quick react with ❤️
      handleReaction('❤️');
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]); // Double vibration pattern
      }
      
      // Reset tap timer
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }

    setIsLongPressing(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Close picker on outside click and scroll
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMobilePicker(false);
    };

    const handleScroll = () => {
      // Cancel picker on scroll
      if (showMobilePicker) {
        setShowMobilePicker(false);
      }
      // Cancel long press on scroll
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setIsLongPressing(false);
    };

    if (showMobilePicker) {
      document.addEventListener('touchstart', handleClickOutside);
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        document.removeEventListener('touchstart', handleClickOutside);
        window.removeEventListener('scroll', handleScroll);
      };
    }

    // Always listen for scroll to cancel long press
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showMobilePicker]);

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 group`}>
      <div className={`flex ${isSent ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[85%] sm:max-w-[70%]`}>
        {/* Avatar */}
        {!isSent && (
          <img
            src={message.sender.avatar || `https://ui-avatars.com/api/?name=${message.sender.username}`}
            alt={message.sender.username}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-1.5 sm:mr-2 flex-shrink-0"
          />
        )}

        <div className="min-w-0 flex-1 relative" ref={messageRef}>
          {/* Sender name (for received messages) */}
          {!isSent && (
            <div className="text-xs text-gray-500 mb-1 ml-1 sm:ml-2">
              {message.sender.username}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`rounded-2xl px-3 py-2 sm:px-4 break-words transition-transform ${
              isSent
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
            } ${isLongPressing ? 'scale-105 ring-2 ring-primary-300' : ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ userSelect: isLongPressing ? 'none' : 'auto' }}
          >
            {/* File/Image */}
            {message.messageType === 'image' && message.fileUrl && (
              <img
                src={message.fileUrl}
                alt={message.fileName}
                className="max-w-full rounded-lg mb-2 max-h-48 sm:max-h-64 object-cover"
              />
            )}

            {message.messageType === 'file' && message.fileUrl && (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded-lg mb-2 hover:bg-opacity-30"
              >
                <span className="text-xl sm:text-2xl flex-shrink-0">📎</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm sm:text-base truncate">{message.fileName}</div>
                  <div className="text-xs opacity-75">{message.fileSize}</div>
                </div>
              </a>
            )}

            {/* Text content */}
            {message.content && (
              <p className="break-words whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
            )}

            {/* Timestamp */}
            <div
              className={`text-xs mt-1 ${
                isSent ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {formatMessageTime(message.createdAt)}
              {message.edited && ' (edited)'}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 ml-1 sm:ml-2">
              {Object.entries(
                message.reactions.reduce((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <span
                  key={emoji}
                  className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                >
                  {emoji} {count}
                </span>
              ))}
            </div>
          )}

          {/* Quick reactions (show on hover for desktop, tap for mobile) */}
          <div className="hidden sm:group-hover:flex gap-1 mt-1 ml-2">
            {reactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-base sm:text-lg hover:scale-125 transition-transform"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Mobile Emoji Picker (Long Press) */}
          {showMobilePicker && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40 bg-black bg-opacity-20 sm:hidden"
                onClick={() => setShowMobilePicker(false)}
              />
              
              {/* Floating Picker */}
              <div
                className={`absolute ${isSent ? 'right-0' : 'left-0'} z-50 sm:hidden
                  bg-white dark:bg-gray-800 rounded-full shadow-2xl px-3 py-2
                  flex gap-2 animate-fadeIn border-2 border-primary-300`}
                style={{
                  [pickerPosition.isAbove ? 'bottom' : 'top']: `${Math.abs(pickerPosition.top)}px`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {mobileReactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-2xl hover:scale-125 active:scale-110 transition-transform
                      w-10 h-10 flex items-center justify-center rounded-full
                      hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
