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
import CropMarketplace from './temporary/sumaiya/CropMarketplace.jsx'
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
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './Components/ProtectedRoute'



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
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
          <Route path="/sumaiya/OrderHistory" element={<OrderHistory />} />
          <Route path="/shabiba/marketplace" element={<Marketplace />} />
          <Route path="/shabiba/verification" element={<Verification />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="profile" element={<DashboardProfile />} />
              <Route path="chatbot" element={<ChatbotPage />} />
              <Route path="orders" element={<div className="dashboard-content"><h3>Orders Page (Coming Soon)</h3></div>} />
              <Route path="messages" element={<ChamanPage />} />
              <Route path="map" element={<SearchMapPage />} />
              <Route path="settings" element={<div className="dashboard-content"><h3>Settings Page (Coming Soon)</h3></div>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Chatbot />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

