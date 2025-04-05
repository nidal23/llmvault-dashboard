
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import {
    Bookmark,
    FolderTree,
    Clock,
    Activity
  } from "lucide-react";
  
  // Types for the stats data
  interface StatsData {
    totalBookmarks: number;
    totalFolders: number;
    recentBookmarks: number;
    averagePerDay: number;
  }
  
  interface StatsProps {
    stats: StatsData;
  }
  
  const Stats = ({ stats }: StatsProps) => {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookmarks}</div>
            <p className="text-xs text-muted-foreground">
              Across all folders
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Folders</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFolders}</div>
            <p className="text-xs text-muted-foreground">
              Organized structure
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentBookmarks}</div>
            <p className="text-xs text-muted-foreground">
              Bookmarks added this week
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averagePerDay)}</div>
            <p className="text-xs text-muted-foreground">
              Bookmarks per day
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  export default Stats;