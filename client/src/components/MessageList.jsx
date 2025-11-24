import { useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useScrollToBottom } from '../hooks/useScrollToBottom';
import Message from './Message';

const MessageList = () => {
  const { messages, typingUsers } = useChat();
  const scrollRef = useScrollToBottom([messages, typingUsers]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4"
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center px-4">
            <div className="text-4xl sm:text-6xl mb-4">💬</div>
            <p className="text-base sm:text-lg">No messages yet</p>
            <p className="text-xs sm:text-sm">Start a conversation!</p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <Message key={message._id || message.id} message={message} />
        ))
      )}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="flex items-center space-x-2 text-gray-500 px-2 sm:px-0">
          <div className="flex space-x-1">
            <span className="typing-dot inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></span>
            <span className="typing-dot inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></span>
            <span className="typing-dot inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></span>
          </div>
          <span className="text-xs sm:text-sm">
            {typingUsers.map((u) => u.username).join(', ')}{' '}
            {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}
    </div>
  );
};

export default MessageList;
