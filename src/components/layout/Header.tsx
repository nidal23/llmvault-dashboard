import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, User, Settings, Sun, Moon, LogOut, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/hooks/useAuth";
import { useUserSettingsStore } from "@/lib/stores/useUserSettingsStore";
import { useProfileStore } from "@/lib/stores/useProfileStore";
import { toast } from "sonner";
import { signOut } from "@/lib/api/auth";
import { useSubscriptionStore } from "@/lib/stores/useSubscriptionStore";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  // const location = useLocation();
  const { user } = useAuth();
  const { settings, updateTheme, fetchSettings } = useUserSettingsStore();
  const { tier } = useSubscriptionStore();
  
  // Use profile store to get and manage profile data
  const { profile, fetchProfile, isLoading: isLoadingProfile } = useProfileStore();
  const [avatarError, setAvatarError] = useState(false);

  // Use user settings for theme preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for initial value to avoid flicker
    const userTheme = localStorage.getItem('user-theme');
    return userTheme === 'dark';
  });

  // Check if URL has /dashboard
  // const isDashboard = location.pathname.includes("/dashboard");

  // Fetch user settings and profile when user is available
  useEffect(() => {
    if (user) {
      fetchSettings(user.id);
      fetchProfile(user.id);
    }
  }, [user, fetchSettings, fetchProfile]);

  // Update isDarkMode when settings change
  useEffect(() => {
    if (settings?.theme) {
      const darkModeEnabled = settings.theme === 'dark';
      setIsDarkMode(darkModeEnabled);
      
      // Apply theme to DOM
      applyTheme(darkModeEnabled);
      
      // Store in localStorage for persistence
      localStorage.setItem('user-theme', darkModeEnabled ? 'dark' : 'light');
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

  // Function to apply theme to DOM
  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  };
  
  const toggleTheme = () => {
    if (!user) return;
    
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    
    // Apply theme immediately for smoother experience
    applyTheme(newIsDarkMode);
    
    // Store in localStorage immediately
    localStorage.setItem('user-theme', newIsDarkMode ? 'dark' : 'light');
    
    // Update user settings if logged in
    if (settings) {
      const newTheme = newIsDarkMode ? 'dark' : 'light';
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
          <span className="font-semibold text-xl">ConvoStack</span>
        </Link>
      </div>
      
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full overflow-hidden flex items-center justify-center"
            >
              {isLoadingProfile ? (
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
              ) : profile?.avatar_url && !avatarError ? (
                <img 
                  src={profile.avatar_url} 
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <User className="h-5 w-5" />
              )}
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
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