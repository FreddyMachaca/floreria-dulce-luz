import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/useCart'
import { formatCurrency } from '../../utils/currencyUtils'
import { resolveImageUrl } from '../../services/productoService'
import './ShopPages.css'

const CarritoPage = () => {
  const navigate = useNavigate()
  const { cart, loading, fetchCart, updateQuantity, removeFromCart, clearCart } = useCart()
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const items = cart?.items || []

  const handleIncrease = async (item) => {
    const result = await updateQuantity(item.id, Number(item.cantidad) + 1)
    if (!result.success) {
      setMessage(result.message || 'No se pudo actualizar la cantidad')
    }
  }

  const handleDecrease = async (item) => {
    const next = Number(item.cantidad) - 1
    const result = await updateQuantity(item.id, Math.max(next, 0))
    if (!result.success) {
      setMessage(result.message || 'No se pudo actualizar la cantidad')
    }
  }

  const handleRemove = async (itemId) => {
    const result = await removeFromCart(itemId)
    if (!result.success) {
      setMessage(result.message || 'No se pudo eliminar el producto')
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Deseas vaciar el carrito?')) {
      return
    }

    const result = await clearCart()
    if (!result.success) {
      setMessage(result.message || 'No se pudo vaciar el carrito')
    }
  }

  return (
    <main className="shop-shell">
      <section className="shop-container">
        <header className="shop-header">
          <div>
            <h1 className="shop-title">Tu Carrito</h1>
            <p style={{ color: 'var(--muted)' }}>Resumen de tu compra en Bs</p>
          </div>
          <div className="shop-actions">
            <Link className="shop-button secondary" to="/productos">
              Seguir comprando
            </Link>
            {items.length > 0 ? (
              <button type="button" className="shop-button" disabled={loading} onClick={handleClear}>
                Vaciar carrito
              </button>
            ) : null}
          </div>
        </header>

        {message ? <div style={{ marginBottom: '1rem', color: 'var(--muted)' }}>{message}</div> : null}

        {items.length === 0 ? (
          <div className="shop-empty">
            <p style={{ marginBottom: '0.75rem' }}>No tienes productos agregados.</p>
            <Link className="shop-button" to="/productos">
              Ver catalogo
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-list">
              {items.map((item) => (
                <article className="cart-item" key={item.id}>
                  {item.imagen ? <img src={resolveImageUrl(item.imagen)} alt={item.nombre} /> : <div className="product-img" />}

                  <div>
                    <div className="cart-item-name">{item.nombre}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
                      Stock disponible {item.stock_disponible}
                    </div>
                    <div style={{ marginTop: '0.45rem', color: 'var(--rose)', fontWeight: 700 }}>
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '0.5rem', justifyItems: 'end' }}>
                    <div className="qty-controls">
                      <button type="button" onClick={() => handleDecrease(item)}>
                        -
                      </button>
                      <span>{item.cantidad}</span>
                      <button type="button" onClick={() => handleIncrease(item)}>
                        +
                      </button>
                    </div>

                    <button type="button" className="shop-button secondary" onClick={() => handleRemove(item.id)}>
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="cart-summary">
              <h3 style={{ marginBottom: '1rem', color: 'var(--ink)' }}>Resumen</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                <span>Subtotal</span>
                <span>{formatCurrency(cart?.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: 'var(--rose)' }}>{formatCurrency(cart?.total)}</span>
              </div>

              <button type="button" className="shop-button" style={{ marginTop: '1rem', width: '100%' }} onClick={() => navigate('/checkout')}>
                Proceder al checkout
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  )
}

export default CarritoPage
