import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import TanvirPage from './tanvir'
import ChamanPage from './chaman'
import ShabibaPage from './shabiba'
import SumaiyaPage from './sumaiya'
import ChatbotPage from './tanvir/ChatbotPage.jsx'
import CropMarketplace from './sumaiya/CropMarketplace.jsx'
import OrderHistory from './sumaiya/OrderHistory.jsx'



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/tanvir" element={<TanvirPage />} />
        <Route path="/chaman" element={<ChamanPage />} />
        <Route path="/shabiba" element={<ShabibaPage />} />
        <Route path="/sumaiya" element={<SumaiyaPage />} />
        <Route path="/sumaiya/CropMarketplace" element={<CropMarketplace />} />
        <Route path="/sumaiya/OrderHistory" element={<OrderHistory />} />
        <Route path="/tanvir/chatbot" element={<ChatbotPage />} />

        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
