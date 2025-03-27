import Layout from "@/components/layout/Layout";
import SettingsPanel from "@/components/settings/SettingsPanel";

const Settings = () => {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account and application preferences.
            </p>
          </div>
          
          <SettingsPanel />
        </div>
      </Layout>
    );
  };
  
  export default Settings;