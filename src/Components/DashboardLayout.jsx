import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Settings,
  ChevronRight,
  Bot,
  Sprout,
  Shield
} from 'lucide-react';
import '../CSS/Dashboard.css';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Profile', path: '/dashboard/profile', icon: <UserCircle size={20} /> },
    { name: 'AI Advisor', path: '/dashboard/chatbot', icon: <Bot size={20} /> },
    { name: 'Smart AgroMarket', path: '/dashboard/smart-agromarket', icon: <Sprout size={20} /> },
    { name: 'Escrow', path: '/dashboard/escrow', icon: <Shield size={20} /> },
    { name: 'Orders', path: '/dashboard/orders', icon: <ShoppingBag size={20} /> },
    { name: 'Messages', path: '/dashboard/messages', icon: <MessageSquare size={20} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
  ];

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
          <button className="nav-item" style={{ width: '100%', color: '#ff85a1' }}>
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
              <input type="text" placeholder="Search markets, products..." />
            </div>
          </div>

          <div className="header-actions">
            <div className="action-icon">
              <Bell size={22} />
              <span className="notification-dot"></span>
            </div>
            
            <div className="user-profile-toggle">
              <div className="avatar-small">JD</div>
              <div className="header-user-info">
                <div className="user-name">John Doe</div>
                <div className="user-role">Vendor</div>
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
          .header-user-info {
            display: none;
          }
        }
        @media (min-width: 769px) {
          .header-user-info {
            display: block;
            text-align: left;
          }
          .user-name {
            font-size: 0.85rem;
            font-weight: 700;
          }
          .user-role {
            font-size: 0.75rem;
            color: #888;
          }
        }
      `}</style>

    </div>
  );
};

export default DashboardLayout;
