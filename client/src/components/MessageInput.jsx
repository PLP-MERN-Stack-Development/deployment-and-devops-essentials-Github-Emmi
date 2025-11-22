import { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { validateMessage } from '../utils/validation';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MessageInput = () => {
  const { sendMessage, currentRoom, startTyping, stopTyping } = useChat();
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleTyping = useTypingIndicator(
    (isTyping) => {
      if (isTyping) {
        startTyping(currentRoom);
      } else {
        stopTyping(currentRoom);
      }
    },
    1000
  );

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async () => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate message or file
    if (!message.trim() && !file) {
      return;
    }

    if (message.trim()) {
      const error = validateMessage(message);
      if (error) {
        toast.error(error);
        return;
      }
    }

    try {
      let fileData = null;

      // Upload file if present
      if (file) {
        setUploading(true);
        fileData = await uploadFile();
      }

      // Send message
      const messageData = {
        content: message.trim(),
        roomId: currentRoom,
        messageType: fileData
          ? fileData.mimetype.startsWith('image/')
            ? 'image'
            : 'file'
          : 'text',
        fileUrl: fileData?.url,
        fileName: fileData?.originalName,
        fileSize: fileData?.formattedSize,
      };

      sendMessage(messageData);

      // Reset form
      setMessage('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      stopTyping(currentRoom);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-white dark:bg-gray-800">
      {/* File preview */}
      {file && (
        <div className="mb-2 flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <Paperclip className="w-4 h-4" />
            <span className="text-sm truncate max-w-xs">{file.name}</span>
            <span className="text-xs text-gray-500">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-2">
        {/* File upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-primary-500 transition-colors"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
        />

        {/* Message input */}
        <textarea
          value={message}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white max-h-32"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={(!message.trim() && !file) || uploading}
          className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
