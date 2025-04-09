import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';

export default function ExtensionAuthCallback() {
const [success, setSuccess] = useState<boolean>(false);

useEffect(() => {
  async function handleAuthCallback() {
    try {
      // Get the session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Get extension ID from URL params
        const params = new URLSearchParams(window.location.search);
        const extId = params.get('extensionId');
        
        if (extId && typeof chrome !== 'undefined') {
          try {
            chrome.runtime.sendMessage(
              extId, 
              { type: 'auth_callback', session: session },
              (response) => {
                if (response && response.status === 'success') {
                  setSuccess(true);
                }
              }
            );
          } catch (error) {
            console.error("Error sending message:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error in auth callback:", error);
    }
  }
  
  handleAuthCallback();
}, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-center text-gray-800">
          {success ? "Authentication Successful!" : "Authentication in Progress"}
        </h1>
        
        {success ? (
          <>
            <div className="flex justify-center my-6">
              <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-center text-gray-600">
              You have been successfully logged in to ConvoStack!
            </p>
            <p className="text-center text-gray-600 mt-2">
              You can now close this tab and return to the extension to start saving your bookmarks.
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