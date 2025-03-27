// Dashboard.tsx
import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import Stats from "@/components/dashboard/Stats";
import BookmarkCard from "@/components/bookmarks/BookmarkCard";
import { useAuth } from "@/lib/context/AuthContext";
import { useBookmarks } from "@/lib/hooks/useBookmarks";
import { getBookmarkStats } from "@/lib/api/bookmarks";
import { Loader2 } from "lucide-react";
import { toast } from 'react-hot-toast';

// Mock stats data for now
const MOCK_STATS = {
  totalBookmarks: 42,
  totalFolders: 8,
  recentBookmarks: 12,
  averagePerDay: 3.5
};

const Dashboard = () => {
  const { user, initialized } = useAuth();
  const [stats, setStats] = useState(MOCK_STATS);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Use the custom hook to fetch bookmarks with a limit of 3
  const { 
    bookmarks: recentBookmarks, 
    isLoading: isLoadingBookmarks,
    error: bookmarksError 
  } = useBookmarks({}, { 
    limit: 3,
    autoFetch: initialized 
  });

  // Separate effect for loading stats
  useEffect(() => {
    const fetchStats = async () => {
      // Don't fetch if auth isn't initialized yet
      if (!initialized || !user) {
        setIsLoadingStats(false);
        return;
      }
      
      console.log('Fetching bookmark stats');
      setIsLoadingStats(true);
      
      try {
        // Fetch statistics
        const bookmarkStats = await getBookmarkStats(user.id);
        console.log('Stats fetched:', bookmarkStats);
        
        // Update stats with real data, with null/undefined checks
        setStats({
          totalBookmarks: bookmarkStats?.totalCount || 0,
          totalFolders: MOCK_STATS.totalFolders, // We'll need to fetch this separately
          recentBookmarks: bookmarkStats?.recentCount || 0,
          averagePerDay: (bookmarkStats?.recentCount || 0) / 7
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Failed to load dashboard statistics');
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    fetchStats();
    
    // Set up refresh interval for stats
    const refreshInterval = setInterval(() => {
      if (user && initialized) {
        console.log('Refreshing dashboard stats');
        fetchStats();
      }
    }, 60000); // Refresh stats every minute
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [user, initialized]);
  
  // Combined loading state
  const isLoading = isLoadingBookmarks || isLoadingStats;
  
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to LLM-Vault. View your bookmarks and analytics.
          </p>
        </div>
        
        <Stats stats={stats} />
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Recent Bookmarks</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading bookmarks...</span>
            </div>
          ) : bookmarksError ? (
            <div className="text-center py-12 border border-dashed rounded-md border-red-300">
              <p className="text-red-500">Error loading bookmarks</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-sm mt-2 text-blue-500 hover:underline"
              >
                Reload page
              </button>
            </div>
          ) : recentBookmarks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentBookmarks.map((bookmark) => (
                <div key={bookmark.id} className="animate-scale-in">
                  <BookmarkCard bookmark={bookmark} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-md">
              <p className="text-muted-foreground">No bookmarks yet</p>
              <p className="text-sm mt-2">Start saving your LLM conversations to see them here</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;