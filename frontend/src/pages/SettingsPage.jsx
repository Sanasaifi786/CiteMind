import React, { useState } from 'react';
import { 
  Check, 
  Trash2, 
  AlertTriangle, 
  Lock, 
  User, 
  Sliders,
  ChevronDown
} from 'lucide-react';
import Sidebar from '../components/workspace/Sidebar';
import './SettingsPage.css';

/**
 * SettingsPage Component (Screen 6: Account Settings)
 * ----------------------------------------------------
 * Pedagogical Breakdown:
 * 1. Categorized 2-Column Card Grid:
 *    - Left Column: Identity & Security (Profile + Password).
 *    - Right Column: Inference Tuning & Governance (Answer Preferences + Danger Zone).
 * 2. User Preference State:
 *    - Controls RAG generation behavior: Answer length (Concise, Balanced, Detailed),
 *      automatic Source Panel display, and chat history persistence.
 * 3. Destructive Action Safeguards (Danger Zone):
 *    - Distinct visual warning for irreversible operations like deleting documents or account.
 */
export default function SettingsPage({
  user,
  onUpdateUser,
  onNavigateLibrary,
  onNavigateAsk,
  onNavigateHistory,
  onNavigateHome,
  onLogout
}) {
  // Profile state
  const [fullName, setFullName] = useState(user?.name || 'Sana Saifi');
  const [email, setEmail] = useState(user?.email || 'sana@college.edu');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Preferences state
  const [answerLength, setAnswerLength] = useState('Balanced');
  const [openSourcePanelAuto, setOpenSourcePanelAuto] = useState(true);
  const [saveChatHistory, setSaveChatHistory] = useState(true);
  const [prefSuccess, setPrefSuccess] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (onUpdateUser) {
      onUpdateUser({ name: fullName, email });
    }
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 2500);
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setPasswordSuccess(false), 2500);
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setPrefSuccess(true);
    setTimeout(() => setPrefSuccess(false), 2500);
  };

  const handleDeleteAllDocs = () => {
    if (window.confirm('Are you sure you want to delete all uploaded documents from your index? This cannot be undone.')) {
      alert('All document vectors have been purged from your index.');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your CiteMind account? All notes and chat history will be permanently deleted.')) {
      if (onLogout) onLogout();
    }
  };

  return (
    <div className="workspace-layout">
      
      {/* ========================================================
          COLUMN 1: Sidebar
          ======================================================== */}
      <Sidebar
        activeNav="settings"
        onSelectNav={(nav) => {
          if (nav === 'home') onNavigateHome();
          if (nav === 'library') onNavigateLibrary();
          if (nav === 'ask') onNavigateAsk();
          if (nav === 'history') onNavigateHistory();
        }}
        user={user}
        onLogout={onLogout}
        onOpenUploadModal={onNavigateLibrary}
      />

      {/* ========================================================
          COLUMN 2: Main Content Area
          ======================================================== */}
      <main className="settings-main">
        
        {/* Header */}
        <header className="settings-topbar">
          <h1 className="settings-heading">Settings</h1>
          <p className="settings-subheading">
            Manage your account and how CiteMind answers.
          </p>
        </header>

        {/* 2-Column Settings Cards Grid */}
        <div className="settings-grid">
          
          {/* ====================================================
              LEFT COLUMN: Profile & Password
              ==================================================== */}
          <div className="settings-column">
            
            {/* Card 1: Profile */}
            <div className="settings-card">
              <h2 className="settings-card-title">Profile</h2>

              <div className="profile-avatar-row">
                <div className="profile-avatar-large">
                  <span>{fullName ? fullName.charAt(0).toUpperCase() : 'Y'}</span>
                </div>
                <button 
                  type="button" 
                  className="btn-change-photo"
                  onClick={() => alert('Photo upload dialog')}
                >
                  Change photo
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="settings-form">
                <div className="settings-field">
                  <label htmlFor="fullName" className="settings-label">Full name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="settings-input"
                    required
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="settingsEmail" className="settings-label">Email</label>
                  <input
                    id="settingsEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    className="settings-input"
                    required
                  />
                </div>

                <div className="settings-btn-row">
                  <button type="submit" className="btn-settings-primary">
                    Save changes
                  </button>
                  {profileSuccess && (
                    <span className="success-toast">
                      <Check size={14} /> Profile updated!
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Card 2: Password */}
            <div className="settings-card">
              <h2 className="settings-card-title">Password</h2>

              <form onSubmit={handleUpdatePassword} className="settings-form">
                <div className="settings-field">
                  <label htmlFor="currentPassword" className="settings-label">Current password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="settings-input"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="newPassword" className="settings-label">New password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="settings-input"
                  />
                </div>

                <div className="settings-btn-row">
                  <button type="submit" className="btn-settings-secondary">
                    Update password
                  </button>
                  {passwordSuccess && (
                    <span className="success-toast">
                      <Check size={14} /> Password changed!
                    </span>
                  )}
                </div>
              </form>
            </div>

          </div>

          {/* ====================================================
              RIGHT COLUMN: Answer Preferences & Danger Zone
              ==================================================== */}
          <div className="settings-column">
            
            {/* Card 3: Answer Preferences */}
            <div className="settings-card">
              <h2 className="settings-card-title">Answer preferences</h2>

              <form onSubmit={handleSavePreferences} className="settings-form">
                
                {/* Dropdown: Answer Length */}
                <div className="settings-field">
                  <label htmlFor="answerLength" className="settings-label">Answer length</label>
                  <div className="settings-select-wrapper">
                    <select
                      id="answerLength"
                      value={answerLength}
                      onChange={(e) => setAnswerLength(e.target.value)}
                      className="settings-select"
                    >
                      <option value="Concise">Concise (Fast definitions)</option>
                      <option value="Balanced">Balanced (Standard explanations)</option>
                      <option value="Detailed">Detailed (In-depth exam prep)</option>
                    </select>
                    <ChevronDown size={16} className="select-dropdown-arrow" />
                  </div>
                </div>

                {/* Checkbox 1: Open Source Panel Automatically */}
                <label className="settings-checkbox-row">
                  <div className="checkbox-custom-box">
                    <input
                      type="checkbox"
                      checked={openSourcePanelAuto}
                      onChange={(e) => setOpenSourcePanelAuto(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`checkbox-indicator ${openSourcePanelAuto ? 'checked' : ''}`}>
                      {openSourcePanelAuto && <Check size={13} strokeWidth={3} />}
                    </div>
                  </div>
                  <div className="checkbox-text-group">
                    <span className="checkbox-title">Open the source panel automatically</span>
                    <span className="checkbox-desc">Show the cited page beside each answer.</span>
                  </div>
                </label>

                {/* Checkbox 2: Save Chat History */}
                <label className="settings-checkbox-row">
                  <div className="checkbox-custom-box">
                    <input
                      type="checkbox"
                      checked={saveChatHistory}
                      onChange={(e) => setSaveChatHistory(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`checkbox-indicator ${saveChatHistory ? 'checked' : ''}`}>
                      {saveChatHistory && <Check size={13} strokeWidth={3} />}
                    </div>
                  </div>
                  <div className="checkbox-text-group">
                    <span className="checkbox-title">Save my chat history</span>
                    <span className="checkbox-desc">Keep past questions so you can revisit them.</span>
                  </div>
                </label>

                <div className="settings-btn-row">
                  <button type="submit" className="btn-settings-primary">
                    Save preferences
                  </button>
                  {prefSuccess && (
                    <span className="success-toast">
                      <Check size={14} /> Preferences saved!
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Card 4: Danger Zone */}
            <div className="settings-card danger-card">
              <h2 className="settings-card-title danger-title">Danger zone</h2>
              <p className="danger-desc">
                These actions remove your data and cannot be undone.
              </p>

              <div className="danger-actions-row">
                <button
                  type="button"
                  className="btn-danger-outline"
                  onClick={handleDeleteAllDocs}
                >
                  Delete all documents
                </button>

                <button
                  type="button"
                  className="btn-danger-solid"
                  onClick={handleDeleteAccount}
                >
                  Delete account
                </button>
              </div>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
