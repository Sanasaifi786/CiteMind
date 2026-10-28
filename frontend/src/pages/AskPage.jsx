import React, { useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  ArrowUp, 
  FileText, 
  ChevronDown, 
  Upload, 
  Sparkles,
  BookOpen,
  Check,
  Copy
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Sidebar from '../components/workspace/Sidebar';
import SourcePanel from '../components/workspace/SourcePanel';
import { 
  askQuestion, 
  fetchSessionDetails, 
  fetchChatHistory, 
  fetchDocumentLibrary 
} from '../services/api';
import './AskPage.css';

/**
 * AskPage Component (Screen 4: Ask Workspace)
 * -------------------------------------------
 * Features:
 * 1. 3-Column Split Interface:
 *    - Left: Persistent Sidebar with Real Recent Chats from SQLite.
 *    - Middle: Dynamic Chat Canvas with Clean Slate for New Documents.
 *    - Right: Synchronized Source Inspector with verified PDF quotes & live page stream.
 * 2. Real Document Scoping:
 *    - Automatically binds to uploaded document or allows querying across all notes.
 * 3. Verified History Recall:
 *    - If questions were asked on this document previously, real turns are restored.
 *    - If it's a new document, the canvas is 100% clean with tailored starter prompts.
 */
export default function AskPage({ 
  activeChatId: propChatId, 
  activeDoc, 
  onSelectDoc,
  onNavigateLibrary, 
  onNavigateHistory, 
  onNavigateSettings, 
  onNavigateHome, 
  user, 
  onLogout 
}) {
  const docFileName = typeof activeDoc === 'string' ? activeDoc : activeDoc?.title || null;
  const [activeChatId, setActiveChatId] = useState(propChatId || null);
  const [sessionInfo, setSessionInfo] = useState({ 
    title: docFileName || 'All Library Documents', 
    subject: activeDoc?.subject || 'General' 
  });
  const [isSourceOpen, setIsSourceOpen] = useState(true);
  const [inputQuery, setInputQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const chatBottomRef = useRef(null);

  const handleCopyResponse = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Active citation inspected in the right SourcePanel
  const [activeCitation, setActiveCitation] = useState({
    source: docFileName,
    page_number: 1,
    snippet: null,
    heading: null
  });

  const [secondaryCitations, setSecondaryCitations] = useState([]);

  // Chat Messages state - defaults to clean empty thread
  const [messages, setMessages] = useState([]);

  // 1. Fetch library documents for scope switcher
  useEffect(() => {
    async function loadDocs() {
      const data = await fetchDocumentLibrary();
      if (data && data.documents) {
        setAvailableDocs(data.documents);
      }
    }
    loadDocs();
  }, []);

  // 2. Fetch real recent chat sessions from SQLite database
  const refreshRecentChats = async () => {
    const data = await fetchChatHistory();
    if (data && data.sessions) {
      setRecentChats(data.sessions.map((s) => ({
        id: s.id,
        title: s.title,
        subject: s.subject,
        document_name: s.document_name
      })));
    } else {
      setRecentChats([]);
    }
  };

  useEffect(() => {
    refreshRecentChats();
  }, []);

  // 3. Thread & History Synchronization
  useEffect(() => {
    let isMounted = true;

    async function syncActiveThread() {
      // Case A: Specific activeChatId requested (e.g., clicked from History or Sidebar)
      if (propChatId || activeChatId) {
        const targetId = propChatId || activeChatId;
        const res = await fetchSessionDetails(targetId);
        if (isMounted && res && res.messages && res.messages.length > 0) {
          setMessages(
            res.messages.map((m) => ({
              id: m.id,
              sender: m.sender,
              text: m.text,
              hasSufficientContext: m.has_sufficient_context,
              citations: (m.citations || []).map((c) => ({
                ...c,
                label: `${(c.source || 'Doc').replace('.pdf', '')} · p. ${c.page_number}`
              }))
            }))
          );
          if (res.session) {
            setSessionInfo({
              title: res.session.title,
              subject: res.session.subject
            });
            if (res.session.document_name && onSelectDoc) {
              onSelectDoc(res.session.document_name);
            }
          }
          return;
        }
      }

      // Case B: No activeChatId specified, but an activeDoc is selected
      if (docFileName) {
        // Look up if user previously asked questions on this PDF
        const historyData = await fetchChatHistory(docFileName);
        if (isMounted && historyData && historyData.sessions && historyData.sessions.length > 0) {
          // Restore the latest session for this PDF
          const latestSession = historyData.sessions[0];
          setActiveChatId(latestSession.id);
          const detail = await fetchSessionDetails(latestSession.id);
          if (isMounted && detail && detail.messages && detail.messages.length > 0) {
            setMessages(
              detail.messages.map((m) => ({
                id: m.id,
                sender: m.sender,
                text: m.text,
                hasSufficientContext: m.has_sufficient_context,
                citations: (m.citations || []).map((c) => ({
                  ...c,
                  label: `${(c.source || 'Doc').replace('.pdf', '')} · p. ${c.page_number}`
                }))
              }))
            );
            setSessionInfo({
              title: latestSession.title,
              subject: latestSession.subject || 'Document'
            });
            return;
          }
        }

        // Fresh new PDF with no prior questions -> CLEAN EMPTY SLATE
        if (isMounted) {
          setMessages([]);
          setActiveChatId(null);
          setSessionInfo({
            title: docFileName,
            subject: activeDoc?.subject || 'Document'
          });
          setActiveCitation({
            source: docFileName,
            page_number: 1,
            snippet: null,
            heading: null
          });
        }
      } else {
        // No specific document and no specific session -> Clean slate
        if (isMounted) {
          setMessages([]);
          setSessionInfo({
            title: 'All Library Documents',
            subject: 'General'
          });
        }
      }
    }

    syncActiveThread();

    return () => {
      isMounted = false;
    };
  }, [propChatId, docFileName]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  // Handle clicking a citation badge in an AI response
  const handleCitationClick = (citation) => {
    setActiveCitation({
      source: citation.source,
      page_number: citation.page_number,
      snippet: citation.snippet,
      heading: `Page ${citation.page_number} Verified Excerpt`
    });
    setIsSourceOpen(true);
  };

  // Submit Question to FastAPI /api/ask with SQLite persistence
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const query = inputQuery.trim();
    if (!query || isSubmitting) return;

    // Append user query immediately to UI
    const userMsgId = `usr-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text: query }]);
    setInputQuery('');
    setIsSubmitting(true);

    try {
      // Connects to FastAPI endpoint POST /api/ask with activeChatId & document scope
      const ragResponse = await askQuestion(query, 5, 0.22, activeChatId, docFileName);

      if (ragResponse.session_id && ragResponse.session_id !== activeChatId) {
        setActiveChatId(ragResponse.session_id);
      }

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: ragResponse.answer,
        hasSufficientContext: ragResponse.has_sufficient_context,
        citations: (ragResponse.citations || []).map((c) => ({
          ...c,
          label: `${(c.source || 'Doc').replace('.pdf', '')} · p. ${c.page_number}`
        }))
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If citations exist, sync with the right source inspector
      if (ragResponse.citations && ragResponse.citations.length > 0) {
        const primary = ragResponse.citations[0];
        setActiveCitation({
          source: primary.source,
          page_number: primary.page_number,
          snippet: primary.snippet,
          heading: `Page ${primary.page_number} Verified Excerpt`
        });
        setSecondaryCitations(ragResponse.citations.slice(1));
        setIsSourceOpen(true);
      }

      // Refresh sidebar recent conversations
      refreshRecentChats();
    } catch (err) {
      console.error('Error querying RAG:', err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `Unable to complete query: ${err.message}. Please verify the backend server is running.`,
        hasSufficientContext: false,
        citations: []
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start a fresh, clean chat thread
  const handleStartNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setSessionInfo({
      title: docFileName || 'All Library Documents',
      subject: activeDoc?.subject || 'General'
    });
    setActiveCitation({
      source: docFileName,
      page_number: 1,
      snippet: null,
      heading: null
    });
    setSecondaryCitations([]);
  };

  return (
    <div className="ask-workspace-layout">
      
      {/* ========================================================
          COLUMN 1: Workspace Sidebar
          ======================================================== */}
      <Sidebar
        activeNav="ask"
        onSelectNav={(nav) => {
          if (nav === 'home') onNavigateHome();
          if (nav === 'library') onNavigateLibrary();
          if (nav === 'history') onNavigateHistory();
          if (nav === 'settings') onNavigateSettings();
        }}
        recentChats={recentChats}
        activeChatId={activeChatId}
        onSelectChat={(chatId) => {
          setActiveChatId(chatId);
        }}
        onNewChat={handleStartNewChat}
        user={user}
        onLogout={onLogout}
        onOpenUploadModal={onNavigateLibrary}
      />

      {/* ========================================================
          COLUMN 2: Chat Stream Canvas
          ======================================================== */}
      <main className="ask-chat-canvas">
        
        {/* Context Top Bar */}
        <header className="ask-topbar">
          <div className="scope-selector-wrapper scope-dropdown-relative">
            <span className="scope-label">Searching in</span>
            <button
              type="button"
              className="scope-pill-dropdown"
              onClick={() => setIsScopeMenuOpen(!isScopeMenuOpen)}
              title="Click to change document search scope"
            >
              <span className="scope-dot" />
              <span className="scope-text">{sessionInfo.title}</span>
              <ChevronDown size={14} className="scope-arrow" />
            </button>

            {/* Scope Selection Popover */}
            {isScopeMenuOpen && (
              <div className="scope-menu-card">
                <button
                  type="button"
                  className={`scope-menu-item ${!docFileName ? 'active' : ''}`}
                  onClick={() => {
                    if (onSelectDoc) onSelectDoc(null);
                    setIsScopeMenuOpen(false);
                    handleStartNewChat();
                  }}
                >
                  <BookOpen size={16} />
                  <span>All Indexed Documents ({availableDocs.length})</span>
                </button>
                {availableDocs.map((d) => (
                  <button
                    key={d.filename}
                    type="button"
                    className={`scope-menu-item ${docFileName === d.filename ? 'active' : ''}`}
                    onClick={() => {
                      if (onSelectDoc) onSelectDoc(d);
                      setIsScopeMenuOpen(false);
                    }}
                  >
                    <FileText size={16} />
                    <span className="truncate" style={{ flex: 1 }}>{d.filename}</span>
                    {docFileName === d.filename && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ask-topbar-actions">
            <button 
              type="button" 
              className="btn-new-chat-topbar"
              onClick={handleStartNewChat}
            >
              + New question
            </button>
            <button 
              type="button" 
              className="btn-manage-docs"
              onClick={onNavigateLibrary}
            >
              Manage documents
            </button>
          </div>
        </header>

        {/* Message Thread Container */}
        <div className="chat-thread-container">
          
          {/* Clean Slate Empty State when no questions have been asked yet */}
          {messages.length === 0 && (
            <div className="chat-empty-state">
              <div className="empty-state-badge">
                <FileText size={15} />
                <span>{docFileName || 'Academic Knowledge Base'}</span>
              </div>
              <h2 className="empty-state-title">
                {docFileName ? `Ready to study: ${docFileName}` : 'Ask anything from your study materials'}
              </h2>
              <p className="empty-state-subtitle">
                {docFileName
                  ? `${activeDoc?.pages || 'All'} pages indexed and verified. Every answer is strictly grounded with exact textbook citations.`
                  : 'CiteMind answers strictly from your notes and textbooks. Ask any concept, formula, or practice question.'}
              </p>

              <div className="empty-state-starters">
                <span className="starters-label">QUICK STARTERS</span>
                <div className="starters-grid">
                  <button
                    type="button"
                    className="starter-prompt-btn"
                    onClick={() => {
                      setInputQuery(`What are the key concepts and formulas covered in ${docFileName || 'this document'}?`);
                    }}
                  >
                    <Sparkles size={16} className="starter-icon" />
                    <span>What are the key concepts and formulas covered?</span>
                  </button>
                  <button
                    type="button"
                    className="starter-prompt-btn"
                    onClick={() => {
                      setInputQuery('Summarize the main topics step-by-step.');
                    }}
                  >
                    <BookOpen size={16} className="starter-icon" />
                    <span>Summarize the main topics step-by-step</span>
                  </button>
                  <button
                    type="button"
                    className="starter-prompt-btn"
                    onClick={() => {
                      setInputQuery('Give me 3 practice questions with detailed answers based on this text.');
                    }}
                  >
                    <FileText size={16} className="starter-icon" />
                    <span>Give me 3 practice questions with solutions</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Render Active Chat Turns */}
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}
            >
              {msg.sender === 'user' ? (
                /* User Bubble */
                <div className="user-chat-bubble">
                  <p>{msg.text}</p>
                </div>
              ) : (
                /* ChatGPT-Style AI Conversational Output */
                <div className="ai-message-wrapper">
                  {/* Top Author Row */}
                  <div className="ai-author-row">
                    <div className="ai-author-left">
                      <div className="ai-avatar-badge">
                        <Sparkles size={13} strokeWidth={2.4} />
                      </div>
                      <span className="ai-author-name">CiteMind AI</span>
                      {msg.hasSufficientContext && (
                        <span className="ai-grounded-pill">
                          <span className="grounded-pulse-dot" />
                          <span>Grounded in notes</span>
                        </span>
                      )}
                    </div>

                    <div className="ai-author-actions">
                      <button
                        type="button"
                        className="btn-copy-response"
                        onClick={() => handleCopyResponse(msg.id, msg.text)}
                        title="Copy response to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check size={13} color="#059669" />
                            <span style={{ color: '#059669' }}>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Rich Markdown Answer Canvas */}
                  <div className="ai-markdown-body">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>

                  {/* Grounded Citation Badges */}
                  {msg.hasSufficientContext && msg.citations && msg.citations.length > 0 && (
                    <div className="ai-citations-footer">
                      <div className="citations-footer-header">
                        <BookOpen size={13} />
                        <span>Sources cited from your notes:</span>
                      </div>
                      <div className="ai-citations-group">
                        {msg.citations.map((cite, index) => (
                          <button
                            key={index}
                            type="button"
                            className="msg-citation-pill"
                            onClick={() => handleCitationClick(cite)}
                            title="Click to view verified source excerpt & live page"
                          >
                            <FileText size={13} className="pill-icon" />
                            <span>{cite.label || `${cite.source} · p. ${cite.page_number}`}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Refusal Action: Upload missing doc notice */}
                  {!msg.hasSufficientContext && (
                    <div className="ai-refusal-notice">
                      <button 
                        type="button" 
                        className="btn-upload-missing-doc"
                        onClick={onNavigateLibrary}
                      >
                        <Upload size={14} />
                        <span>Upload missing document to expand study materials</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Real-time Submitting State */}
          {isSubmitting && (
            <div className="message-row ai-row">
              <div className="ai-response-card thinking-card">
                <div className="thinking-dots">
                  <span className="dot dot-1" />
                  <span className="dot dot-2" />
                  <span className="dot dot-3" />
                </div>
                <span className="thinking-label">Reading notes & verifying citations...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Floating Input Dock */}
        <div className="ask-input-dock">
          <form onSubmit={handleSendMessage} className="ask-input-form">
            <button 
              type="button" 
              className="btn-attach" 
              onClick={onNavigateLibrary}
              title="Attach document or manage syllabus"
            >
              <Paperclip size={18} />
            </button>

            <input
              type="text"
              placeholder={`Ask a question about ${docFileName || 'your documents'}...`}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="ask-text-input"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim() || isSubmitting}
              className="btn-send-query"
              aria-label="Send message"
            >
              <ArrowUp size={18} strokeWidth={2.4} />
            </button>
          </form>

          <p className="ask-dock-disclaimer">
            CiteMind answers only from your documents. Check the cited page for important facts.
          </p>
        </div>

      </main>

      {/* ========================================================
          COLUMN 3: Right Slide-out Source Panel
          ======================================================== */}
      {isSourceOpen && (
        <SourcePanel
          activeCitation={activeCitation}
          secondaryCitations={secondaryCitations}
          activeDoc={activeDoc}
          onSelectCitation={(secCite) => {
            setActiveCitation({
              source: secCite.source,
              page_number: secCite.page_number,
              snippet: secCite.snippet,
              heading: `Page ${secCite.page_number} Excerpt`
            });
          }}
          onClose={() => setIsSourceOpen(false)}
        />
      )}

    </div>
  );
}
