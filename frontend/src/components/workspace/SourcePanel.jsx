import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronRight as ArrowRightIcon, FileText, ExternalLink, BookOpen } from 'lucide-react';
import { getDocumentFileUrl } from '../../services/api';
import './SourcePanel.css';

/**
 * SourcePanel Component
 * ---------------------
 * Pedagogical Breakdown:
 * 1. Side-by-side Ground Truth Verification:
 *    Allows the student to inspect the actual PDF page excerpt directly beside the chat answer.
 * 2. Dual Viewing Modes:
 *    - 'excerpt': Highlighted quote with academic page skeleton.
 *    - 'pdf': Real embedded PDF page rendered directly from the backend.
 * 3. Live Streaming & Page Jump:
 *    - Opens the physical PDF jumped directly to #page={currentPage}.
 */
export default function SourcePanel({
  activeCitation,
  secondaryCitations = [],
  onSelectCitation,
  onClose,
  activeDoc = null
}) {
  const effectiveDocName = activeCitation?.source || (typeof activeDoc === 'string' ? activeDoc : activeDoc?.title) || null;
  const [currentPage, setCurrentPage] = useState(activeCitation?.page_number || 1);
  const [viewMode, setViewMode] = useState('excerpt'); // 'excerpt' | 'pdf'
  const totalPages = activeCitation?.totalPages || activeDoc?.pages || (activeCitation?.page_number ? Math.max(activeCitation.page_number, 1) : 1);

  // When active citation updates, sync page number
  React.useEffect(() => {
    if (activeCitation?.page_number) {
      setCurrentPage(activeCitation.page_number);
    }
  }, [activeCitation]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const currentPdfUrl = effectiveDocName
    ? getDocumentFileUrl(effectiveDocName, currentPage)
    : null;

  return (
    <aside className="source-panel-container">
      
      {/* Top Header */}
      <div className="source-panel-top">
        <div className="source-title-group">
          <h2 className="source-panel-title">Source</h2>
          <div className="source-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${viewMode === 'excerpt' ? 'active' : ''}`}
              onClick={() => setViewMode('excerpt')}
            >
              Excerpt
            </button>
            <button
              type="button"
              className={`mode-btn ${viewMode === 'pdf' ? 'active' : ''}`}
              onClick={() => setViewMode('pdf')}
              disabled={!effectiveDocName}
            >
              Live PDF
            </button>
          </div>
        </div>

        <button 
          type="button" 
          className="btn-source-close" 
          onClick={onClose}
          aria-label="Close source inspector"
        >
          <X size={18} />
        </button>
      </div>

      {/* Document Meta */}
      <div className="source-doc-meta">
        <h3 className="source-doc-title" title={effectiveDocName || 'No document selected'}>
          {effectiveDocName || 'No document selected'}
        </h3>
        <p className="source-doc-sub">
          {activeCitation?.page_number ? `Cited Page ${activeCitation.page_number}` : effectiveDocName ? `Browsing Page ${currentPage}` : 'Reference passage'}
        </p>
      </div>

      {/* Page Navigation Controls */}
      <div className="source-page-nav">
        <button
          type="button"
          className="page-nav-arrow"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="page-indicator">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          className="page-nav-arrow"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Content Canvas: Excerpt Mode OR Live PDF Mode */}
      {viewMode === 'excerpt' ? (
        <div className="source-sheet-card">
          <h4 className="sheet-heading">
            {activeCitation?.heading || (activeCitation?.snippet ? `Page ${currentPage} Verified Text` : 'Ground Truth Inspector')}
          </h4>

          {/* Paragraph skeleton lines */}
          <div className="sheet-skeleton-group">
            <div className="skeleton-line full" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line long" />
          </div>

          {/* Golden Highlight Box */}
          <div className="sheet-highlight-box">
            <p className="sheet-highlight-text">
              {activeCitation?.snippet ||
                (effectiveDocName 
                  ? `Ask any question about "${effectiveDocName}". Verified quotes and textbook page excerpts with citations will be highlighted here automatically.` 
                  : 'Ask a question or click any [Doc · p. X] citation pill in an AI response to inspect the exact verified source excerpt here.')}
            </p>
          </div>

          {/* Paragraph skeleton lines */}
          <div className="sheet-skeleton-group">
            <div className="skeleton-line long" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line short" />
          </div>
        </div>
      ) : (
        /* Real Interactive PDF Canvas Stream */
        <div className="source-pdf-frame-wrapper">
          {currentPdfUrl ? (
            <iframe
              src={currentPdfUrl}
              title={`PDF Preview: ${activeCitation?.source}`}
              className="source-pdf-iframe"
            />
          ) : (
            <div className="source-pdf-placeholder">
              <BookOpen size={24} className="placeholder-icon" />
              <p>No document source loaded</p>
            </div>
          )}
        </div>
      )}

      {/* Secondary Sources Section */}
      {secondaryCitations.length > 0 && (
        <div className="source-secondary-section">
          <span className="secondary-label">ALSO USED FOR THIS ANSWER</span>
          <div className="secondary-list">
            {secondaryCitations.map((secCite, idx) => (
              <button
                key={idx}
                type="button"
                className="secondary-cite-item"
                onClick={() => onSelectCitation && onSelectCitation(secCite)}
              >
                <div className="secondary-left">
                  <FileText size={14} className="secondary-icon" />
                  <span>{secCite.source} · p. {secCite.page_number}</span>
                </div>
                <ArrowRightIcon size={14} className="secondary-arrow" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Open Full Document in New Tab */}
      <div className="source-panel-footer">
        <button 
          type="button" 
          className="btn-open-full-doc"
          onClick={() => {
            if (currentPdfUrl) {
              window.open(currentPdfUrl, '_blank', 'noopener,noreferrer');
            } else {
              alert('No document source available to open.');
            }
          }}
        >
          <span>Open full PDF</span>
          <ExternalLink size={14} />
        </button>
      </div>

    </aside>
  );
}

