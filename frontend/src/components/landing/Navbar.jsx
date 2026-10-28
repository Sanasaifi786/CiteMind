import React, { useState, useEffect } from 'react';
import { BookOpen, Menu, X } from 'lucide-react';
import './Navbar.css';

/**
 * Navbar Component
 * ----------------
 * Features:
 * - Fixed/sticky with subtle background blur on scroll.
 * - Smooth scroll anchor links to page sections.
 * - Responsive mobile drawer toggle.
 * - Auth action buttons (Log in & Get started).
 */
export default function Navbar({ onOpenLogin, onOpenSignup }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add subtle shadow and background blur when the user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="citemind-container navbar-container">
        
        {/* Brand Logo */}
        <a href="#" className="navbar-brand">
          <div className="brand-icon-box">
            <BookOpen className="brand-icon" size={20} strokeWidth={2.2} />
          </div>
          <span className="brand-name">CiteMind</span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="navbar-nav desktop-only">
          <a href="#why-citemind" className="nav-link">Why CiteMind</a>
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </nav>

        {/* Right Auth Action Buttons */}
        <div className="navbar-actions desktop-only">
          <button 
            type="button" 
            onClick={onOpenLogin} 
            className="btn-login"
          >
            Log in
          </button>
          <button 
            type="button" 
            onClick={onOpenSignup} 
            className="btn-get-started"
          >
            Get started
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="mobile-toggle-btn mobile-only" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer mobile-only">
          <a href="#why-citemind" onClick={() => setIsMobileMenuOpen(false)}>Why CiteMind</a>
          <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>How it works</a>
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
          <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a>
          <div className="mobile-drawer-actions">
            <button 
              type="button" 
              className="btn-login" 
              onClick={() => { setIsMobileMenuOpen(false); if (onOpenLogin) onOpenLogin(); }}
            >
              Log in
            </button>
            <button 
              type="button" 
              className="btn-get-started" 
              onClick={() => { setIsMobileMenuOpen(false); if (onOpenSignup) onOpenSignup(); }}
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
