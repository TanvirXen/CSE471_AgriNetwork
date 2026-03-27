import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import TanvirPage from './temporary/tanvir'
import ChamanPage from './temporary/chaman'
import SearchMapPage from './temporary/chaman/SearchMapPage'
import ShabibaPage from './temporary/shabiba'
import SumaiyaPage from './temporary/sumaiya'
import CropMarketplace from './Pages/CropMarketplace.jsx'
import CropDetails from './Pages/CropDetails.jsx'
import OrderHistory from './temporary/sumaiya/OrderHistory.jsx'
import Marketplace from './temporary/shabiba/Marketplace.jsx'
import Verification from './temporary/shabiba/Verification.jsx'
import Login from './Pages/Login'
import Signup from './Pages/Signup'
import ForgotPassword from './Pages/ForgotPassword'
import CompleteProfile from './Pages/CompleteProfile'
import NIDVerification from './Pages/NIDVerification'
import Chatbot from './Components/Chatbot'
import DashboardLayout from './Components/DashboardLayout'
import DashboardOverview from './Pages/DashboardOverview'
import DashboardProfile from './Pages/DashboardProfile'
import ChatbotPage from './Pages/ChatbotPage'



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/complete-profile/:role" element={<CompleteProfile />} />
        <Route path="/verify-nid" element={<NIDVerification />} />
        <Route path="/tanvir" element={<TanvirPage />} />
        <Route path="/chaman" element={<ChamanPage />} />
        <Route path="/chaman/search" element={<SearchMapPage />} />
        <Route path="/shabiba" element={<ShabibaPage />} />
        <Route path="/sumaiya" element={<SumaiyaPage />} />
        <Route path="/sumaiya/CropMarketplace" element={<CropMarketplace />} />
        <Route path="/sumaiya/crop/:id" element={<CropDetails />} />
        <Route path="/sumaiya/OrderHistory" element={<OrderHistory />} />
        <Route path="/shabiba/marketplace" element={<Marketplace />} />
        <Route path="/shabiba/verification" element={<Verification />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="profile" element={<DashboardProfile />} />
          <Route path="chatbot" element={<ChatbotPage />} />
          <Route path="orders" element={<div className="dashboard-content"><h3>Orders Page (Coming Soon)</h3></div>} />
          <Route path="messages" element={<div className="dashboard-content"><h3>Messages Page (Coming Soon)</h3></div>} />
          <Route path="settings" element={<div className="dashboard-content"><h3>Settings Page (Coming Soon)</h3></div>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Chatbot />
    </BrowserRouter>
  </StrictMode>,
)
