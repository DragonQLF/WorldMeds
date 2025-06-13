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
    // No need to preload flags anymore since we'll load them as needed
    setIsLoading(false);
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