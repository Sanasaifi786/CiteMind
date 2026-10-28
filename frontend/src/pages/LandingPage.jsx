import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import BuiltForBar from '../components/landing/BuiltForBar';
import WhyCiteMind from '../components/landing/WhyCiteMind';
import HowItWorks from '../components/landing/HowItWorks';
import FeaturesGrid from '../components/landing/FeaturesGrid';
import Comparison from '../components/landing/Comparison';
import FaqAccordion from '../components/landing/FaqAccordion';
import CtaBanner from '../components/landing/CtaBanner';
import Footer from '../components/landing/Footer';

/**
 * LandingPage
 * -----------
 * Fully assembled Landing Page matching AllDesignPages/Landing page@1x.png:
 * 1. Navbar: Sticky header with backdrop-blur & mobile drawer.
 * 2. Hero: Value proposition with interactive citation preview mockup.
 * 3. BuiltForBar: Academic document proof ribbon.
 * 4. WhyCiteMind: 3-card problem & solution deck.
 * 5. HowItWorks: 4-step dark journey.
 * 6. FeaturesGrid: 6 capability cards.
 * 7. Comparison: Without vs With CiteMind visual breakdown.
 * 8. FaqAccordion: Expandable Q&A accordion.
 * 9. CtaBanner: Closing conversion banner.
 * 10. Footer: Scholarly brand lockup, links, and copyright.
 */
export default function LandingPage({ onOpenLogin, onOpenSignup }) {
  return (
    <div className="landing-page">
      <Navbar onOpenLogin={onOpenLogin} onOpenSignup={onOpenSignup} />
      <main>
        <Hero onOpenSignup={onOpenSignup} />
        <BuiltForBar />
        <WhyCiteMind />
        <HowItWorks />
        <FeaturesGrid />
        <Comparison />
        <FaqAccordion />
        <CtaBanner onOpenSignup={onOpenSignup} />
      </main>
      <Footer />
    </div>
  );
}
