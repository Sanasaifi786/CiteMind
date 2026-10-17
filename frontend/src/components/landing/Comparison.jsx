import React from 'react';
import { X, Check } from 'lucide-react';
import './Comparison.css';

/**
 * Comparison Component
 * --------------------
 * Pedagogical Breakdown:
 * - Psychological contrast framing: Pain vs. Relief.
 * - Symmetrical 2-column comparison card layout.
 * - Semantic color coding: Terracotta/Red (Friction) vs. Sage/Teal (Clarity).
 */
export default function Comparison() {
  const withoutPoints = [
    'Scroll through 200 pages hunting for one definition',
    'Re-read a whole chapter to check a single fact',
    'Trust a chatbot that may be making the answer up',
    'Lose track of which note said what'
  ];

  const withPoints = [
    'Ask the question and get the exact passage back',
    'Jump straight to the cited page to confirm it',
    'Get answers only from your own syllabus',
    'Keep every subject tidy in its own folder'
  ];

  return (
    <section className="comparison-section">
      <div className="citemind-container">
        
        {/* Header */}
        <div className="comparison-header">
          <span className="comparison-tracker">HOW IT EASES YOUR LEARNING</span>
          <h2 className="comparison-title">
            Spend your time understanding, not searching.
          </h2>
        </div>

        {/* Side-by-Side Comparison Container */}
        <div className="comparison-grid">
          
          {/* Card: Without CiteMind */}
          <div className="comparison-card without-card">
            <h3 className="comparison-card-tag without-tag">WITHOUT CITEMIND</h3>
            <ul className="comparison-list">
              {withoutPoints.map((point) => (
                <li key={point} className="comparison-item">
                  <div className="point-icon-box without-icon">
                    <X size={14} strokeWidth={2.8} />
                  </div>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card: With CiteMind */}
          <div className="comparison-card with-card">
            <h3 className="comparison-card-tag with-tag">WITH CITEMIND</h3>
            <ul className="comparison-list">
              {withPoints.map((point) => (
                <li key={point} className="comparison-item">
                  <div className="point-icon-box with-icon">
                    <Check size={14} strokeWidth={2.8} />
                  </div>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
}
