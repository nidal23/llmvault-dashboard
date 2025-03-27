import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast'; // Or 'sonner' if you're using that

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Current URL:', window.location.href);
        
        // Check if we have a hash fragment (which contains the tokens)
        if (window.location.hash) {
          console.log('Hash fragment detected, checking session...');
          
          // The session should be automatically set by Supabase when using hash fragments
          // Just verify we have a session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log('Session established successfully');
            // Show success toast
            toast.success("Successfully signed in!");
            // Redirect to dashboard on success
            navigate('/dashboard');
            return;
          } else {
            console.log('No session found despite having hash parameters');
            // Try manually setting session with hash params
            // You might need to implement custom logic here based on how your auth provider returns tokens
          }
        }
        
        // If we don't have either a hash or a session, check if we have a code
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        
        if (code) {
          console.log('Code parameter found, exchanging for session...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code for session:', error);
            setError('Authentication failed. Please try again.');
            toast.error("Authentication failed. Please try again.");
            return;
          }
          
          // Show success toast after successful code exchange
          toast.success("Successfully signed in!");
          navigate('/dashboard');
          return;
        }
        
        // Final check for an existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Session already exists, proceeding to dashboard');
          // Don't show toast here as they might just be navigating back
          navigate('/dashboard');
          return;
        }
        
        // If we get here, no authentication method worked
        setError('Authentication failed. No valid session could be established.');
        toast.error("Authentication failed. No valid session could be established.");
        
      } catch (err) {
        console.error('Error during authentication callback:', err);
        setError('An unexpected error occurred. Please try again.');
        toast.error("An unexpected error occurred. Please try again.");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {error ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-red-500">Authentication Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Return to Homepage
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Signing you in...</h2>
            <p className="text-muted-foreground">Please wait while we complete the authentication.</p>
            <div className="mt-4 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}