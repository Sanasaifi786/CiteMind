import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import HeroMockup from './HeroMockup';
import './Hero.css';

/**
 * Hero Component
 * --------------
 * Pedagogical Breakdown:
 * - Two-column responsive layout (CSS Grid / Flexbox).
 * - Editorial headline with inline color emphasis.
 * - Call-To-Action (CTA) group with visual hierarchy.
 * - Social trust bullets using scalable vector icons.
 * - Interactive Mockup preview demonstrating the product value.
 */
export default function Hero() {
  return (
    <section className="hero-section">
      <div className="citemind-container hero-container">
        
        {/* Left Column: Value Proposition & Pitch */}
        <div className="hero-content">
          
          {/* Top Pill Tag */}
          <div className="hero-badge">
            <span className="badge-dot" />
            <span>Answers with citations, from your own notes</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-title">
            Ask your notes. <span className="hero-title-accent">Get answers</span> with the page number.
          </h1>

          {/* Description Subtitle */}
          <p className="hero-description">
            CiteMind reads the PDFs and notes you upload, answers your questions in plain language, and shows exactly which page every answer came from. No more scrolling through 200 slides to find one definition.
          </p>

          {/* Call-to-action Action Buttons */}
          <div className="hero-cta-group">
            <a href="#signup" className="btn-hero-primary">
              <span>Get started</span>
              <ArrowRight size={18} className="btn-arrow" />
            </a>
            <a href="#how-it-works" className="btn-hero-secondary">
              See how it works
            </a>
          </div>

          {/* Trust Guarantees */}
          <div className="hero-trust-list">
            <div className="trust-item">
              <Check size={16} className="trust-check-icon" strokeWidth={2.5} />
              <span>Answers only from your material</span>
            </div>
            <div className="trust-item">
              <Check size={16} className="trust-check-icon" strokeWidth={2.5} />
              <span>Every answer cites its page</span>
            </div>
            <div className="trust-item">
              <Check size={16} className="trust-check-icon" strokeWidth={2.5} />
              <span>Web and mobile</span>
            </div>
          </div>

        </div>

        {/* Right Column: Live Simulated Workspace */}
        <div className="hero-visual">
          <HeroMockup />
        </div>

      </div>
    </section>
  );
}
