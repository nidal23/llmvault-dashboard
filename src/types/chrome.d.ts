// src/types/chrome.d.ts

/**
 * TypeScript definitions for Chrome Extension API
 */

interface ChromeMessage {
    type: string;
    [key: string]: unknown;
  }
  
  interface ChromeResponse {
    status?: string;
    message?: string;
    [key: string]: unknown;
  }
  
  interface Chrome {
    runtime: {
      id?: string;
      sendMessage: (
        extensionId: string,
        message: ChromeMessage,
        callback?: (response: ChromeResponse) => void
      ) => void;
      lastError?: {
        message: string;
      };
    };
    storage?: {
      local: {
        get: (keys: string | string[] | Record<string, unknown> | null, 
             callback: (items: Record<string, unknown>) => void) => void;
        set: (items: Record<string, unknown>, callback?: () => void) => void;
        remove: (keys: string | string[], callback?: () => void) => void;
      };
    };
    tabs?: {
      create: (createProperties: { url: string }) => void;
    };
  }
  
  // Extend the Window interface to include chrome
  declare global {
    interface Window {
      chrome?: Chrome;
    }
    
    // For direct global access
    // Using const instead of var to satisfy ESLint
    // (in .d.ts files this is just for type definitions and doesn't affect runtime)
    const chrome: Chrome;
  }
  
  // This export makes TypeScript treat this file as a module
  export {};