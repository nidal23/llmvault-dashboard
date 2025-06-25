// src/components/prompts/PlatformLauncher.tsx - Updated with enhanced UI
import React from "react";
import { ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// LLM Platform configuration
export const LLM_PLATFORMS = {
  'ChatGPT': {
    name: 'ChatGPT',
    url: 'https://chat.openai.com/',
    color: '#10A37F',
    icon: '🤖',
    description: 'OpenAI ChatGPT'
  },
  'Claude': {
    name: 'Claude',
    url: 'https://claude.ai/',
    color: '#8C5AF2',
    icon: '🧠',
    description: 'Anthropic Claude'
  },
  'Gemini': {
    name: 'Gemini',
    url: 'https://gemini.google.com/',
    color: '#4285F4',
    icon: '✨',
    description: 'Google Gemini'
  },
  'Perplexity': {
    name: 'Perplexity',
    url: 'https://www.perplexity.ai/',
    color: '#20B2AA',
    icon: '🔍',
    description: 'Perplexity AI'
  },
  'DeepSeek': {
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    color: '#0066FF',
    icon: '🔬',
    description: 'DeepSeek Chat'
  },
  'Mistral': {
    name: 'Mistral',
    url: 'https://chat.mistral.ai/',
    color: '#FF6B35',
    icon: '🌪️',
    description: 'Mistral AI'
  }
} as const;

export type PlatformKey = keyof typeof LLM_PLATFORMS;

// Helper function to check if a string is a valid platform key
export const isPlatformKey = (key: string): key is PlatformKey => {
  return key in LLM_PLATFORMS;
};

interface PlatformLauncherProps {
  promptContent: string;
  preferredPlatforms?: string[] | null;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  disabled?: boolean;
}

const PlatformLauncher: React.FC<PlatformLauncherProps> = ({
  promptContent,
  preferredPlatforms = [],
  className,
  variant = 'default',
  disabled = false
}) => {
  const platforms = preferredPlatforms || [];
  
  // Handle launching a platform (KEEP THIS)
  const handleLaunchPlatform = async (platformName: string) => {
    if (disabled || !promptContent.trim()) {
      toast.error("No prompt content to copy");
      return;
    }
    
    if (!isPlatformKey(platformName)) {
      toast.error("Unknown platform");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(promptContent);
      const platform = LLM_PLATFORMS[platformName];
      toast.success(`Prompt copied! Opening ${platform.name}...`);
      window.open(platform.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error launching platform:', error);
      toast.error("Failed to copy prompt to clipboard");
    }
  };
  
  // Render platform buttons (SIMPLIFIED - no editing)
  const renderPlatformButton = (platformName: string) => {
    if (!isPlatformKey(platformName)) return null;
    const platform = LLM_PLATFORMS[platformName];
    
    switch (variant) {
      case 'compact':
        return (
          <Button
            key={platformName}
            variant="outline"
            size="sm"
            onClick={() => handleLaunchPlatform(platformName)}
            disabled={disabled}
            className="h-8 px-3 border-2 hover:scale-105"
            style={{ 
              borderColor: `${platform.color}30`,
              backgroundColor: `${platform.color}10`,
              color: platform.color
            }}
          >
            <span className="mr-1.5">{platform.icon}</span>
            <span className="text-xs font-medium">{platform.name}</span>
            <ExternalLink className="h-3 w-3 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        );
        
      case 'minimal':
        return (
          <button
            key={platformName}
            onClick={() => handleLaunchPlatform(platformName)}
            disabled={disabled}
            className="h-8 w-8 rounded-lg border flex items-center justify-center hover:scale-110"
            style={{ 
              borderColor: `${platform.color}40`,
              backgroundColor: `${platform.color}15`
            }}
            title={`Launch ${platform.name}`}
          >
            <span style={{ color: platform.color }}>{platform.icon}</span>
          </button>
        );
        
      default:
        return (
          <Button
            key={platformName}
            variant="outline"
            onClick={() => handleLaunchPlatform(platformName)}
            disabled={disabled}
            className="h-10 px-4 border-2 hover:scale-105 hover:shadow-md"
            style={{ 
              borderColor: `${platform.color}30`,
              backgroundColor: `${platform.color}08`
            }}
          >
            <span className="mr-2 text-lg">{platform.icon}</span>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium" style={{ color: platform.color }}>
                {platform.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {platform.description}
              </span>
            </div>
            <ExternalLink 
              className="h-4 w-4 ml-3 opacity-0 group-hover:opacity-100 transition-opacity" 
              style={{ color: platform.color }}
            />
          </Button>
        );
    }
  };
  
  // If no platforms, show helpful message
  if (platforms.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Zap className="h-4 w-4" />
        <span className="text-sm">No preferred platforms set</span>
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {platforms.map((platform) => renderPlatformButton(platform))}
    </div>
  );
};

export default PlatformLauncher;