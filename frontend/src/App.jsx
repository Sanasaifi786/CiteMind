import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import LibraryPage from './pages/LibraryPage';
import AskPage from './pages/AskPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

/**
 * App Root Component
 * ------------------
 * Application Page State Router:
 * - 'landing': The marketing landing page with interactive preview.
 * - 'login' | 'signup': The 50/50 split authentication page.
 * - 'library': Screen 3 - Document Library & Upload workspace.
 * - 'ask': Screen 4 - Ask Workspace (Split Chat + Source Inspector).
 * - 'history': Screen 5 - Chat History (Chronological timeline).
 * - 'settings': Screen 6 - Account Settings (Final Screen).
 */
function App() {
  const [currentPage, setCurrentPage] = useState('ask');
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [activeDoc, setActiveDoc] = useState(null);
  const [user, setUser] = useState({
    name: 'Sana Saifi',
    email: 'sana@college.edu'
  });

  const handleNavigateHome = () => {
    setCurrentPage('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLogin = () => {
    setCurrentPage('login');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenSignup = () => {
    setCurrentPage('signup');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenLibrary = () => {
    setCurrentPage('library');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenAsk = (doc = null) => {
    if (doc) {
      setActiveDoc(doc);
    }
    setSelectedChatId(null);
    setCurrentPage('ask');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenHistory = () => {
    setCurrentPage('history');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenSettings = () => {
    setCurrentPage('settings');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSelectChatFromHistory = (chatId) => {
    setSelectedChatId(chatId);
    setCurrentPage('ask');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('library');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('landing');
  };

  return (
    <div className="app-root">
      {currentPage === 'landing' && (
        <LandingPage
          onOpenLogin={handleOpenLogin}
          onOpenSignup={handleOpenSignup}
        />
      )}

      {(currentPage === 'login' || currentPage === 'signup') && (
        <AuthPage
          initialMode={currentPage === 'login' ? 'login' : 'signup'}
          onNavigateHome={handleNavigateHome}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {currentPage === 'library' && (
        <LibraryPage
          user={user}
          onNavigateAsk={handleOpenAsk}
          onNavigateHistory={handleOpenHistory}
          onNavigateSettings={handleOpenSettings}
          onNavigateHome={handleNavigateHome}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'ask' && (
        <AskPage
          user={user}
          activeChatId={selectedChatId}
          activeDoc={activeDoc}
          onSelectDoc={setActiveDoc}
          onNavigateLibrary={handleOpenLibrary}
          onNavigateHistory={handleOpenHistory}
          onNavigateSettings={handleOpenSettings}
          onNavigateHome={handleNavigateHome}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'history' && (
        <HistoryPage
          user={user}
          onSelectChat={handleSelectChatFromHistory}
          onNavigateAsk={handleOpenAsk}
          onNavigateLibrary={handleOpenLibrary}
          onNavigateSettings={handleOpenSettings}
          onNavigateHome={handleNavigateHome}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'settings' && (
        <SettingsPage
          user={user}
          onUpdateUser={setUser}
          onNavigateLibrary={handleOpenLibrary}
          onNavigateAsk={handleOpenAsk}
          onNavigateHistory={handleOpenHistory}
          onNavigateHome={handleNavigateHome}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
