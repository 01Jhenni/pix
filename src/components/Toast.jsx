import React from 'react';
import { CheckCircle, XCircle, Info, AlertCircle } from 'lucide-react';

export function ToastContainer({ toasts }) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {toasts.map(toast => {
        const Icon = icons[toast.type] || Info;
        const colors = {
          success: 'bg-green-500/90 border-green-400',
          error: 'bg-red-500/90 border-red-400',
          warning: 'bg-yellow-500/90 border-yellow-400',
          info: 'bg-blue-500/90 border-blue-400',
        };

        return (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg
              text-white shadow-xl border
              animate-slideIn
              ${colors[toast.type] || colors.info}
            `}
          >
            <Icon size={20} />
            <span className="font-medium">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}

