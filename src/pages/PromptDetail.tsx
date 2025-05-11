// src/pages/PromptDetail.tsx
import Layout from "@/components/layout/Layout";
import PromptEditor from "@/components/prompts/PromptEditor";

const PromptDetail = () => {
  return (
    <Layout>
      <div className="container py-6 max-w-5xl mx-auto">
        <PromptEditor />
      </div>
    </Layout>
  );
};

export default PromptDetail;