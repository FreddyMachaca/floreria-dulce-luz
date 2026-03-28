import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './App'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/admin/DashboardPage'
import AdminProductosPage from './pages/admin/ProductosPage'
import AdminOrdenesPage from './pages/admin/OrdenesPage'
import UserHomePage from './pages/user/UserHomePage'
import ProductosPage from './pages/public/ProductosPage'
import CarritoPage from './pages/public/CarritoPage'
import CheckoutPage from './pages/public/CheckoutPage'
import ProtectedRoute from './components/admin/ProtectedRoute'

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/productos" element={<ProductosPage />} />
            <Route path="/carrito" element={<CarritoPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />
            <Route path="/admin/login" element={<LoginPage adminMode />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requireRole="admin" redirectTo="/admin/login">
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requireRole="admin" redirectTo="/admin/login">
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/productos"
              element={
                <ProtectedRoute requireRole="admin" redirectTo="/admin/login">
                  <AdminProductosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ordenes"
              element={
                <ProtectedRoute requireRole="admin" redirectTo="/admin/login">
                  <AdminOrdenesPage />
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
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default AppRouter
