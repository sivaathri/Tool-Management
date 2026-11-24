import React, { useState, useEffect, useRef, useMemo } from 'react';

const PREFIX_OPTIONS = ['NSR', 'NRS', 'FWM', 'NIV', 'NIG'];

// Helper to parse existing value into prefix and number
function parseValue(val) {
  if (!val) return { prefix: '', number: '' };
  const trimmed = String(val).trim();

  // Match prefixes like NSR-1122, NRS_500, FWM 001, etc.
  const match = trimmed.match(/^([A-Za-z]{2,5})[-_\s]?([0-9a-zA-Z\-_/]*)$/);
  if (match) {
    const pfx = match[1].toUpperCase();
    const num = match[2];
    if (PREFIX_OPTIONS.includes(pfx)) {
      return { prefix: pfx, number: num };
    }
  }

  // Pure numbers or legacy (e.g. 001)
  const numOnly = trimmed.replace(/^(NSR|NRS|FWM|NIV|NIG)[-_\s]?/i, '');
  return { prefix: '', number: numOnly || trimmed };
}

// Helper to construct the unified Application Part No
function formatFullPart(pfx, num) {
  const cleanNum = String(num || '').trim();
  if (!cleanNum) return '';
  if (!pfx || !PREFIX_OPTIONS.includes(pfx)) {
    return cleanNum;
  }
  return `${pfx}-${cleanNum}`;
}

