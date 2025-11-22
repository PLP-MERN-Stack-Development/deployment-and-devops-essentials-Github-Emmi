// Format date to readable string
const formatDate = (date) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(date).toLocaleDateString('en-US', options);
};

// Generate random color for avatar
const generateRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Sanitize username
const sanitizeUsername = (username) => {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
};

// Error response formatter
const errorResponse = (message, statusCode = 500) => {
  return {
    success: false,
    error: message,
    statusCode,
  };
};

// Success response formatter
const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

module.exports = {
  formatDate,
  generateRandomColor,
  sanitizeUsername,
  errorResponse,
  successResponse,
};
