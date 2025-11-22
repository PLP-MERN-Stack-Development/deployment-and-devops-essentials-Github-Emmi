export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateUsername = (username) => {
  if (!username || username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (username.length > 30) {
    return 'Username cannot exceed 30 characters';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, underscores, and hyphens';
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const validateRoomName = (name) => {
  if (!name || name.length < 3) {
    return 'Room name must be at least 3 characters';
  }
  if (name.length > 50) {
    return 'Room name cannot exceed 50 characters';
  }
  return null;
};

export const validateMessage = (message) => {
  if (!message || message.trim().length === 0) {
    return 'Message cannot be empty';
  }
  if (message.length > 5000) {
    return 'Message is too long (max 5000 characters)';
  }
  return null;
};
