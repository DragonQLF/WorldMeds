import { Layout } from "@/components/layout/Layout";

const Settings = () => {
  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-4">Settings</h1>
        <p className="text-xl text-gray-600">
          Manage your <span className="worldmeds-font">WorldMeds</span> settings here
        </p>
      </div>
    </Layout>
  );
};

export default Settings;
