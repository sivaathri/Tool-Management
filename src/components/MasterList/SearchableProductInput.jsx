import React, { useState, useEffect, useRef } from 'react';

export default function SearchableProductInput({
  value = '',
  onChange,
  onSelectProduct,
  existingTools = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Extract unique product names from existing tools
  const uniqueProducts = React.useMemo(() => {
    const products = new Set();
    existingTools.forEach(t => {
      const prod = t.productName ? String(t.productName).trim() : '';
      if (prod) products.add(prod);
    });
    // Add default examples if empty
    if (products.size === 0) {
      products.add('Steering Yoke Assembly');
      products.add('Brake Caliper Assembly');
      products.add('Engine Connecting Rod Line 2');
      products.add('Chassis Mounting Flange Assembly');
      products.add('EV Traction Motor Lamination');
    }
    return Array.from(products).sort((a, b) => a.localeCompare(b));
  }, [existingTools]);

  // Filter products based on input query
  const query = String(value || '').trim().toLowerCase();
  const filtered = uniqueProducts.filter(p => !query || p.toLowerCase().includes(query));
  const isExactMatch = uniqueProducts.some(p => p.toLowerCase() === query);

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
    // Allows full manual text typing (characters, numbers, spaces, symbols)
    const val = e.target.value;
    onChange(val);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (productName) => {
    onChange(productName);
    onSelectProduct?.(productName);
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
        handleSelect(value.trim());
      } else if (filtered.length > 0) {
        handleSelect(filtered[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="combobox-container" ref={containerRef}>
      <label className="form-label" htmlFor="inpProductName">Product Name *</label>
      
      <div className="combobox-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="form-input combobox-input"
          id="inpProductName"
          placeholder="e.g. Steering Yoke Assembly / Brake Caliper"
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
          aria-label="Toggle product list"
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
        Search and select from saved Products, or type a new name
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="combobox-dropdown" style={{ display: 'flex' }}>
          <div className="combobox-header">
            <span>Saved Product Names</span>
            <span className="combobox-header-badge">{uniqueProducts.length} saved</span>
          </div>

          <div className="combobox-options">
            {filtered.length === 0 && !query && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--slate-400)' }}>
                No saved product names
              </div>
            )}

            {filtered.map((product, idx) => {
              const isSelected = String(product).toLowerCase() === query;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={product}
                  className={`combobox-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'active' : ''}`}
                  onClick={() => handleSelect(product)}
                >
                  <span className="combobox-num" style={{ fontWeight: 600 }}>{product}</span>
                  <span className="combobox-option-badge">Product</span>
                </div>
              );
            })}

            {/* Option to create new product name if not an exact match */}
            {query && !isExactMatch && (
              <div
                className={`combobox-new-option ${highlightedIndex === filtered.length ? 'active' : ''}`}
                onClick={() => handleSelect(value.trim())}
              >
                <span>Use <strong>"{value.trim()}"</strong> as New Product Name</span>
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
            <span>Search & select, or type any custom product name</span>
          </div>
        </div>
      )}
    </div>
  );
}

export { SearchableProductInput };
