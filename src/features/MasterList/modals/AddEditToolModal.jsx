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
  const [toolNumberDigits, setToolNumberDigits] = useState('');

  const extractDigits = (val) => String(val || '').replace(/^INE\s*T\s*/i, '').replace(/[^0-9]/g, '');

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  useEffect(() => {
    setErrors({});
    if (currentTool) {
      const existingDigits = extractDigits(currentTool.toolNo || currentTool.toolNumber || '');
      setToolNumberDigits(existingDigits);

      let initialCheckPoints = [{ sno: 1, point: '', method: '', specification: '', actualCondition: '' }];
      if (Array.isArray(currentTool.checkPoints) && currentTool.checkPoints.length > 0) {
        initialCheckPoints = currentTool.checkPoints.map((cp, idx) => {
          if (typeof cp === 'string') {
            return { sno: idx + 1, point: cp, method: '', specification: '', actualCondition: '' };
          }
          if (cp && typeof cp === 'object') {
            return {
              sno: idx + 1,
              point: cp.point || cp.text || cp.description || cp.checkPoint || '',
              method: cp.method || '',
              specification: cp.specification || cp.spec || '',
              actualCondition: cp.actualCondition || ''
            };
          }
          return { sno: idx + 1, point: '', method: '', specification: '', actualCondition: '' };
        });
      }

      setFormData({
        id: currentTool.id,
        applicationPartNo: currentTool.applicationPartNo || '',
        productName: currentTool.productName || '',
        toolNo: existingDigits ? `INE T ${existingDigits}` : '',
        description: currentTool.description || currentTool.toolDescription || '',
        toolIssuedOn: currentTool.toolIssuedOn || currentTool.issuedDate || new Date().toISOString().slice(0, 10),
        lifetime: currentTool.lifetime !== undefined && currentTool.lifetime !== null ? currentTool.lifetime : (currentTool.lifeTime || ''),
        classification: currentTool.classification || 'Critical',
        toolCount: currentTool.toolCount !== undefined ? currentTool.toolCount : 0,
        checkPoints: initialCheckPoints
      });
    } else {
      setToolNumberDigits('');
      setFormData({
        applicationPartNo: '',
        productName: '',
        toolNo: '',
        description: '',
        toolIssuedOn: new Date().toISOString().slice(0, 10),
        lifetime: '',
        classification: 'Critical',
        toolCount: 0,
        checkPoints: [{ sno: 1, point: '', method: '', specification: '', actualCondition: '' }]
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
      .filter(cp => (typeof cp === 'object' ? (cp.point || '').trim() : String(cp || '').trim()))
      .map((cp, idx) => {
        if (typeof cp === 'object') {
          const pt = (cp.point || '').trim();
          const spec = cp.specification || cp.spec || '';
          return {
            sno: idx + 1,
            point: pt,
            description: pt,
            checkPoint: pt,
            method: cp.method || '',
            specification: spec,
            spec: spec,
            actualCondition: cp.actualCondition || ''
          };
        }
        const str = String(cp).trim();
        return {
          sno: idx + 1,
          point: str,
          description: str,
          checkPoint: str,
          method: '',
          specification: '',
          spec: '',
          actualCondition: ''
        };
      });

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
      <div className="modal-card modal-lg" style={{ maxWidth: '1280px', width: '96%' }}>
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
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'stretch',
                    border: errors.toolNo ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                    boxShadow: errors.toolNo ? '0 0 0 1px #ef4444' : 'none',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: errors.toolNo ? '#fef2f2' : '#ffffff',
                    overflow: 'hidden',
                    height: '38px',
                    boxSizing: 'border-box'
                  }}>
                    {/* Fixed uneditable INE T prefix box */}
                    <div style={{
                      padding: '0 12px',
                      backgroundColor: '#f8fafc',
                      color: '#1d4ed8',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      borderRight: '1.5px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      userSelect: 'none',
                      whiteSpace: 'nowrap'
                    }}>
                      INE T
                    </div>

                    {/* Number-only input box */}
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      id="inpToolNumber"
                      placeholder="Enter number (e.g. 1122, 0624)..."
                      value={toolNumberDigits}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^0-9]/g, '');
                        setToolNumberDigits(digits);
                        handleFieldChange('toolNo', digits ? `INE T ${digits}` : '');
                      }}
                      style={{
                        border: 'none',
                        outline: 'none',
                        flex: 1,
                        padding: '0 12px',
                        height: '100%',
                        fontSize: '13.5px',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 700,
                        color: '#0f172a',
                        backgroundColor: 'transparent'
                      }}
                    />

                    {toolNumberDigits && (
                      <button
                        type="button"
                        onClick={() => {
                          setToolNumberDigits('');
                          handleFieldChange('toolNo', '');
                        }}
                        title="Clear number"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--slate-400)',
                          cursor: 'pointer',
                          fontSize: '17px',
                          lineHeight: '1',
                          padding: '0 10px',
                          display: 'flex',
                          alignItems: 'center'
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
                      <strong>INE T</strong> is fixed; enter tool number only (e.g. 1122)
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
                      border: errors.productName ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
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
                      border: errors.description ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
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
                      border: errors.toolIssuedOn ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
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
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    id="inpLifeTime"
                    placeholder="Enter life time limit..."
                    value={formData.lifetime}
                    onKeyDown={(e) => {
                      if (
                        !/[0-9]/.test(e.key) &&
                        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key) &&
                        !e.ctrlKey &&
                        !e.metaKey
                      ) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const numericOnly = e.target.value.replace(/[^0-9]/g, '');
                      handleFieldChange('lifetime', numericOnly);
                    }}
                    style={{
                      height: '38px',
                      boxSizing: 'border-box',
                      border: errors.lifetime ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
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
