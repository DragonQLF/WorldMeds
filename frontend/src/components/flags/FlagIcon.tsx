import React from 'react';
import ReactCountryFlag from 'react-country-flag';

interface FlagIconProps {
  isoCode?: string;
  title?: string;
  className?: string;
}

const FlagIcon: React.FC<FlagIconProps> = ({ isoCode, title, className }) => {
  if (!isoCode) {
    return null; // Or a fallback like a globe icon
  }

  return (
    <ReactCountryFlag
      countryCode={isoCode}
      svg
      title={title}
      className={className}
    />
  );
};

export default FlagIcon; 