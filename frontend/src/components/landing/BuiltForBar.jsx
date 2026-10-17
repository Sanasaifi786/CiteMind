import React from 'react';
import './BuiltForBar.css';

/**
 * BuiltForBar Component
 * ---------------------
 * Pedagogical Goal: Social Proof & Target Audience Signaling
 * 
 * In academic SaaS products, immediately signaling what document formats
 * and study materials are supported builds instant trust.
 * 
 * Layout Mechanics:
 * - Full-width ribbon with a warm neutral background.
 * - Flex container with `justify-content: center` and responsive wrapping.
 * - Monospace/uppercase label paired with high-contrast document tags.
 */
export default function BuiltForBar() {
  const materials = [
    'Lecture notes',
    'Textbook chapters',
    'Past papers',
    'Research PDFs',
    'Lab manuals'
  ];

  return (
    <section className="built-for-section">
      <div className="citemind-container built-for-container">
        <span className="built-for-label">BUILT FOR</span>
        <div className="built-for-items">
          {materials.map((item, index) => (
            <React.Fragment key={item}>
              <span className="built-for-item">{item}</span>
              {index < materials.length - 1 && (
                <span className="built-for-separator" aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
