//pages/index.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { useAuth } from "../lib/hooks/useAuth";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  console.log('user in index.ts: ', user);
  
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

  const scrollToPricing = (e: React.MouseEvent) => {
    e.preventDefault();
    const pricingSection = document.getElementById('pricing');
    pricingSection?.scrollIntoView({ behavior: 'smooth' });
  };

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

  return (
    <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
                <Bookmark className="h-6 w-6" />
                <span className="font-semibold text-xl">LLM-Vault</span>
            </div>
            <nav className="hidden md:flex gap-6 items-center">
                <a href="#features" onClick={scrollToFeatures}  className="text-muted-foreground hover:text-foreground transition-colors">
                Features
                </a>
                <a href="#how-it-works" onClick={scrollToSteps}  className="text-muted-foreground hover:text-foreground transition-colors">
                How it works
                </a>
                <a href="#pricing" onClick={scrollToPricing} className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
                </a>
                {isLoggedIn ? (
                    <Button className="apple-button" onClick={() => navigate("/dashboard")}>
                        Go to Dashboard
                    </Button>
                ) : (
                    <GoogleAuthButton onSuccess={handleAuthSuccess} />
                )}
            </nav>
            <div className="md:hidden">
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
                Organize your AI conversations
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                LLM-Vault helps you bookmark, organize, and retrieve your most valuable LLM conversations from ChatGPT, Claude, and more.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                {isLoggedIn ? (
                  <Button className="apple-button" size="lg" onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <GoogleAuthButton onSuccess={handleAuthSuccess} />
                )}
                <Button variant="outline" size="lg">
                  Learn More
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 mt-10 md:mt-0 animate-fade-in">
              <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://placehold.co/600x400/3b82f6/ffffff?text=ChatBook+Dashboard" 
                  alt="LLM-Vault Dashboard Preview" 
                  className="w-full h-auto object-cover rounded-2xl"
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Features */}
        <section id="features" className="py-20 bg-muted/50">
          <div className="px-4 sm:px-6 md:px-8 lg:px-16 max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl sm:text-4xl font-bold">Everything you need to stay organized</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                LLM-Vault gives you powerful tools to manage your AI conversations across different platforms.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Unified Bookmarks",
                  description: "Save conversations from ChatGPT, Claude, Deepseek, and other LLM platforms in one place.",
                  icon: "🔖",
                },
                {
                  title: "Folder Organization",
                  description: "Create nested folders to organize bookmarks by project, topic, or any way you choose.",
                  icon: "📁",
                },
                {
                  title: "Smart Search",
                  description: "Quickly find the conversations you need with full-text search and filtering.",
                  icon: "🔍",
                },
                {
                  title: "Labels & Tags",
                  description: "Add custom labels to categorize your bookmarks for easier management.",
                  icon: "🏷️",
                },
                {
                  title: "Cross Platform",
                  description: "Access your bookmarks from any device with our web dashboard and browser extension.",
                  icon: "🔄",
                },
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="apple-card p-6 flex flex-col items-center text-center animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
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
              LLM-Vault is designed to work seamlessly with your existing workflow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              {
                step: "1",
                title: "Install the Extension",
                description: "Add our browser extension and connect it to your account.",
              },
              {
                step: "2",
                title: "Bookmark Conversations",
                description: "Save important AI chats with one click from any platform.",
              },
              {
                step: "3",
                title: "Organize & Access",
                description: "Manage your bookmarks and access them from anywhere.",
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
            {!isLoggedIn && (
              <GoogleAuthButton onSuccess={handleAuthSuccess} />
            )}
            {isLoggedIn && (
              <Button className="apple-button" size="lg" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </section>
        
        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-muted/50">
          <div className="px-4 sm:px-6 md:px-8 lg:px-16 max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl sm:text-4xl font-bold">Simple, Transparent Pricing</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that fits your needs. Start free, upgrade when you need more.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Tier */}
              <div className="apple-card p-6 flex flex-col h-full animate-fade-in">
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold">Free Tier</h3>
                  <p className="text-muted-foreground mt-2">Basic features for personal use</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">$0</span>
                    <span className="text-muted-foreground ml-2">forever</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex gap-2">
                    <div className="text-primary">✓</div>
                    <span>Core functionality: Basic folder structure (limited to 5 folders)</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="text-primary">✓</div>
                    <span>Limited chat saves: Up to 30 saved chat URLs</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="text-primary">✓</div>
                    <span>Basic labeling: Standard label options</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="text-primary">✓</div>
                    <span>Manual URL saving: Context menu and popup functionality</span>
                  </li>
                </ul>
                
                {isLoggedIn ? (
                  <Button className="mt-auto" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
                ) : (
                  <GoogleAuthButton onSuccess={handleAuthSuccess} />
                )}
              </div>
              
              {/* Premium Tier */}
              <div className="apple-card p-6 border-primary flex flex-col h-full animate-fade-in">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold">Premium Tier</h3>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Recommended
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2">Advanced features for power users</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">$3.99</span>
                    <span className="text-muted-foreground ml-2">/ month</span>
                    <p className="text-sm text-muted-foreground mt-1">or $39.99/year (20% savings)</p>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex gap-2">
                    <div className="text-primary">✓</div>
                    <span>Unlimited folders: Full hierarchical organization</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="text-primary">✓</div>
                    <span>Unlimited chat saves: No restrictions</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="text-primary">✓</div>
                    <span>Advanced labeling: Custom label creation and management</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="text-primary">✓</div>
                    <span>Notes and context: Ability to add detailed notes to each chat</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="text-primary">✓</div>
                    <span>Search functionality: Advanced search across all saved content</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="text-primary">✓</div>
                    <span>Cross-device sync: Seamless experience across multiple devices</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="text-primary">✓</div>
                    <span>Import/export: Data backup and restoration</span>
                  </li>
                </ul>
                
                <Button className="apple-button mt-auto" onClick={() => navigate(isLoggedIn ? "/settings" : "/signup")}>
                  {isLoggedIn ? "Upgrade Now" : "Subscribe Now"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-10 px-4 sm:px-6 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Bookmark className="h-5 w-5" />
            <span className="font-semibold">LLM-Vault</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Help Center
            </a>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LLM-Vault. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Index