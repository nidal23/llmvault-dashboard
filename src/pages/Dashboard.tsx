import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import Stats from "@/components/dashboard/Stats";
import BookmarkCard from "@/components/bookmarks/BookmarkCard";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBookmarksStore } from "@/lib/stores/useBookmarksStore";
import { Loader2 } from "lucide-react";
import { Crown, Check, ExternalLink } from "lucide-react";
import { useSubscriptionStore } from "@/lib/stores/useSubscriptionStore";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Mock stats data for now
const MOCK_STATS = {
  totalBookmarks: 0,
  totalFolders: 0,
  recentBookmarks: 0,
  averagePerDay: 0
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(MOCK_STATS);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const { tier } = useSubscriptionStore();
  const navigate = useNavigate();


  
  // Use the custom hook to fetch bookmarks with a limit of 3
  const { 
    bookmarks: recentBookmarks, 
    isLoading: isLoadingBookmarks,
    error: bookmarksError,
    fetchBookmarks,
    fetchBookmarkStats,
    stats: bookmarkStats
  } = useBookmarksStore();

  useEffect(() => {
    if (user) {
      fetchBookmarks(user.id, { limit: 3 });
      fetchBookmarkStats(user.id);
    }
  }, [user, fetchBookmarks, fetchBookmarkStats]);

  useEffect(() => {
    if (bookmarkStats) {
      setStats({
        totalBookmarks: bookmarkStats.totalCount || 0,
        totalFolders: bookmarkStats.folderCount || 0, // Now using real folder count from usage_stats
        recentBookmarks: bookmarkStats.recentCount || 0,
        averagePerDay: (bookmarkStats.recentCount || 0) / 7
      });
      setIsLoadingStats(false);
    }
  }, [bookmarkStats]);
  
  // Combined loading state
  const isLoading = isLoadingBookmarks || isLoadingStats;
  
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to ChatStack. View your conversations and analytics.
          </p>
        </div>
        
        <Stats stats={stats} />
        {tier === 'free' && (
          <div className="mt-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-full">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Unlock Premium Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Premium for unlimited folders and conversations
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="justify-start gap-1.5 md:justify-center"
                  onClick={() => navigate('/settings?tab=subscription')}
                >
                  <Check className="h-4 w-4" />
                  <span>View Benefits</span>
                </Button>
                <Button 
                  className="gap-1.5 justify-start md:justify-center" 
                  size="sm"
                  onClick={() => navigate('/settings?tab=subscription')}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Upgrade Now</span>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Recent Bookmarks</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading conversations...</span>
            </div>
          ) : bookmarksError ? (
            <div className="text-center py-12 border border-dashed rounded-md border-red-300">
              <p className="text-red-500">Error loading conversations</p>
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
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm mt-2">Start saving your LLM conversations to see them here</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;