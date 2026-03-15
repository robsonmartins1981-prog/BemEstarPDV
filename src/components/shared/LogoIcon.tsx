
import React from 'react';

interface LogoIconProps {
  className?: string;
}

const LogoIcon: React.FC<LogoIconProps> = ({ className }) => {
  return (
    <div className={`flex items-center justify-center bg-theme-primary rounded-xl shadow-lg ${className}`}>
      <span className="text-white font-black text-2xl tracking-tighter italic">BE</span>
    </div>
  );
};

export default LogoIcon;
