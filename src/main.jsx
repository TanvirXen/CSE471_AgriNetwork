import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import './index.css'
import TanvirPage from './temporary/tanvir'
import ChamanPage from './temporary/chaman'
import SearchMapPage from './temporary/chaman/SearchMapPage'
import ShabibaPage from './temporary/shabiba'
import SumaiyaPage from './temporary/sumaiya'
import CropMarketplace from './Pages/CropMarketplace.jsx'
import CropDetails from './Pages/CropDetails.jsx'
import OrderHistory from './Pages/OrderHistory.jsx'
import Marketplace from './temporary/shabiba/Marketplace.jsx'
import Verification from './temporary/shabiba/Verification.jsx'
import Login from './Pages/Login'
import Signup from './Pages/Signup'
import ForgotPassword from './Pages/ForgotPassword'
import CompleteProfile from './Pages/CompleteProfile'
import NIDVerification from './Pages/NIDVerification'
import DashboardLayout from './Components/DashboardLayout'
import DashboardOverview from './Pages/DashboardOverview'
import DashboardProfile from './Pages/DashboardProfile'
import WalletPaymentResult from './Pages/WalletPaymentResult'
import ChatbotPage from './Pages/ChatbotPage'
import VendorDelivery from './Pages/VendorDelivery'
import AiAdminReviews from './Pages/AiAdminReviews'
import SmartAgroMarket from './temporary/chaman/SmartAgroMarket'
import EscrowDashboard from './temporary/chaman/EscrowDashboard'
import PaymentPage from './temporary/chaman/PaymentPage'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import ProtectedRoute from './Components/ProtectedRoute'
import TranslateToggle from './Components/TranslateToggle'

// eslint-disable-next-line react-refresh/only-export-components
const RootRedirect = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--neutral-bg)' }}>
        <div className="loader">Loading...</div>
      </div>
    )
  }

  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/complete-profile/:role" element={<CompleteProfile />} />
          <Route path="/verify-nid" element={<NIDVerification />} />
          <Route path="/payments/sslcommerz/result" element={<WalletPaymentResult />} />
          <Route path="/tanvir" element={<TanvirPage />} />
          <Route path="/chaman" element={<ChamanPage />} />
          <Route path="/chaman/search" element={<SearchMapPage />} />
          <Route path="/shabiba" element={<ShabibaPage />} />
          <Route path="/sumaiya" element={<SumaiyaPage />} />
          <Route path="/crop-marketplace" element={<CropMarketplace />} />
          <Route path="/sumaiya/CropMarketplace" element={<CropMarketplace />} />
          <Route path="/sumaiya/crop/:id" element={<CropDetails />} />
          <Route path="/sumaiya/OrderHistory" element={<OrderHistory />} />
          <Route path="/shabiba/marketplace" element={<Marketplace />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/shabiba/verification" element={<Verification />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="profile" element={<DashboardProfile />} />
              <Route path="chatbot" element={<ChatbotPage />} />
              <Route path="smart-agromarket" element={<SmartAgroMarket />} />
              <Route path="escrow" element={<EscrowDashboard />} />
              <Route path="payment" element={<PaymentPage />} />
              <Route path="orders" element={<OrderHistory />} />
              <Route path="delivery-handler/:orderId" element={<VendorDelivery />} />
              <Route path="messages" element={<ChamanPage />} />
              <Route path="map" element={<SearchMapPage />} />
              <Route path="settings" element={<div className="dashboard-content"><h3>Settings Page (Coming Soon)</h3></div>} />
            </Route>
            <Route path="/aiadmin/reviews" element={<AiAdminReviews />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
      <TranslateToggle />
    </BrowserRouter>
  </StrictMode>,
)

