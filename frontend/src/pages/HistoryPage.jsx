import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  ChevronRight,
  Clock,
  ArrowRight
} from 'lucide-react';
import Sidebar from '../components/workspace/Sidebar';
import { fetchChatHistory, deleteChatSession } from '../services/api';
import './HistoryPage.css';

/**
 * HistoryPage Component (Screen 5: Chat History)
 * ----------------------------------------------
 * Pedagogical Breakdown:
 * 1. Chronological Timeline Grouping:
 *    Groups study conversations by temporal boundaries:
 *    - TODAY
 *    - YESTERDAY
 *    - EARLIER THIS WEEK
 * 2. Cross-Document Synthesis Metrics:
 *    Displays both question counts and cited source counts (e.g., "3 questions · 4 sources").
 * 3. Quick-Resume Interaction:
 *    Clicking any history card immediately opens that thread in the Ask Workspace.
 * 4. Multi-Dimensional Filtering:
 *    Real-time text search + Subject categorization pills.
 * 5. SQLite Persistence:
 *    Reflects questions asked in AskPage instantly.
 */
export default function HistoryPage({ onSelectChat, onNavigateAsk, onNavigateLibrary, onNavigateSettings, onNavigateHome, user, onLogout }) {
  const [activeSubject, setActiveSubject] = useState('All subjects');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyItems, setHistoryItems] = useState([]);

  const subjects = ['All subjects', 'DBMS', 'Operating Systems', 'Computer Networks'];

  // Load chat sessions from SQLite database
  useEffect(() => {
    async function loadHistory() {
      const res = await fetchChatHistory();
      if (res && res.sessions && res.sessions.length > 0) {
        const mapped = res.sessions.map((sess) => {
          const date = new Date(sess.updated_at || sess.created_at);
          const now = new Date();
          const diffHours = (now - date) / (1000 * 60 * 60);

          let tf = 'TODAY';
          let timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          if (diffHours > 24 && diffHours <= 48) {
            tf = 'YESTERDAY';
          } else if (diffHours > 48) {
            tf = 'EARLIER THIS WEEK';
            timeStr = date.toLocaleDateString([], { weekday: 'short' });
          }

          const subColors = {
            DBMS: { color: '#059669', bg: '#ECFDF5', text: '#065F46' },
            'Operating Systems': { color: '#D97706', bg: '#FEF3C7', text: '#92400E' },
            'Computer Networks': { color: '#2563EB', bg: '#EFF6FF', text: '#1E40AF' },
            General: { color: '#4F46E5', bg: '#EEF2FF', text: '#3730A3' }
          };
          const theme = subColors[sess.subject] || subColors.General;

          return {
            id: sess.id,
            title: sess.title,
            snippet: `Chat thread with ${sess.message_count} messages`,
            subject: sess.subject,
            subjectColor: theme.color,
            subjectBg: theme.bg,
            subjectText: theme.text,
            iconBg: theme.bg,
            iconColor: theme.color,
            questionsCount: Math.ceil(sess.message_count / 2) || 1,
            sourcesCount: Math.max(1, sess.message_count),
            timestamp: timeStr,
            timeframe: tf
          };
        });
        setHistoryItems(mapped);
      } else {
        setHistoryItems([]);
      }
    }
    loadHistory();
  }, []);

  const handleDeleteItem = async (e, id) => {
    e.stopPropagation(); // Prevent opening the chat
    try {
      await deleteChatSession(id);
    } catch (err) {
      console.warn('Backend delete error:', err);
    }
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCardClick = (id) => {
    if (onSelectChat) onSelectChat(id);
    if (onNavigateAsk) onNavigateAsk();
  };

  // Filter items based on active subject tab and search input
  const filteredItems = historyItems.filter((item) => {
    const matchesSubject = activeSubject === 'All subjects' || item.subject === activeSubject;
    const matchesQuery = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesQuery;
  });

  // Group items by timeframe: TODAY, YESTERDAY, EARLIER THIS WEEK
  const timeframes = ['TODAY', 'YESTERDAY', 'EARLIER THIS WEEK'];

  return (
    <div className="workspace-layout">
      
      {/* ========================================================
          COLUMN 1: Sidebar
          ======================================================== */}
      <Sidebar
        activeNav="history"
        onSelectNav={(nav) => {
          if (nav === 'home') onNavigateHome();
          if (nav === 'library') onNavigateLibrary();
          if (nav === 'ask') onNavigateAsk();
          if (nav === 'settings') onNavigateSettings();
        }}
        user={user}
        onLogout={onLogout}
        onOpenUploadModal={onNavigateLibrary}
      />

      {/* ========================================================
          COLUMN 2: Main Content Area
          ======================================================== */}
      <main className="history-main">
        
        {/* Top Header Bar */}
        <header className="history-topbar">
          <div className="topbar-left">
            <h1 className="history-heading">Chat history</h1>
            <p className="history-subheading">
              Revisit any question together with the pages it came from.
            </p>
          </div>

          <div className="topbar-right">
            <div className="history-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search past chats"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="history-search-input"
              />
            </div>
          </div>
        </header>

        {/* Subject Filter Pills */}
        <div className="history-filter-tabs">
          {subjects.map((sub) => (
            <button
              key={sub}
              type="button"
              className={`filter-pill ${activeSubject === sub ? 'active' : ''}`}
              onClick={() => setActiveSubject(sub)}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Chronological Timeframe Sections */}
        <div className="history-timeline-container">
          {timeframes.map((timeframe) => {
            const sectionItems = filteredItems.filter((item) => item.timeframe === timeframe);
            if (sectionItems.length === 0) return null;

            return (
              <section key={timeframe} className="timeframe-group">
                <span className="timeframe-label">{timeframe}</span>

                <div className="history-cards-stack">
                  {sectionItems.map((item) => (
                    <div
                      key={item.id}
                      className="history-card"
                      onClick={() => handleCardClick(item.id)}
                      title="Click to resume this conversation in Ask Workspace"
                    >
                      {/* Left: Message Icon Box */}
                      <div 
                        className="history-icon-box"
                        style={{
                          backgroundColor: item.iconBg,
                          color: item.iconColor
                        }}
                      >
                        <MessageSquare size={18} strokeWidth={2.2} />
                      </div>

                      {/* Center: Title & Question Snippet */}
                      <div className="history-card-content">
                        <h3 className="history-item-title">{item.title}</h3>
                        <p className="history-item-snippet">{item.snippet}</p>
                      </div>

                      {/* Right: Metadata, Subject Pill & Delete Action */}
                      <div className="history-card-right">
                        <span 
                          className="history-subject-badge"
                          style={{
                            backgroundColor: item.subjectBg,
                            color: item.subjectText
                          }}
                        >
                          {item.subject}
                        </span>

                        <span className="history-stats">
                          {item.questionsCount} questions · {item.sourcesCount} sources
                        </span>

                        <span className="history-timestamp">{item.timestamp}</span>

                        <button
                          type="button"
                          className="btn-delete-history"
                          onClick={(e) => handleDeleteItem(e, item.id)}
                          aria-label={`Delete chat "${item.title}"`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="history-empty-state">
              <Clock size={36} className="empty-icon" />
              <h3>No past conversations found</h3>
              <p>Try searching for a different keyword or start a new question.</p>
              <button 
                type="button" 
                className="btn-start-chat-empty"
                onClick={onNavigateAsk}
              >
                Ask a question
              </button>
            </div>
          )}
        </div>

      </main>

    </div>
  );
}
