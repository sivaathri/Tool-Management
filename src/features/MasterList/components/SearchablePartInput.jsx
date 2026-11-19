import React, { useState, useEffect, useRef } from 'react';

export default function SearchablePartInput({
  value = '',
  onChange,
  onSelectPart,
  existingTools = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Extract unique numeric-only part numbers
  const uniqueParts = React.useMemo(() => {
    const parts = new Set();
    existingTools.forEach(t => {
      const part = t.applicationPartNo ? String(t.applicationPartNo).trim() : '';
      if (part) parts.add(part);
    });
    return Array.from(parts).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [existingTools]);

  // Filter parts based on input query
  const query = String(value || '').trim().toLowerCase();
  const filtered = uniqueParts.filter(p => !query || p.toLowerCase().includes(query));
  const isExactMatch = uniqueParts.some(p => p.toLowerCase() === query);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    // Keep numbers only
    const cleanVal = e.target.value.replace(/[^0-9]/g, '');
    onChange(cleanVal);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (partNo) => {
    onChange(partNo);
    onSelectPart?.(partNo);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    const totalOptions = filtered.length + (!isExactMatch && query ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1 < totalOptions ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : totalOptions - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        handleSelect(filtered[highlightedIndex]);
      } else if (!isExactMatch && query) {
        handleSelect(query);
      } else if (filtered.length > 0) {
        handleSelect(filtered[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="combobox-container" ref={containerRef}>
      <label className="form-label" htmlFor="inpAppPartNo">Application Part No. *</label>
      
      <div className="combobox-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="form-input combobox-input"
          id="inpAppPartNo"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="e.g. 001, 002"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          required
        />
        <button
          type="button"
          className="combobox-chevron-btn"
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
          tabIndex="-1"
          aria-label="Toggle part list"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
        Search and select from saved Part Numbers, or type a new number
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="combobox-dropdown" style={{ display: 'flex' }}>
          <div className="combobox-header">
            <span>Saved Part Numbers</span>
            <span className="combobox-header-badge">{uniqueParts.length} saved</span>
          </div>

          <div className="combobox-options">
            {filtered.length === 0 && !query && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--slate-400)' }}>
                No saved part numbers
              </div>
            )}

            {filtered.map((part, idx) => {
              const isSelected = String(part).toLowerCase() === query;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={part}
                  className={`combobox-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'active' : ''}`}
                  onClick={() => handleSelect(part)}
                >
                  <span className="combobox-num">{part}</span>
                  <span className="combobox-option-badge">Part No</span>
                </div>
              );
            })}

            {/* Option to create new number if not exactly matched */}
            {query && !isExactMatch && (
              <div
                className={`combobox-new-option ${highlightedIndex === filtered.length ? 'active' : ''}`}
                onClick={() => handleSelect(query)}
              >
                <span>Use <strong>"{query}"</strong> as New Part No</span>
                <span style={{ fontSize: '10px', color: 'var(--accent-600)' }}>Enter ↵</span>
              </div>
            )}
          </div>

          <div className="combobox-footer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Search & select, or type any new number</span>
          </div>
        </div>
      )}
    </div>
  );
}

export { SearchablePartInput };
