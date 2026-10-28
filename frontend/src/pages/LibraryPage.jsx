import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Search, 
  FileText, 
  Check, 
  Loader2, 
  AlertCircle, 
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import Sidebar from '../components/workspace/Sidebar';
import { uploadDocument, fetchDocumentLibrary, deleteDocument } from '../services/api';
import './LibraryPage.css';

/**
 * LibraryPage Component (Screen 3)
 * --------------------------------
 * Pedagogical Breakdown:
 * 1. Application Shell Architecture:
 *    - Persistent Sidebar with document taxonomy.
 *    - Main scrollable content canvas.
 * 2. Asynchronous RAG Ingestion Pipeline:
 *    - Visualizes the 4 internal phases of document processing:
 *      Extract (text mining) -> Chunk (recursive splitting) -> Embed (vector generation) -> Ready (searchable).
 * 3. Reactive State Management:
 *    - Real-time search filter and subject category filtering.
 *    - Drag-and-drop file upload handler connected to FastAPI POST /api/upload.
 */
export default function LibraryPage({ onNavigateAsk, onNavigateHistory, onNavigateSettings, onNavigateHome, user, onLogout }) {
  // Available Subjects
  const [subjects, setSubjects] = useState([
    { name: 'DBMS', color: '#059669', count: 3 },
    { name: 'Operating Systems', color: '#D97706', count: 1 },
    { name: 'Computer Networks', color: '#2563EB', count: 1 }
  ]);

  const [activeSubject, setActiveSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUploadSubject, setSelectedUploadSubject] = useState('DBMS');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Live In-Progress Processing Pipeline State
  const [processingDoc, setProcessingDoc] = useState({
    name: 'Ready for upload',
    subject: 'All Subjects',
    progress: 100,
    currentStep: 'ready', // 'extract', 'chunk', 'embed', 'ready'
    message: 'System ready. Drop a PDF to begin indexing.'
  });

  // Document Records
  const [documents, setDocuments] = useState([]);

  // Fetch real indexed documents from backend on mount
  useEffect(() => {
    async function loadDocuments() {
      const data = await fetchDocumentLibrary();
      if (data && data.documents && data.documents.length > 0) {
        const mapped = data.documents.map((doc, idx) => {
          const lower = doc.filename.toLowerCase();
          let sub = 'DBMS';
          if (lower.includes('network') || lower.includes('cn')) sub = 'Computer Networks';
          else if (lower.includes('os') || lower.includes('operating')) sub = 'Operating Systems';

          return {
            id: `doc-${idx + 1}`,
            title: doc.filename,
            pages: doc.total_pages,
            chunks: doc.total_chunks,
            fileSize: doc.file_size_kb,
            subject: sub,
            status: 'ready',
            statusLabel: 'Ready'
          };
        });
        setDocuments(mapped);

        // Update subject counts
        setSubjects((prev) =>
          prev.map((s) => ({
            ...s,
            count: mapped.filter((d) => d.subject === s.name).length
          }))
        );
      } else {
        setDocuments([]);
      }
    }
    loadDocuments();
  }, []);

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Live Async Ingestion Pipeline Handler
  const handleFileUpload = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only .pdf files are supported for academic vector indexing.');
      return;
    }

    const tempDocId = `upl-${Date.now()}`;
    const newDoc = {
      id: tempDocId,
      title: file.name,
      pages: 0,
      subject: selectedUploadSubject,
      status: 'processing',
      statusLabel: 'Extracting text',
      stage: 'extract'
    };

    setDocuments((prev) => [newDoc, ...prev]);

    // Step 1: Extract (0% -> 25%)
    setProcessingDoc({
      name: file.name,
      subject: selectedUploadSubject,
      progress: 25,
      currentStep: 'extract',
      message: 'Extracting text and page coordinates with PyMuPDF...'
    });

    // Step 2 timer: Chunking (50%)
    const timerChunk = setTimeout(() => {
      setProcessingDoc((prev) => ({
        ...prev,
        progress: 50,
        currentStep: 'chunk',
        message: 'Segmenting pages into overlapping semantic chunks (size 300, overlap 60)...'
      }));
    }, 400);

    // Step 3 timer: Embedding (75%)
    const timerEmbed = setTimeout(() => {
      setProcessingDoc((prev) => ({
        ...prev,
        progress: 75,
        currentStep: 'embed',
        message: 'Generating 384-dimensional dense vectors with sentence-transformers...'
      }));
    }, 900);

    try {
      // Connect to FastAPI POST /api/upload
      const response = await uploadDocument(file);
      clearTimeout(timerChunk);
      clearTimeout(timerEmbed);

      // Step 4: Ready (100%)
      setProcessingDoc({
        name: file.name,
        subject: selectedUploadSubject,
        progress: 100,
        currentStep: 'ready',
        message: `Indexed ${response.chunks_indexed} chunks across ${response.pages_extracted} pages in ${response.upload_time_ms}ms!`
      });

      // Update document item to ready status with verified metrics
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === tempDocId
            ? {
                ...d,
                status: 'ready',
                statusLabel: 'Ready',
                pages: response.pages_extracted,
                chunks: response.chunks_indexed
              }
            : d
        )
      );

      // Update subject count
      setSubjects((prev) =>
        prev.map((s) =>
          s.name === selectedUploadSubject ? { ...s, count: s.count + 1 } : s
        )
      );
    } catch (err) {
      clearTimeout(timerChunk);
      clearTimeout(timerEmbed);

      console.error('Upload failed:', err);
      setProcessingDoc({
        name: file.name,
        subject: selectedUploadSubject,
        progress: 100,
        currentStep: 'ready',
        message: `Upload failed: ${err.message}`
      });

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === tempDocId
            ? {
                ...d,
                status: 'error',
                statusLabel: 'Could not read',
                errorNote: err.message || 'Processing error'
              }
            : d
        )
      );
    }
  };

  const handleRemoveDoc = async (id, title) => {
    if (title && !window.confirm(`Are you sure you want to remove "${title}"? This will delete the file and remove its vectors from search.`)) {
      return;
    }
    try {
      if (title) {
        await deleteDocument(title);
      }
    } catch (err) {
      console.warn('Could not delete from backend:', err);
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleCreateNewSubject = () => {
    const name = prompt('Enter new subject name:');
    if (name && name.trim()) {
      const colors = ['#059669', '#D97706', '#2563EB', '#7C3AED', '#DB2777'];
      const newSub = {
        name: name.trim(),
        color: colors[subjects.length % colors.length],
        count: 0
      };
      setSubjects([...subjects, newSub]);
    }
  };

  // Filter documents by subject and search keyword
  const filteredDocuments = documents.filter((doc) => {
    const matchesSubject = activeSubject === 'All' || doc.subject === activeSubject;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="workspace-layout">
      
      {/* ========================================================
          LEFT SIDEBAR NAVIGATION
          ======================================================== */}
      <Sidebar
        activeNav="library"
        onSelectNav={(nav) => {
          if (nav === 'home') onNavigateHome();
          if (nav === 'ask') onNavigateAsk();
          if (nav === 'history') onNavigateHistory();
          if (nav === 'settings') onNavigateSettings();
        }}
        subjects={subjects}
        activeSubject={activeSubject}
        onSelectSubject={setActiveSubject}
        onOpenUploadModal={() => fileInputRef.current?.click()}
        onNewSubject={handleCreateNewSubject}
        user={user}
        onLogout={onLogout}
      />

      {/* ========================================================
          RIGHT MAIN CONTENT
          ======================================================== */}
      <main className="library-main">
        
        {/* Top Action Bar */}
        <header className="library-topbar">
          <div className="topbar-left">
            <h1 className="library-heading">Library</h1>
            <p className="library-subheading">
              {documents.length} documents in {subjects.length} subjects
            </p>
          </div>

          <div className="topbar-right">
            {/* Search Input */}
            <div className="library-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search documents"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="library-search-input"
              />
            </div>

            {/* "Ask a question" Action */}
            <button 
              type="button" 
              className="btn-ask-question"
              onClick={onNavigateAsk}
            >
              Ask a question
            </button>
          </div>
        </header>

        {/* ========================================================
            UPLOAD DROPZONE & PROCESSING LIVE STEPPER
            ======================================================== */}
        <div className="library-hero-grid">
          
          {/* Left Card: Drag-and-Drop Uploader */}
          <div 
            className={`dropzone-card ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInputChange} 
              accept=".pdf" 
              style={{ display: 'none' }} 
            />

            <div className="dropzone-icon-circle">
              <Upload size={22} className="dropzone-icon" />
            </div>

            <h3 className="dropzone-title">Drop PDFs here</h3>
            <p className="dropzone-subtitle">or browse your files. PDF files only.</p>

            <div className="dropzone-controls">
              <div className="add-to-select-wrapper">
                <span className="add-to-label">Add to</span>
                <select
                  value={selectedUploadSubject}
                  onChange={(e) => setSelectedUploadSubject(e.target.value)}
                  className="subject-select"
                >
                  {subjects.map((sub) => (
                    <option key={sub.name} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="select-arrow" />
              </div>

              <button
                type="button"
                className="btn-browse-files"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse files
              </button>
            </div>
          </div>

          {/* Right Card: Processing Now Live Pipeline */}
          <div className="processing-card">
            <div className="processing-header">
              <h3 className="processing-title">Processing now</h3>
              <span className="processing-pill-badge">2 in progress</span>
            </div>

            <span className="processing-doc-name">{processingDoc.name}</span>

            {/* 4-Step Pipeline Stepper */}
            <div className="pipeline-stepper">
              {/* Step 1: Extract */}
              <div className="pipeline-step completed">
                <div className="step-circle">
                  <Check size={14} strokeWidth={2.8} />
                </div>
                <span className="step-label">Extract</span>
              </div>
              <div className="step-track completed" />

              {/* Step 2: Chunk */}
              <div className="pipeline-step completed">
                <div className="step-circle">
                  <Check size={14} strokeWidth={2.8} />
                </div>
                <span className="step-label">Chunk</span>
              </div>
              <div className="step-track in-progress" />

              {/* Step 3: Embed */}
              <div className="pipeline-step active">
                <div className="step-circle active-pulse">
                  <span className="pulse-dot" />
                </div>
                <span className="step-label active">Embed</span>
              </div>
              <div className="step-track pending" />

              {/* Step 4: Ready */}
              <div className="pipeline-step pending">
                <div className="step-circle" />
                <span className="step-label">Ready</span>
              </div>
            </div>

            {/* Bottom Progress Metrics */}
            <div className="processing-meta">
              <span className="processing-message">{processingDoc.message}</span>
              <span className="processing-percentage">{processingDoc.progress}%</span>
            </div>

            <div className="processing-progress-bar-track">
              <div 
                className="processing-progress-bar-fill" 
                style={{ width: `${processingDoc.progress}%` }} 
              />
            </div>
          </div>

        </div>

        {/* ========================================================
            SUBJECT FILTER PILL TABS
            ======================================================== */}
        <div className="subject-filter-tabs">
          <button
            type="button"
            className={`filter-pill ${activeSubject === 'All' ? 'active' : ''}`}
            onClick={() => setActiveSubject('All')}
          >
            All
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.name}
              type="button"
              className={`filter-pill ${activeSubject === sub.name ? 'active' : ''}`}
              onClick={() => setActiveSubject(sub.name)}
            >
              {sub.name}
            </button>
          ))}
        </div>

        {/* ========================================================
            DOCUMENT CARDS GRID
            ======================================================== */}
        <div className="documents-grid">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="doc-card">
              
              <div className="doc-card-top">
                {/* Colored File Icon Box */}
                <div 
                  className={`doc-icon-box ${
                    doc.status === 'ready' 
                      ? 'icon-ready' 
                      : doc.status === 'error' 
                      ? 'icon-error' 
                      : 'icon-processing'
                  }`}
                >
                  <FileText size={18} strokeWidth={2.2} />
                </div>

                <div className="doc-info">
                  <h4 className="doc-title" title={doc.title}>{doc.title}</h4>
                  <p className="doc-meta">
                    {doc.status === 'error' ? doc.errorNote : `${doc.pages} pages · ${doc.subject}`}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="doc-card-footer">
                {/* Status Badges */}
                {doc.status === 'ready' && (
                  <span className="badge-status-ready">
                    <span className="badge-dot" />
                    <span>Ready</span>
                  </span>
                )}

                {doc.status === 'processing' && (
                  <span className="badge-status-processing">
                    <span className="badge-dot" />
                    <span>{doc.statusLabel}</span>
                  </span>
                )}

                {doc.status === 'error' && (
                  <span className="badge-status-error">
                    <span className="badge-dot" />
                    <span>Could not read</span>
                  </span>
                )}

                {/* Right Action */}
                {doc.status === 'ready' && (
                  <div className="card-ready-actions">
                    <button
                      type="button"
                      className="btn-card-delete"
                      onClick={() => handleRemoveDoc(doc.id, doc.title)}
                      title="Delete document and remove from search"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="btn-card-ask"
                      onClick={() => onNavigateAsk && onNavigateAsk(doc.title, doc)}
                    >
                      Ask
                    </button>
                  </div>
                )}

                {doc.status === 'processing' && (
                  <span className="action-please-wait">Please wait</span>
                )}

                {doc.status === 'error' && (
                  <button
                    type="button"
                    className="btn-card-remove"
                    onClick={() => handleRemoveDoc(doc.id, doc.title)}
                  >
                    Remove
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>

      </main>

    </div>
  );
}
