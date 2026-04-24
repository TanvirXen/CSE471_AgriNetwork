import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  Clock,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

const DashboardOverview = () => {
  const navigate = useNavigate();
  const { user: _user } = useAuth(); // reserved for future personalization

  const stats = [
    { label: 'Total Earnings', value: '৳45,200', icon: <DollarSign size={24} color="#3a5a40" />, color: '#ffe5ec' },
    { label: 'Active Orders', value: '12', icon: <Package size={24} color="#344e41" />, color: '#dad7cd' },
    { label: 'New Deals', value: '5', icon: <TrendingUp size={24} color="#588157" />, color: '#f1f3f5' },
    { label: 'Customers', value: '28', icon: <Users size={24} color="#3a5a40" />, color: '#eef6f0' },
  ];

  const recentActivity = [
    { id: 1, type: 'order', text: 'New order received for Premium Boro Rice', time: '2 mins ago', icon: <Clock size={16} /> },
    { id: 2, type: 'deal', text: 'Deal closed with Rahat Traders for 500kg Potato', time: '45 mins ago', icon: <CheckCircle2 size={16} /> },
    { id: 3, type: 'payment', text: 'Payment of ৳12,000 received', time: '2 hours ago', icon: <DollarSign size={16} /> },
  ];

  return (
    <div className="overview-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary-dark)' }}>Dashboard Overview</h2>
          <p style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Welcome back, {_user?.fullName || 'User'}! 
            {_user?.isVerified && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                <CheckCircle2 size={12} /> Verified
              </span>
            )}
            Here's what's happening with your agri-business.
          </p>
        </div>
        <button 
          onClick={() => navigate('/marketplace')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'var(--primary-main)', 
            color: 'white', 
            padding: '12px 20px', 
            borderRadius: '12px', 
            border: 'none', 
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          Go to Marketplace <ExternalLink size={18} />
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <motion.div 
            key={stat.label}
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="stat-icon" style={{ backgroundColor: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <div className="label">{stat.label}</div>
              <div className="value">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: '700' }}>Recent Activity</h3>
            <button style={{ color: 'var(--primary-main)', fontSize: '0.85rem', fontWeight: '600' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {recentActivity.map(activity => (
              <div key={activity.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '8px', background: 'var(--neutral-bg)', borderRadius: '8px', color: 'var(--primary-dark)' }}>
                  {activity.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{activity.text}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--primary-main)', padding: '1.5rem', borderRadius: '20px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Upgrade to Premium</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>Get advanced market analysis and AI crop planning tools.</p>
          </div>
          <button style={{ background: 'white', color: 'var(--primary-main)', padding: '0.75rem', borderRadius: '12px', fontWeight: '700', marginTop: '1.5rem' }}>
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
