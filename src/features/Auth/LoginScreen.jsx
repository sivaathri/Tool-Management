import React, { useState } from 'react';

export default function LoginScreen({ onLogin, users = [], showToast }) {
  const [identifier, setIdentifier] = useState('admin@inel.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    setErrorMsg('');

    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user from users list
      const matched = users.find(u => 
        (u.email && u.email.toLowerCase() === cleanId) ||
        (u.empId && u.empId.toLowerCase() === cleanId) ||
        (u.name && u.name.toLowerCase() === cleanId) ||
        cleanId === 'admin'
      );

      if (matched) {
        setIsLoading(false);
        onLogin(matched, true);
        showToast?.(`Welcome back, ${matched.name}!`, 'success');
      } else {
        // Fallback for demo login
        if (cleanId === 'admin' || cleanId.includes('@') || cleanId.startsWith('emp')) {
          const defaultUser = {
            id: 'USR-001',
            name: 'Admin User',
            empId: 'EMP-001',
            email: identifier.trim(),
            role: 'Administrator',
            department: 'Plant Operations',
            avatar: 'AD'
          };
          setIsLoading(false);
          onLogin(defaultUser, true);
          showToast?.(`Welcome back, ${defaultUser.name}!`, 'success');
        } else {
          setIsLoading(false);
          setErrorMsg('Invalid email or password. Please try again.');
        }
      }
    }, 300);
  };

  return (
    <div className="inel-login-viewport" style={{ backgroundImage: "url('/login-bg.png')" }}>
      {/* Top Left Branding */}
      <div className="inel-login-brand">
        <div className="inel-brand-symbol">
          <img src="/inel-logo.png" alt="INEL Logo" className="inel-brand-img" />
        </div>
        <span className="inel-brand-name">Tool Management</span>
      </div>

      {/* Main Login Card Positioned on the Right Side */}
      <div className="inel-login-right-pane">
        <div className="inel-login-intro">
          <h1 className="inel-welcome-title">Welcome Back</h1>
          <p className="inel-welcome-subtitle">Enter your credentials to manage your requests</p>
        </div>

        <div className="inel-login-white-card">
          <form onSubmit={handleSubmit} className="inel-card-form">
            {errorMsg && (
              <div className="inel-login-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Address */}
            <div className="inel-form-field">
              <label className="inel-field-label" htmlFor="loginEmail">
                EMAIL ADDRESS
              </label>
              <div className="inel-field-input-box">
                <svg className="inel-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                  <polyline points="3 7 12 13 21 7"></polyline>
                </svg>
                <input
                  type="text"
                  id="loginEmail"
                  className="inel-field-input"
                  placeholder="name@company.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="inel-form-field">
              <label className="inel-field-label" htmlFor="loginPassword">
                PASSWORD
              </label>
              <div className="inel-field-input-box">
                <svg className="inel-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="11" width="16" height="10" rx="2"></rect>
                  <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="loginPassword"
                  className="inel-field-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="inel-eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="inel-btn-signin"
              disabled={isLoading}
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>
        </div>
      </div>

    
    </div>
  );
}
