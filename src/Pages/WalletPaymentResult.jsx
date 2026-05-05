import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../config/network';

const RESULT_COPY = {
  success: {
    title: 'Payment Successful',
    message: 'Your wallet balance has been updated successfully.',
    accent: '#166534',
    background: '#dcfce7',
  },
  review: {
    title: 'Payment Under Review',
    message: 'SSLCommerz marked this payment for manual review.',
    accent: '#92400e',
    background: '#fef3c7',
  },
  failed: {
    title: 'Payment Failed',
    message: 'The payment could not be completed. No balance was added.',
    accent: '#991b1b',
    background: '#fee2e2',
  },
  cancelled: {
    title: 'Payment Cancelled',
    message: 'The payment was cancelled before completion.',
    accent: '#9a3412',
    background: '#ffedd5',
  },
  error: {
    title: 'Payment Verification Error',
    message: 'We could not verify the payment callback.',
    accent: '#991b1b',
    background: '#fee2e2',
  },
};

const WalletPaymentResult = () => {
  const { token, updateUserInfo } = useAuth();
  const [searchParams] = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const walletStatus = searchParams.get('wallet') || 'error';
  const tranId = searchParams.get('tran_id') || '';
  const result = RESULT_COPY[walletStatus] || RESULT_COPY.error;

  useEffect(() => {
    const refreshWallet = async () => {
      if (walletStatus !== 'success' || !token) return;

      setIsRefreshing(true);
      try {
        const res = await fetch(buildApiUrl('/api/auth/me'), {
          headers: {
            'x-auth-token': token,
          },
        });

        if (res.ok) {
          const latestUser = await res.json();
          updateUserInfo(latestUser);
        }
      } catch (_err) {
        // The success screen can still render even if the refresh request fails.
      } finally {
        setIsRefreshing(false);
      }
    };

    refreshWallet();
  }, [token, updateUserInfo, walletStatus]);

  return (
    <div
      translate="no"
      className="translate-no"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background:
          'radial-gradient(circle at top, rgba(46, 107, 71, 0.16), transparent 38%), linear-gradient(180deg, #f6fbf7 0%, #eef6ef 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 24px 60px rgba(18, 53, 36, 0.12)',
          border: '1px solid rgba(18, 53, 36, 0.08)',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            marginBottom: '20px',
            background: result.background,
          }}
        >
          {walletStatus === 'success' ? '✓' : walletStatus === 'review' ? '!' : '×'}
        </div>

        <h1 style={{ margin: 0, fontSize: '2rem', color: '#123524' }}>{result.title}</h1>
        <p style={{ margin: '12px 0 0', fontSize: '1rem', lineHeight: 1.7, color: '#4b5563' }}>
          {result.message}
        </p>

        {tranId && (
          <div
            style={{
              marginTop: '20px',
              padding: '14px 16px',
              borderRadius: '14px',
              background: '#f8fafc',
              color: '#334155',
              fontSize: '0.95rem',
            }}
          >
            Transaction ID: <strong>{tranId}</strong>
          </div>
        )}

        {isRefreshing && (
          <p style={{ marginTop: '14px', color: '#166534', fontSize: '0.92rem' }}>
            Refreshing your wallet balance...
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '28px' }}>
          <Link
            to="/dashboard/profile"
            style={{
              textDecoration: 'none',
              padding: '12px 18px',
              borderRadius: '12px',
              background: '#123524',
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            Go to Profile
          </Link>
          <Link
            to="/dashboard/payment"
            style={{
              textDecoration: 'none',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(18, 53, 36, 0.14)',
              color: '#123524',
              fontWeight: 700,
              background: '#ffffff',
            }}
          >
            Payment Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WalletPaymentResult;
