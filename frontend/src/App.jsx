import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  const [showAuth, setShowAuth] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <>
      <Navbar onAuthOpen={() => setShowAuth(true)} onSearch={setSearch} />
      <Routes>
        <Route path="/" element={<HomePage onAuthRequired={() => setShowAuth(true)} search={search} />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
