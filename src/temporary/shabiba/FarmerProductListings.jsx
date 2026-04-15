import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Package, Tag, TrendingUp, Search, Calendar, Filter,
  CheckCircle, Clock, X, ChevronRight, Plus,
  ShieldCheck, AlertCircle, Trash2, Edit2, ShoppingBag, MapPin,
  Image as ImageIcon, Rocket
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './FarmerProductListings.css';

const FarmerProductListings = () => {
  const { token, user } = useAuth();
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    description: '',
    price: '',
    harvestOrigin: '',
    currentStock: '',
    variety: 'Standard',
    grade: 'A',
    availabilityDate: '',
    productImage: '' // [NEW] Image field
  });

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:5000/api/listings';
  const filterInputClass = "filter-input";

  const fetchListings = async () => {
    try {
      const response = await axios.get(API_URL, {
        headers: { 'x-auth-token': token }
      });
      if (response && response.data && response.data.success) {
        setListings(response.data.listings || []);
      }
    } catch (error) {
      console.error("Listing fetch failed:", error);
    }
  };

  useEffect(() => {
    if (token) fetchListings();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!token) return alert("Please log in first.");

    setLoading(true);
    try {
      const response = await axios.post(API_URL, formData, {
        headers: { 'x-auth-token': token }
      });
      if (response.data.success) {
        alert("Product Registered & Published to Marketplace!");
        fetchListings();
        setFormData({
          productName: '',
          category: '',
          description: '',
          price: '',
          harvestOrigin: '',
          currentStock: '',
          variety: 'Standard',
          grade: 'A',
          availabilityDate: '',
          productImage: ''
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to register product.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this listing? It will also be removed from the Marketplace.")) return;

    try {
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: { 'x-auth-token': token }
      });
      if (response.data.success) {
        fetchListings();
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete listing.");
    }
  };

  return (
    <div className="order-history-wrapper bg-[#dad7cd] min-h-screen p-8 pt-12 font-['Inter',sans-serif] text-[#1f2937]">
      <div className="order-history-container max-w-[1200px] mx-auto">

        {/* Header - OrderHistory Aesthetic */}
        <div className="order-history-header mb-8">
          <h1 className="text-[2rem] font-bold text-[#344e41] mb-2 font-['Outfit',sans-serif]">Farmer Inventory Management</h1>
          <p className="text-[1rem] text-[#588157]">Monitor your transaction progress and manage your marketplace listings here.</p>
        </div>

        {/* Filters (Used here as Registration Form) - Exactly matching OrderHistory.jsx */}
        <div className="filters-section bg-white p-[1.5rem] rounded-[12px] shadow-[0_4px_6px_rgba(0,0,0,0.05)] mb-8">
          <div className="flex flex-col w-full gap-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <Rocket size={18} className="text-[#344e41]" />
              <span className="text-sm font-bold text-[#344e41] uppercase tracking-wider">Harvest Registration & Marketplace Bridge</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="filter-group">
                <label><Package size={14} style={{ display: 'inline', marginRight: 4 }} /> Product Identity</label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  className={filterInputClass}
                  placeholder="e.g. Boro Rice"
                />
              </div>
              <div className="filter-group">
                <label><Filter size={14} style={{ display: 'inline', marginRight: 4 }} /> Marketplace Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={filterInputClass}
                >
                  <option value="">Select Category...</option>
                  <option value="crops">Crops & Grains</option>
                  <option value="fish">Fresh Fish</option>
                  <option value="fruits">Fresh Fruits</option>
                  <option value="livestock">Livestock</option>
                  <option value="poultry">Poultry</option>
                </select>
              </div>
              <div className="filter-group">
                <label><TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} /> Unit Valuation (৳)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className={filterInputClass}
                  placeholder="0.00"
                />
              </div>
              <div className="filter-group">
                <label><MapPin size={14} style={{ display: 'inline', marginRight: 4 }} /> Origin Region</label>
                <input
                  type="text"
                  name="harvestOrigin"
                  value={formData.harvestOrigin}
                  onChange={handleInputChange}
                  className={filterInputClass}
                  placeholder="Region name"
                />
              </div>
              <div className="filter-group">
                <label><ShoppingBag size={14} style={{ display: 'inline', marginRight: 4 }} /> In-Stock Volume</label>
                <input
                  type="text"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleInputChange}
                  className={filterInputClass}
                  placeholder="e.g. 500 kg"
                />
              </div>
              <div className="filter-group">
                <label><ImageIcon size={6} style={{ display: 'inline', marginRight: 4 }} /> Product Image URL</label>
                <input
                  type="text"
                  name="productImage"
                  value={formData.productImage}
                  onChange={handleInputChange}
                  className={filterInputClass}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div className="filter-group md:col-span-2 lg:col-span-3">
                <label><Calendar size={14} style={{ display: 'inline', marginRight: 4 }} /> Available Date</label>
                <input
                  type="date"
                  name="availabilityDate"
                  value={formData.availabilityDate}
                  onChange={handleInputChange}
                  className={filterInputClass}
                />
              </div>
            </div>

            <div className="flex justify-end mt-24 mb-6 px-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="register-btn"
              >
                {loading ? (
                  <Clock className="animate-spin" size={20} />
                ) : (
                  <Plus size={18} />
                )}
                {loading ? 'Processing...' : 'Register'}
              </button>
            </div>
          </div>
        </div>

        {/* Listings List - OrderHistory "OrderCard" Aesthetic */}
        <div className="orders-list grid gap-6">
          {(listings && listings.length > 0) ? (
            listings.map((item) => (
              <div
                key={item._id}
                className="order-card bg-white p-[1.5rem] rounded-[12px] shadow-[0_4px_6px_rgba(0,0,0,0.05)] border-l-[6px] border-l-[#3a5a40] hover:scale-[1.01] transition-transform relative group"
              >
                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(item._id)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                  title="Delete Listing"
                >
                  <Trash2 size={20} />
                </button>

                <div className="order-header flex justify-between items-center border-b border-[#e5e7eb] pb-4 mb-4">
                  <div className="order-id-date flex items-center gap-4">
                    {item.media && item.media[0] && (
                      <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        minWidth: '50px', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        border: '1px solid #e5e7eb' 
                      }}>
                        <img
                          src={item.media[0].url}
                          alt="thumbnail"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="id font-bold text-[#344e41] text-[1.125rem]">{item.productName || item.title}</span>
                      <span className="date text-[#6b7280] text-[0.875rem]">Uploaded on {new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="status-badge bg-[#d4edda] text-[#155724] px-[0.75rem] py-[0.35rem] rounded-full text-[0.875rem] font-bold mr-10">
                    Live on Marketplace
                  </div>
                </div>

                <div className="order-body flex justify-between items-end">
                  <div className="products-list flex flex-col gap-2">
                    <div className="product-item flex items-center gap-2 text-[1rem] text-[#1f2937]">
                      <Package size={16} className="text-[#3a5a40]" />
                      <span>{item.categoryType || 'Crop'} / <span className="text-[#6b7280]">{item.quantity}{item.quantityUnit || 'kg'} in stock</span></span>
                    </div>
                    <div className="product-item flex items-center gap-2 text-[1rem] text-[#1f2937]">
                      <MapPin size={16} className="text-[#3a5a40]" />
                      <span>Origin: {item.region || item.harvestOrigin || 'Not Specified'}</span>
                    </div>
                  </div>
                  <div className="order-total text-right">
                    <p className="label text-[0.875rem] text-[#6b7280]">Listing Price</p>
                    <p className="amount text-[1.5rem] font-bold text-[#344e41]">৳{(Number(item.pricing?.unitPrice) || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state text-center p-12 bg-white rounded-[12px] text-[#6b7280]">
              <Search size={32} className="mx-auto mb-4 text-[#dad7cd]" />
              <h3 className="text-[#344e41] text-[1.25rem] font-bold">No active listings</h3>
              <p>Your harvest entries will show up here after registration.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FarmerProductListings;