export default function SearchablePartInput({
  value = '',
  onChange,
  onSelectPart,
  existingTools = [],
  hasError = false,
  errorMessage = ''
}) {
  const initialParsed = useMemo(() => parseValue(value), []);
  const [selectedPrefix, setSelectedPrefix] = useState(initialParsed.prefix);
  const [partNumber, setPartNumber] = useState(initialParsed.number);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync state if value prop changes externally (e.g., editing different tool)
  useEffect(() => {
    const parsed = parseValue(value);
    setSelectedPrefix(parsed.prefix);
    setPartNumber(parsed.number);
  }, [value]);

  // Extract unique saved part numbers from existing tools
  const uniqueParts = useMemo(() => {
    const parts = new Set();
    existingTools.forEach(t => {
      const part = t.applicationPartNo ? String(t.applicationPartNo).trim() : '';
      if (part) parts.add(part);
    });
    return Array.from(parts).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [existingTools]);

  const currentFullValue = formatFullPart(selectedPrefix, partNumber);

  // Filter saved parts based on query and selected prefix
  const query = (partNumber || '').trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!selectedPrefix) return [];
    return uniqueParts.filter(p => {
      const lowerP = p.toLowerCase();
      const prefixMatch = lowerP.startsWith(selectedPrefix.toLowerCase());
      if (!prefixMatch) return false;
      if (!query) return true;
      return lowerP.includes(query);
    });
  }, [uniqueParts, selectedPrefix, query]);

  const isExactMatch = uniqueParts.some(p => p.toLowerCase() === currentFullValue.toLowerCase());

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrefixSelect = (pfx) => {
    setSelectedPrefix(pfx);
    setIsOpen(false);
    const updatedFull = formatFullPart(pfx, partNumber);
    onChange(updatedFull);
    if (pfx) {
      setTimeout(() => {
        inputRef.current?.focus();
        setIsOpen(true);
      }, 50);
    }
  };

  const handleNumberChange = (e) => {
    if (!selectedPrefix) return;
    let raw = e.target.value;

    // Detect if user pasted or typed full part with prefix like "NSR-1122" or "NRS 1122"
    const match = raw.match(/^([A-Za-z]{2,5})[-_\s]?(.*)$/);
    if (match) {
      const potentialPfx = match[1].toUpperCase();
      if (PREFIX_OPTIONS.includes(potentialPfx)) {
        setSelectedPrefix(potentialPfx);
        raw = match[2];
      }
    }

    const cleanNum = raw.replace(/[^0-9a-zA-Z\-_/]/g, '');
    setPartNumber(cleanNum);

    const updatedFull = formatFullPart(selectedPrefix, cleanNum);
    onChange(updatedFull);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (savedPart) => {
    const parsed = parseValue(savedPart);
    setSelectedPrefix(parsed.prefix);
    setPartNumber(parsed.number);

    const full = formatFullPart(parsed.prefix, parsed.number);
    onChange(full);
    onSelectPart?.(full);
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

    const totalOptions = filtered.length + (!isExactMatch && currentFullValue ? 1 : 0);

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
      } else if (!isExactMatch && currentFullValue) {
        handleSelect(currentFullValue);
      } else if (filtered.length > 0) {
        handleSelect(filtered[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="combobox-container" ref={containerRef} style={{ width: '100%' }}>
      {/* Label and live preview badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px',
        minHeight: '26px'
      }}>
        <label className="form-label" htmlFor="inpAppPartNo" style={{ margin: 0, fontWeight: 700 }}>
          Application Part No. <span style={{ color: '#ef4444' }}>*</span>
        </label>
        {currentFullValue && (
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#1d4ed8',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '1px 8px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono, monospace)'
          }}>
            Part: {currentFullValue}
          </span>
        )}
      </div>

      {/* Unified Input Wrapper with Embedded Prefix Dropdown and Number Box */}
      <div className="combobox-input-wrapper" style={{
        display: 'flex',
        alignItems: 'stretch',
        border: hasError ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
        boxShadow: hasError ? '0 0 0 1px #ef4444' : 'none',
        borderRadius: 'var(--radius-md)',
        backgroundColor: hasError ? '#fef2f2' : '#ffffff',
        position: 'relative',
        height: '38px',
        boxSizing: 'border-box'
      }}>
        {/* Integrated Prefix Dropdown Selector */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          borderRight: '1.5px solid #cbd5e1',
          borderTopLeftRadius: 'var(--radius-md)',
          borderBottomLeftRadius: 'var(--radius-md)'
        }}>
          <select
            value={selectedPrefix}
            onFocus={() => setIsOpen(false)}
            onMouseDown={() => setIsOpen(false)}
            onClick={() => setIsOpen(false)}
            onChange={(e) => handlePrefixSelect(e.target.value)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              backgroundColor: 'transparent',
              border: 'none',
              padding: '0 24px 0 10px',
              fontWeight: selectedPrefix ? 800 : 600,
              fontSize: '12.5px',
              fontFamily: selectedPrefix ? 'var(--font-mono, monospace)' : 'inherit',
              color: selectedPrefix ? '#1d4ed8' : '#64748b',
              cursor: 'pointer',
              height: '100%',
              outline: 'none',
              lineHeight: '36px'
            }}
            title="Select Prefix (NSR, NRS, FWM, NIV, NIG)"
          >
            <option value="" style={{ color: '#64748b', fontWeight: 600 }}>
              Select
            </option>
            {PREFIX_OPTIONS.map(pfx => (
              <option key={pfx} value={pfx} style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono, monospace)' }}>
                {pfx} -
              </option>
            ))}
          </select>
          {/* Small chevron arrow indicator for the prefix dropdown */}
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke={selectedPrefix ? '#1d4ed8' : '#64748b'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: 'absolute',
              right: '8px',
              pointerEvents: 'none'
            }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        {/* Number Input (Disabled until prefix is selected) */}
        <input
          ref={inputRef}
          type="text"
          className="form-input combobox-input"
          id="inpAppPartNo"
          disabled={!selectedPrefix}
          style={{
            border: 'none',
            borderRadius: 0,
            flex: 1,
            height: '100%',
            boxShadow: 'none',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600,
            paddingRight: '36px',
            backgroundColor: !selectedPrefix ? '#f8fafc' : '#ffffff',
            cursor: !selectedPrefix ? 'not-allowed' : 'text',
            color: !selectedPrefix ? '#94a3b8' : '#0f172a'
          }}
          placeholder={!selectedPrefix ? "Select prefix first..." : "e.g. 1122 or 001"}
          value={partNumber}
          onChange={handleNumberChange}
          onFocus={() => {
            if (selectedPrefix) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          required
        />

        {/* Toggle Dropdown Chevron Button */}
        <button
          type="button"
          className="combobox-chevron-btn"
          disabled={!selectedPrefix}
          onClick={() => {
            if (!selectedPrefix) return;
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
          tabIndex="-1"
          aria-label="Toggle part list"
          style={{
            top: '0',
            bottom: '0',
            right: '0',
            cursor: !selectedPrefix ? 'not-allowed' : 'pointer',
            opacity: !selectedPrefix ? 0.35 : 1
          }}
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

      {/* Helper text & Live Preview */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', marginTop: '4px' }}>
        {!selectedPrefix ? (
          <span style={{ color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>⚠</span> Please select  (NSR, NRS, FWM, NIV, NIG) first
          </span>
        ) : (
          <span style={{ color: 'var(--slate-500)' }}>
            Search saved {selectedPrefix} parts or enter number
          </span>
        )}
        {currentFullValue && (
          <span style={{ fontWeight: 700, color: '#1d4ed8', fontFamily: 'var(--font-mono, monospace)' }}>
            Part: {currentFullValue}
          </span>
        )}
      </div>

      {/* DROPDOWN MENU (Only visible when prefix is selected) */}
      {isOpen && Boolean(selectedPrefix) && (
        <div className="combobox-dropdown" style={{ display: 'flex' }}>
          <div className="combobox-header">
            <span>Saved Part Numbers</span>
            <span className="combobox-header-badge">{uniqueParts.length} saved</span>
          </div>

          <div className="combobox-options">
            {filtered.length === 0 && !currentFullValue && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--slate-400)' }}>
                No saved part numbers
              </div>
            )}

            {filtered.map((part, idx) => {
              const isSelected = String(part).toLowerCase() === currentFullValue.toLowerCase();
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

            {/* Quick Option to use new custom or typed part number if not in saved list */}
            {currentFullValue && !isExactMatch && (
              <div
                className={`combobox-new-option ${highlightedIndex === filtered.length ? 'active' : ''}`}
                onClick={() => handleSelect(currentFullValue)}
              >
                <span>Use <strong>"{currentFullValue}"</strong> as Application Part No</span>
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
            <span>Choose prefix (NSR, NRS, FWM, NIV, NIG) & enter number</span>
          </div>
        </div>
      )}
    </div>
  );
}

export { SearchablePartInput };
