import React, { useState, useEffect } from 'react';

export default function UserModal({ isOpen, user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    empId: '',
    email: '',
    phone: '',
    role: 'Tool Room Engineer',
    department: 'Tool Room',
    status: 'Active'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name || '',
        empId: user.empId || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'Tool Room Engineer',
        department: user.department || 'Tool Room',
        status: user.status || 'Active',
        avatar: user.avatar || ''
      });
    } else {
      setFormData({
        name: '',
        empId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        email: '',
        phone: '',
        role: 'Tool Room Engineer',
        department: 'Tool Room',
        status: 'Active'
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.empId.trim()) {
      alert('Please fill in Name, Employee ID, and Email');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-backdrop show">
      <div className="modal-card" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>{user ? `Edit User: ${user.name}` : 'Add New Plant User'}</span>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              
              {/* Full Name */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" htmlFor="inpUserName">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  id="inpUserName"
                  placeholder="e.g. R. Sharma / K. Patel"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {/* Employee ID */}
              <div className="form-group">
                <label className="form-label" htmlFor="inpUserEmpId">Employee ID *</label>
                <input
                  type="text"
                  className="form-input"
                  id="inpUserEmpId"
                  placeholder="e.g. EMP-014"
                  value={formData.empId}
                  onChange={(e) => setFormData(prev => ({ ...prev, empId: e.target.value }))}
                  required
                />
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label" htmlFor="inpUserStatus">Account Status</label>
                <select
                  className="form-select"
                  id="inpUserStatus"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Email */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" htmlFor="inpUserEmail">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  id="inpUserEmail"
                  placeholder="e.g. r.sharma@inel.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              {/* Phone */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" htmlFor="inpUserPhone">Contact Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  id="inpUserPhone"
                  placeholder="+91 98401 23456"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              {/* Role */}
              <div className="form-group">
                <label className="form-label" htmlFor="inpUserRole">Assigned Role</label>
                <select
                  className="form-select"
                  id="inpUserRole"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Tool Room Engineer">Tool Room Engineer</option>
                  <option value="Quality Inspector">Quality Inspector</option>
                  <option value="Tool Design Engineer">Tool Design Engineer</option>
                  <option value="Plant Head">Plant Head</option>
                  <option value="Machine Operator">Machine Operator</option>
                </select>
              </div>

              {/* Department */}
              <div className="form-group">
                <label className="form-label" htmlFor="inpUserDept">Department</label>
                <select
                  className="form-select"
                  id="inpUserDept"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                >
                  <option value="Tool Room">Tool Room</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Plant Operations">Plant Operations</option>
                  <option value="Press Shop">Press Shop</option>
                  <option value="Tool Design">Tool Design</option>
                  <option value="Management">Management</option>
                </select>
              </div>

            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
