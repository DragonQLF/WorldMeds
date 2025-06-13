import React, { memo, useEffect } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { useFlagContext } from './FlagProvider';

interface FlagIconProps {
  isoCode?: string;
  title?: string;
  className?: string;
}

const FlagIcon: React.FC<FlagIconProps> = ({ isoCode, title, className }) => {
  const { loadedFlags, addLoadedFlag, isLoading } = useFlagContext();

  if (!isoCode) {
    return null;
  }

  // Add to context cache when loaded
  useEffect(() => {
    if (!loadedFlags.has(isoCode)) {
      const img = new Image();
      img.onload = () => addLoadedFlag(isoCode);
      img.src = `https://flagcdn.com/${isoCode.toLowerCase()}.svg`;
    }
  }, [isoCode, loadedFlags, addLoadedFlag]);

  if (isLoading && !loadedFlags.has(isoCode)) {
    // Return a placeholder while loading
    return (
      <div 
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
        style={{
          width: className?.includes('w-') ? undefined : '1.5em',
          height: className?.includes('h-') ? undefined : '1.5em'
        }}
      />
    );
  }

  return (
    <ReactCountryFlag
      countryCode={isoCode}
      svg
      title={title}
      className={className}
      style={{
        // Add loading="eager" to the underlying img element
        loading: 'eager',
        // Use width/height if not provided in className
        width: className?.includes('w-') ? undefined : '1.5em',
        height: className?.includes('h-') ? undefined : '1.5em'
      }}
    />
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(FlagIcon); 