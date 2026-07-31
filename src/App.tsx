import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Practicals from './pages/Practicals';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-900 text-slate-300 font-sans flex flex-col selection:bg-primary/30 selection:text-primary-300">
        <Navbar />
        <main className="flex-grow pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/practicals" element={<Practicals />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
