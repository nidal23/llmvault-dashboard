import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  X, 
  Plus, 
  Moon, 
  Sun, 
  Loader2, 
  AlertCircle, 
  Edit2, 
  User,
  Save,
  CheckCircle2,
  CircleUser,
  AtSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUserSettingsStore } from "@/lib/stores/useUserSettingsStore";
import { useProfileStore } from "@/lib/stores/useProfileStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { Json, PlatformWithColor, safeParsePlatforms } from "@/lib/supabase/database.types";
import { signOut } from "@/lib/api/auth";
import { getAvatarOptions } from "@/lib/api/profiles";
import { useSubscriptionStore } from "@/lib/stores/useSubscriptionStore";
import { Shield, Crown, Check } from "lucide-react";

const SettingsPanel = () => {
  const { user } = useAuth();
  const { subscription, tier, isActive } = useSubscriptionStore();
  const { 
    settings, 
    isLoading: isLoadingSettings,
    fetchSettings,
    updateTheme, 
    updateDefaultLabels,
    updatePlatforms,
    toggleAutoDetectPlatform 
  } = useUserSettingsStore();
  
  const {
    profile,
    isLoading: isLoadingProfile,
    isSaving: isSavingProfile,
    fetchProfile,
    updateProfile
  } = useProfileStore();

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [avatarOptions] = useState(getAvatarOptions());

  console.log('avatar options:', avatarOptions)

  // Load data when component mounts
  useEffect(() => {
    if (user) {
      fetchSettings(user.id);
      fetchProfile(user.id);
    }
  }, [user, fetchSettings, fetchProfile]);
  
  // Initialize profile form when profile data is available
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setFullName(profile.full_name || "");
      setSelectedAvatar(profile.avatar_url || "");
    }
  }, [profile]);
  
  // Local state that will be synced with the database
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [autoDetectPlatform, setAutoDetectPlatform] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [newPlatform, setNewPlatform] = useState("");
  const [newPlatformColor, setNewPlatformColor] = useState("#808080");
  const [platforms, setPlatforms] = useState<PlatformWithColor[]>([]);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isEditPlatformOpen, setIsEditPlatformOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<PlatformWithColor | null>(null);
  
  // Default platform colors
  const defaultPlatforms: PlatformWithColor[] = [
    { name: "ChatGPT", color: "#10A37F" },
    { name: "Claude", color: "#8C5AF2" },
    { name: "Deepseek", color: "#0066FF" },
    { name: "Gemini", color: "#AA5A44" },
    { name: "Perplexity", color: "#61C7FA" }
  ];
  
  // Helper function to safely convert Json to string array
  const parseArrayFromJson = (json: Json | null): string[] => {
    if (!json) return [];
    
    if (Array.isArray(json)) {
      return json
        .filter(item => item !== null && item !== undefined)
        .map(item => String(item));
    }
    
    return [];
  };
  
  // Load settings into local state when they're available
  useEffect(() => {
    if (settings) {
      // Handle theme - default to light if null
      setIsDarkMode(settings.theme === 'dark');
      
      // Handle auto_detect_platform - default to true if null
      setAutoDetectPlatform(settings.auto_detect_platform !== false);
      
      // Handle default_labels
      setLabels(parseArrayFromJson(settings.default_labels));
      
      // Handle platforms with default values if null
      setPlatforms(
        settings.platforms 
          ? safeParsePlatforms(settings.platforms) 
          : defaultPlatforms
      );
    }
  }, [settings]);
  
  // Apply theme when it changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);
  
  const handleThemeChange = async (value: boolean) => {
    setIsDarkMode(value);
    const newTheme = value ? 'dark' : 'light';
    
    try {
      await updateTheme(user.id, newTheme);
      // Toast is shown by the hook
    } catch (error) {
      console.log('error: ', error)
      // Error handling is done in the hook
    }
  };
  
  const handleAutoDetectChange = async (value: boolean) => {
    setAutoDetectPlatform(value);
    
    try {
      await toggleAutoDetectPlatform(user.id);
      // Toast is shown by the hook
    } catch (error) {
      console.log('error: ', error)
      // Error handling is done in the hook
    }
  };
  
  const handleAddLabel = () => {
    if (!user) return;
    if (newLabel.trim() === "") return;
    if (labels.includes(newLabel.trim())) {
      toast.error("This label already exists");
      return;
    }
    
    const updatedLabels = [...labels, newLabel.trim()];
    setLabels(updatedLabels);
    setNewLabel("");
    
    // Save labels immediately for better UX
    updateDefaultLabels(user.id, updatedLabels).catch(() => {
      // Revert on error
      setLabels(labels);
    });
  };
  
  const handleRemoveLabel = (label: string) => {
    if (!user) return;
    
    const updatedLabels = labels.filter((l) => l !== label);
    setLabels(updatedLabels);
    
    // Save labels immediately for better UX
    updateDefaultLabels(user.id, updatedLabels).catch(() => {
      // Revert on error
      setLabels(labels);
    });
  };

  // Create a wrapper function to handle the type conversion for platforms
  const savePlatforms = async (userId: string, platformsToSave: PlatformWithColor[]) => {
      await updatePlatforms(userId, platformsToSave);
  };

  const handleAddPlatform = () => {
    if (!user) return;
    if (newPlatform.trim() === "") return;
    if (platforms.some(p => p.name.toLowerCase() === newPlatform.trim().toLowerCase())) {
      toast.error("This platform already exists");
      return;
    }
    
    const newPlatformObj: PlatformWithColor = { 
      name: newPlatform.trim(), 
      color: newPlatformColor 
    };
    
    const updatedPlatforms = [...platforms, newPlatformObj];
    setPlatforms(updatedPlatforms);
    setNewPlatform("");
    setNewPlatformColor("#808080"); // Reset to default gray
    
    // Save platforms immediately for better UX using the wrapper
    savePlatforms(user.id, updatedPlatforms).catch(() => {
      // Revert on error
      setPlatforms(platforms);
    });
  };
  
  const handleRemovePlatform = (platformName: string) => {
    if (!user) return;
    
    const updatedPlatforms = platforms.filter((p) => p.name !== platformName);
    setPlatforms(updatedPlatforms);
    
    // Save platforms immediately for better UX using the wrapper
    savePlatforms(user.id, updatedPlatforms).catch(() => {
      // Revert on error
      setPlatforms(platforms);
    });
  };

  const openEditPlatform = (platform: PlatformWithColor) => {
    setEditingPlatform({ ...platform });
    setIsEditPlatformOpen(true);
  };

  const handleUpdatePlatform = () => {
    if (!user || !editingPlatform) return;

    const updatedPlatforms = platforms.map(p => 
      p.name === editingPlatform.name ? editingPlatform : p
    );
    
    setPlatforms(updatedPlatforms);
    setIsEditPlatformOpen(false);
    
    // Save platforms immediately for better UX using the wrapper
    savePlatforms(user.id, updatedPlatforms).catch(() => {
      // Revert on error
      setPlatforms(platforms);
    });
  };

  // Handle profile updates using the profile store
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      await updateProfile(user.id, {
        username: username || null,
        full_name: fullName || null,
        avatar_url: selectedAvatar || null // This already handles empty string as null
      });
      
      setIsEditingProfile(false);
      // Toast is shown by the store
    } catch (error) {
      console.error('Error updating profile:', error);
      // Error is handled in the store
    }
  };
  
  const handleSelectAvatar = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    setShowAvatarSelector(false);
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Successfully signed out");
      // Navigation will be handled by auth context
    } catch (error) {
      console.log('error: ', error)
      toast.error("Failed to sign out");
    }
  };
  
  const getBadgeStyle = (color: string) => {
    // Extract RGB components for background
    let r = 128, g = 128, b = 128;
    
    try {
      if (color.startsWith('#') && (color.length === 4 || color.length === 7)) {
        if (color.length === 4) {
          // Convert #RGB to #RRGGBB
          const r1 = color[1], g1 = color[2], b1 = color[3];
          r = parseInt(`${r1}${r1}`, 16);
          g = parseInt(`${g1}${g1}`, 16);
          b = parseInt(`${b1}${b1}`, 16);
        } else {
          r = parseInt(color.slice(1, 3), 16);
          g = parseInt(color.slice(3, 5), 16);
          b = parseInt(color.slice(5, 7), 16);
        }
      }
    } catch (error) {
      console.error('Error parsing color:', error);
    }
    
    // Create a semi-transparent background (20% opacity)
    const bgColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
    
    // Return the style object
    return {
      backgroundColor: bgColor,
      color: color,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.5)`, // Add a subtle border with 50% opacity
    };
  };
  
  const isLoading = isLoadingSettings || isLoadingProfile;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Tabs defaultValue="general">
        <TabsList className="glass-card">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="labels">Labels</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your general application preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-detect" className="text-base">Platform auto-detection</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically detect the LLM platform from the bookmarked URL
                    </p>
                  </div>
                  <Switch
                    id="auto-detect"
                    checked={autoDetectPlatform}
                    onCheckedChange={handleAutoDetectChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card mt-6">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Your current plan and subscription details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium flex items-center gap-2">
                    {tier === 'premium' ? (
                      <>
                        <Shield className="h-5 w-5 text-primary" />
                        Premium Plan
                      </>
                    ) : (
                      <>
                        Free Plan
                      </>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tier === 'premium' 
                      ? 'Unlimited folders and conversations' 
                      : 'Limited to 5 folders and 30 conversations'}
                  </p>
                </div>
                
                <Badge 
                  className={tier === 'premium' 
                    ? 'bg-primary/20 text-primary hover:bg-primary/30' 
                    : 'bg-muted text-muted-foreground'
                  }
                >
                  {tier === 'premium' ? 'Premium' : 'Free'}
                </Badge>
              </div>
              
              {tier === 'premium' && subscription && (
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Status:</span>{' '}
                    <Badge variant={isActive ? "outline" : "destructive"}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </p>
                  
                  {subscription.current_period_end && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Next billing date:</span>{' '}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
              
              {tier === 'free' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Premium benefits:</p>
                    <ul className="space-y-1.5">
                      {[
                        'Unlimited folders & organization',
                        'Store up to 500 conversations',
                        'Advanced search capabilities',
                        'Custom labeling system',
                        'Priority support'
                      ].map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className={tier === 'premium' ? 'bg-destructive hover:bg-destructive/90' : 'apple-button'}
                onClick={() => {
                  // For a real app, redirect to subscription management page
                  // This is just a placeholder toast
                  toast.info(tier === 'premium' 
                    ? 'Cancel subscription functionality coming soon' 
                    : 'Upgrade functionality coming soon'
                  );
                }}
              >
                {tier === 'premium' ? 'Cancel Subscription' : (
                  <span className="flex items-center gap-1.5">
                    <Crown className="h-4 w-4" />
                    Upgrade to Premium for $3.99/month
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>

          
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how ChatStack looks and feels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    <div>
                      <Label htmlFor="theme-mode" className="text-base">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark theme
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="theme-mode"
                    checked={isDarkMode}
                    onCheckedChange={handleThemeChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="labels" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Label Management</CardTitle>
              <CardDescription>
                Customize your bookmark labels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {labels.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No labels yet. Add some below to categorize your conversations.
                    </p>
                  )}
                  
                  {labels.map((label) => (
                    <Badge key={label} variant="secondary" className="px-3 py-1 text-sm">
                      <span className="mr-1">{label}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full ml-1 hover:bg-secondary"
                        onClick={() => handleRemoveLabel(label)}
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {label}</span>
                      </Button>
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new label..."
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddLabel();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleAddLabel}
                    disabled={!newLabel.trim() || isLoading}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add label</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Platform Management</CardTitle>
              <CardDescription>
                Customize LLM platforms and their colors for categorizing your conversations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {platforms.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No platforms yet. Add some below to categorize your bookmarks by LLM platforms.
                    </p>
                  )}
                  
                  {platforms.map((platform) => (
                    <div key={platform.name} className="flex items-center">
                      <Badge 
                        variant="secondary" 
                        className="px-3 py-1 text-sm flex items-center gap-1"
                        style={getBadgeStyle(platform.color)}
                      >
                        <span 
                          className="h-3 w-3 rounded-full mr-1.5" 
                          style={{ backgroundColor: platform.color || "#808080" }}
                        />
                        <span>{platform.name}</span>
                      </Badge>
                      <div className="flex ml-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full hover:bg-secondary"
                          onClick={() => openEditPlatform(platform)}
                        >
                          <Edit2 className="h-3 w-3" />
                          <span className="sr-only">Edit {platform.name}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full hover:bg-secondary"
                          onClick={() => handleRemovePlatform(platform.name)}
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove {platform.name}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Add new platform..."
                      value={newPlatform}
                      onChange={(e) => setNewPlatform(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPlatform();
                        }
                      }}
                      disabled={isLoading}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newPlatformColor}
                        onChange={(e) => setNewPlatformColor(e.target.value)}
                        className="h-8 w-8 border-0 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleAddPlatform}
                    disabled={!newPlatform.trim() || isLoading}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add platform</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        
        <TabsContent value="account" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>
                    Manage your account settings and profile.
                  </CardDescription>
                </div>
                {!isEditingProfile ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingProfile(false)}
                    className="text-muted-foreground"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                {!isEditingProfile ? (
                  // Profile Display Mode
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-primary/10 p-2 h-16 w-16 flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.full_name || "Profile"} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <CircleUser className="h-10 w-10 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-medium">
                        {profile?.full_name || user?.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-sm text-muted-foreground">{user?.email || 'No email available'}</p>
                      
                      {profile?.username && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                          <AtSign className="h-3 w-3 mr-1" />
                          {profile.username}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  // Profile Edit Mode
                  <div className="space-y-6">
                    <div className="flex flex-col items-center">
                      <div 
                        className="relative rounded-full h-24 w-24 bg-primary/10 mb-4 overflow-hidden cursor-pointer group"
                        onClick={() => setShowAvatarSelector(true)}
                      >
                        {selectedAvatar ? (
                          <>
                            <img 
                              src={selectedAvatar} 
                              alt="Selected avatar" 
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit2 className="h-6 w-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <User className="h-10 w-10 text-primary" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit2 className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Click to change avatar
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Username (optional)"
                        />
                        <p className="text-xs text-muted-foreground">
                          This will be used for mentions and sharing.
                        </p>
                      </div>
                      
                      <Button 
                        onClick={handleUpdateProfile} 
                        className="w-full"
                        disabled={isSavingProfile}
                      >
                        {isSavingProfile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium">Connected Accounts</h3>
                  <div className="mt-2 flex items-center space-x-2">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Google (Primary)</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-4">Data & Privacy</h3>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Request data export functionality
                      toast.info("Data export functionality coming soon");
                    }}
                    className="w-full mb-2"
                  >
                    Export Your Data
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setIsConfirmDeleteOpen(true)}
              >
                Delete Account
              </Button>
              <Button 
                className="apple-button"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Avatar Selector Dialog */}
      <Dialog open={showAvatarSelector} onOpenChange={setShowAvatarSelector}>
        <DialogContent className="glass-card max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose an Avatar</DialogTitle>
            <DialogDescription>
              Select a fun avatar for your profile or remove your current avatar.
            </DialogDescription>
          </DialogHeader>
          
          {/* Add "Remove avatar" option at the top */}
          <div className="border-b pb-4 mb-2">
            <div 
              className={`
                rounded-lg p-3 cursor-pointer transition-all border-2
                ${!selectedAvatar 
                  ? 'border-primary bg-primary/10' 
                  : 'border-transparent hover:bg-muted'}
              `}
              onClick={() => {
                setSelectedAvatar("");
                setShowAvatarSelector(false);
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                  <CircleUser className="h-10 w-10 text-primary" />
                  {!selectedAvatar && (
                    <div className="absolute bottom-1 right-1 bg-primary rounded-full p-1">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="font-medium text-sm">No Avatar</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the default profile icon instead of a custom avatar
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Rest of the avatar options */}
          <div className="grid grid-cols-2 gap-6 py-4">
            {avatarOptions.map((avatar) => (
              <div 
                key={avatar.id}
                className={`
                  rounded-lg p-3 cursor-pointer transition-all border-2
                  ${selectedAvatar === avatar.url 
                    ? 'border-primary bg-primary/10' 
                    : 'border-transparent hover:bg-muted'}
                `}
                onClick={() => handleSelectAvatar(avatar.url)}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={avatar.url} 
                      alt={avatar.alt} 
                      className="h-full w-full object-cover"
                    />
                    {selectedAvatar === avatar.url && (
                      <div className="absolute bottom-1 right-1 bg-primary rounded-full p-1">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-sm">{avatar.alt}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {avatar.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvatarSelector(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => setShowAvatarSelector(false)}
            >
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* Edit Platform Dialog */}
       <Dialog open={isEditPlatformOpen} onOpenChange={setIsEditPlatformOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Edit Platform</DialogTitle>
            <DialogDescription>
              Update the platform name and color.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-platform-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-platform-name"
                value={editingPlatform?.name || ""}
                onChange={(e) => setEditingPlatform(prev => 
                  prev ? { ...prev, name: e.target.value } : prev
                )}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-platform-color" className="text-right">
                Color
              </Label>
              <div className="col-span-3 flex items-center gap-3">
                <input
                  id="edit-platform-color"
                  type="color"
                  value={editingPlatform?.color || "#808080"}
                  onChange={(e) => setEditingPlatform(prev => 
                    prev ? { ...prev, color: e.target.value } : prev
                  )}
                  className="h-10 w-10 border-0 rounded cursor-pointer"
                />
                <div
                  className="h-8 flex-1 rounded"
                  style={{ 
                    backgroundColor: editingPlatform?.color || "#808080" 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Preview</Label>
              <div className="col-span-3">
                <Badge 
                  variant="secondary" 
                  className="px-3 py-1 text-sm"
                  style={getBadgeStyle(editingPlatform?.color || "#808080")}
                >
                  <span 
                    className="h-3 w-3 rounded-full mr-1.5" 
                    style={{ 
                      backgroundColor: editingPlatform?.color || "#808080" 
                    }}
                  />
                  <span>{editingPlatform?.name || ""}</span>
                </Badge>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPlatformOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePlatform} 
              disabled={isLoading || !editingPlatform?.name}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Account Deletion Confirmation Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data, including bookmarks and folders, will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-destructive/10 p-4 rounded-md border border-destructive/20 text-destructive">
            <p className="text-sm font-semibold">Before proceeding, please consider:</p>
            <ul className="text-sm list-disc list-inside mt-2">
              <li>All your bookmarks will be permanently lost</li>
              <li>Your folder structure will be deleted</li>
              <li>Your subscription information will be removed</li>
              <li>This action cannot be reversed</li>
            </ul>
          </div>
          
          <div className="mt-2">
            <Label htmlFor="confirm-delete" className="text-sm">
              Type "DELETE" to confirm
            </Label>
            <Input 
              id="confirm-delete" 
              className="mt-1"
              placeholder="DELETE"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                // Implement account deletion logic here
                toast.error("Account deletion functionality is not yet implemented");
                setIsConfirmDeleteOpen(false);
              }}
            >
              Permanently Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPanel;