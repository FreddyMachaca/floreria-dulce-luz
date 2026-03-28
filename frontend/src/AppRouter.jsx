import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './App'
import { AuthProvider } from './context/AuthContext'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import AdminHomePage from './pages/admin/AdminHomePage'
import UserHomePage from './pages/user/UserHomePage'
import ProtectedRoute from './components/admin/ProtectedRoute'

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/admin/login" element={<LoginPage adminMode />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="admin" redirectTo="/admin/login">
                <AdminHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mi-cuenta"
            element={
              <ProtectedRoute>
                <UserHomePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default AppRouter
