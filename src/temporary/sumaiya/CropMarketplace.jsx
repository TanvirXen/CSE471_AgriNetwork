import React, { useState } from 'react';
import './CropMarketplace.css';
import { Filter, Search, Calendar, MapPin, Tag, AlertCircle, CheckCircle, Package } from 'lucide-react';

// --- Mock Data ---
import premiumBoroRice from './assets/premium_boro_rice_1772801425925.png';
import amanFineRice from './assets/aman_fine_rice_1772801624794.png';
import organicWheat from './assets/organic_wheat_1772801682955.png';
import goldenJute from './assets/golden_jute_1772801735527.png';

const CROP_DATA = [
  {
    id: 1,
    name: 'Premium Boro Rice',
    variety: 'BRRI Dhan 28',
    region: 'Dinajpur',
    price: 45,
    unit: 'kg',
    moisture: '12%',
    grade: 'A',
    sackType: 'Jute (50kg)',
    diseaseNotes: 'None. Tested negative for Blast disease.',
    qualityNotes: '100% sortex clean, no broken grains.',
    isSpotlight: true,
    bulkDeals: [
      { minQty: 1000, price: 42 },
      { minQty: 5000, price: 40 }
    ],
    harvestDate: 'April 2024',
    image: premiumBoroRice
  },
  {
    id: 2,
    name: 'Aman Fine Rice',
    variety: 'Kataribhog',
    region: 'Naogaon',
    price: 75,
    unit: 'kg',
    moisture: '14%',
    grade: 'Premium',
    sackType: 'Plastic (25kg)',
    diseaseNotes: 'Minor husking issues in 2% grains.',
    qualityNotes: 'Aromatic, aged 6 months for better cooking quality.',
    isSpotlight: false,
    bulkDeals: [
      { minQty: 500, price: 72 },
    ],
    harvestDate: 'Nov 2023',
    image: amanFineRice
  },
  {
    id: 3,
    name: 'Organic Wheat',
    variety: 'BARI Gom 26',
    region: 'Thakurgaon',
    price: 35,
    unit: 'kg',
    moisture: '11%',
    grade: 'B',
    sackType: 'Woven Sack (50kg)',
    diseaseNotes: 'Treated for loose smut.',
    qualityNotes: 'High gluten content, suitable for baking.',
    isSpotlight: true,
    bulkDeals: [
      { minQty: 2000, price: 32 },
      { minQty: 10000, price: 30 }
    ],
    harvestDate: 'March 2024',
    image: organicWheat
  },
  {
    id: 4,
    name: 'Golden Jute',
    variety: 'Tosha Jute',
    region: 'Faridpur',
    price: 3000,
    unit: 'maund',
    moisture: '15%',
    grade: 'C',
    sackType: 'Bales (180kg)',
    diseaseNotes: 'Clear of stem rot.',
    qualityNotes: 'Long fiber, golden color, excellent strength.',
    isSpotlight: false,
    bulkDeals: [
      { minQty: 50, price: 2900 }
    ],
    harvestDate: 'August 2024',
    image: goldenJute
  }
];

const FILTER_OPTIONS = {
  variety: ['All', 'BRRI Dhan 28', 'Kataribhog', 'BARI Gom 26', 'Tosha Jute'],
  moisture: ['All', '< 12%', '12% - 14%', '> 14%'],
  grade: ['All', 'Premium', 'A', 'B', 'C'],
  sackType: ['All', 'Jute (50kg)', 'Plastic (25kg)', 'Woven Sack (50kg)', 'Bales (180kg)']
};

