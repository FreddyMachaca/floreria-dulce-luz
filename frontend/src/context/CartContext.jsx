import { useCallback, useEffect, useMemo, useState } from 'react'
import { carritoService } from '../services/carritoService'
import { getSessionId } from '../utils/sessionUtils'
import { CartContext } from './cartContextValue'

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      const response = await carritoService.getCarrito()
      setCart(response.data)
      return { success: true, data: response.data }
    } catch (error) {
      const emptyCart = {
        items: [],
        subtotal: '0.00',
        total: '0.00',
        cantidadItems: 0,
        cliente: null,
        qr: null,
      }
      setCart(emptyCart)
      return {
        success: false,
        message: error.response?.data?.message || 'No se pudo cargar el carrito',
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getSessionId()
    fetchCart()
  }, [fetchCart])

  const addToCart = useCallback(
    async (productoId, cantidad = 1) => {
      try {
        setLoading(true)
        await carritoService.addItem(productoId, cantidad)
        await fetchCart()
        return { success: true }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'No se pudo agregar el producto',
        }
      } finally {
        setLoading(false)
      }
    },
    [fetchCart],
  )

  const updateQuantity = useCallback(
    async (itemId, cantidad) => {
      try {
        setLoading(true)
        await carritoService.updateItemQuantity(itemId, cantidad)
        await fetchCart()
        return { success: true }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'No se pudo actualizar la cantidad',
        }
      } finally {
        setLoading(false)
      }
    },
    [fetchCart],
  )

  const removeFromCart = useCallback(
    async (itemId) => {
      try {
        setLoading(true)
        await carritoService.removeItem(itemId)
        await fetchCart()
        return { success: true }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'No se pudo eliminar el producto',
        }
      } finally {
        setLoading(false)
      }
    },
    [fetchCart],
  )

  const clearCart = useCallback(async () => {
    try {
      setLoading(true)
      await carritoService.clearCarrito()
      await fetchCart()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'No se pudo vaciar el carrito',
      }
    } finally {
      setLoading(false)
    }
  }, [fetchCart])

  const setClienteInfo = useCallback(
    async (payload) => {
      try {
        setLoading(true)
        await carritoService.setClienteInfo(payload)
        await fetchCart()
        return { success: true }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'No se pudo guardar la informacion del cliente',
        }
      } finally {
        setLoading(false)
      }
    },
    [fetchCart],
  )

  const itemCount = useMemo(() => {
    if (!cart?.items) return 0
    return cart.items.reduce((acc, item) => acc + Number(item.cantidad || 0), 0)
  }, [cart])

  const value = useMemo(
    () => ({
      cart,
      loading,
      itemCount,
      fetchCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      setClienteInfo,
    }),
    [cart, loading, itemCount, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart, setClienteInfo],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
