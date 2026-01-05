import React from 'react';

export function Card({ children, className = '', title, action }) {
  return (
    <div className={`bg-slate-800/50 backdrop-blur-lg rounded-xl border border-red-500/20 p-6 shadow-xl ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-red-500/20">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

