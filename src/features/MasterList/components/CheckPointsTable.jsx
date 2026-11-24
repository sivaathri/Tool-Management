import React from 'react';

export default function CheckPointsTable({ checkPoints = [], onChange, hasError = false, errorMessage = '' }) {
  const handleFieldChange = (index, field, value) => {
    const updated = [...checkPoints];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleInsertSymbol = (index, symbol, field = 'specification') => {
    const current = checkPoints[index]?.[field] || '';
    handleFieldChange(index, field, current ? `${current}${symbol}` : symbol);
  };

  const handleAddRow = () => {
    const nextSno = checkPoints.length + 1;
    onChange([
      ...checkPoints,
      { sno: nextSno, point: '', method: '', specification: '', actualCondition: '' }
    ]);
  };

  const handleRemoveRow = (index) => {
    if (checkPoints.length <= 1) {
      // Keep single row, just clear fields
      onChange([{ sno: 1, point: '', method: '', specification: '', actualCondition: '' }]);
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
          <label className="form-label" style={{ marginBottom: '2px', fontWeight: 700 }}>
            Check Points Matrix <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
            Configure inspection points with Checking Method, Specification &amp; Actual Condition
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          id="btnAddCheckPointRow"
          onClick={handleAddRow}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontWeight: 700,
            fontSize: '12px',
            padding: '6px 12px'
          }}
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
        <table className="enterprise-table" style={{ margin: 0, fontSize: '13px', width: '100%', tableLayout: 'auto' }}>
          <thead>
            <tr style={{ background: 'var(--slate-100)', color: 'var(--slate-700)', fontWeight: 700 }}>
              <th style={{ width: '50px', textAlign: 'center', padding: '10px 6px', verticalAlign: 'middle' }}>S.no</th>
              <th style={{ minWidth: '240px', padding: '10px 12px', verticalAlign: 'middle' }}>
                Check point Description <span style={{ color: '#ef4444' }}>*</span>
              </th>
              <th style={{ width: '160px', padding: '10px 10px', textAlign: 'center', verticalAlign: 'middle' }}>Checking Method</th>
              <th style={{ minWidth: '220px', padding: '10px 12px', verticalAlign: 'middle' }}>Specification</th>
              <th style={{ minWidth: '220px', padding: '10px 12px', verticalAlign: 'middle' }}>Actual condition</th>
              <th style={{ width: '60px', textAlign: 'center', padding: '10px 6px', verticalAlign: 'middle' }}>Action</th>
            </tr>
          </thead>
          <tbody id="checkPointsTableBody">
            {checkPoints.map((cp, index) => (
              <tr key={index} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {/* S.No */}
                <td style={{ width: '50px', textAlign: 'center', fontWeight: 700, color: 'var(--slate-600)', verticalAlign: 'middle', padding: '10px 6px' }}>
                  {index + 1}
                </td>

                {/* Check point Description */}
                <td style={{ verticalAlign: 'top', padding: '10px 12px' }}>
                  <div style={{ minHeight: '24px', marginBottom: '6px', visibility: 'hidden' }} aria-hidden="true" />
                  <textarea
                    className="form-input cp-input"
                    placeholder="e.g. CHECK COIL LOCATOR FOR ANY DAMAGES"
                    rows="2"
                    value={cp.point || ''}
                    onChange={(e) => handleFieldChange(index, 'point', e.target.value)}
                    style={{
                      fontSize: '13px',
                      width: '100%',
                      resize: 'vertical',
                      minHeight: '48px',
                      lineHeight: 1.45,
                      padding: '8px 10px',
                      borderRadius: '5px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </td>

                {/* Checking Method */}
                <td style={{ width: '160px', verticalAlign: 'top', padding: '10px 10px' }}>
                  <div style={{ minHeight: '24px', marginBottom: '6px', visibility: 'hidden' }} aria-hidden="true" />
                  <select
                    className="form-select"
                    value={cp.method || ''}
                    onChange={(e) => handleFieldChange(index, 'method', e.target.value)}
                    style={{
                      width: '100%',
                      height: '48px',
                      fontSize: '13px',
                      padding: '8px 10px',
                      fontWeight: 600,
                      borderRadius: '5px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select Method</option>
                    <option value="Visual">Visual</option>
                    <option value="Vernier">Vernier</option>
                    <option value="Micro meter">Micro meter</option>
                    <option value="Flip guage">Flip guage</option>
                    {cp.method && !['Visual', 'Vernier', 'Micro meter', 'Flip guage'].includes(cp.method) && (
                      <option value={cp.method}>{cp.method}</option>
                    )}
                  </select>
                </td>

                {/* Specification */}
                <td style={{ verticalAlign: 'top', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', minHeight: '24px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Insert:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertSymbol(index, '⌀')}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #3b82f6',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        lineHeight: '1.2'
                      }}
                      title="Insert Diameter symbol (⌀)"
                    >
                      ⌀
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertSymbol(index, '±')}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #f97316',
                        backgroundColor: '#fff7ed',
                        color: '#ea580c',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        lineHeight: '1.2'
                      }}
                      title="Insert Plus-Minus tolerance symbol (±)"
                    >
                      ±
                    </button>
                  </div>
                  <textarea
                    className="form-input"
                    placeholder="e.g. ⌀ 25 ± 0.05"
                    rows="2"
                    value={cp.specification || cp.spec || ''}
                    onChange={(e) => handleFieldChange(index, 'specification', e.target.value)}
                    style={{
                      fontSize: '13px',
                      width: '100%',
                      resize: 'vertical',
                      minHeight: '48px',
                      lineHeight: 1.45,
                      padding: '8px 10px',
                      borderRadius: '5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </td>

                {/* Actual condition */}
                <td style={{ verticalAlign: 'top', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', minHeight: '24px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Insert:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertSymbol(index, '⌀', 'actualCondition')}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #3b82f6',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        lineHeight: '1.2'
                      }}
                      title="Insert Diameter symbol (⌀)"
                    >
                      ⌀
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertSymbol(index, '±', 'actualCondition')}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #f97316',
                        backgroundColor: '#fff7ed',
                        color: '#ea580c',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        lineHeight: '1.2'
                      }}
                      title="Insert Plus-Minus tolerance symbol (±)"
                    >
                      ±
                    </button>
                  </div>
                  <textarea
                    className="form-input"
                    placeholder="e.g. Smooth, OK, No wear"
                    rows="2"
                    value={cp.actualCondition || ''}
                    onChange={(e) => handleFieldChange(index, 'actualCondition', e.target.value)}
                    style={{
                      fontSize: '13px',
                      width: '100%',
                      resize: 'vertical',
                      minHeight: '48px',
                      lineHeight: 1.45,
                      padding: '8px 10px',
                      borderRadius: '5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </td>

                {/* Action */}
                <td style={{ width: '60px', textAlign: 'center', verticalAlign: 'top', padding: '10px 6px' }}>
                  <div style={{ minHeight: '24px', marginBottom: '6px', visibility: 'hidden' }} aria-hidden="true" />
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
                      width="16"
                      height="16"
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
