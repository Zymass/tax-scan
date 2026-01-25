import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import CalculatorPage from './pages/CalculatorPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProtectedRoute from './components/Common/ProtectedRoute';
import Footer from './components/Common/Footer';
import './styles/globals.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/calculator" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/calculator"
            element={
              <ProtectedRoute>
                <CalculatorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:id"
            element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
