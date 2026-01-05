import React from 'react';

export function Input({ label, error, help, className = '', ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2.5
          bg-slate-700/50 border border-slate-600
          rounded-lg text-white placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
          transition-all duration-200
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {help && <p className="mt-1 text-xs text-slate-400">{help}</p>}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

