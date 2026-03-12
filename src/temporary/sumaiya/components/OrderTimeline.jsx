import React from 'react';

const OrderTimeline = ({ status }) => {
  const steps = [
    { label: 'Pending', id: 'Pending' },
    { label: 'Confirmed', id: 'Confirmed' },
    { label: 'Shipped', id: 'Shipped' },
    { label: 'Delivered', id: 'Delivered' }
  ];

  // Map status to progress index
  const getStatusIndex = () => {
    switch (status) {
      case 'Pending': return 0;
      case 'Confirmed': return 1;
      case 'Shipped': return 2;
      case 'Delivered': return 3;
      case 'Cancelled': return -1;
      default: return 0;
    }
  };

  const currentIndex = getStatusIndex();

  if (status === 'Cancelled') {
    return (
      <div className="timeline-container" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
        <div style={{ textAlign: 'center', color: '#dc2626', fontWeight: 600, padding: '1rem' }}>
          This order has been cancelled.
        </div>
      </div>
    );
  }

  // Calculate progress bar width
  const progressWidth = currentIndex === 0 ? '0%' : 
                        currentIndex === 1 ? '33.33%' : 
                        currentIndex === 2 ? '66.66%' : '100%';

  return (
    <div className="timeline-container">
      <div className="timeline">
        <div className="timeline-progress" style={{ width: progressWidth }}></div>
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          
          let className = "timeline-step";
          if (isCompleted) className += " completed";
          if (isActive) className += " active";

          return (
            <div key={step.id} className={className}>
              <div className="timeline-icon-wrap">
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : isActive ? (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'currentColor' }}></div>
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e5e7eb' }}></div>
                )}
              </div>
              <span className="timeline-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;
