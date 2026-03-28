import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productoService } from '../../services/productoService'
import { useCart } from '../../context/useCart'
import { formatCurrency } from '../../utils/currencyUtils'
import './ShopPages.css'

const ProductosPage = () => {
  const { addToCart, itemCount, loading } = useCart()
  const [productos, setProductos] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [fetching, setFetching] = useState(false)
  const [message, setMessage] = useState('')

  const loadProductos = useCallback(async () => {
    try {
      setFetching(true)
      const response = await productoService.getProductosPublicos({
        page,
        limit: 12,
        search: search.trim() || undefined,
      })

      setProductos(response.data?.productos || [])
      setTotalPages(response.data?.pagination?.totalPages || 1)
    } catch (error) {
      setProductos([])
      setTotalPages(1)
      setMessage(error.response?.data?.message || 'No se pudo cargar el catalogo')
    } finally {
      setFetching(false)
    }
  }, [page, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProductos()
    }, 250)

    return () => clearTimeout(timer)
  }, [loadProductos])

  const handleAddToCart = async (productoId) => {
    const result = await addToCart(productoId, 1)

    if (result.success) {
      setMessage('Producto agregado al carrito')
      return
    }

    setMessage(result.message || 'No se pudo agregar el producto')
  }

  return (
    <main className="shop-shell">
      <section className="shop-container">
        <header className="shop-header">
          <div>
            <h1 className="shop-title">Catalogo de Productos</h1>
            <p style={{ color: 'var(--muted)' }}>Floreria Dulce Luz · Moneda Bs</p>
          </div>

          <div className="shop-actions">
            <Link className="shop-button secondary" to="/">
              Volver
            </Link>
            <Link className="shop-button" to="/carrito">
              Carrito ({itemCount})
            </Link>
          </div>
        </header>

        <input
          className="shop-search"
          value={search}
          onChange={(event) => {
            setPage(1)
            setSearch(event.target.value)
          }}
          placeholder="Buscar flores, ramos o arreglos"
        />

        {message ? (
          <div style={{ marginBottom: '1rem', color: 'var(--muted)' }}>{message}</div>
        ) : null}

        {fetching ? (
          <div className="shop-empty">Cargando productos...</div>
        ) : productos.length === 0 ? (
          <div className="shop-empty">No hay productos para mostrar</div>
        ) : (
          <div className="products-grid">
            {productos.map((producto) => (
              <article key={producto.id} className="product-card">
                {producto.imagen ? (
                  <img src={producto.imagen} alt={producto.nombre} className="product-img" />
                ) : (
                  <div className="product-img" />
                )}

                <div className="product-name">{producto.nombre}</div>
                <div className="product-description">{producto.descripcion || 'Sin descripcion'}</div>

                <div className="product-meta">
                  <span className="product-price">{formatCurrency(producto.precio)}</span>
                  <span className="product-tag">{producto.es_servicio ? 'Servicio' : `Stock ${producto.cantidad}`}</span>
                </div>

                <button type="button" className="shop-button" disabled={loading} onClick={() => handleAddToCart(producto.id)}>
                  Agregar al carrito
                </button>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginTop: '1.2rem' }}>
            <button type="button" className="shop-button secondary" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
              Anterior
            </button>
            <span style={{ alignSelf: 'center', color: 'var(--muted)' }}>
              Pagina {page} de {totalPages}
            </span>
            <button type="button" className="shop-button secondary" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}>
              Siguiente
            </button>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default ProductosPage
