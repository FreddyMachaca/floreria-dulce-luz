import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { checkoutService } from '../../services/checkoutService'
import { useCart } from '../../context/useCart'
import { formatCurrency } from '../../utils/currencyUtils'
import './ShopPages.css'

const DEPARTAMENTOS = [
  'La Paz',
  'Cochabamba',
  'Santa Cruz',
  'Oruro',
  'Potosi',
  'Tarija',
  'Chuquisaca',
  'Beni',
  'Pando',
]

const getQrImageSource = (qrData) => {
  if (!qrData?.qrImage) return ''
  if (qrData.qrImage.startsWith('data:')) return qrData.qrImage
  if (qrData.qrImage.startsWith('http')) return qrData.qrImage
  return `data:image/png;base64,${qrData.qrImage}`
}

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { cart, fetchCart, setClienteInfo } = useCart()
  const pollingRef = useRef(null)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [qrData, setQrData] = useState(null)
  const [ordenData, setOrdenData] = useState(null)
  const [clienteData, setClienteData] = useState(null)
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    departamento: '',
  })

  const hasItems = useMemo(() => (cart?.items || []).length > 0, [cart])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()

    pollingRef.current = setInterval(async () => {
      try {
        setCheckingPayment(true)
        const response = await checkoutService.checkQrStatus()

        if (response.success && response.data.status === 'Pagado') {
          stopPolling()
          setOrdenData(response.data.orden)
          setStep(3)
          await fetchCart()
          return
        }

        if (response.success && response.data.needsRegeneration) {
          stopPolling()
          setMessage(response.data.message || 'El QR expiro. Debes generar uno nuevo.')
          setQrData(null)
        }
      } catch (error) {
        setMessage(error.response?.data?.message || 'No se pudo verificar el pago')
      } finally {
        setCheckingPayment(false)
      }
    }, 5000)
  }, [fetchCart, stopPolling])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  useEffect(() => {
    if (!hasItems && step !== 3) {
      navigate('/carrito', { replace: true })
    }
  }, [hasItems, navigate, step])

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerateQr = async (event) => {
    event.preventDefault()

    if (!formData.nombre || !formData.apellido || !formData.telefono || !formData.departamento) {
      setMessage('Completa todos los datos del cliente')
      return
    }

    setLoading(true)
    setMessage('')

    const clienteResult = await setClienteInfo(formData)
    if (!clienteResult.success) {
      setLoading(false)
      setMessage(clienteResult.message || 'No se pudo guardar los datos del cliente')
      return
    }

    try {
      const qrResponse = await checkoutService.generateQr(false)

      if (!qrResponse.success) {
        setMessage(qrResponse.message || 'No se pudo generar el QR')
        setLoading(false)
        return
      }

      setClienteData(formData)
      setQrData(qrResponse.data)
      setStep(2)
      startPolling()
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo generar el QR')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateQr = async () => {
    setLoading(true)
    setMessage('')

    try {
      const qrResponse = await checkoutService.generateQr(true)
      if (!qrResponse.success) {
        setMessage(qrResponse.message || 'No se pudo regenerar el QR')
        return
      }

      setQrData(qrResponse.data)
      startPolling()
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo regenerar el QR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="shop-shell">
      <section className="shop-container">
        <header className="shop-header">
          <div>
            <h1 className="shop-title">Checkout</h1>
            <p style={{ color: 'var(--muted)' }}>Flujo de compra con QR Vendis</p>
          </div>
          <div className="shop-actions">
            <Link className="shop-button secondary" to="/carrito">
              Volver al carrito
            </Link>
          </div>
        </header>

        <div className="checkout-panel" style={{ marginBottom: '1rem' }}>
          <div className="checkout-step">
            <span className={`checkout-dot ${step >= 1 ? 'active' : ''}`}>1</span>
            <span>Datos</span>
            <span className={`checkout-dot ${step >= 2 ? 'active' : ''}`}>2</span>
            <span>QR</span>
            <span className={`checkout-dot ${step >= 3 ? 'active' : ''}`}>3</span>
            <span>Confirmacion</span>
          </div>
        </div>

        {message ? <div style={{ marginBottom: '1rem', color: 'var(--muted)' }}>{message}</div> : null}

        {step === 1 ? (
          <section className="checkout-panel">
            <h2 style={{ marginBottom: '0.5rem' }}>Datos del cliente</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
              Total a pagar: <strong style={{ color: 'var(--rose)' }}>{formatCurrency(cart?.total)}</strong>
            </p>

            <form className="checkout-form" onSubmit={handleGenerateQr}>
              <input name="nombre" value={formData.nombre} onChange={handleFormChange} placeholder="Nombre" />
              <input name="apellido" value={formData.apellido} onChange={handleFormChange} placeholder="Apellido" />
              <input name="telefono" value={formData.telefono} onChange={handleFormChange} placeholder="Telefono" />
              <select name="departamento" value={formData.departamento} onChange={handleFormChange}>
                <option value="">Selecciona departamento</option>
                {DEPARTAMENTOS.map((departamento) => (
                  <option key={departamento} value={departamento}>
                    {departamento}
                  </option>
                ))}
              </select>

              <button type="submit" className="shop-button checkout-full" disabled={loading}>
                {loading ? 'Generando QR...' : 'Continuar al pago'}
              </button>
            </form>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="checkout-panel qr-box">
            <h2>Escanea el QR</h2>
            <p className="qr-amount">
              Monto: <strong>{formatCurrency(qrData?.total || cart?.total)}</strong>
            </p>

            {qrData ? (
              <img className="qr-image" src={getQrImageSource(qrData)} alt="QR de pago" />
            ) : (
              <div className="shop-empty">Generando imagen QR...</div>
            )}

            <p className="status-message">
              {checkingPayment ? 'Verificando pago...' : `QR valido por ${qrData?.expirationMinutes || 15} minutos`}
            </p>

            <button type="button" className="shop-button secondary" onClick={handleRegenerateQr} disabled={loading}>
              Regenerar QR
            </button>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="checkout-panel">
            <h2 style={{ marginBottom: '0.7rem' }}>Pago confirmado</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
              Orden registrada correctamente.
            </p>

            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
              <div>
                Codigo: <strong>{ordenData?.codigoUnico}</strong>
              </div>
              <div>
                Cliente: <strong>{clienteData?.nombre} {clienteData?.apellido}</strong>
              </div>
              <div>
                Telefono: <strong>{clienteData?.telefono}</strong>
              </div>
              <div>
                Departamento: <strong>{clienteData?.departamento}</strong>
              </div>
              <div>
                Total pagado: <strong style={{ color: 'var(--rose)' }}>{formatCurrency(ordenData?.total)}</strong>
              </div>
            </div>

            <button type="button" className="shop-button" onClick={() => navigate('/', { replace: true })}>
              Volver al inicio
            </button>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default CheckoutPage
