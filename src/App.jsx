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
            <Link to="/shabiba">Shabiba</Link>
          </li>
          <li>
            <Link to="/sumaiya">Sumaiya</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}

export default App
