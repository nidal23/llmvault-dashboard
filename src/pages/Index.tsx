import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ExternalLink, Cpu, FolderSearch, BrainCircuit, Clock, ZapIcon, Moon, Sun, FileText, Sparkles, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { useAuth } from "../lib/hooks/useAuth";
import { toast } from "sonner";
import ConvoStackHubDiagram from "@/components/home/ConvoStackHubDiagram";
import dashbordLogo from '@/assets/platforms/convo-stack-logo-bg.png';

const CHROME_EXTENSION_URL = "https://chromewebstore.google.com/detail/convostack/nmhkgpekffdekmnionfgjolgedakmpdk";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Initialize dark mode from localStorage for non-logged-in users
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const guestTheme = localStorage.getItem('guest-theme');
    const userTheme = localStorage.getItem('user-theme');
    
    // Use guest theme for non-logged-in users, default to dark if not set
    return (guestTheme || userTheme || 'dark') === 'dark';
  });
  
  // Function to apply theme to DOM
  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };
  
  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(isDarkMode);
  }, [isDarkMode]);
  
  // Toggle theme function
  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    
    // Save theme preference in localStorage for guests
    localStorage.setItem('guest-theme', newIsDarkMode ? 'dark' : 'light');
    
    // Apply theme immediately
    applyTheme(newIsDarkMode);
  };
  
  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    toast.success("Successfully signed in!");
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  };

  // Use the auth context to determine if user is logged in
  useEffect(() => {
    if (user) {
      setIsLoggedIn(!!user);
    }
  }, [user]);

  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    const featureSection = document.getElementById('features');
    featureSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSteps = (e: React.MouseEvent) => {
    e.preventDefault();
    const stepsSection = document.getElementById('how-it-works');
    stepsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToExtension = (e: React.MouseEvent) => {
    e.preventDefault();
    const extensionSection = document.getElementById('extension');
    extensionSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExtensionClick = () => {
    window.open(CHROME_EXTENSION_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-slate-950 dark:text-white transition-colors">
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between px-2">
            <div className="flex items-center gap-1">
              <img src={dashbordLogo} alt="convostack-logo" className="w-12 h-12 object-contain" />
              <span className="font-semibold text-xl -ml-3">ConvoStack</span>
            </div>
            <nav className="hidden md:flex gap-6 items-center">
                <a href="#features" onClick={scrollToFeatures} className="text-muted-foreground hover:text-foreground transition-colors">
                Features
                </a>
                <a href="#how-it-works" onClick={scrollToSteps} className="text-muted-foreground hover:text-foreground transition-colors">
                How it works
                </a>
                <a href="#extension" onClick={scrollToExtension} className="text-muted-foreground hover:text-foreground transition-colors">
                Get Extension
                </a>
                <button 
                  onClick={toggleTheme} 
                  className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>
                {isLoggedIn ? (
                    <Button className="apple-button" onClick={() => navigate("/dashboard")}>
                        Go to Dashboard
                    </Button>
                ) : (
                    <GoogleAuthButton onSuccess={handleAuthSuccess} variant="cta"/>
                )}
            </nav>
            <div className="md:hidden flex items-center gap-2">
                <button 
                  onClick={toggleTheme} 
                  className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>
                {isLoggedIn ? (
                <Button className="apple-button" onClick={() => navigate("/dashboard")}>
                    Dashboard
                </Button>
                ) : (
                <GoogleAuthButton onSuccess={handleAuthSuccess} />
                )}
            </div>
            </div>
        </header>

        <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12 text-center md:text-left animate-fade-in">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
                Find your AI genius, <span className="text-primary">when you need it</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Stop losing your brilliant AI conversations in the noise. ConvoStack helps you organize and retrieve valuable insights from ChatGPT, Claude, and other LLMs — so you can focus on getting things done.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                {isLoggedIn ? (
                  <Button className="apple-button" size="lg" onClick={() => navigate("/dashboard")}>
                    Build Your Stack
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <GoogleAuthButton onSuccess={handleAuthSuccess} variant="cta" />
                )}
                <Button variant="outline" size="lg" onClick={handleExtensionClick}>
                  Install Extension
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 mt-10 md:mt-0 animate-fade-in">
              <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
              <div className="w-full aspect-[3/2] relative">
              <div className="w-full h-full flex items-center justify-center">
                {/* ConvoStackHubDiagram component replaces the placeholder image */}
                <div className="w-4/5 h-4/5 relative">
                  <ConvoStackHubDiagram 
                    compactMode={true} 
                  />
                </div>
                
              </div>
              </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features */}
        <section id="features" className="py-20 bg-muted/50">
          <div className="px-4 sm:px-6 md:px-8 lg:px-16 max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl sm:text-4xl font-bold">Never lose your AI wisdom again</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                ConvoStack helps you organize your AI conversations and prompts so you can quickly find exactly what you need, when you need it.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Fast Access",
                  description: "Instantly find the right conversation when you need it most, without scrolling through hundreds of chats.",
                  icon: <Clock className="w-8 h-8 text-primary" />,
                },
                {
                  title: "Task-Focused",
                  description: "Organize conversations by projects, tasks or topics to keep your workflow efficient and your mind clear.",
                  icon: <FolderSearch className="w-8 h-8 text-primary" />,
                },
                {
                  title: "Multi-AI Support",
                  description: "One unified place for all your AI assistants: ChatGPT, Claude, Deepseek, and more.",
                  icon: <BrainCircuit className="w-8 h-8 text-primary" />,
                },
                {
                  title: "Context Retention",
                  description: "Add notes to your bookmarks to remember why a particular conversation was valuable to you.",
                  icon: <Cpu className="w-8 h-8 text-primary" />,
                },
                {
                  title: "Prompt Library",
                  description: "Save and organize effective prompts that consistently deliver great results from your AI assistants.",
                  icon: <FileText className="w-8 h-8 text-primary" />,
                },
                {
                  title: "Productivity Boost",
                  description: "Transform how you use AI from occasional helper to integrated productivity system.",
                  icon: <ZapIcon className="w-8 h-8 text-primary" />,
                },
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="apple-card p-6 flex flex-col items-center text-center animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            ConvoStack integrates seamlessly into your AI workflow in just three simple steps.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              {
                step: "1",
                title: "Install the Extension",
                description: "Add our browser extension to Chrome with just one click.",
              },
              {
                step: "2",
                title: "Save Valuable Conversations",
                description: "When you find an AI chat worth keeping, save it with a single click.",
              },
              {
                step: "3",
                title: "Find It When You Need It",
                description: "Organize, tag, and easily retrieve your AI wisdom exactly when you need it.",
              },
            ].map((step, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center text-center animate-fade-in"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-medium mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <p className="text-lg font-medium mb-4">Ready to stack your convos?</p>
            <div className="flex justify-center">
              {!isLoggedIn ? (
                <GoogleAuthButton onSuccess={handleAuthSuccess} variant="cta" />
              ) : (
                <Button className="apple-button" size="lg" onClick={() => navigate("/dashboard")}>
                  Build Your Stack
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </section>
        
        {/* Prompt Library Section */}
        <section className="py-20 bg-muted/20">
          <div className="px-4 sm:px-6 md:px-8 lg:px-16 max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl sm:text-4xl font-bold relative inline-flex items-center">
                Prompt Library
                <span className="ml-3 px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-700/20 dark:text-amber-400">
                  Coming Soon
                </span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Never start from scratch. Store, organize, and reuse your most effective prompts.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 space-y-6 animate-fade-in">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-1">Template Library</h4>
                    <p className="text-muted-foreground">Create and categorize prompt templates for different tasks and AI assistants.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-1">Prompt Generation</h4>
                    <p className="text-muted-foreground">Get AI-powered help to craft the perfect prompt for any task you want to accomplish.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Link className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-1">Link to Conversations</h4>
                    <p className="text-muted-foreground">Connect prompt templates to the conversations they created for a complete knowledge system.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-1">Usage Analytics</h4>
                    <p className="text-muted-foreground">Track which prompts deliver the best results and optimize your approach to AI.</p>
                  </div>
                </div>
              </div>
              
              <div className="order-1 md:order-2 animate-fade-in">
                <div className="apple-card p-6 rounded-xl shadow-lg relative">
                  <div className="bg-primary/5 p-4 rounded-lg mb-4 border border-primary/10">
                    <h4 className="font-medium mb-2 text-primary flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Code Review Prompt
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">Provides detailed feedback for code review with security and best practice suggestions.</p>
                    <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
                      I want you to review the following code for best practices, potential bugs, security issues, and performance optimizations. Please organize your feedback into these categories and provide specific examples and solutions.
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-1">
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">coding</span>
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">review</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Used 28 times</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">Save, organize and reuse your best prompts</p>
                    <Button size="sm" className="gap-1" disabled>
                      <FileText className="h-3.5 w-3.5" />
                      View Library
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Chrome Extension Section */}
        <section id="extension" className="py-20 bg-muted/50">
          <div className="px-4 sm:px-6 md:px-8 lg:px-16 max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl sm:text-4xl font-bold">Get the ConvoStack Extension</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                The ConvoStack Chrome extension is the key to organizing your AI conversations.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 max-w-4xl mx-auto">
              <div className="md:w-1/2 flex justify-center">
                <div className="apple-card p-6 w-full max-w-md animate-fade-in">
                  <div className="rounded-lg mb-6 flex flex-col items-center">
                    <div className="w-20 h-20 bg-primary/10 mb-4 rounded-full flex items-center justify-center">
                      <BrainCircuit className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-center mb-4">
                      <h3 className="text-2xl font-semibold mb-2">ConvoStack Chrome Extension</h3>
                      <p className="text-muted-foreground">Organize your AI conversations with one click</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex gap-2">
                      <div className="text-primary">✓</div>
                      <span>One-click saving from any LLM platform</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="text-primary">✓</div>
                      <span>Auto-detection of AI platform</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="text-primary">✓</div>
                      <span>Add notes and labels while saving</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="text-primary">✓</div>
                      <span>Organize into custom folders</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="text-primary">✓</div>
                      <span>Save effective prompts to your library</span>
                    </li>
                  </ul>
                  
                  <Button 
                    className="apple-button w-full" 
                    size="lg"
                    onClick={handleExtensionClick}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Install from Chrome Store
                  </Button>
                </div>
              </div>
              
              <div className="md:w-1/2 flex flex-col max-w-md space-y-6 animate-fade-in">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ZapIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-1">Seamless Integration</h4>
                    <p className="text-muted-foreground">Works with all major AI platforms without disrupting your workflow.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-1">Save Time</h4>
                    <p className="text-muted-foreground">No more scrolling through endless conversation history to find what you need.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-1">Amplify Your AI Use</h4>
                    <p className="text-muted-foreground">Transform how you interact with AI by building your personal knowledge database.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FolderSearch className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-1">Complete Access</h4>
                    <p className="text-muted-foreground">Use the web dashboard to manage all your saved conversations from any device.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-16 text-center">
              <p className="text-lg font-medium mb-4">What's in your convo stack today?</p>
              <p className="text-sm text-muted-foreground mb-6">From vibe coders to PhD researchers to insomnia-driven entrepreneurs — we've got you covered.</p>
                <div className="flex justify-center">
                  {!isLoggedIn ? (
                    <GoogleAuthButton onSuccess={handleAuthSuccess} variant="cta" />
                  ) : (
                    <Button className="apple-button" size="lg" onClick={() => navigate("/dashboard")}>
                      Build Your Stack
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-10 px-4 sm:px-6 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
          </div>
          <div className="flex gap-6">
            <a href="privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ConvoStack. All rights reserved.
          </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Index