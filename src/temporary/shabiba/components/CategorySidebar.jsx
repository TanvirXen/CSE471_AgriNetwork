import React from 'react';

const CategorySidebar = ({ activeCategory, setActiveCategory, activeSegment, setActiveSegment }) => {
    const categories = [
        { id: 'all', name: 'All Products' },
        { id: 'crops', name: 'Crops' },
        { id: 'fish', name: 'Fish' },
        { id: 'poultry', name: 'Poultry' },
        { id: 'livestock', name: 'Livestock' },
    ];

    const segments = ['Seasonal', 'Bulk', 'Direct Farm', 'Organic'];

    return (
        <aside style={{ width: '250px', borderRight: '1px solid #eee', paddingRight: '20px' }}>
            {/* Categories */}
            <h3 style={{ marginBottom: '15px' }}>Categories</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {categories.map((cat) => (
                    <li key={cat.id} style={{ marginBottom: '10px' }}>
                        <button 
                            onClick={() => {
                                setActiveCategory(cat.id);
                                setActiveSegment('all'); // Reset segment when changing category
                            }}
                            style={{ 
                                fontWeight: activeCategory === cat.id ? 'bold' : 'normal',
                                color: activeCategory === cat.id ? '#3a5a40' : '#333',
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                padding: '8px 12px',
                                textAlign: 'left',
                                width: '100%',
                                borderRadius: '4px',
                                backgroundColor: activeCategory === cat.id ? '#f0f5f1' : 'transparent'
                            }}
                        >
                            {cat.name}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Segments */}
            <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Segments</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {segments.map((seg) => {
                    const segLower = seg.toLowerCase();
                    const isActive = activeSegment === segLower;
                    return (
                        <li key={seg} style={{ marginBottom: '10px' }}>
                            <button 
                                onClick={() => setActiveSegment(isActive ? 'all' : segLower)}
                                style={{ 
                                    fontWeight: isActive ? 'bold' : 'normal',
                                    color: isActive ? '#3a5a40' : '#555',
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer', 
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    width: '100%',
                                    borderRadius: '4px',
                                    backgroundColor: isActive ? '#f0f5f1' : 'transparent'
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
