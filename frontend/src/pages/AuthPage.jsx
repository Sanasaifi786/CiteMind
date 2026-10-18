import React, { useState } from 'react';
import { BookOpen, FileText, Check, ArrowLeft, Eye, EyeOff} from 'lucide-react';
import './AuthPage.css';

/**
 * AuthPage Component
 * ------------------
 * Pedagogical Breakdown:
 * 1. 50/50 Split-Screen Layout:
 *    - Left Panel: High-authority academic dark canvas showing core value proposition.
 *    - Right Panel: Focused, distraction-free authentication form.
 * 2. Segmented Controller Tab:
 *    - Smooth state toggling between 'login' and 'signup' modes.
 * 3. Form Handling:
 *    - Controlled inputs, password visibility toggle, and validation readiness.
 * 4. User Isolation (Multi-Tenancy):
 *    - Prepares user credentials to exchange for a JWT token from FastAPI.
 */
export default function AuthPage({ initialMode = 'login', onNavigateHome, onLoginSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (mode === 'signup' && !formData.name) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    // Simulated authentication - ready for backend FastAPI /api/auth integration
    setTimeout(() => {
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess({
          email: formData.email,
          name: formData.name || formData.email.split('@')[0]
        });
      }
    }, 700);
  };

  return (
    <div className="auth-split-layout">
      
      {/* ========================================================
          LEFT PANEL: Showcase & Academic Proof
          ======================================================== */}
      <div className="auth-showcase-panel">
        
        {/* Brand Lockup & Back Button */}
        <div className="showcase-top">
          <div className="showcase-brand" onClick={onNavigateHome} title="Return to Home">
            <div className="showcase-brand-icon">
              <BookOpen size={20} strokeWidth={2.2} />
            </div>
            <span className="showcase-brand-name">CiteMind</span>
          </div>

          <button 
            type="button" 
            className="btn-back-home" 
            onClick={onNavigateHome}
          >
            <ArrowLeft size={16} />
            <span>Back to home</span>
          </button>
        </div>

        {/* Center Editorial Headline & Citation Card */}
        <div className="showcase-center">
          <h1 className="showcase-headline">
            Every answer should come with its <span className="showcase-accent">page number.</span>
          </h1>

          {/* Dynamic Citation Excerpt Preview */}
          <div className="showcase-citation-card">
            <div className="citation-tag">
              <FileText size={13} className="citation-tag-icon" />
              <span>Operating Systems · p. 52</span>
            </div>
            <p className="citation-quote">
              A deadlock needs four conditions to hold together: mutual exclusion, hold and wait, no preemption, and circular wait.
            </p>
          </div>
        </div>

        {/* Bottom Security / Trust Checkmarks */}
        <div className="showcase-bottom">
          <div className="showcase-trust-item">
            <Check size={16} className="showcase-check-icon" strokeWidth={2.5} />
            <span>Your documents stay in your account</span>
          </div>
          <div className="showcase-trust-item">
            <Check size={16} className="showcase-check-icon" strokeWidth={2.5} />
            <span>Answers only from your notes</span>
          </div>
        </div>

      </div>

      {/* ========================================================
          RIGHT PANEL: Authentication Form
          ======================================================== */}
      <div className="auth-form-panel">
        <div className="auth-card-container">
          
          {/* Segmented Controller (Log in vs Sign up) */}
          <div className="auth-segmented-control">
            <button
              type="button"
              className={`segmented-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setErrorMessage(''); }}
            >
              Log in
            </button>
            <button
              type="button"
              className={`segmented-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setErrorMessage(''); }}
            >
              Sign up
            </button>
          </div>

          {/* Title & Subtitle */}
          <div className="auth-heading-group">
            <h2 className="auth-title">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'Log in to pick up your subjects, documents and past questions.'
                : 'Start asking questions and getting verified citations from your notes.'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="auth-error-banner">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actual Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            
            {/* Full Name Field (Sign up only) */}
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="e.g. Alex Morgan"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  autoComplete="name"
                />
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@college.edu"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="password" className="form-label">Password</label>
                {mode === 'login' && (
                  <a href="#forgot" className="forgot-password-link">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input password-input"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-auth-submit"
            >
              {isLoading ? (
                <span className="spinner-dots">Verifying...</span>
              ) : mode === 'login' ? (
                'Log in'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Legal / Policy Note */}
          <p className="auth-disclaimer">
            By continuing you agree to use CiteMind for your own study material.
          </p>

        </div>
      </div>

    </div>
  );
}
