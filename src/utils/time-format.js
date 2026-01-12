/**
 * Converts a timestamp to a human-readable relative time string
 * @param {string|number|Date} timestamp - The timestamp to format
 * @returns {string} Human-readable time like "just now", "5 minutes ago", etc.
 */
export function timeAgo(timestamp) {
  if (!timestamp) return '';
  
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  
  // If timestamp is in the future or invalid, return empty
  if (diffMs < 0 || isNaN(diffMs)) return '';
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  // Less than 1 minute
  if (minutes < 1) {
    return 'just now';
  }
  
  // Less than 1 hour
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than 1 day
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than 7 days
  if (days < 7) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // More than 7 days
  return 'a while ago';
}

