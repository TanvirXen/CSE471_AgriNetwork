import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShoppingCart, Users, Search, MapPin, Package, ArrowRight, X, 
  Calendar, Filter, Target, Info, ShieldCheck, ChevronRight,
  List, Plus, Trash2, Edit2, Tag, Wallet, TrendingUp, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './VendorBuyRequests.css'; 

const VendorBuyRequests = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    category: '',
    productName: '',
    qualityGrade: '',
    quantity: '',
    unit: 'kg',
    budget: '',
    deadline: '',
    urgency: 'Standard',
  });

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:5000/api/buy-requests';
  const filterInputClass = "filter-input"; 

  const fetchRequests = async () => {
    try {
      const response = await axios.get(API_URL, {
        headers: { 'x-auth-token': token }
      });
      if (response && response.data && response.data.success) {
        setRequests(response.data.data || []);
      }
    } catch (error) {
       console.error("Fetch failed:", error);
    }
  };

  useEffect(() => {
    if (token) fetchRequests();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        alert("Procurement Demand Broadcasted!");
        fetchRequests();
        setFormData({
            category: '',
            productName: '',
            qualityGrade: '',
            quantity: '',
            unit: 'kg',
            budget: '',
            deadline: '',
            urgency: 'Standard',
        });
      }
    } catch (error) {
       console.error("Submission error:", error);
       alert("Failed to post request.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this procurement demand?")) return;
    
    try {
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: { 'x-auth-token': token }
      });
      if (response.data.success) {
        fetchRequests();
      }
    } catch (error) {
       console.error("Delete failed:", error);
       alert("Failed to delete request.");
    }
  };

  return (
    <div className="order-history-wrapper bg-[#dad7cd] min-h-screen p-8 pt-12 font-['Inter',sans-serif] text-[#1f2937]">
      <div className="order-history-container max-w-[1200px] mx-auto">
        
        {/* Header - OrderHistory Aesthetic */}
        <div className="order-history-header mb-8">
          <h1 className="text-[2rem] font-bold text-[#344e41] mb-2 flex items-center gap-3">
            <ShoppingCart className="w-10 h-10" /> Procurement Center
          </h1>
          <p className="text-[1rem] text-[#588157]">Monitor your transaction progress and broadcast your marketplace buy requests here.</p>
        </div>

        {/* Filters (Used here as Registration Form) - Exactly matching OrderHistory.jsx */}
        <div className="filters-section bg-white p-[1.5rem] rounded-[12px] shadow-[0_4px_6px_rgba(0,0,0,0.05)] mb-8">
          <div className="flex flex-col w-full gap-6">
             <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                <Target size={14} className="text-[#344e41]" />
                <span className="text-sm font-bold text-[#344e41] uppercase tracking-wider">Broadcast Procurement Demand</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="filter-group">
                   <label><Package size={14} style={{ display: 'inline', marginRight: 4 }} /> Required Product</label>
                   <input 
                     type="text" 
                     name="productName" 
                     value={formData.productName} 
                     onChange={handleInputChange} 
                     className={filterInputClass} 
                     placeholder="e.g. Premium Potato" 
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
                    <option value="">Choosing Category...</option>
                    <option value="crops">Crops & Grains</option>
                    <option value="fish">Fresh Fish</option>
                    <option value="fruits">Fresh Fruits</option>
                    <option value="livestock">Livestock</option>
                    <option value="poultry">Poultry</option>
                  </select>
                </div>
                <div className="filter-group">
                   <label><TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} /> Spec Grade</label>
                   <select 
                     name="qualityGrade" 
                     value={formData.qualityGrade} 
                     onChange={handleInputChange} 
                     className={filterInputClass}
                   >
                    <option value="">Choosing Grade...</option>
                    <option value="A">Grade A (Premium)</option>
                    <option value="B">Grade B (Standard)</option>
                  </select>
                </div>
                <div className="filter-group">
                   <label><List size={14} style={{ display: 'inline', marginRight: 4 }} /> Quantity Required</label>
                   <div className="flex gap-2">
                    <input 
                        type="number" 
                        name="quantity" 
                        value={formData.quantity} 
                        onChange={handleInputChange} 
                        className="flex-1 filter-input" 
                        placeholder="0" 
                    />
                    <select 
                        name="unit" 
                        value={formData.unit} 
                        onChange={handleInputChange} 
                        className="w-20 filter-input font-bold text-xs uppercase"
                    >
                        <option>kg</option>
                        <option>ton</option>
                    </select>
                  </div>
                </div>
                <div className="filter-group">
                   <label><Wallet size={14} style={{ display: 'inline', marginRight: 4 }} /> Max Budget (৳)</label>
                   <input 
                     type="number" 
                     name="budget" 
                     value={formData.budget} 
                     onChange={handleInputChange} 
                     className={filterInputClass} 
                     placeholder="Total Budget" 
                   />
                </div>
                <div className="filter-group">
                   <label><Calendar size={14} style={{ display: 'inline', marginRight: 4 }} /> Expected Deadline</label>
                   <input 
                     type="date" 
                     name="deadline" 
                     value={formData.deadline} 
                     onChange={handleInputChange} 
                     className={filterInputClass} 
                   />
                </div>
             </div>

             <div className="flex justify-end mt-16 mb-6 px-2">
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="post-btn"
                >
                  {loading ? (
                    <Clock className="animate-spin" size={20} />
                  ) : (
                    <Plus size={18} /> 
                  )}
                  {loading ? 'Processing...' : 'Post'}
                </button>
             </div>
          </div>
        </div>

        {/* Demands List - OrderHistory "OrderCard" Aesthetic */}
        <div className="orders-list grid gap-6">
          {(requests && requests.length > 0) ? (
            requests.map((item) => (
              <div 
                key={item._id}
                className="order-card bg-white p-[1.5rem] rounded-[12px] shadow-[0_4px_6px_rgba(0,0,0,0.05)] border-l-[6px] border-l-[#3a5a40] hover:scale-[1.01] transition-transform relative group"
              >
                {/* Delete Button */}
                <button 
                  onClick={() => handleDelete(item._id)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                  title="Delete Request"
                >
                  <Trash2 size={20} />
                </button>
                <div className="order-header flex justify-between items-center border-b border-[#e5e7eb] pb-4 mb-4">
                  <div className="order-id-date flex flex-col gap-1">
                     <span className="id font-bold text-[#344e41] text-[1.125rem]">{item.productName}</span>
                     <span className="date text-[#6b7280] text-[0.875rem]">Request ID: {item.id || item._id.slice(-6).toUpperCase()} • Deadline: {new Date(item.deliveryTimelineEnd).toLocaleDateString()}</span>
                  </div>
                  <div className="status-badge bg-[#cce5ff] text-[#004085] px-[0.75rem] py-[0.35rem] rounded-full text-[0.875rem] font-bold">
                     {item.status || 'Active'}
                  </div>
                </div>

                <div className="order-body flex justify-between items-end">
                  <div className="products-list flex flex-col gap-2">
                     <div className="product-item flex items-center gap-2 text-[1rem] text-[#1f2937]">
                        <Package size={16} className="text-[#3a5a40]" />
                        <span>{item.quantityNeeded}{item.quantityUnit} Required / <span className="text-[#6b7280]">Grade {item.preferredGrade}</span></span>
                     </div>
                     <div className="product-item flex items-center gap-2 text-[1rem] text-[#1f2937]">
                        <Users size={16} className="text-[#3a5a40]" />
                        <span>{item.farmerMatches?.length || 0} Potential Farmer Matches</span>
                     </div>
                  </div>
                  <div className="order-total text-right">
                     <p className="label text-[0.875rem] text-[#6b7280]">Target Budget</p>
                     <p className="amount text-[1.5rem] font-bold text-[#344e41]">৳{(item.budgetMax || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
                <div className="empty-state text-center p-12 bg-white rounded-[12px] text-[#6b7280]">
                    <Search size={32} className="mx-auto mb-4 text-[#dad7cd]" />
                    <h3 className="text-[#344e41] text-[1.25rem] font-bold">No active buy requests</h3>
                    <p>Broadcast your procurement needs to match with verified farmers.</p>
                </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default VendorBuyRequests;