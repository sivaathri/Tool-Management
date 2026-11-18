import React, { useState, useEffect } from 'react';
import SearchablePartInput from './SearchablePartInput';
import CheckPointsTable from './CheckPointsTable';

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

  useEffect(() => {
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

    if (!formData.applicationPartNo.trim() || !formData.productName.trim() || !formData.toolNo.trim() || !formData.description.trim()) {
      alert('Please fill in Application Part No, Product Name, Tool No, and Description');
      return;
    }

    const numLifeTime = Number(formData.lifetime);
    if (!numLifeTime || numLifeTime <= 0) {
      alert('Please enter a valid Life Time limit for the tool');
      return;
    }

    const validCheckPoints = formData.checkPoints
      .map(cp => (cp.point || '').trim())
      .filter(Boolean);

    if (validCheckPoints.length === 0) {
      alert('Please enter at least 1 Check Point for the tool');
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span id="modalAddToolTitle">
              {currentTool ? `Edit Tool: ${currentTool.toolNo || currentTool.toolNumber}` : 'Add New Tool'}
            </span>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} id="formAddTool">
          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '24px' }}>
            <div className="form-grid">
              
              {/* Row 1: Application Part No (Parent) & Product Name */}
              <div className="form-row-2">
                <div className="form-group">
                  <SearchablePartInput
                    value={formData.applicationPartNo}
                    onChange={(val) => setFormData(prev => ({ ...prev, applicationPartNo: val }))}
                    existingTools={allTools}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inpProductName">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    id="inpProductName"
                    placeholder="e.g. Steering Yoke Assembly / Brake Caliper"
                    value={formData.productName}
                    onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Tool No & Description */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="inpToolNumber">Tool No. *</label>
                  <input
                    type="text"
                    className="form-input"
                    id="inpToolNumber"
                    placeholder="e.g. INE T 1122"
                    value={formData.toolNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, toolNo: e.target.value }))}
                    required
                  />
                  <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
                    Tool No. format: <strong>INE T [Number]</strong>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inpToolDescription">Description *</label>
                  <input
                    type="text"
                    className="form-input"
                    id="inpToolDescription"
                    placeholder="e.g. Yoke Pressing Upper Die"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Row 3: Tool Issued On & Life Time */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="inpIssuedDate">Tool Issued On *</label>
                  <input
                    type="date"
                    className="form-input"
                    id="inpIssuedDate"
                    value={formData.toolIssuedOn}
                    onChange={(e) => setFormData(prev => ({ ...prev, toolIssuedOn: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inpLifeTime">Life Time (Stroke / Cycle Limit) *</label>
                  <input
                    type="number"
                    className="form-input"
                    id="inpLifeTime"
                    placeholder="Enter life time limit..."
                    min="1"
                    value={formData.lifetime}
                    onChange={(e) => setFormData(prev => ({ ...prev, lifetime: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Row 4: Classification & Tool Count */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="inpClassification">Classification *</label>
                  <select
                    className="form-select"
                    id="inpClassification"
                    value={formData.classification}
                    onChange={(e) => setFormData(prev => ({ ...prev, classification: e.target.value }))}
                    required
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
                      fontWeight: 600
                    }}
                    title="Auto-calculated cycle count: 0 by default; becomes 1 once life time completes"
                  />
                </div>
              </div>

              {/* Row 5: Check Points Matrix (Dynamic list of check points) */}
              <CheckPointsTable
                checkPoints={formData.checkPoints}
                onChange={(updated) => setFormData(prev => ({ ...prev, checkPoints: updated }))}
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
