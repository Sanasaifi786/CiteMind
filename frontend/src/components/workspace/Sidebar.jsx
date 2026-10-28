import React from 'react';
import { 
  BookOpen, 
  MessageSquare, 
  Clock, 
  Sliders, 
  Plus, 
  Upload, 
  LogOut 
} from 'lucide-react';
import './Sidebar.css';

/**
 * Sidebar Component
 * -----------------
 * Pedagogical Breakdown:
 * 1. Persistent App Navigation: Stays visible across Library, Ask Workspace, History, and Settings.
 * 2. Primary Workflow Trigger: Prominent "+ Upload PDF" action at the top.
 * 3. Dynamic Subject Taxonomy: Real-time document counts per subject folder.
 * 4. User Profile Footer: Displays active session identity.
 */
export default function Sidebar({
  activeNav = 'library',
  onSelectNav,
  subjects = [],
  activeSubject = 'All',
  onSelectSubject,
  onOpenUploadModal,
  onNewSubject,
  recentChats,
  activeChatId,
  onSelectChat,
  onNewChat,
  user,
  onLogout
}) {
  return (
    <aside className="workspace-sidebar">
      
      {/* Top Brand Section */}
      <div className="sidebar-top">
        <div className="sidebar-brand" onClick={() => onSelectNav && onSelectNav('home')} title="Return to Home">
          <div className="sidebar-brand-icon">
            <BookOpen size={20} strokeWidth={2.2} />
          </div>
          <span className="sidebar-brand-name">CiteMind</span>
        </div>

        {/* Primary "+ Upload PDF" Button */}
        <button 
          type="button" 
          className="btn-sidebar-upload"
          onClick={onOpenUploadModal}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Upload PDF</span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="sidebar-nav" aria-label="Workspace Navigation">
        <button
          type="button"
          className={`sidebar-nav-item ${activeNav === 'library' ? 'active' : ''}`}
          onClick={() => onSelectNav && onSelectNav('library')}
        >
          <BookOpen size={18} className="nav-icon" />
          <span>Library</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeNav === 'ask' ? 'active' : ''}`}
          onClick={() => onSelectNav && onSelectNav('ask')}
        >
          <MessageSquare size={18} className="nav-icon" />
          <span>Ask</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeNav === 'history' ? 'active' : ''}`}
          onClick={() => onSelectNav && onSelectNav('history')}
        >
          <Clock size={18} className="nav-icon" />
          <span>History</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeNav === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectNav && onSelectNav('settings')}
        >
          <Sliders size={18} className="nav-icon" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Subjects Category Section OR Recent Chats Section */}
      {activeNav === 'ask' ? (
        <div className="sidebar-subjects-section">
          <div className="subjects-header">
            <span className="subjects-label">RECENT CHATS</span>
            {onNewChat && (
              <button
                type="button"
                className="btn-new-chat-action"
                onClick={onNewChat}
                title="Start a new chat thread"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>New</span>
              </button>
            )}
          </div>

          <div className="subjects-list">
            {recentChats && recentChats.length > 0 ? (
              recentChats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className={`recent-chat-btn ${activeChatId === chat.id ? 'active' : ''}`}
                  onClick={() => onSelectChat && onSelectChat(chat.id)}
                  title={chat.title}
                >
                  <span>{chat.title}</span>
                </button>
              ))
            ) : (
              <div style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No saved questions yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="sidebar-subjects-section">
          <div className="subjects-header">
            <span className="subjects-label">SUBJECTS</span>
          </div>

          <div className="subjects-list">
            {subjects.map((sub) => (
              <button
                key={sub.name}
                type="button"
                className={`subject-item-btn ${activeSubject === sub.name ? 'active' : ''}`}
                onClick={() => onSelectSubject && onSelectSubject(sub.name)}
              >
                <div className="subject-item-left">
                  <span 
                    className="subject-color-dot" 
                    style={{ backgroundColor: sub.color }} 
                  />
                  <span className="subject-name">{sub.name}</span>
                </div>
                <span className="subject-count">{sub.count}</span>
              </button>
            ))}
          </div>

          {/* "+ New subject" Button */}
          <button 
            type="button" 
            className="btn-new-subject"
            onClick={onNewSubject}
          >
            <Plus size={15} strokeWidth={2.2} />
            <span>New subject</span>
          </button>
        </div>
      )}

      {/* Bottom User Identity Card */}
      <div className="sidebar-user-footer">
        <div className="user-avatar-circle">
          <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'Y'}</span>
        </div>
        <div className="user-details">
          <span className="user-name">{user?.name || 'Your name'}</span>
          <span className="user-email">{user?.email || 'you@college.edu'}</span>
        </div>
        <button 
          type="button" 
          className="btn-logout"
          onClick={onLogout}
          title="Sign out / Return to Landing"
        >
          <LogOut size={16} />
        </button>
      </div>

    </aside>
  );
}
