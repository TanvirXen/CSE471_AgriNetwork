import React, { useState } from 'react';
import './Marketplace.css';
import CategorySidebar from './components/CategorySidebar';
import ProductCard from './components/ProductCard';
import LiveStreamCard from './components/LiveStreamCard';
import BiddingSystem from './components/BiddingSystem';

const STREAMS_DATA = [
    {
        id: 1,
        title: "Organic Mango Farm Tour",
        host: "Rajshahi Farm",
        viewers: 1240,
        thumbnail: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?q=80&w=1000&auto=format&fit=crop",
        tags: ["Mango", "Rajshahi", "Organic"]
    },
    {
        id: 2,
        title: "Fresh Hilsha Catch - LIVE",
        host: "Padma Fisheries",
        viewers: 850,
        thumbnail: "https://images.unsplash.com/photo-1544521714-d50d0061e88f?q=80&w=1000&auto=format&fit=crop",
        tags: ["Fish", "Hilsha", "Bulk"]
    }
];

const PRODUCTS_DATA = [
    { id: 1, name: "Premium Sona Masuri", category: "crops", price: 85, quality: "A", image: "https://images.unsplash.com/photo-1586201327102-335a28352e07?auto=format&fit=crop&w=400", tag: "Seasonal" },
    { id: 2, name: "Golden Hybrid Tomato", category: "crops", price: 45, quality: "A+", image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400", tag: "New" },
    { id: 3, name: "Fresh Rohu Fish (Bulk)", category: "fish", price: 320, quality: "A", image: "https://images.unsplash.com/photo-1534073737927-85f1df9605d2?auto=format&fit=crop&w=400", tag: "Live" },
    { id: 4, name: "Country Chicken (Free Range)", category: "poultry", price: 450, quality: "A+", image: "https://images.unsplash.com/photo-1549313861-33587f3d2956?auto=format&fit=crop&w=400", tag: "Organic" },
    { id: 5, name: "Native Buffalo Milk", category: "livestock", price: 110, quality: "A", image: "https://images.unsplash.com/photo-1528750942718-3e289f812e9b?auto=format&fit=crop&w=400", tag: "Fresh" },
    { id: 6, name: "Dry Red Chili (Bulk)", category: "crops", price: 210, quality: "B", image: "https://images.unsplash.com/photo-151833153ec02-53b05423f6e5?auto=format&fit=crop&w=400", tag: "Bulk" },
];

const Marketplace = () => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [biddingProduct, setBiddingProduct] = useState(null);

    const filteredProducts = PRODUCTS_DATA.filter(p => {
        const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleJoinStream = (stream) => {
        alert(`Joining stream: ${stream.title}`);
    };

    const handleOpenBidding = (product) => {
        setBiddingProduct(product);
    };

    return (
        <div className="marketplace-container">
            <CategorySidebar
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
            />

            <main className="marketplace-content">
                <header className="marketplace-header">
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Search for crops, fish, poultry or livestock..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </header>

                <section>
                    <h2 className="section-title">
                        <span style={{ color: '#ff4757' }}>●</span> Live From the Farm
                    </h2>
                    <div className="live-stream-grid">
                        {STREAMS_DATA.map(stream => (
                            <LiveStreamCard
                                key={stream.id}
                                stream={stream}
                                onJoin={handleJoinStream}
                            />
                        ))}
                    </div>
                </section>

                <section>
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 className="section-title">
                            {activeCategory === 'all' ? 'All Products' : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
                        </h2>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Showing {filteredProducts.length} items
                        </div>
                    </div>
                    <div className="products-grid">
                        {filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onBuy={handleOpenBidding}
                            />
                        ))}
                    </div>
                </section>

                {biddingProduct && (
                    <BiddingSystem
                        product={biddingProduct}
                        onClose={() => setBiddingProduct(null)}
                    />
                )}
            </main>
        </div>
    );
};

export default Marketplace;
