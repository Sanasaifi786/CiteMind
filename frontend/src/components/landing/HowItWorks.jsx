import React from 'react';
import './HowItWorks.css';

/**
 * HowItWorks Component
 * --------------------
 * Pedagogical Breakdown:
 * - High-contrast Dark Section: Changes pacing and establishes a dramatic visual shift.
 * - Narrative Progression: "Four chapters from upload to understanding."
 * - 4-column responsive layout with bold editorial numerals (01 - 04).
 * - Maps directly to CiteMind's backend RAG ingestion & querying pipeline:
 *     1. Upload (FastAPI /api/upload)
 *     2. Ingestion (PyPDF/Miner + Chunking + ChromaDB embeddings)
 *     3. Query Retrieval (Semantic similarity search)
 *     4. Citation Verification (Source page extraction)
 */
export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Upload your material',
      description:
        'Drop in PDFs of notes, chapters or past papers. Sort them into subject folders like DBMS or Operating Systems.'
    },
    {
      number: '02',
      title: 'CiteMind reads it',
      description:
        'Each document is split into passages and prepared for search by meaning. You watch the progress live.'
    },
    {
      number: '03',
      title: 'Ask in plain language',
      description:
        'Type a question about one document, or search a whole subject folder at once.'
    },
    {
      number: '04',
      title: 'Check the source',
      description:
        'Open the cited page beside the answer, with the exact passage highlighted, and trust what you read.'
    }
  ];

  return (
    <section id="how-it-works" className="how-section">
      <div className="citemind-container">
        
        {/* Dark Section Header */}
        <div className="how-header">
          <span className="how-tracker">HOW IT WORKS</span>
          <h2 className="how-title">
            Four chapters from upload to understanding.
          </h2>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div className="how-steps-grid">
          {steps.map((step) => (
            <div key={step.number} className="how-step-card">
              <div className="how-number-wrapper">
                <span className="how-step-number">{step.number}</span>
                <div className="how-step-line" />
              </div>
              <h3 className="how-step-title">{step.title}</h3>
              <p className="how-step-description">{step.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
