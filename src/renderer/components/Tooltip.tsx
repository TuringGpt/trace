// Tooltip.tsx
import React from 'react';

type TooltipProps = {
  text: string;
  children: React.ReactNode;
};

export default function Tooltip({ text, children }: TooltipProps) {
  return (
    <div className="group relative flex items-center">
      {children}
      <span className="absolute text-xs bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition ease-in-out duration-500 pointer-events-none bg-black text-white p-1 rounded">
        {text}
      </span>
    </div>
  );
}
