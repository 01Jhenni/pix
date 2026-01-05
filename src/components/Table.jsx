import React from 'react';

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead className={className}>
      <tr className="border-b border-red-500/20">
        {children}
      </tr>
    </thead>
  );
}

export function TableHeaderCell({ children, className = '' }) {
  return (
    <th className={`text-left py-3 px-4 text-slate-300 font-semibold ${className}`}>
      {children}
    </th>
  );
}

export function TableBody({ children, className = '' }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, onClick, className = '' }) {
  const baseClasses = 'border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors';
  const clickableClasses = onClick ? 'cursor-pointer' : '';
  
  return (
    <tr 
      className={`${baseClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`py-3 px-4 ${className}`}>
      {children}
    </td>
  );
}

