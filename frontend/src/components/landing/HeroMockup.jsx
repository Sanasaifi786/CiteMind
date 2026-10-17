import React, { useState } from 'react';
import { Folder, FileText, ArrowUp, CheckCircle2 } from 'lucide-react';
import './Hero.css';

/**
 * HeroMockup Component
 * --------------------
 * Pedagogical Concept: Micro-Interactivity & Component State
 * 
 * In a real application, this data would arrive from FastAPI (`/api/query`).
 * Here, we model the exact response schema that CiteMind's backend returns:
 * - Query: string
 * - Answer: string
 * - Citations: array of { document, page, quote }
 * 
 * We give the user the ability to click between citations to switch the highlighted
 * source snippet, proving the core value proposition: verifiable answers!
 */
export default function HeroMockup() {
  const [activeCitation, setActiveCitation] = useState(0);

  const citations = [
    {
      id: 0,
      label: 'DBMS Unit 3 · p. 14',
      docName: 'DBMS UNIT 3',
      page: 14,
      highlight: 'every non-key attribute depends directly on the primary key, and on nothing else.',
      contextBefore: 'A relation is in third normal form when ',
      contextAfter: ' This removes transitive dependencies.'
    },
    {
      id: 1,
      label: 'Lecture 7 notes · p. 3',
      docName: 'LECTURE 7 NOTES',
      page: 3,
      highlight: '3NF strictly enforces: X -> Y where X is a superkey or Y is prime.',
      contextBefore: 'Summary table of normal forms: ',
      contextAfter: ' Violations cause update anomalies.'
    }
  ];

  return (
    <div className="hero-mockup-wrapper">
      {/* Golden Aura Glow Backdrop */}
      <div className="mockup-glow-aura" />

      {/* Main Mockup Card Surface */}
      <div className="hero-mockup-card">
        
        {/* Mockup Top Header */}
        <div className="mockup-header">
          <div className="mockup-folder">
            <Folder size={18} className="folder-icon" />
            <span className="folder-title">DBMS Revision</span>
          </div>
          <span className="badge-docs-ready">3 documents ready</span>
        </div>

        {/* Chat Thread Container */}
        <div className="mockup-chat-thread">
          
          {/* User Prompt Bubble */}
          <div className="mockup-user-bubble">
            <span>What is the difference between 2NF and 3NF?</span>
          </div>  

          {/* AI Response Card */}
          <div className="mockup-ai-response">
            <p className="ai-text">
              2NF removes partial dependencies on a composite key. 3NF goes one step further and removes transitive dependencies, so every non-key column depends only on the key.
            </p>

            {/* Clickable Citation Badges */}
            <div className="ai-citations-list">
              {citations.map((cite, index) => (
                <button
                  key={cite.id}
                  type="button"
                  onClick={() => setActiveCitation(index)}
                  className={`citation-pill ${activeCitation === index ? 'active' : ''}`}
                  title="Click to view verified source excerpt"
                >
                  <FileText size={13} className="citation-icon" />
                  <span>{cite.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Verified Source Excerpt */}
          <div className="mockup-source-excerpt">
            <div className="source-meta">
              <span>SOURCE · {citations[activeCitation].docName}, PAGE {citations[activeCitation].page}</span>
            </div>
            <div className="source-content">
              <span>{citations[activeCitation].contextBefore}</span>
              <mark className="source-mark">{citations[activeCitation].highlight}</mark>
              <span>{citations[activeCitation].contextAfter}</span>
            </div>
          </div>

        </div>

        {/* Mockup Input Bar */}
        <div className="mockup-input-bar">
          <input 
            type="text" 
            placeholder="Ask anything from your notes..." 
            readOnly 
            className="mockup-input"
          />
          <button type="button" className="mockup-send-btn" aria-label="Send query">
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>

      </div>
    </div>
  );
}
