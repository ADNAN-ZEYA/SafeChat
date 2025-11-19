// src/App.jsx
import { useState } from 'react';
import HomePage from './HomePage';
import AuthPage from './AuthPage';
import Notification from './Notification';
import ProfilePage from './ProfilePage';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null); // This is for the pop-up
  const [currentPage, setCurrentPage] = useState('home');
  
  // --- NEW: This is the live list for the "Bell Icon" panel ---
  const [notifications, setNotifications] = useState([]);
  // -----------------------------------------------------------

  const showNotification = (message) => {
    // 1. Show the pop-up (your existing code)
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
    
    // 2. NEW: Add this message to the "Bell Icon" list
    const newNotification = {
      id: Date.now(),
      type: 'warning', // All our pop-ups are warnings
      text: message 
    };
    // Add the new notification to the top of the list
    setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
  };

  const handleLogin = (username) => {
    setCurrentUser(username);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const navigateToHome = () => setCurrentPage('home');
  const navigateToProfile = () => setCurrentPage('profile');

  // This function decides which main page to render
  const renderPage = () => {
    if (currentPage === 'home') {
      return (
        <HomePage 
          user={currentUser} 
          onLogout={handleLogout} 
          showNotification={showNotification} 
          onNavigateToProfile={navigateToProfile}
          onNavigateToHome={navigateToHome}
          notifications={notifications} // <-- 3. Pass the new list down
          setNotifications={setNotifications} // <-- 4. Pass the "setter" function down
        />
      );
    }
    if (currentPage === 'profile') {
      return (
        <ProfilePage 
          user={currentUser} 
          onLogout={handleLogout} 
          onNavigateHome={navigateToHome}
          onNavigateToProfile={navigateToProfile}
        />
      );
    }
  };

  return (
    <div>
      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}

      {currentUser
        ? renderPage()
        : <AuthPage onLogin={handleLogin} />
      }
    </div>
  );
}

export default App;