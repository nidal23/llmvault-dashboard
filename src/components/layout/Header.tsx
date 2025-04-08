//components/layout/Header.tsx
import { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Menu, Search, User, Settings, Sun, Moon, LogOut, Crown, CircleUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/hooks/useAuth";
import { useUserSettingsStore } from "@/lib/stores/useUserSettingsStore";
import { useProfileStore } from "@/lib/stores/useProfileStore";
import { toast } from "react-hot-toast";
import { signOut } from "@/lib/api/auth";
import { useSubscriptionStore } from "@/lib/stores/useSubscriptionStore";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { settings, updateTheme, fetchSettings } = useUserSettingsStore();
  const { tier } = useSubscriptionStore();
  
  // Use profile store to get and manage profile data
  const { profile, fetchProfile, isLoading: isLoadingProfile } = useProfileStore();
  const [avatarError, setAvatarError] = useState(false);


  // Use user settings for theme preference
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if URL has /dashboard
  const isDashboard = location.pathname.includes("/dashboard");

  // Fetch user settings and profile when user is available
  useEffect(() => {
    if (user) {
      fetchSettings(user.id);
      fetchProfile(user.id);
    }
  }, [user, fetchSettings, fetchProfile]);

  useEffect(() => {
    if (settings?.theme) {
      const darkModeEnabled = settings.theme === 'dark' || 
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(darkModeEnabled);
    }
  }, [settings]);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle theme toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);
  
  const toggleTheme = () => {
    if (!user) return;
    
    setIsDarkMode(!isDarkMode);
    
    // Update user settings if logged in
    if (settings) {
      const newTheme = isDarkMode ? 'light' : 'dark';
      // Pass user.id to the updateTheme function
      updateTheme(user.id, newTheme).catch(error => {
        console.error('Failed to update theme preference:', error);
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Successfully signed out');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  // Get display information from profile store instead of auth context
  const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'No email available';

  return (
    <header 
      className={`sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:px-6 transition-all duration-300 
        ${isScrolled ? "glass-morphism shadow-sm" : "bg-background"}`}
    >
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <Link to="/" className="flex items-center gap-2">
          <span className="font-semibold text-xl">ChatStack</span>
        </Link>
      </div>

      {isDashboard && (
        <div className="hidden md:flex max-w-md w-full mx-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search conversations..."
              className="w-full pl-8 bg-muted/50 border-none focus-visible:ring-1"
            />
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        {tier === 'free' && (
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-1.5 text-primary border-primary/20 hover:bg-primary/10"
            onClick={() => navigate('/settings?tab=subscription')}
          >
            <Crown className="h-3.5 w-3.5" />
            <span>Upgrade</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              {isLoadingProfile ? (
                <div className="h-5 w-5 rounded-full bg-muted animate-pulse"></div>
              ) : (
                <User className="h-5 w-5" />
              )}
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="rounded-full bg-primary/10 p-1 h-10 w-10 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url && !avatarError ? (
                <img 
                  src={profile.avatar_url} 
                  alt={displayName}
                  className="h-full w-full rounded-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <CircleUser className="h-8 w-8 text-primary" />
              )}
              </div>
              <div className="flex flex-col space-y-0.5 max-w-[180px]">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <Link to="/settings">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;