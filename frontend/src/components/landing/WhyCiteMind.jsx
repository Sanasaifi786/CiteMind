import React from 'react';
import { Search, ShieldAlert, Clock } from 'lucide-react';
import './WhyCiteMind.css';

/**
 * WhyCiteMind Component
 * ----------------------
 * Pedagogical Breakdown:
 * - Direct pain-point vs. solution mapping.
 * - 3-column CSS Grid layout with card hover elevations.
 * - Accessible SVG icons housed inside warm tinted badge containers.
 */
export default function WhyCiteMind() {
  const painPoints = [
    {
      id: 'search',
      icon: Search,
      title: 'Finding things takes too long',
      description:
        'Is it in unit 3, slide 41, or the other PDF? CiteMind finds the right passage for you by meaning, not just by matching keywords.'
    },
    {
      id: 'hallucination',
      icon: ShieldAlert,
      title: 'Chatbots can be confidently wrong',
      description:
        'General AI tools answer from the internet and sometimes invent details. CiteMind answers only from what you uploaded, and tells you when your notes do not cover a question.'
    },
    {
      id: 'time',
      icon: Clock,
      title: 'Revision time is short',
      description:
        'Ask the way you would ask a friend, get a clear explanation, and open the cited page in one tap to confirm it before the exam.'
    }
  ];

  return (
    <section id="why-citemind" className="why-section">
      <div className="citemind-container">
        
        {/* Section Header */}
        <div className="why-header">
          <span className="section-tracker">WHY CITEMIND</span>
          <h2 className="why-title">
            Studying from your own material should not feel like a search party.
          </h2>
          <p className="why-subtitle">
            Students already have the right answers, buried somewhere in notes and PDFs. CiteMind brings them to the surface and shows you the proof.
          </p>
        </div>

        {/* 3-Card Deck Grid */}
        <div className="why-cards-grid">
          {painPoints.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="why-card">
                <div className="why-card-icon-wrapper">
                  <Icon size={20} className="why-card-icon" />
                </div>
                <h3 className="why-card-title">{item.title}</h3>
                <p className="why-card-description">{item.description}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
