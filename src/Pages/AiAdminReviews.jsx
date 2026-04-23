import React, { useState, useEffect } from 'react';
import { Shield, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function AiAdminReviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Security Check
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      navigate('/'); // Bounce non-admins
    } else if (user && user.role === 'Admin') {
      fetchReportedReviews();
    }
  }, [user, navigate]);

  const fetchReportedReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/reviews/reported`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to fetch reports.');
      }
    } catch (err) {
      setError('An error occurred while fetching reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reviewId, actionType) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/reviews/${reviewId}/${actionType}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        // Remove from list
        setReports(prev => prev.filter(r => r._id !== reviewId));
      } else {
        alert('Action failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || user.role !== 'Admin') return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '12px', color: '#dc2626' }}>
          <Shield size={32} />
        </div>
        <div>
          <h1 style={{ margin: 0, color: '#1e293b' }}>Content Moderation Team</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Review restricted content reports and enforce marketplace guidelines.</p>
        </div>
      </div>

      {loading ? (
        <div>Loading reports...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : reports.length === 0 ? (
        <div style={{ backgroundColor: '#f8fafc', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1' }}>
          <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h3>All Clear!</h3>
          <p>There are currently no pending abuse reports in the queue.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {reports.map(report => (
            <div key={report._id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={18} color="#dc2626" />
                    <strong style={{ color: '#dc2626' }}>Active Report: {report.reportReason}</strong>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    <strong>Reported by:</strong> {report.reportedBy?.fullName || 'System'} <br />
                    <strong>Offending Vendor:</strong> {report.vendorId?.fullName || 'Unknown'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#94a3b8' }}>
                  ID: {report._id.substring(0, 8)}...<br/>
                  {new Date(report.updatedAt).toLocaleString()}
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #cbd5e1', marginBottom: '1.5rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#334155' }}>Original Review ({report.averageRating?.toFixed(1)} ⭐):</p>
                <p style={{ margin: 0, color: '#475569', fontStyle: 'italic' }}>"{report.reviewText || '(No text provided)'}"</p>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => handleAction(report._id, 'ignore')}
                  style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Ignore (Clear Flag)
                </button>
                <button 
                  onClick={() => handleAction(report._id, 'delete')}
                  style={{ flex: 1, padding: '0.75rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                >
                  <Trash2 size={18} /> Delete Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
