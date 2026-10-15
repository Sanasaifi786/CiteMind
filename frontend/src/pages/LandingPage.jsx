import React from 'react';
import Navbar from '../components/landing/Navbar';

/**
 * LandingPage
 * -----------
 * Assembles all modular sections of the landing page:
 * 1. Navbar (Sticky header with auth triggers)
 * 2. Hero (Headline + Value Proposition + Interactive Mockup Preview)
 * 3. BuiltForBar (Academic material proof ribbon)
 * 4. WhyCiteMind (Pain point cards)
 * 5. HowItWorks (4-step dark journey)
 * 6. FeaturesGrid (6 capabilities)
 * 7. Comparison (Without vs With CiteMind)
 * 8. FaqAccordion (Interactive expandable Q&A)
 * 9. CtaBanner (Bottom conversion card)
 * 10. Footer
 */
export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <main>
        {/* Step-by-step sections will be mounted here as we learn & build */}
      </main>
    </div>
  );
}
