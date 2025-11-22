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
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg">No messages yet</p>
            <p className="text-sm">Start a conversation!</p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <Message key={message._id || message.id} message={message} />
        ))
      )}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="flex space-x-1">
            <span className="typing-dot inline-block w-2 h-2 bg-gray-400 rounded-full"></span>
            <span className="typing-dot inline-block w-2 h-2 bg-gray-400 rounded-full"></span>
            <span className="typing-dot inline-block w-2 h-2 bg-gray-400 rounded-full"></span>
          </div>
          <span className="text-sm">
            {typingUsers.map((u) => u.username).join(', ')}{' '}
            {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}
    </div>
  );
};

export default MessageList;
