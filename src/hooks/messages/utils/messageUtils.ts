/**
 * Format the message date as a string display
 */
export const formatMessageDate = (dateString: string): string => {
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Check if the message is from today
  if (messageDate.toDateString() === today.toDateString()) {
    return 'Today';
  }
  
  // Check if the message is from yesterday
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  // Otherwise return formatted date
  return messageDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format the message time as a time ago string
 */
export const formatMessageTime = (dateString: string): string => {
  const messageTime = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  }
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  // If more than an hour ago, just show the time
  return messageTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};
