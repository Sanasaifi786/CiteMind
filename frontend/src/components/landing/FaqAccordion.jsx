import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import './FaqAccordion.css';

/**
 * FaqAccordion Component
 * ----------------------
 * Pedagogical Breakdown:
 * - Controlled React State for accordion interaction:
 *   Tracks which item index is currently expanded (or null if closed).
 * - Smooth CSS max-height & opacity transitions for fluid accordion animation.
 * - Icon rotation (`transform: rotate(45deg)`) turning a `+` into an `×` cleanly.
 */
export default function FaqAccordion() {
  // First question is open by default, exactly as shown in the design
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: 'Will CiteMind make up answers?',
      answer:
        'It is built to answer only from passages found in your documents. If your notes do not cover a question, it says so instead of guessing.'
    },
    {
      question: 'What can I upload?',
      answer:
        'You can upload PDF lecture slides, textbook chapters, past exam papers, handwritten notes scanned to PDF, and lab manuals.'
    },
    {
      question: 'Can other people see my documents?',
      answer:
        'No. Your documents and chats belong to your account and are not shown to other users. Everything is securely stored and isolated.'
    },
    {
      question: 'Is there a mobile app?',
      answer:
        'CiteMind works smoothly on your phone browser, so you can search notes and revise on the go with zero installation required.'
    }
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq-section">
      <div className="citemind-container">
        
        {/* Header */}
        <div className="faq-header">
          <span className="faq-tracker">FAQ</span>
          <h2 className="faq-title">Questions students ask first</h2>
        </div>

        {/* Accordion Stack */}
        <div className="faq-stack">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={faq.question} 
                className={`faq-item ${isOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-text">{faq.question}</span>
                  <div className={`faq-icon-box ${isOpen ? 'rotated' : ''}`}>
                    <Plus size={18} strokeWidth={2.2} />
                  </div>
                </button>

                <div className={`faq-answer-collapse ${isOpen ? 'expanded' : ''}`}>
                  <div className="faq-answer-inner">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
