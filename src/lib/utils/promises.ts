// src/lib/utils/promises.ts

/**
 * Wraps a promise with a timeout to prevent it from hanging indefinitely
 * @param promiseOrFn The promise or function that returns a promise
 * @param ms Timeout in milliseconds
 * @returns The original promise result or rejects with timeout error
 */
export const withTimeout = <T>(promiseOrFn: Promise<T> | (() => Promise<T>), ms = 10000): Promise<T> => {
    // Convert function to promise if needed
    const promise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
    
    let timeoutId: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
    });
    
    return Promise.race([
      promise,
      timeoutPromise
    ]).finally(() => clearTimeout(timeoutId));
  };