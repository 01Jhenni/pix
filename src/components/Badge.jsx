import React from 'react';

const variants = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  default: 'bg-slate-700/50 text-slate-300 border-slate-600',
};

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border
      ${variants[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
}

