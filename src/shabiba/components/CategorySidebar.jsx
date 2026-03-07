import React from 'react';

const CategorySidebar = ({ activeCategory, setActiveCategory }) => {
    const categories = [
        { id: 'all', name: 'All Products', icon: '🛒' },
        { id: 'crops', name: 'Crops', icon: '🌾' },
        { id: 'fish', name: 'Fish', icon: '🐟' },
        { id: 'poultry', name: 'Poultry', icon: '🐔' },
        { id: 'livestock', name: 'Livestock', icon: '🐄' },
    ];

    return (
        <aside className="marketplace-sidebar">
            <div className="sidebar-card">
                <h2 className="sidebar-title">Categories</h2>
                <ul className="category-list">
                    {categories.map((cat) => (
                        <li
                            key={cat.id}
                            className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            <span>{cat.icon} {cat.name}</span>
                            {activeCategory === cat.id && <span className="active-dot">●</span>}
                        </li>
                    ))}
                </ul>

                <div className="filter-section" style={{ marginTop: '30px' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Segments</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['Seasonal', 'Bulk', 'Direct Farm', 'Organic'].map(tag => (
                            <span key={tag} style={{
                                padding: '6px 12px',
                                background: 'var(--neutral-bg)',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                            }}
                                onMouseOver={(e) => e.target.style.background = 'var(--secondary)'}
                                onMouseOut={(e) => e.target.style.background = 'var(--neutral-bg)'}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default CategorySidebar;
