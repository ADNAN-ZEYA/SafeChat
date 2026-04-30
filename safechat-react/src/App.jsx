// src/App.jsx
import { useState, useCallback, useEffect } from 'react';
import HomePage from './HomePage';
import AuthPage from './AuthPage';
import Notification from './Notification';
import ProfilePage from './ProfilePage';
import FindFriendsPage from './FindFriendsPage';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';
import NotificationsPanel from './NotificationsPanel';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [chatTargetUser, setChatTargetUser] = useState(null);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.pathname === '/admin');
  const [notifications, setNotifications] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const showNotification = useCallback((message, options = {}) => {
    const { type = 'warning', user = null } = options;
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
    const newNotification = { id: Date.now(), type, user, text: message };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const handleLogin = (username) => {
    setCurrentUser(username);
    setCurrentPage('home');
    setChatTargetUser(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setChatTargetUser(null);
    setCurrentPage('home');
  };

  const navigateToHome = (targetUser = null) => {
    setCurrentPage('home');
    setChatTargetUser(targetUser);
  };
  const navigateToProfile = () => setCurrentPage('profile');
  const navigateToFriends = () => setCurrentPage('friends');
  const navigateToAdmin = () => {
    setIsAdminRoute(true);
    window.history.pushState({}, '', '/admin');
  };

  const handleAdminLogin = () => setAdminAuthenticated(true);
  const handleAdminLogout = () => {
    setAdminAuthenticated(false);
    setIsAdminRoute(false);
    window.history.pushState({}, '', '/');
  };

  const handleChatTargetConsumed = useCallback(() => setChatTargetUser(null), []);

  useEffect(() => {
    const handlePopState = () => {
      const isAdmin = window.location.pathname === '/admin';
      setIsAdminRoute(isAdmin);
      if (!isAdmin) setAdminAuthenticated(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isAdminRoute) {
    if (!adminAuthenticated) {
      return (
        <>
          {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
          <AdminLogin
            onLoginSuccess={handleAdminLogin}
            onCancel={() => { setIsAdminRoute(false); window.history.pushState({}, '', '/'); }}
          />
        </>
      );
    }
    return (
      <>
        {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
        <AdminPanel
          user={currentUser || 'admin'}
          onNavigateToHome={() => { setIsAdminRoute(false); window.history.pushState({}, '', '/'); }}
          onLogout={handleAdminLogout}
          showNotification={showNotification}
        />
      </>
    );
  }

  const renderPage = () => {
    if (currentPage === 'home') {
      return (
        <HomePage
          user={currentUser}
          onLogout={handleLogout}
          showNotification={showNotification}
          onNavigateToProfile={navigateToProfile}
          onNavigateToHome={navigateToHome}
          onNavigateToFriends={navigateToFriends}
          onNavigateToAdmin={navigateToAdmin}
          notifications={notifications}
          setNotifications={setNotifications}
          chatTargetUser={chatTargetUser}
          onChatTargetConsumed={handleChatTargetConsumed}
          onOpenChat={() => setIsChatOpen(true)}
        />
      );
    }
    if (currentPage === 'profile') {
      return (
        <ProfilePage
          user={currentUser}
          onLogout={handleLogout}
          onNavigateToHome={() => navigateToHome()}
          onNavigateToProfile={navigateToProfile}
          onNavigateToFriends={navigateToFriends}
          onShowNotifications={() => setIsNotificationsOpen(true)}
          onShowChat={() => setIsChatOpen(true)}
          showNotification={showNotification}
        />
      );
    }
    if (currentPage === 'friends') {
      return (
        <FindFriendsPage
          user={currentUser}
          onLogout={handleLogout}
          onNavigateToHome={() => navigateToHome()}
          onNavigateToProfile={navigateToProfile}
          onNavigateToFriends={navigateToFriends}
          onStartChat={(username) => navigateToHome(username)}
          showNotification={showNotification}
        />
      );
    }
    return null;
  };

  if (!currentUser) {
    return (
      <div>
        {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
        <AuthPage onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div>
      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}

      {renderPage()}

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <Sidebar
          activePage={currentPage === 'home' ? 'Home' : currentPage === 'profile' ? 'Profile' : 'Find Friends'}
          onShowNotifications={() => setIsNotificationsOpen(true)}
          onShowChat={() => setIsChatOpen(true)}
          onNavigateToHome={() => navigateToHome()}
          onNavigateToProfile={navigateToProfile}
          onNavigateToFriends={navigateToFriends}
        />
      </div>

      {/* Notifications panel */}
      {isNotificationsOpen && (
        <NotificationsPanel
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
        />
      )}

      {/* Chat panel */}
      {isChatOpen && (
        <ChatPanel
          onClose={() => setIsChatOpen(false)}
          currentUser={currentUser}
          showNotification={showNotification}
          initialActiveUser={chatTargetUser}
          refreshToken={0}
        />
      )}
    </div>
  );
}

export default App;