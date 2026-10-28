import React from 'react';
import { BookOpen } from 'lucide-react';
import './Footer.css';

/**
 * Footer Component
 * ----------------
 * Pedagogical Breakdown:
 * - Semantic HTML5 `<footer>` element.
 * - Scholarly brand identity anchor with icon lockup.
 * - Navigational anchor links for accessibility and SEO.
 * - Responsive 3-column layout collapsing gracefully on mobile viewports.
 */
export default function Footer() {
  return (
    <footer className="citemind-footer">
      <div className="citemind-container footer-container">
        
        {/* Left Column: Brand & Tagline */}
        <div className="footer-brand-col">
          <div className="footer-brand">
            <div className="footer-icon-box">
              <BookOpen size={18} strokeWidth={2.2} />
            </div>
            <span className="footer-brand-name">CiteMind</span>
          </div>
          <p className="footer-tagline">
            Answers from your notes, with the page to prove it.
          </p>
        </div>

        {/* Center Column: Quick Navigation Links */}
        <nav className="footer-nav" aria-label="Footer Navigation">
          <a href="#why-citemind" className="footer-link">Why CiteMind</a>
          <a href="#how-it-works" className="footer-link">How it works</a>
          <a href="#features" className="footer-link">Features</a>
          <a href="#faq" className="footer-link">FAQ</a>
        </nav>

        {/* Right Column: Legal & Copyright */}
        <div className="footer-legal">
          <span>© 2026 CiteMind</span>
        </div>

      </div>
    </footer>
  );
}
