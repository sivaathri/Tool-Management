import React, { useState, useMemo } from 'react';
import UserModal from './UserModal';

export default function UserManagementView({
  users = [],
  onSaveUser,
  onDeleteUser,
  showToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Metrics
  const totalUsers = users.length;
  const activeCount = users.filter(u => u.status === 'Active').length;
  const toolRoomCount = users.filter(u => (u.department || '').toLowerCase().includes('tool') || (u.role || '').toLowerCase().includes('tool')).length;
  const qaCount = users.filter(u => (u.department || '').toLowerCase().includes('quality') || (u.role || '').toLowerCase().includes('quality') || (u.role || '').toLowerCase().includes('admin')).length;

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.empId && u.empId.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q));

      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesStatus = !statusFilter || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSave = (userData) => {
    onSaveUser(userData);
    setIsModalOpen(false);
    showToast?.(editingUser ? `User ${userData.name} updated` : `New user ${userData.name} created`, 'success');
  };

  const handleToggleStatus = (user) => {
    const updatedStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    onSaveUser({ ...user, status: updatedStatus });
    showToast?.(`User ${user.name} is now ${updatedStatus}`, 'info');
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
      showToast?.(`User ${userToDelete.name} deleted`, 'info');
      setUserToDelete(null);
    }
  };

  return (
    <section className="view-section active" id="view-user-management">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card card-kpi-total">
          <div className="kpi-header">
            <span className="kpi-title">Total Registered Users</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--accent-50)', color: 'var(--accent-600)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <div className="kpi-value">{totalUsers}</div>
          <div className="kpi-subtitle">Across all plant divisions</div>
        </div>

        <div className="kpi-card card-kpi-active">
          <div className="kpi-header">
            <span className="kpi-title">Active Personnel</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#059669' }}>{activeCount}</div>
          <div className="kpi-subtitle">Ready for tool allocation</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Tool Room Engineers</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#1d4ed8' }}>{toolRoomCount}</div>
          <div className="kpi-subtitle">Design & Maintenance</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">QA & Management</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#b45309' }}>{qaCount}</div>
          <div className="kpi-subtitle">Inspection approval leads</div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="filter-card" style={{ marginBottom: '20px' }}>
        <div className="filter-grid filter-grid-users">
          <div className="form-group">
            <label className="form-label" htmlFor="userSearchInput">Search Users</label>
            <input
              type="text"
              className="form-input"
              id="userSearchInput"
              placeholder="Search by name, employee ID, email, or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="userRoleFilter">Role</label>
            <select
              className="form-select"
              id="userRoleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="Administrator">Administrator</option>
              <option value="Tool Room Engineer">Tool Room Engineer</option>
              <option value="Quality Inspector">Quality Inspector</option>
              <option value="Tool Design Engineer">Tool Design Engineer</option>
              <option value="Plant Head">Plant Head</option>
              <option value="Machine Operator">Machine Operator</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="userStatusFilter">Status</label>
            <select
              className="form-select"
              id="userStatusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ visibility: 'hidden' }}>&nbsp;</label>
            <button
              type="button"
              className="btn btn-secondary btn-reset-filter"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setStatusFilter('');
              }}
              style={{ height: '38px', minWidth: '90px' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Employee ID</th>
                <th>Role</th>
                <th>Department</th>
                <th>Contact</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--slate-500)' }}>
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    {/* User Avatar + Name */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: user.role === 'Administrator' ? 'var(--accent-600)' : 'var(--slate-700)',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {user.avatar || 'US'}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--slate-900)', fontSize: '13.5px' }}>{user.name}</strong>
                          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-700)' }}>
                        {user.empId || '—'}
                      </span>
                    </td>

                    {/* Role */}
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          backgroundColor:
                            user.role === 'Administrator' ? '#fee2e2' :
                            user.role.includes('Engineer') ? '#eff6ff' :
                            user.role.includes('Inspector') ? '#fef3c7' : '#f1f5f9',
                          color:
                            user.role === 'Administrator' ? '#991b1b' :
                            user.role.includes('Engineer') ? '#1d4ed8' :
                            user.role.includes('Inspector') ? '#b45309' : '#334155'
                        }}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Department */}
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--slate-700)' }}>{user.department || '—'}</span>
                    </td>

                    {/* Contact */}
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--slate-600)' }}>{user.phone || '—'}</span>
                    </td>

                    {/* Joined Date */}
                    <td>
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--slate-600)' }}>
                        {user.createdDate || '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        title={`Click to mark as ${user.status === 'Active' ? 'Inactive' : 'Active'}`}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      >
                        <span className={`badge ${user.status === 'Active' ? 'badge-healthy' : 'badge-danger'}`}>
                          <span className="badge-dot"></span>
                          <span>{user.status}</span>
                        </span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-action-icon btn-action-edit"
                          title="Edit User Details"
                          onClick={() => handleOpenEdit(user)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.5 3.5H6A3.5 3.5 0 0 0 2.5 7v10A3.5 3.5 0 0 0 6 20.5h10a3.5 3.5 0 0 0 3.5-3.5v-6.5" />
                            <path d="M16.5 6.5L18.3 4.7C19.1 3.9 20.4 3.9 21.2 4.7C22.0 5.5 22.0 6.8 21.2 7.6L19.4 9.4" />
                            <line x1="16.5" y1="6.5" x2="9.8" y2="13.2" />
                            <line x1="19.4" y1="9.4" x2="12.7" y2="16.1" />
                            <line x1="16.5" y1="6.5" x2="19.4" y2="9.4" />
                            <line x1="9.8" y1="13.2" x2="12.7" y2="16.1" />
                            <path d="M9.8 13.2L7.8 18.1L12.7 16.1" />
                            <polygon points="7.8,18.1 8.8,15.6 10.3,17.1" fill="currentColor" stroke="none" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn-trash-outline"
                          title="Delete User"
                          onClick={() => setUserToDelete(user)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 7V4.5C9 3.67 9.67 3 10.5 3h3c.83 0 1.5.67 1.5 1.5V7" />
                            <line x1="4" y1="7" x2="20" y2="7" />
                            <path d="M6 7l1.2 11.5c.08.84.78 1.5 1.63 1.5h6.34c.85 0 1.55-.66 1.63-1.5L18 7" />
                            <line x1="10" y1="11" x2="10" y2="16" />
                            <line x1="14" y1="11" x2="14" y2="16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <UserModal
          isOpen={isModalOpen}
          user={editingUser}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="modal-backdrop show">
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: '#dc2626' }}>
                Delete User
              </div>
              <button type="button" className="modal-close" onClick={() => setUserToDelete(null)} title="Close">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ fontSize: '13.5px', color: 'var(--slate-700)', margin: 0 }}>
                Are you sure you want to remove <strong>{userToDelete.name}</strong> ({userToDelete.empId})? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setUserToDelete(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
