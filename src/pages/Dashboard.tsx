import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import Stats from "@/components/dashboard/Stats";
import BookmarkCard from "@/components/bookmarks/BookmarkCard";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBookmarksStore } from "@/lib/stores/useBookmarksStore";
import { ArrowRight, Bookmark, Command, Loader2 } from "lucide-react";
import { Crown, Check } from "lucide-react";
import { useSubscriptionStore } from "@/lib/stores/useSubscriptionStore";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import ConversationLauncher from "@/components/dashboard/ConversationLauncher";

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
      totalFolders: bookmarkStats.folderCount || 0,
      recentBookmarks: bookmarkStats.recentCount || 0,
      averagePerDay: (bookmarkStats.recentCount || 0) / 7
    });
  }
}, [bookmarkStats]);
  
  // Combined loading state
  
  return (
    <Layout>
      <div className="container py-8 px-4 sm:px-6 mx-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header with welcome message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Welcome to ConvoStack</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Your personal command center for AI conversations
            </p>
          </div>
          
          {/* Stats row - full width, more space */}
          <div className="mb-10">
            <Stats stats={stats} />
          </div>
          
          {/* Main content with more breathing room */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main column - spans 2 columns */}
            <div className="lg:col-span-2">
              {/* Conversation launcher */}
              <ConversationLauncher />
              
              {/* Recent conversations with more space */}
              <div className="mt-10">
                <h2 className="text-2xl font-semibold mb-6">Recent Conversations</h2>
                {isLoadingBookmarks ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading conversations...</span>
                  </div>
                ) : bookmarksError ? (
                  <div className="text-red-500 p-6 text-center">Error loading conversations</div>
                ) : (
                  <div className="space-y-4">
                    {recentBookmarks.length === 0 ? (
                      <div className="text-muted-foreground text-center py-10 border border-dashed rounded-lg">
                        No saved conversations yet
                      </div>
                    ) : (
                      recentBookmarks.map(bookmark => (
                        <BookmarkCard 
                          key={bookmark.id}
                          bookmark={bookmark} 
                          viewMode="list"
                        />
                      ))
                    )}
                    
                    {recentBookmarks.length > 0 && (
                      <div className="flex justify-end pt-4">
                        <Button 
                          variant="outline" 
                          className="text-primary"
                          onClick={() => navigate('/bookmarks')}
                        >
                          View All Conversations
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Side column - spans 1 column with more vertical space between items */}
            <div className="space-y-8">
              {/* Upgrade promo if on free tier */}
              {tier === 'free' && (
                <div className="rounded-xl overflow-hidden border relative bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        Upgrade to Premium
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-5">
                      Remove limits and unlock powerful features
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Unlimited conversations</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Unlimited folders</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Advanced sorting and filtering</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Priority customer support</span>
                      </li>
                    </ul>
                    <Button 
                      className="w-full mt-6 bg-primary hover:bg-primary/90"
                      onClick={() => navigate('/settings?tab=subscription')}
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Activity feed widget */}
              <div className="border rounded-xl p-6">
                <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    Activity feed coming soon!
                  </div>
                </div>
              </div>
              
              {/* Tips widget */}
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-6">
                <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-3">Pro Tips</h3>
                <ul className="space-y-3">
                  <li className="text-sm text-blue-700 dark:text-blue-400/90 flex items-start gap-2">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-1 rounded-full mt-0.5">
                      <Command className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Use keyboard shortcuts to start chats faster</span>
                  </li>
                  <li className="text-sm text-blue-700 dark:text-blue-400/90 flex items-start gap-2">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-1 rounded-full mt-0.5">
                      <Bookmark className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Install the Chrome extension to save chats with one click</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;