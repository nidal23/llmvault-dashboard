import { useEffect, useState } from 'react';
import { ArrowLeft, Shield, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import dashbordLogo from '@/assets/platforms/convo-stack-logo-bg.png';

const PrivacyPolicy = () => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode like the index page
  
  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };
  
  // Apply theme effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen flex flex-col dark:bg-slate-950 dark:text-white transition-colors">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center">
                <img src={dashbordLogo} alt="convostack-logo" className="w-12 h-12 object-contain" />
                <span className="font-semibold text-xl -ml-2">ConvoStack</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
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
            <Link to="/">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          
          <div className="glass-card p-6 mb-6">
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          
          <div className="space-y-8">
            <section className="apple-card p-6">
              <h2 className="text-xl font-semibold mb-3">Introduction</h2>
              <p className="mb-3 text-muted-foreground">
                ConvoStack ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your information when you use our ConvoStack Chrome extension and associated web application (collectively, the "Service").
              </p>
              <p className="text-muted-foreground">
                By installing the extension or using our Service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>
            
            <section className="apple-card p-6">
              <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
              <p className="mb-3 text-muted-foreground">We collect the following types of information:</p>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Account Information</h3>
              <p className="mb-3 text-muted-foreground">
                When you register for an account, we collect information such as your name, email address, and profile picture through your Google authentication provider.
              </p>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Bookmark Data</h3>
              <p className="mb-3 text-muted-foreground">
                We collect the following information when you save AI conversations:
              </p>
              <ul className="list-disc pl-6 mb-3 space-y-1 text-muted-foreground">
                <li>URLs of the conversations you bookmark</li>
                <li>Titles of conversations</li>
                <li>Labels and notes you add to bookmarks</li>
                <li>Folder organization information</li>
                <li>The AI platform associated with each bookmark (e.g., ChatGPT, Claude, Gemini)</li>
                <li>Timestamps of when bookmarks are created</li>
              </ul>
              <p className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                <span className="font-semibold">Important Note:</span> We do not collect or store the actual content of your AI conversations. We only store the metadata you provide and the URLs that link to those conversations.
              </p>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Usage Information</h3>
              <p className="mb-3 text-muted-foreground">
                We collect information about how you use our Service, including:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Actions you take within the extension and web application</li>
                <li>Feature usage patterns</li>
                <li>User preferences and settings</li>
              </ul>
            </section>
            
            <section className="apple-card p-6">
              <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
              <p className="mb-3 text-muted-foreground">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>To provide, maintain, and improve our Service</li>
                <li>To sync your bookmarks between the extension and web application</li>
                <li>To personalize your experience and provide custom organization features</li>
                <li>To communicate with you about Service updates or changes</li>
                <li>To monitor and analyze usage patterns and trends</li>
                <li>To detect, prevent, and address technical issues</li>
                <li>To enforce our Terms of Service</li>
              </ul>
            </section>
            
            <section className="apple-card p-6">
              <h2 className="text-xl font-semibold mb-3">Data Storage and Security</h2>
              <p className="mb-3 text-muted-foreground">
                We store your data securely using industry-standard practices:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>All data is stored in secure databases hosted by Supabase</li>
                <li>Data transmitted between our extension, web application, and servers is encrypted using HTTPS</li>
                <li>Authentication is handled securely through Google OAuth</li>
                <li>We regularly review our data collection, storage, and processing practices to prevent unauthorized access</li>
              </ul>
            </section>
            
            <section className="apple-card p-6">
              <h2 className="text-xl font-semibold mb-3">Data Sharing and Third Parties</h2>
              <p className="mb-3 text-muted-foreground">
                We do not sell your personal information to third parties. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>With service providers who perform services on our behalf (e.g., hosting and database providers)</li>
                <li>To comply with legal obligations</li>
                <li>To protect and defend our rights and property</li>
                <li>With your consent or at your direction</li>
              </ul>
              
              <p className="mt-3 text-muted-foreground">
                We use the following third-party services:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Google Authentication for user authentication</li>
                <li>Supabase for data storage and management</li>
              </ul>
            </section>
            
            <section className="apple-card p-6">
              <h2 className="text-xl font-semibold mb-3">Your Rights and Choices</h2>
              <p className="mb-3 text-muted-foreground">
                You have the following rights regarding your data:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Access: You can access your bookmarks and personal information through our web application</li>
                <li>Deletion: You can delete individual bookmarks at any time</li>
                <li>Account Deletion: You can request to delete your account and associated data from your account settings</li>
                <li>Data Export: You can request an export of your data</li>
              </ul>
            </section>
            
            <section className="apple-card p-6">
              <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our Service is not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us so we can promptly remove the information.
              </p>
            </section>
            
            <section className="apple-card p-6">
              <h2 className="text-xl font-semibold mb-3">Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </section>
            
            <section className="apple-card p-6">
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="mb-3 text-muted-foreground">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="px-4 py-3 bg-muted/50 rounded-md inline-block">
                Email: <a href="mailto:niwizmo@gmail.com" className="text-primary hover:underline">niwizmo@gmail.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;