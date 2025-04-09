import React, { useState } from "react";
import { SidebarButton } from "./ui/SidebarButton";
import {
  LayoutGridIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
} from "lucide-react";

interface SidebarProps {
  activePage: string;
  setActivePage: React.Dispatch<React.SetStateAction<string>>;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");

  const handleMouseEnter = () => setIsExpanded(true);
  const handleMouseLeave = () => setIsExpanded(false);
  const handleTabChange = (tab: string) => setActiveTab(tab);

  return (
    <aside
      className={`flex flex-col h-screen items-center justify-between py-10 bg-primitives-color-neutral-FFFFFF transition-all duration-300 ${
        isExpanded ? "w-[200px] px-4" : "w-[93px] px-6"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-center w-full">
        <img
          className="w-[31px] h-10"
          alt="Logo"
          src="https://c.animaapp.com/wALP8Ily/img/icone.svg"
        />
        {isExpanded && (
          <span className="ml-2 text-lg font-semibold whitespace-nowrap overflow-hidden transition-all duration-300">
            WorldMeds
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-4 w-full">
        <SidebarButton
          icon={<LayoutGridIcon />}
          label="Dashboard"
          isActive={activeTab === "Dashboard"}
          onClick={() => handleTabChange("Dashboard")}
        />
        <SidebarButton
          icon={<SettingsIcon />}
          label="Settings"
          isActive={activeTab === "Settings"}
          onClick={() => handleTabChange("Settings")}
        />
      </nav>

      <div className="flex flex-col gap-4 w-full">
        <SidebarButton
          icon={<LogOutIcon />}
          label="Logout"
          onClick={() => console.log("Logout clicked")}
        />
        <SidebarButton
          icon={<MoonIcon />}
          label="Dark Mode"
          onClick={() => console.log("Dark Mode clicked")}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
