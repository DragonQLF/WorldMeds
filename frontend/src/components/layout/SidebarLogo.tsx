import React from "react";
import { useMapContext } from "@/contexts/MapContext";

interface SidebarLogoProps {
  isExpanded: boolean;
}

export const SidebarLogo: React.FC<SidebarLogoProps> = ({ isExpanded }) => {
  const { darkMode } = useMapContext();
  const logoSrc = darkMode ? "/icone-dark.png" : "/icone.png";

  return (
    <div className="flex items-center gap-2 w-full">
      <img
        src={logoSrc}
        alt="WorldMeds"
        className="h-9 w-9 max-md:h-[32px] max-sm:h-[28px] object-contain flex-shrink-0" 
      />
      {isExpanded && (
        <span className="text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis dark:text-gray-100 worldmeds-font">
          WorldMeds
        </span>
      )}
    </div>
  );
};
