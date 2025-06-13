import React, { createContext, useContext, useEffect, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';

interface FlagContextType {
  loadedFlags: Set<string>;
  addLoadedFlag: (isoCode: string) => void;
  isLoading: boolean;
}

const FlagContext = createContext<FlagContextType>({
  loadedFlags: new Set(),
  addLoadedFlag: () => {},
  isLoading: true,
});

// List of commonly used country codes
const COMMON_COUNTRY_CODES = [
  'US', 'GB', 'CA', 'AU', 'FR', 'DE', 'IT', 'ES', 'JP', 'CN',
  'BR', 'RU', 'IN', 'MX', 'AR', 'CL', 'ZA', 'KR', 'SA', 'AE'
];

export const useFlagContext = () => useContext(FlagContext);

interface FlagProviderProps {
  children: React.ReactNode;
}

export const FlagProvider: React.FC<FlagProviderProps> = ({ children }) => {
  const [loadedFlags, setLoadedFlags] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const addLoadedFlag = (isoCode: string) => {
    setLoadedFlags(prev => {
      const newSet = new Set(prev);
      newSet.add(isoCode);
      return newSet;
    });
  };

  useEffect(() => {
    const preloadFlags = async () => {
      try {
        const preloadPromises = COMMON_COUNTRY_CODES.map(code => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              addLoadedFlag(code);
              resolve(true);
            };
            img.onerror = () => resolve(false);
            img.src = `https://flagcdn.com/${code.toLowerCase()}.svg`;
          });
        });

        await Promise.all(preloadPromises);
      } finally {
        setIsLoading(false);
      }
    };

    preloadFlags();
  }, []);

  return (
    <FlagContext.Provider value={{ loadedFlags, addLoadedFlag, isLoading }}>
      <div style={{ display: 'none' }}>
        {Array.from(loadedFlags).map(code => (
          <ReactCountryFlag
            key={code}
            countryCode={code}
            svg
            style={{
              width: '1px',
              height: '1px',
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none'
            }}
          />
        ))}
      </div>
      {children}
    </FlagContext.Provider>
  );
}; 