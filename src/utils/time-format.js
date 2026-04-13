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
  
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

/**
 * Formats a timestamp in the browser's local timezone.
 * @param {string|number|Date} timestamp - The timestamp to format
 * @returns {string} Date/time like "09-Apr-2026 14:30"
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return '';

  const d = new Date(timestamp);

  if (Number.isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  const time = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return `${day}-${month}-${year} ${time}`;
}

