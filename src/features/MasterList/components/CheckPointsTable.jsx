import React from 'react';

export default function CheckPointsTable({ checkPoints = [], onChange, hasError = false, errorMessage = '' }) {
  const handleTextChange = (index, value) => {
    const updated = [...checkPoints];
    updated[index] = { ...updated[index], point: value };
    onChange(updated);
  };

  const handleAddRow = () => {
    const nextSno = checkPoints.length + 1;
    onChange([...checkPoints, { sno: nextSno, point: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (checkPoints.length <= 1) {
      // Keep single row, just clear text
      onChange([{ sno: 1, point: '' }]);
      return;
    }
    const filtered = checkPoints.filter((_, idx) => idx !== index);
    const renumbered = filtered.map((cp, idx) => ({ ...cp, sno: idx + 1 }));
    onChange(renumbered);
  };

  return (
    <div className="form-group" style={{ marginTop: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <label className="form-label" style={{ marginBottom: '2px' }}>Check Points <span style={{ color: '#ef4444' }}>*</span></label>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          id="btnAddCheckPointRow"
          onClick={handleAddRow}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Check Point</span>
        </button>
      </div>

      <div
        className="table-responsive"
        style={{
          border: hasError ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
          boxShadow: hasError ? '0 0 0 1px #ef4444' : 'none',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: hasError ? '#fef2f2' : '#fff'
        }}
      >
        <table className="enterprise-table" style={{ margin: 0, fontSize: '12.5px' }}>
          <thead>
            <tr style={{ background: 'var(--slate-100)' }}>
              <th style={{ width: '70px', textAlign: 'center' }}>S.no</th>
              <th>Check points</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody id="checkPointsTableBody">
            {checkPoints.map((cp, index) => (
              <tr key={index}>
                <td style={{ width: '70px', textAlign: 'center', fontWeight: 600, color: 'var(--slate-600)', verticalAlign: 'middle' }}>
                  {index + 1}
                </td>
                <td>
                  <textarea
                    className="form-input cp-input"
                    placeholder="e.g. CHECK COIL LOCATOR"
                    rows="2"
                    value={cp.point || ''}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    style={{
                      fontSize: '12.5px',
                      width: '100%',
                      resize: 'vertical',
                      minHeight: '48px',
                      lineHeight: 1.4,
                      padding: '6px 10px'
                    }}
                    required
                  />
                </td>
                <td style={{ width: '60px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <button
                    type="button"
                    className="btn-action-icon btn-action-delete"
                    onClick={() => handleRemoveRow(index)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '6px',
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      color: '#dc2626',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    title="Remove check point"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasError && (
        <div style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: 600, marginTop: '5px' }}>
          {errorMessage || 'Please enter at least 1 Check Point.'}
        </div>
      )}
    </div>
  );
}

export { CheckPointsTable };
