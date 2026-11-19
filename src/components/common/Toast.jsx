import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    // Automatically close notification after 3 seconds
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isDanger = toast.type === 'danger' || toast.type === 'error';
  const isWarning = toast.type === 'warning';

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold animate-fade-in transition-all ${
        isSuccess
          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
          : isDanger
          ? 'bg-rose-50 text-rose-900 border-rose-200'
          : isWarning
          ? 'bg-amber-50 text-amber-900 border-amber-200'
          : 'bg-slate-900 text-white border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
        {isDanger && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
        {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
        {!isSuccess && !isDanger && !isWarning && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
        <span>{toast.message}</span>
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
