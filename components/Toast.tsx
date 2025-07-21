
import React from 'react';
import { useJobData } from '../contexts/JobDataContext';
import { InformationCircleIcon, CheckIcon, XCircleIcon, XMarkIcon } from './icons';

const Toast: React.FC = () => {
  const { toasts, removeToast } = useJobData();

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckIcon className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <InformationCircleIcon className="w-6 h-6 text-blue-500" />;
    }
  };
  
  const getColors = (type: string) => {
     switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between p-4 rounded-lg shadow-lg border animate-fade-in-down ${getColors(toast.type)}`}
          role="alert"
        >
          <div className="flex items-center">
            {getIcon(toast.type)}
            <p className="ml-3 font-medium">{toast.message}</p>
          </div>
          <button onClick={() => removeToast(toast.id)} className="p-1 -mr-2 rounded-full hover:bg-black/10">
            <XMarkIcon className="w-4 h-4"/>
          </button>
        </div>
      ))}
      <style>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts } = useJobData();
  return <>{toasts.length > 0 && <Toast />}</>;
}


export default ToastContainer;
