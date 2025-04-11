import { useState } from "react";
import { LayoutDashboard, Settings, LogIn, Moon } from "lucide-react";

export default function Sidebar() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    // The container uses the group class to trigger inner hover transitions.
    <div
      className={`group h-[1080px] w-20 hover:w-52 transition-all duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-700"
      } flex flex-col justify-between py-4 px-2`}
    >
      <div>
        {/* Logo */}
        <div className="flex items-center space-x-2 px-2 mb-8">
          <div className="text-blue-500 text-2xl">🔷</div>
          <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold text-lg">
            WorldMeds
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-4">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Dashboard
            </span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Settings className="h-5 w-5" />
            <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Settings
            </span>
          </button>
        </nav>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-4">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <LogIn className="h-5 w-5" />
          <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Login
          </span>
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Moon className="h-5 w-5" />
          <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Dark
          </span>
        </button>
      </div>
    </div>
  );
}