const CropMarketplace = () => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    variety: 'All',
    moisture: 'All',
    grade: 'All',
    sackType: 'All',
    search: ''
  });

  const handleFilterChange = (type, value) => {
    setActiveFilters(prev => ({ ...prev, [type]: value }));
  };

  // Filter Logic
  const filteredCrops = CROP_DATA.filter(crop => {
    if (activeFilters.variety !== 'All' && crop.variety !== activeFilters.variety) return false;
    if (activeFilters.grade !== 'All' && crop.grade !== activeFilters.grade) return false;
    if (activeFilters.sackType !== 'All' && crop.sackType !== activeFilters.sackType) return false;
    if (activeFilters.search && !crop.name.toLowerCase().includes(activeFilters.search.toLowerCase())) return false;
    return true; // Simplified moisture filter for mockup
  });

  return (
    <div className="sumaiya-crop-marketplace">
      <header className="cm-header">
        <div className="cm-header-logo">
          <MapPin size={24} color="var(--accent-soft)" />
          AgriNetwork Market
        </div>
      </header>

      <div className="cm-container">
        {/* --- Sidebar Filter --- */}
        <aside className={`cm-sidebar ${isMobileFilterOpen ? 'open' : ''}`}>
          <div className="cm-sidebar-header">
            <h3>Filters</h3>
            <button className="cm-close-filter" onClick={() => setIsMobileFilterOpen(false)}>×</button>
          </div>
          
          <div className="cm-filter-group">
            <h4 className="cm-filter-title">Crop Variety</h4>
            <div className="cm-filter-options">
              {FILTER_OPTIONS.variety.map(opt => (
                <label key={opt} className="cm-checkbox-label">
                  <input 
                    type="radio" 
                    name="variety"
                    checked={activeFilters.variety === opt}
                    onChange={() => handleFilterChange('variety', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="cm-filter-group">
            <h4 className="cm-filter-title">Moisture %</h4>
            <div className="cm-filter-options">
              {FILTER_OPTIONS.moisture.map(opt => (
                <label key={opt} className="cm-checkbox-label">
                  <input 
                    type="radio" 
                    name="moisture"
                    checked={activeFilters.moisture === opt}
                    onChange={() => handleFilterChange('moisture', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="cm-filter-group">
            <h4 className="cm-filter-title">Quality Grade</h4>
            <div className="cm-filter-options">
              {FILTER_OPTIONS.grade.map(opt => (
                <label key={opt} className="cm-checkbox-label">
                  <input 
                    type="radio" 
                    name="grade"
                    checked={activeFilters.grade === opt}
                    onChange={() => handleFilterChange('grade', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="cm-filter-group">
            <h4 className="cm-filter-title">Packaging / Sack Type</h4>
            <div className="cm-filter-options">
               {FILTER_OPTIONS.sackType.map(opt => (
                <label key={opt} className="cm-checkbox-label">
                  <input 
                    type="radio" 
                    name="sackType"
                    checked={activeFilters.sackType === opt}
                    onChange={() => handleFilterChange('sackType', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* --- Main Content --- */}
        <main className="cm-main-content">
          <div className="cm-page-header">
            <div>
              <h1 className="cm-page-title">Wholesale Crop Marketplace</h1>
              <p className="cm-page-subtitle">Transparent pricing, verified quality, direct from farmers.</p>
            </div>
            
            <div className="cm-search-bar">
              <Search className="cm-search-icon" size={20} />
              <input 
                type="text" 
                placeholder="Search crops, varieties, or regions..." 
                value={activeFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          <button className="cm-filter-toggle" onClick={() => setIsMobileFilterOpen(true)}>
            <Filter size={18} />
            Show Filters
          </button>

          {/* Region Spotlights */}
          <section className="cm-spotlight-section">
            <h2 className="cm-section-title">
              <MapPin size={24} color="var(--primary-main)" />
              Region Spotlights
            </h2>
            <div className="cm-spotlight-grid">
              {CROP_DATA.filter(c => c.isSpotlight).map(crop => (
                <div key={`spotlight-${crop.id}`} className="cm-spotlight-card">
                  <img src={crop.image} alt={crop.name} className="cm-spotlight-img"/>
                  <div className="cm-spotlight-overlay">
                    <span className="cm-badge primary">High Demand</span>
                    <h3>{crop.region}</h3>
                    <p>{crop.name} • {crop.variety}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Harvest Calendar Preview */}
          <section className="cm-calendar-section">
            <div className="cm-calendar-banner">
              <div className="cm-calendar-info">
                <h3><Calendar size={20} style={{marginRight: '8px', verticalAlign: 'middle'}}/> Harvest Calendar</h3>
                <p>Plan your bulk purchases ahead of time. See what's coming next season.</p>
              </div>
              <button className="cm-btn-outline">View Full Calendar</button>
            </div>
          </section>

          {/* Crop Listings */}
          <section className="cm-listings-section">
            <h2 className="cm-section-title">Available Listings ({filteredCrops.length})</h2>
            <div className="cm-listings-grid">
              {filteredCrops.map(crop => (
                <div key={crop.id} className="cm-crop-card">
                  <div className="cm-card-image-wrap">
                    <img src={crop.image} alt={crop.name} className="cm-card-image" />
                    <span className="cm-card-grade">Grade {crop.grade}</span>
                  </div>
                  
                  <div className="cm-card-body">
                    <div className="cm-card-header">
                      <h3 className="cm-card-title">{crop.name}</h3>
                      <span className="cm-card-price">৳{crop.price}<small>/{crop.unit}</small></span>
                    </div>
                    
                    <div className="cm-card-meta">
                      <span><Tag size={14}/> {crop.variety}</span>
                      <span><MapPin size={14}/> {crop.region}</span>
                      <span><Package size={14}/> {crop.sackType}</span>
                    </div>

                    {/* Bulk Deals Tier */}
                    <div className="cm-bulk-deals">
                      <h4>Wholesaler Pricing Tiers</h4>
                      <ul>
                        {crop.bulkDeals.map((deal, idx) => (
                           <li key={idx}>Min {deal.minQty} {crop.unit}: <strong>৳{deal.price}</strong>/{crop.unit}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Quality & Disease Notes */}
                    <div className="cm-quality-notes">
                      <div className="cm-note">
                        <CheckCircle size={16} color="var(--secondary)"/>
                        <p><strong>Quality:</strong> {crop.qualityNotes}</p>
                      </div>
                      <div className="cm-note">
                         <AlertCircle size={16} color="var(--primary-main)"/>
                         <p><strong>Health:</strong> {crop.diseaseNotes}</p>
                      </div>
                    </div>

                    <div className="cm-card-footer">
                       <span className="cm-moisture">Moisture: {crop.moisture}</span>
                       <button className="cm-btn-primary">Contact Seller</button>
                    </div>
                  </div>
                </div>
              ))}
               {filteredCrops.length === 0 && (
                 <div className="cm-no-results">
                   <p>No crops match your current filters. Try adjusting them.</p>
                 </div>
               )}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default CropMarketplace;
