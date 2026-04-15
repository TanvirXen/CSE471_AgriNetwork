import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UserCircle, 
  ShoppingBag, 
  MessageSquare, 
  Bell, 
  Search, 
  Menu, 
  X, 
  LogOut, 
  Leaf,
  Map,
  Settings,
  Bot,
  Shield,
  Sprout,
  CreditCard
} from 'lucide-react';
import '../CSS/Dashboard.css';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Profile', path: '/dashboard/profile', icon: <UserCircle size={20} /> },
    { name: 'AI Advisor', path: '/dashboard/chatbot', icon: <Bot size={20} /> },
    { name: 'Smart AgroMarket', path: '/dashboard/smart-agromarket', icon: <Sprout size={20} /> },
    { name: 'Escrow', path: '/dashboard/escrow', icon: <Shield size={20} /> },
    { name: 'Payment', path: '/dashboard/payment', icon: <CreditCard size={20} /> },
    { name: 'Orders', path: '/dashboard/orders', icon: <ShoppingBag size={20} /> },
    { name: 'Messages', path: '/dashboard/messages', icon: <MessageSquare size={20} /> },
    { name: 'AgriDiscovery Map', path: '/dashboard/map', icon: <Map size={20} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
  ];

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/dashboard/map?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(""); // Clear after search
    }
  };
  return (
    <div className="dashboard-wrapper">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 95
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <Leaf size={28} /> AgriNetwork
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" style={{ width: '100%', color: '#ff85a1' }} onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(true)} style={{ display: 'none' }}>
              <Menu size={24} color="var(--primary-dark)" />
            </button>
            <div className="header-search">
              <Search size={18} color="#888" />
              <input 
                type="text" 
                placeholder="Search markets, products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>

          <div className="header-actions">
            <div className="action-icon">
              <Bell size={22} />
              <span className="notification-dot"></span>
            </div>
            
            <div className="user-profile-toggle">
              <div className="avatar-small">{userInitials}</div>
              <div style={{ textAlign: 'left', display: 'none', md: 'block' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{user?.fullName || 'Guest'}</div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>{user?.role || 'User'}</div>
              </div>
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          <Outlet />
        </section>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
