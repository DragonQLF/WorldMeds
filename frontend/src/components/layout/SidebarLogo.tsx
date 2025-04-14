import React from "react";

interface SidebarLogoProps {
  isExpanded: boolean;
}

export const SidebarLogo: React.FC<SidebarLogoProps> = ({ isExpanded }) => {
  return (
    <div className="flex items-center gap-3 w-full">
      <img
        src="./././icone.png"
        alt="WorldMeds"
        className="h-10 w-10 max-md:h-[35px] max-sm:h-[30px] object-contain" // Ensures the logo maintains its aspect ratio
      />
      {isExpanded && (
        <span className="text-xl font-bold transition-opacity duration-200">
          WorldMeds
        </span>
      )}
    </div>
  );
};
