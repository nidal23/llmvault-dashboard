import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';

export default function ExtensionAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        
        // Check if we have a hash fragment (which contains the tokens)
        if (window.location.hash) {
          console.log('Hash fragment detected, checking session...');
        }
        
        // Get the session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Get extension ID from URL params
          const params = new URLSearchParams(window.location.search);
          const extId = params.get('extensionId');
          
          if (!extId) {
            setStatus('error');
            setErrorMessage('Extension ID not found in URL parameters');
            return;
          }
          
          // Attempt to send message to extension
          try {
            // Check if chrome API is available
            if (typeof window.chrome !== 'undefined' && window.chrome.runtime) {
              window.chrome.runtime.sendMessage(
                extId, 
                { type: 'auth_callback', session: session },
                (response) => {
                  
                  if (window?.chrome?.runtime.lastError) {
                    console.error("Error:", window.chrome.runtime.lastError);
                    setStatus('error');
                    setErrorMessage(`Error communicating with extension: ${window.chrome.runtime.lastError.message}`);
                  } else if (response && response.status === 'success') {
                    setStatus('success');
                  } else {
                    setStatus('error');
                    setErrorMessage('Unexpected response from extension');
                  }
                }
              );
            } else {
              // Manual auth success - for testing when Chrome API isn't available
              setStatus('success');
            }
          } catch (error) {
            console.error("Error sending message:", error);
            setStatus('error');
            setErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          setStatus('error');
          setErrorMessage('No session found');
        }
      } catch (error) {
        console.error("Error in auth callback:", error);
        setStatus('error');
        setErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    handleAuthCallback();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-center text-gray-800">
          {status === 'success' ? "Authentication Successful!" : 
           status === 'error' ? "Authentication Error" : 
           "Authentication in Progress"}
        </h1>
        
        {status === 'success' ? (
          <>
            <div className="flex justify-center my-6">
              <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-center text-gray-600">
              You've been successfully logged in to ConvoStack!
            </p>
            <p className="text-center text-gray-600 mt-2">
              You can now close this tab and return to the extension to start saving your bookmarks.
            </p>
          </>
        ) : status === 'error' ? (
          <>
            <div className="flex justify-center my-6">
              <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p className="text-center text-gray-600">
              {errorMessage || "There was a problem with authentication."}
            </p>
            <p className="text-center text-gray-600 mt-2">
              Please try again or contact support if the problem persists.
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center my-6">
              <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-center text-gray-600">
              Please wait while we complete your sign in...
            </p>
          </>
        )}
      </div>
    </div>
  );
}