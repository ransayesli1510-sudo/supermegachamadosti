import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserRanking } from './pages/UserRanking';
import { type CarEvaluation, MOCK_CARS } from './store/mockData';
import './index.css';

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [cars, setCars] = useState<CarEvaluation[]>(MOCK_CARS);

  const toggleMode = () => {
    setIsAdminMode(prev => !prev);
  };

  const handleAddCar = (newCar: CarEvaluation) => {
    setCars(prev => [...prev, newCar]);
  };

  const handleUpdateCar = (updatedCar: CarEvaluation) => {
    setCars(prev => prev.map(c => c.id === updatedCar.id ? updatedCar : c));
  };

  const handleDeleteCar = (id: string) => {
    setCars(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="app-layout">
      <Navigation isAdminMode={isAdminMode} toggleMode={toggleMode} />

      <main style={{ minHeight: 'calc(100vh - 72px)' }}>
        {isAdminMode ? (
          <AdminDashboard
            cars={cars}
            onAddCar={handleAddCar}
            onUpdateCar={handleUpdateCar}
            onDeleteCar={handleDeleteCar}
          />
        ) : (
          <UserRanking cars={cars} />
        )}
      </main>

      {/* Footer minimal */}
      <footer style={{ backgroundColor: 'var(--color-text)', color: 'white', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <p style={{ margin: 0, opacity: 0.8 }}>© 2026 Calculadora de Médias Auto Repórter</p>
      </footer>
    </div>
  );
}

export default App;
