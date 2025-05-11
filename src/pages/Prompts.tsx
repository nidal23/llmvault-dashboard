// src/pages/Prompts.tsx
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import PromptsList from "@/components/prompts/PromptsList";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePromptsStore } from "@/lib/stores/usePromptsStore";

const Prompts = () => {
  const { user } = useAuth();
  const { fetchPrompts } = usePromptsStore();
  
  useEffect(() => {
    if (user) {
      fetchPrompts(user.id);
    }
  }, [user, fetchPrompts]);
  
  return (
    <Layout>
      <div className="container py-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Prompt Studio</h1>
        <p className="text-muted-foreground mb-6">
          Create, manage, and use effective prompts for AI conversations
        </p>
        
        <PromptsList />
      </div>
    </Layout>
  );
};

export default Prompts;