import React from 'react';
import { ArrowRight } from 'lucide-react';
import './CtaBanner.css';

/**
 * CtaBanner Component
 * -------------------
 * Pedagogical Breakdown:
 * - High-impact closing conversion card.
 * - Deep navy container with radial ambient glow.
 * - High-contrast golden call-to-action button directing users to onboarding.
 */
export default function CtaBanner() {
  return (
    <section className="cta-banner-section">
      <div className="citemind-container">
        
        <div className="cta-banner-card">
          {/* Ambient Gold Radial Glow */}
          <div className="cta-glow-aura" />

          <div className="cta-card-content">
            <h2 className="cta-title">Open your first notebook.</h2>
            <p className="cta-subtitle">
              Upload a PDF, ask a question, and see the page your answer came from.
            </p>
            <a href="#signup" className="btn-cta-gold">
              <span>Get started</span>
              <ArrowRight size={18} className="cta-arrow" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
