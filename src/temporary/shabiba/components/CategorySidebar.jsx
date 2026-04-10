import React from 'react';

const CategorySidebar = ({ activeCategory, setActiveCategory, activeSegment, setActiveSegment }) => {
    const categories = [
        { id: 'all', name: 'All Products' },
        { id: 'crops', name: 'Crops' },
        { id: 'fish', name: 'Fish' },
        { id: 'fruits', name: 'Fruits' },
        { id: 'livestock', name: 'Livestock' },
    ];

    const segments = ['Seasonal', 'Bulk', 'Direct Farm', 'Organic'];

    return (
        <aside style={{ 
            width: '260px', 
            background: '#2d4a3e', 
            color: 'white', 
            padding: '1.5rem', 
            minHeight: '100vh', 
            position: 'sticky', 
            top: 0, 
            display: 'flex', 
            flexDirection: 'column',
            boxShadow: '4px 0 10px rgba(0,0,0,0.1)'
        }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: '800', marginBottom: '2.5rem', color: '#ffe5ec' }}>
                🌿 AgriMarket
            </div>

            {/* Categories */}
            <h3 style={{ marginBottom: '15px', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Categories</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {categories.map((cat) => (
                    <li key={cat.id} style={{ marginBottom: '0.5rem' }}>
                        <button 
                            onClick={() => {
                                setActiveCategory(cat.id);
                                setActiveSegment('all'); // Reset segment when changing category
                            }}
                            style={{ 
                                fontWeight: '500',
                                color: activeCategory === cat.id ? 'white' : 'rgba(255,255,255,0.7)',
                                background: activeCategory === cat.id ? '#3a5a40' : 'transparent', 
                                border: 'none', 
                                cursor: 'pointer', 
                                padding: '0.75rem 1rem',
                                textAlign: 'left',
                                width: '100%',
                                borderRadius: '10px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                if (activeCategory !== cat.id) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.color = 'white';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (activeCategory !== cat.id) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                                }
                            }}
                        >
                            {cat.name}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Segments */}
            <h3 style={{ marginTop: '2rem', marginBottom: '15px', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Segments</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {segments.map((seg) => {
                    const segLower = seg.toLowerCase();
                    const isActive = activeSegment === segLower;
                    return (
                        <li key={seg} style={{ marginBottom: '0.5rem' }}>
                            <button 
                                onClick={() => setActiveSegment(isActive ? 'all' : segLower)}
                                style={{ 
                                    fontWeight: '500',
                                    color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                                    background: isActive ? '#3a5a40' : 'transparent', 
                                    border: 'none', 
                                    cursor: 'pointer', 
                                    padding: '0.75rem 1rem',
                                    textAlign: 'left',
                                    width: '100%',
                                    borderRadius: '10px',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.color = 'white';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                                    }
                                }}
                            >
                                {seg}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
};

export default CategorySidebar;
