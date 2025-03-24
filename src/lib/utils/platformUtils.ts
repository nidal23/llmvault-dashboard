//LLM platform detection utilities

// src/lib/utils/platformUtils.ts
// Function to detect platform from URL
export const detectPlatform = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      if (hostname.includes('chat.openai.com')) return 'ChatGPT';
      if (hostname.includes('claude.ai')) return 'Claude';
      if (hostname.includes('deepseek.com')) return 'Deepseek';
      if (hostname.includes('gemini.google.com')) return 'Gemini';
      
      return null;
    } catch {
      return null;
    }
  };
  
  // Get platform color for UI
  export const getPlatformColor = (platform: string | null): string => {
    switch (platform?.toLowerCase()) {
      case 'chatgpt':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'claude':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'deepseek':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'gemini':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  // Get platform icon component name
  export const getPlatformIcon = (platform: string | null): string => {
    switch (platform?.toLowerCase()) {
      case 'chatgpt':
        return 'ChatGPTIcon';
      case 'claude':
        return 'ClaudeIcon';
      case 'deepseek':
        return 'DeepseekIcon';
      case 'gemini':
        return 'GeminiIcon';
      default:
        return 'DefaultIcon';
    }
  };