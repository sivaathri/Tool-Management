import React, { useState, useEffect } from 'react';
import SearchablePartInput from '../components/SearchablePartInput';
import CheckPointsTable from '../components/CheckPointsTable';

export default function AddEditToolModal({
  isOpen = true,
  onClose,
  onSave,
  tool = null,
  editingTool = null,
  allTools = []
}) {
  const currentTool = tool || editingTool;

  const [formData, setFormData] = useState({
    applicationPartNo: '',
    productName: '',
    toolNo: '',
    description: '',
    toolIssuedOn: new Date().toISOString().slice(0, 10),
    lifetime: '',
    classification: 'Critical',
    toolCount: 0,
    checkPoints: [{ sno: 1, point: '' }]
  });

  const [errors, setErrors] = useState({});

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  useEffect(() => {
    setErrors({});
    if (currentTool) {
      let initialCheckPoints = [{ sno: 1, point: '' }];
      if (Array.isArray(currentTool.checkPoints) && currentTool.checkPoints.length > 0) {
        initialCheckPoints = currentTool.checkPoints.map((cp, idx) => {
          if (typeof cp === 'string') return { sno: idx + 1, point: cp };
          if (cp && typeof cp === 'object') return { sno: idx + 1, point: cp.point || cp.text || '' };
          return { sno: idx + 1, point: '' };
        });
      }

      setFormData({
        id: currentTool.id,
        applicationPartNo: currentTool.applicationPartNo || '',
        productName: currentTool.productName || '',
        toolNo: currentTool.toolNo || currentTool.toolNumber || '',
        description: currentTool.description || currentTool.toolDescription || '',
        toolIssuedOn: currentTool.toolIssuedOn || currentTool.issuedDate || new Date().toISOString().slice(0, 10),
        lifetime: currentTool.lifetime !== undefined && currentTool.lifetime !== null ? currentTool.lifetime : (currentTool.lifeTime || ''),
        classification: currentTool.classification || 'Critical',
        toolCount: currentTool.toolCount !== undefined ? currentTool.toolCount : 0,
        checkPoints: initialCheckPoints
      });
    } else {
      setFormData({
        applicationPartNo: '',
        productName: '',
        toolNo: '',
        description: '',
        toolIssuedOn: new Date().toISOString().slice(0, 10),
        lifetime: '',
        classification: 'Critical',
        toolCount: 0,
        checkPoints: [{ sno: 1, point: '' }]
      });
    }
  }, [currentTool, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.applicationPartNo.trim()) {
      newErrors.applicationPartNo = 'Please enter Application Part No.';
    }
    if (!formData.toolNo.trim()) {
      newErrors.toolNo = 'Please enter Tool No.';
    }
    if (!formData.productName.trim()) {
      newErrors.productName = 'Please enter Product Name.';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Please enter Description.';
    }
    if (!formData.toolIssuedOn) {
      newErrors.toolIssuedOn = 'Please select Tool Issued On date.';
    }
    const numLifeTime = Number(formData.lifetime);
    if (!formData.lifetime || isNaN(numLifeTime) || numLifeTime <= 0) {
      newErrors.lifetime = 'Please enter a valid Life Time limit.';
    }
    const validCheckPoints = formData.checkPoints
      .map(cp => (cp.point || '').trim())
      .filter(Boolean);
    if (validCheckPoints.length === 0) {
      newErrors.checkPoints = 'Please enter at least 1 Check Point.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Auto-focus first error field
      const firstField = Object.keys(newErrors)[0];
      const targetId =
        firstField === 'toolNo' ? 'inpToolNumber' :
        firstField === 'productName' ? 'inpProductName' :
        firstField === 'description' ? 'inpToolDescription' :
        firstField === 'toolIssuedOn' ? 'inpIssuedDate' :
        firstField === 'lifetime' ? 'inpLifeTime' :
        firstField === 'applicationPartNo' ? 'inpAppPartNo' : null;
      if (targetId) {
        document.getElementById(targetId)?.focus();
      }
      return;
    }

    let cleanToolNo = formData.toolNo.trim();
    if (!cleanToolNo.toUpperCase().startsWith('INE T')) {
      const digits = cleanToolNo.replace(/[^0-9]/g, '');
      cleanToolNo = `INE T ${digits || cleanToolNo}`;
    } else {
      cleanToolNo = cleanToolNo.replace(/^INE\s*T\s*/i, 'INE T ');
    }

    onSave({
      id: formData.id || currentTool?.id,
      applicationPartNo: formData.applicationPartNo.trim(),
      productName: formData.productName.trim(),
      toolNo: cleanToolNo,
      toolNumber: cleanToolNo,
      description: formData.description.trim(),
      toolDescription: formData.description.trim(),
      toolIssuedOn: formData.toolIssuedOn,
      issuedDate: formData.toolIssuedOn,
      lifetime: numLifeTime,
      lifeTime: numLifeTime,
      replacementFrequency: numLifeTime,
      classification: formData.classification,
      toolCount: Number(formData.toolCount) || 0,
      checkPoints: validCheckPoints,
      cumulative: currentTool?.cumulative || 0,
      balance: currentTool?.balance !== undefined ? currentTool.balance : numLifeTime
    });
  };

  return (
    <div className="modal-backdrop show" id="modalAddTool">
      <div className="modal-card modal-lg">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            
            <span id="modalAddToolTitle">
              {currentTool ? `Edit Tool: ${currentTool.toolNo || currentTool.toolNumber}` : 'Add New Tool'}
            </span>
          </div>
          <button type="button" className="modal-close" onClick={onClose} title="Close">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} id="formAddTool" noValidate>
          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '24px' }}>
            <div className="form-grid">
              
              {/* Row 1: Application Part No & Tool No */}
              <div className="form-row-2">
                <div className="form-group">
                  <SearchablePartInput
                    value={formData.applicationPartNo}
                    onChange={(val) => handleFieldChange('applicationPartNo', val)}
                    existingTools={allTools}
                    hasError={Boolean(errors.applicationPartNo)}
                    errorMessage={errors.applicationPartNo}
                  />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', minHeight: '26px', marginBottom: '6px' }}>
                    <label className="form-label" htmlFor="inpToolNumber" style={{ margin: 0, fontWeight: 700 }}>
                      Tool No. <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      id="inpToolNumber"
                      placeholder="e.g. INE T 1122"
                      value={formData.toolNo}
                      onChange={(e) => handleFieldChange('toolNo', e.target.value)}
                      style={{
                        paddingRight: formData.toolNo ? '30px' : '12px',
                        height: '38px',
                        boxSizing: 'border-box',
                        width: '100%',
                        border: errors.toolNo ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                        boxShadow: errors.toolNo ? '0 0 0 1px #ef4444' : 'none',
                        backgroundColor: errors.toolNo ? '#fef2f2' : '#ffffff'
                      }}
                    />
                    {formData.toolNo && (
                      <button
                        type="button"
                        onClick={() => handleFieldChange('toolNo', '')}
                        title="Clear Tool No"
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--slate-400)',
                          cursor: 'pointer',
                          fontSize: '17px',
                          lineHeight: '1',
                          padding: '4px'
                        }}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                  {errors.toolNo ? (
                    <div style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>
                      {errors.toolNo}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
                      Format: <strong>INE T [Number]</strong> (e.g. INE T 1122)
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Product Name & Description */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="inpProductName">Product Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    id="inpProductName"
                    placeholder="e.g. Steering Yoke Assembly / Brake Caliper"
                    value={formData.productName}
                    onChange={(e) => handleFieldChange('productName', e.target.value)}
                    style={{
                      height: '38px',
                      boxSizing: 'border-box',
                      border: errors.productName ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                      boxShadow: errors.productName ? '0 0 0 1px #ef4444' : 'none',
                      backgroundColor: errors.productName ? '#fef2f2' : '#ffffff'
                    }}
                  />
                  {errors.productName ? (
                    <div style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>
                      {errors.productName}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
                      Specify product assembly or part description
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inpToolDescription">Description <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    id="inpToolDescription"
                    placeholder="e.g. Yoke Pressing Upper Die"
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    style={{
                      height: '38px',
                      boxSizing: 'border-box',
                      border: errors.description ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                      boxShadow: errors.description ? '0 0 0 1px #ef4444' : 'none',
                      backgroundColor: errors.description ? '#fef2f2' : '#ffffff'
                    }}
                  />
                  {errors.description ? (
                    <div style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>
                      {errors.description}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
                      Tool functional description or operation name
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Tool Issued On & Life Time */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="inpIssuedDate">Tool Issued On <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="date"
                    className="form-input"
                    id="inpIssuedDate"
                    value={formData.toolIssuedOn}
                    onChange={(e) => handleFieldChange('toolIssuedOn', e.target.value)}
                    style={{
                      height: '38px',
                      boxSizing: 'border-box',
                      border: errors.toolIssuedOn ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                      boxShadow: errors.toolIssuedOn ? '0 0 0 1px #ef4444' : 'none',
                      backgroundColor: errors.toolIssuedOn ? '#fef2f2' : '#ffffff'
                    }}
                  />
                  {errors.toolIssuedOn ? (
                    <div style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>
                      {errors.toolIssuedOn}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
                      Tool commissioning or deployment date
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inpLifeTime">Life Time (Stroke / Cycle Limit) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    className="form-input"
                    id="inpLifeTime"
                    placeholder="Enter life time limit..."
                    min="1"
                    value={formData.lifetime}
                    onChange={(e) => handleFieldChange('lifetime', e.target.value)}
                    style={{
                      height: '38px',
                      boxSizing: 'border-box',
                      border: errors.lifetime ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                      boxShadow: errors.lifetime ? '0 0 0 1px #ef4444' : 'none',
                      backgroundColor: errors.lifetime ? '#fef2f2' : '#ffffff'
                    }}
                  />
                  {errors.lifetime ? (
                    <div style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>
                      {errors.lifetime}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
                      Maximum stroke count threshold before replacement
                    </div>
                  )}
                </div>
              </div>

              {/* Row 4: Classification & Tool Count */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="inpClassification">Classification <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    className="form-select"
                    id="inpClassification"
                    value={formData.classification}
                    onChange={(e) => handleFieldChange('classification', e.target.value)}
                    style={{ height: '38px', boxSizing: 'border-box' }}
                  >
                    <option value="Critical">Critical</option>
                    <option value="Non-Critical">Non-Critical</option>
                  </select>
                  <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
                    Classification (Critical or Non-Critical)
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inpToolCount">Tool Count (Cycle Count)</label>
                  <input
                    type="number"
                    className="form-input"
                    id="inpToolCount"
                    value={formData.toolCount}
                    readOnly
                    style={{
                      backgroundColor: 'var(--slate-100)',
                      color: 'var(--slate-700)',
                      cursor: 'not-allowed',
                      fontWeight: 600,
                      height: '38px',
                      boxSizing: 'border-box'
                    }}
                    title="Auto-calculated cycle count: 0 by default; becomes 1 once life time completes"
                  />
                  <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
                    Auto-incremented cycle count (0 on new tool)
                  </div>
                </div>
              </div>

              {/* Row 5: Check Points Matrix (Dynamic list of check points) */}
              <CheckPointsTable
                checkPoints={formData.checkPoints}
                onChange={(updated) => {
                  setFormData(prev => ({ ...prev, checkPoints: updated }));
                  if (errors.checkPoints && updated.some(cp => (cp.point || '').trim())) {
                    setErrors(prev => ({ ...prev, checkPoints: undefined }));
                  }
                }}
                hasError={Boolean(errors.checkPoints)}
                errorMessage={errors.checkPoints}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="btnSaveTool">
              Save Tool
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { AddEditToolModal };
