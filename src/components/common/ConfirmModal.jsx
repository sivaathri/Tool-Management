import React from 'react';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText,
  confirmLabel = 'Confirm', 
  confirmStyle,
  confirmVariant = 'danger' 
}) {
  if (!isOpen) return null;

  const label = confirmText || confirmLabel;
  const isDanger = confirmStyle === 'danger' || confirmVariant === 'danger';

  return (
    <div className="modal-backdrop show">
      <div className="modal-card" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDanger ? '#dc2626' : 'currentColor'} strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>{title}</span>
          </div>
          <button type="button" className="modal-close" onClick={onCancel} title="Close">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', fontSize: '13.5px', color: 'var(--slate-600)', lineHeight: 1.6 }}>
          {message}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            style={isDanger ? { backgroundColor: '#dc2626', borderColor: '#dc2626' } : {}}
          >
            {label}
          </button>
        </div>
      </div>
    </div>
  );
}

export { ConfirmModal };
