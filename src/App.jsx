import { Link } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <main>
      <h1>AgriNetwork Team Pages</h1>
      <p>Select a route:</p>
      <nav>
        <ul>
          <li>
            <Link to="/tanvir">Tanvir</Link>
          </li>
          <li>
            <Link to="/chaman">Chaman Chat</Link>
          </li>
          <li>
            <Link to="/chaman/search">Chaman Search & Map</Link>
          </li>
          <li>
            <Link to="/shabiba/verification">Shabiba Verification</Link>
          </li>
          <li>
            <Link to="/marketplace">Marketplace</Link>
          </li>
          <li>
            <Link to="/sumaiya/CropMarketplace">Sumaiya CropMarketplace</Link>
          </li>
          <li>
            <Link to="/sumaiya/OrderHistory">Sumaiya OrderHistory</Link>
          </li>
          <li>
            <Link to="/dashboard/smart-agromarket">Smart AgroMarket</Link>
          </li>
          <li>
            <Link to="/dashboard/escrow">Escrow Dashboard</Link>
          </li>
          <li>
            <Link to="/dashboard/payment">Payment Page</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}

export default App
