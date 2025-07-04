import React, { useState } from 'react';

const ProfilePopupMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e) => {
    setIsOpen(!isOpen);
    
    // Add ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    button.style.setProperty('--x', x);
    button.style.setProperty('--y', y);
    
    button.classList.remove('ripple-it');
    void button.offsetWidth; // Force reflow
    button.classList.add('ripple-it');
  };

  const handleAction = (action) => {
    console.log(`${action} clicked`);
    setIsOpen(false); // Close menu after action
  };

  return (
    <div className="relative">
      <style jsx>{`
        .popup {
          display: inline-block;
          position: relative;
        }

        .profile-button {
          cursor: pointer;
          height: 40px;
          width: 40px;
          border-radius: 8px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          border: none;
          position: relative;
          overflow: hidden;
        }

        .profile-button:hover {
          background: #e5e7eb;
        }

        .profile-button.ripple-it::before {
          content: "";
          position: absolute;
          left: calc(var(--x, 0.5) * 100%);
          top: calc(var(--y, 0.5) * 100%);
          width: 20px;
          height: 20px;
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          pointer-events: none;
          animation: rippleExpand 1.2s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes rippleExpand {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.6;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: translate(-50%, -50%) scale(12);
            opacity: 0;
          }
        }

        .popup-window {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          padding: 16px;
          min-width: 200px;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
        }

        .popup-window.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .popup-window legend {
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .popup-window ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .popup-window li {
          margin-bottom: 4px;
        }

        .popup-window button {
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
          transition: background-color 0.2s ease;
        }

        .popup-window button:hover {
          background: #f3f4f6;
        }

        .popup-window button.delete {
          color: #dc2626;
        }

        .popup-window button.delete:hover {
          background: #fee2e2;
        }

        .popup-window hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 8px 0;
        }


      `}</style>

      <div className="popup">
        <button 
          className="profile-button"
          onClick={handleToggle}
          onKeyDown={(e) => e.key === 'Enter' && handleToggle(e)}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" 
              stroke="#374151" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M21 21V19C21 16.7909 19.2091 15 17 15H7C4.79086 15 3 16.7909 3 19V21" 
              stroke="#374151" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <nav className={`popup-window ${isOpen ? 'open' : ''}`}>
          <legend>Actions</legend>
          <ul>
            <li>
              <button onClick={() => handleAction('Collaborators')}>
                <svg strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="currentColor" fill="none" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle r="4" cy="7" cx="9"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Collaborators</span>
              </button>
            </li>
            <li>
              <button onClick={() => handleAction('Magic Link')}>
                <svg strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="currentColor" fill="none" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                <span>Magic Link</span>
              </button>
            </li>
            <hr />
            <li>
              <button onClick={() => handleAction('Clone')}>
                <svg strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="currentColor" fill="none" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
                  <rect ry="2" rx="2" height="13" width="13" y="9" x="9"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Clone</span>
              </button>
            </li>
            <li>
              <button onClick={() => handleAction('Edit')}>
                <svg strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="currentColor" fill="none" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>
                </svg>
                <span>Edit</span>
              </button>
            </li>
            <hr />
            <li>
              <button className="delete" onClick={() => handleAction('Delete')}>
                <svg strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="currentColor" fill="none" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
                  <line y2="18" x2="6" y1="6" x1="18"></line>
                  <line y2="18" x2="18" y1="6" x1="6"></line>
                </svg>
                <span>Delete</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default ProfilePopupMenu;