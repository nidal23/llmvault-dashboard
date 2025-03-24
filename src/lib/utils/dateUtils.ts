//Date formatting utilities
// src/lib/utils/dateUtils.ts
import { format, formatDistanceToNow } from 'date-fns';

// Format date to readable string
export const formatDate = (dateString: string | null, formatStr = 'PPpp'): string => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    return format(date, formatStr);
  } catch {
    return 'Invalid date';
  }
};

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (dateString: string | null): string => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
};

// Format date for grouping (e.g., "Today", "Yesterday", "Last week", etc.)
export const getDateGroup = (dateString: string | null): string => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return 'This week';
    if (diffDays < 30) return 'This month';
    
    return format(date, 'MMMM yyyy');
  } catch {
    return 'Unknown';
  }
};