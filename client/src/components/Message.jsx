import { formatMessageTime } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const Message = ({ message }) => {
  const { user } = useAuth();
  const { addReaction } = useChat();
  const isSent = message.sender._id === user._id;

  const handleReaction = (emoji) => {
    addReaction(message._id, emoji);
  };

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`flex ${isSent ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[70%]`}>
        {/* Avatar */}
        {!isSent && (
          <img
            src={message.sender.avatar || `https://ui-avatars.com/api/?name=${message.sender.username}`}
            alt={message.sender.username}
            className="w-8 h-8 rounded-full mr-2"
          />
        )}

        <div>
          {/* Sender name (for received messages) */}
          {!isSent && (
            <div className="text-xs text-gray-500 mb-1 ml-2">
              {message.sender.username}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`rounded-2xl px-4 py-2 ${
              isSent
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
            }`}
          >
            {/* File/Image */}
            {message.messageType === 'image' && message.fileUrl && (
              <img
                src={message.fileUrl}
                alt={message.fileName}
                className="max-w-full rounded-lg mb-2 max-h-64 object-cover"
              />
            )}

            {message.messageType === 'file' && message.fileUrl && (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded-lg mb-2 hover:bg-opacity-30"
              >
                <span className="text-2xl">📎</span>
                <div>
                  <div className="font-medium">{message.fileName}</div>
                  <div className="text-xs opacity-75">{message.fileSize}</div>
                </div>
              </a>
            )}

            {/* Text content */}
            {message.content && (
              <p className="break-words whitespace-pre-wrap">{message.content}</p>
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
            <div className="flex flex-wrap gap-1 mt-1 ml-2">
              {Object.entries(
                message.reactions.reduce((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <span
                  key={emoji}
                  className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full"
                >
                  {emoji} {count}
                </span>
              ))}
            </div>
          )}

          {/* Quick reactions (show on hover) */}
          <div className="hidden group-hover:flex gap-1 mt-1 ml-2">
            {reactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-lg hover:scale-125 transition-transform"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
