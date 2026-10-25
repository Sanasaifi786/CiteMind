import React from 'react';
import { ShieldCheck, FileText, Folder, MessageSquare, Smartphone, Lock } from 'lucide-react';
import './FeaturesGrid.css';

/**
 * FeaturesGrid Component
 * ----------------------
 * Pedagogical Breakdown:
 * - 2-column card grid (2 cols x 3 rows).
 * - Horizontal card anatomy: leading semantic icon badge + content block.
 * - Explains all 6 student workflow features with clear value propositions.
 */
export default function FeaturesGrid() {
  const features = [
    {
      id: 'grounded',
      icon: ShieldCheck,
      iconColor: '#059669',
      iconBg: '#ECFDF5',
      iconBorder: '#A7F3D0',
      title: 'Grounded answers',
      description: 'Replies are built from passages found in your documents, not from general internet knowledge.'
    },
    {
      id: 'citations',
      icon: FileText,
      iconColor: '#D97706',
      iconBg: '#FEF3C7',
      iconBorder: '#FDE68A',
      title: 'Page-level citations',
      description: 'Every answer shows the document and page it came from, one tap away from the highlighted text.'
    },
    {
      id: 'folders',
      icon: Folder,
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
      iconBorder: '#BFDBFE',
      title: 'Subject folders',
      description: 'Group documents by subject and ask a question across the whole folder.'
    },
    {
      id: 'history',
      icon: MessageSquare,
      iconColor: '#0D9488',
      iconBg: '#F0FDFA',
      iconBorder: '#99F6E4',
      title: 'Chat history',
      description: 'Come back to any past question and its sources when you revise.'
    },
    {
      id: 'mobile',
      icon: Smartphone,
      iconColor: '#EA580C',
      iconBg: '#FFF7ED',
      iconBorder: '#FFEDD5',
      title: 'Study on your phone',
      description: 'Upload, ask and check sources from the mobile app, wherever you revise.'
    },
    {
      id: 'privacy',
      icon: Lock,
      iconColor: '#4F46E5',
      iconBg: '#EEF2FF',
      iconBorder: '#C7D2FE',
      title: 'Private to you',
      description: 'Your documents and chats belong to your account and are not shown to other users.'
    }
  ];

  return (
    <section id="features" className="features-section">
      <div className="citemind-container">
        
        {/* Section Header */}
        <div className="features-header">
          <span className="features-tracker">FEATURES</span>
          <h2 className="features-title">
            Everything a study companion should do.
          </h2>
        </div>

        {/* 2-Column Features Grid */}
        <div className="features-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.id} className="feature-card">
                <div 
                  className="feature-icon-wrapper"
                  style={{
                    backgroundColor: feature.iconBg,
                    borderColor: feature.iconBorder,
                    color: feature.iconColor
                  }}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </div>
                <div className="feature-card-content">
                  <h3 className="feature-card-title">{feature.title}</h3>
                  <p className="feature-card-description">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
