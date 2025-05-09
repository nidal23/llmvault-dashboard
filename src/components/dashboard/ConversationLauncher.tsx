// src/components/dashboard/ConversationLauncher.tsx
import { useEffect } from "react";
import { ExternalLink, Bookmark, Command, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

// Define the platforms we want to show
const platforms = [
  { 
    name: "ChatGPT", 
    url: "https://chat.openai.com/", 
    color: "#10A37F",
    keyboard: "C",
    description: "Versatile assistant for writing, answering questions & creative tasks"
  },
  { 
    name: "Claude", 
    url: "https://claude.ai/chats", 
    color: "#8C5AF2",
    keyboard: "L",
    description: "Thoughtful, nuanced responses with strong reasoning abilities"
  },
  { 
    name: "Deepseek", 
    url: "https://chat.deepseek.com/", 
    color: "#0066FF",
    keyboard: "D",
    description: "Technical specialist with strong coding and scientific knowledge"
  },
  { 
    name: "Perplexity", 
    url: "https://www.perplexity.ai/", 
    color: "#61C7FA",
    keyboard: "P",
    description: "Real-time information with comprehensive search capabilities"
  }
];

const ConversationLauncher = () => {
  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Command/Ctrl key is pressed along with a letter
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const key = e.key.toUpperCase();
        const platformIndex = platforms.findIndex(p => p.keyboard === key);
        
        if (platformIndex !== -1) {
          e.preventDefault();
          handleStartConversation(platforms[platformIndex].url);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const handleStartConversation = (url: string) => {
    // Open the conversation in a new tab
    window.open(url, "_blank", "noopener,noreferrer");
  };
  
  return (
    <div className="mt-8 mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span>Chat with AI Assistants</span>
        </h2>
      </div>
      
      {/* Reminder message - always visible */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 mb-6 flex items-start gap-3">
        <div className="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 p-2 rounded-full flex-shrink-0">
          <Bookmark className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-300">Remember to save your conversations</h3>
          <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">
            Use the ConvoStack extension to easily bookmark and organize interesting AI conversations
          </p>
        </div>
      </div>
      
      {/* Platform launcher cards - redesigned with more space and visual appeal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((platform) => (
          <motion.div
            key={platform.name}
            whileHover={{ 
              y: -5,
              boxShadow: `0 10px 25px -5px ${platform.color}15`
            }}
            className="rounded-xl overflow-hidden transition-all duration-300"
            style={{ 
              background: `linear-gradient(135deg, ${platform.color}08, ${platform.color}15)`,
              border: `1px solid ${platform.color}30`,
            }}
            onClick={() => handleStartConversation(platform.url)}
          >
            <div className="p-6 h-full flex flex-col cursor-pointer">
              <div className="flex items-start mb-4">
                {/* Logo and name */}
                <div className="flex items-center gap-3 flex-grow">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${platform.color}20` }}
                  >
                    <span className="text-xl font-bold" style={{ color: platform.color }}>
                      {platform.name[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: platform.color }}>
                      {platform.name}
                    </h3>
                  </div>
                </div>
                
                {/* Keyboard shortcut - fixed positioning */}
                <div className="flex-shrink-0 ml-2">
                  <div 
                    className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                    style={{ 
                      backgroundColor: `${platform.color}15`,
                      color: platform.color 
                    }}
                  >
                    <Command className="h-3 w-3" />
                    <span>{platform.keyboard}</span>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-sm text-muted-foreground flex-grow mb-4">
                {platform.description}
              </p>
              
              {/* Launch button */}
              <div className="mt-auto">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  className="w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                  style={{ 
                    backgroundColor: `${platform.color}20`,
                    color: platform.color
                  }}
                >
                  <span>Start Chat</span>
                  <ExternalLink className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ConversationLauncher;