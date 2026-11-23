import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    // Automatically close notification after custom duration or default
    const duration = toast.duration || (toast.onClick ? 12000 : 3500);
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, toast.onClick, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isDanger = toast.type === 'danger' || toast.type === 'error';
  const isWarning = toast.type === 'warning';

  const handleClick = (e) => {
    if (toast.onClick) {
      toast.onClick();
      onDismiss(toast.id);
    }
  };

  return (
    <div
      onClick={toast.onClick ? handleClick : undefined}
      style={{
        cursor: toast.onClick ? 'pointer' : 'default',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }}
      className={`pointer-events-auto flex items-start justify-between gap-3 px-4 py-3 rounded-xl border animate-fade-in transition-all ${
        isSuccess
          ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
          : isDanger
          ? 'bg-rose-50 text-rose-950 border-rose-300'
          : isWarning
          ? 'bg-amber-50 text-amber-950 border-amber-300'
          : 'bg-slate-900 text-white border-slate-700'
      }`}
    >
      <div className="flex items-start gap-2.5 flex-1">
        <div className="mt-0.5 shrink-0">
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          {isDanger && <AlertCircle className="w-5 h-5 text-rose-600" />}
          {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
          {!isSuccess && !isDanger && !isWarning && <Info className="w-5 h-5 text-blue-400" />}
        </div>
        <div className="flex-1">
          {toast.title && (
            <div className="font-bold text-xs uppercase tracking-wide mb-1" style={{ color: isDanger ? '#991b1b' : 'inherit' }}>
              {toast.title}
            </div>
          )}
          <div className="text-xs leading-relaxed font-medium">
            {toast.message}
          </div>
          {toast.actionLabel && (
            <div className="mt-2">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 12px',
                  backgroundColor: isDanger ? '#dc2626' : '#2563eb',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}
              >
                {toast.actionLabel} &rarr;
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Toast({ toasts = [], onDismiss, onCloseToast }) {
  const dismiss = onDismiss || onCloseToast || (() => {});
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}

export { Toast, Toast as ToastContainer };
