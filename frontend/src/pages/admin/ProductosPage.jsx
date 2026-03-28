import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dropdown } from 'primereact/dropdown'
import { InputSwitch } from 'primereact/inputswitch'
import { FileUpload } from 'primereact/fileupload'
import AdminLayout from '../../components/admin/AdminLayout'
import { productoService, resolveImageUrl } from '../../services/productoService'
import { formatCurrency } from '../../utils/currencyUtils'
import './AdminPanel.css'

const initialForm = {
  nombre: '',
  descripcion: '',
  precio: '',
  cantidad: '',
  estado: 'disponible',
  activo: true,
}

const estadoOptions = [
  { label: 'Disponible', value: 'disponible' },
  { label: 'No disponible', value: 'no_disponible' },
]

const ProductosPage = () => {
  const fileUploadRef = useRef(null)
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(initialForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)

  const isEditing = useMemo(() => Boolean(editingId), [editingId])

  const resetForm = useCallback(() => {
    setFormData(initialForm)
    setEditingId(null)
    setSelectedFile(null)
    setPreviewUrl(null)
    setRemoveImage(false)
    if (fileUploadRef.current) {
      fileUploadRef.current.clear()
    }
  }, [])

  const closeDialog = () => {
    setDialogVisible(false)
    resetForm()
  }

  const loadProductos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await productoService.getProductos({ page: 1, limit: 100 })
      setProductos(response.data?.productos || [])
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo cargar productos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProductos()
  }, [loadProductos])

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleOpenCreate = () => {
    resetForm()
    setDialogVisible(true)
  }

  const handleOpenEdit = (producto) => {
    setEditingId(producto.id)
    setFormData({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: String(producto.precio ?? ''),
      cantidad: String(producto.cantidad ?? ''),
      estado: producto.estado || 'disponible',
      activo: Boolean(producto.activo),
    })
    setSelectedFile(null)
    setPreviewUrl(resolveImageUrl(producto.imagen))
    setRemoveImage(false)
    if (fileUploadRef.current) {
      fileUploadRef.current.clear()
    }
    setDialogVisible(true)
  }

  const handleFileSelect = (event) => {
    const file = event.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setRemoveImage(false)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemovePreviewImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setRemoveImage(true)
    if (fileUploadRef.current) {
      fileUploadRef.current.clear()
    }
  }

  const handleDelete = async (id) => {
    try {
      await productoService.deleteProducto(id)
      await loadProductos()
      setMessage('Producto eliminado correctamente')
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo eliminar el producto')
    }
  }

  const handleDeleteConfirm = (producto) => {
    confirmDialog({
      message: `Deseas eliminar el producto "${producto.nombre}"?`,
      header: 'Confirmar eliminacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: () => handleDelete(producto.id),
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const payload = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: Number(formData.precio),
      cantidad: Number(formData.cantidad || 0),
      estado: formData.estado,
      activo: formData.activo,
      imagenFile: selectedFile,
      remove_imagen: removeImage,
    }

    try {
      if (isEditing) {
        await productoService.updateProducto(editingId, payload)
        setMessage('Producto actualizado')
      } else {
        await productoService.createProducto(payload)
        setMessage('Producto creado')
      }

      closeDialog()
      await loadProductos()
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  const dialogTitle = isEditing ? 'Editar producto' : 'Nuevo producto'

  return (
    <AdminLayout
      title="Productos"
      subtitle="Gestiona productos con una experiencia de edicion mas clara y moderna"
      actions={
        <Button
          type="button"
          label="Nuevo producto"
          icon="pi pi-plus"
          className="admin-prime-button"
          onClick={handleOpenCreate}
        />
      }
    >
      <ConfirmDialog />

      <article className="admin-card">
        <div className="admin-card-head">
          <h2>Listado de productos</h2>
          <span className="admin-counter-pill">{productos.length} registrados</span>
        </div>

        {loading ? <p className="admin-message">Cargando productos...</p> : null}
        {message ? <p className="admin-message">{message}</p> : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={7}>No hay productos</td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <tr key={producto.id}>
                    <td>
                      {producto.imagen ? (
                        <img src={resolveImageUrl(producto.imagen)} alt={producto.nombre} className="admin-table-image" />
                      ) : (
                        <div className="admin-table-image placeholder" />
                      )}
                    </td>
                    <td>{producto.nombre}</td>
                    <td>{formatCurrency(producto.precio)}</td>
                    <td>{producto.cantidad}</td>
                    <td>
                      <span className={`admin-chip ${producto.estado === 'disponible' ? 'ok' : 'off'}`}>
                        {producto.estado}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-chip ${producto.activo ? 'ok' : 'off'}`}>
                        {producto.activo ? 'si' : 'no'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-inline-actions">
                        <Button
                          type="button"
                          label="Editar"
                          icon="pi pi-pencil"
                          className="p-button-sm admin-row-action admin-row-action-edit"
                          onClick={() => handleOpenEdit(producto)}
                        />
                        <Button
                          type="button"
                          label="Eliminar"
                          icon="pi pi-trash"
                          className="p-button-sm admin-row-action admin-row-action-delete"
                          onClick={() => handleDeleteConfirm(producto)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <Dialog
        visible={dialogVisible}
        onHide={closeDialog}
        header={dialogTitle}
        className="admin-product-dialog"
        draggable={false}
        resizable={false}
        dismissableMask
      >
        <p className="admin-dialog-subtitle">Completa la informacion del producto. Las imagenes permiten hasta 25MB.</p>

        <form className="admin-prime-form" onSubmit={handleSubmit}>
          <div className="admin-prime-field">
            <label htmlFor="nombre">Nombre</label>
            <InputText id="nombre" value={formData.nombre} onChange={(e) => handleChange('nombre', e.target.value)} required />
          </div>

          <div className="admin-prime-field">
            <label htmlFor="precio">Precio (Bs)</label>
            <InputText
              id="precio"
              type="number"
              min="0"
              step="0.01"
              value={formData.precio}
              onChange={(e) => handleChange('precio', e.target.value)}
              required
            />
          </div>

          <div className="admin-prime-field admin-prime-field-full">
            <label htmlFor="descripcion">Descripcion</label>
            <InputTextarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              autoResize
              rows={4}
            />
          </div>

          <div className="admin-prime-field">
            <label htmlFor="cantidad">Cantidad</label>
            <InputText
              id="cantidad"
              type="number"
              min="0"
              value={formData.cantidad}
              onChange={(e) => handleChange('cantidad', e.target.value)}
              required
            />
          </div>

          <div className="admin-prime-field">
            <label htmlFor="estado">Estado</label>
            <Dropdown
              id="estado"
              options={estadoOptions}
              value={formData.estado}
              onChange={(e) => handleChange('estado', e.value)}
              optionLabel="label"
              optionValue="value"
            />
          </div>

          <div className="admin-prime-field admin-prime-switch-row admin-prime-field-full">
            <label htmlFor="activo">Activo</label>
            <InputSwitch inputId="activo" checked={Boolean(formData.activo)} onChange={(e) => handleChange('activo', e.value)} />
          </div>

          <div className="admin-prime-field admin-prime-field-full">
            <div className="admin-upload-zone">
              <div className="admin-upload-zone-head">
                <span className="admin-upload-zone-icon">
                  <i className="pi pi-images" />
                </span>
                <div>
                  <h4>Imagen del producto</h4>
                  <p>JPG, PNG o WEBP hasta 25MB</p>
                </div>
              </div>

              <FileUpload
                ref={fileUploadRef}
                mode="basic"
                name="imagen"
                accept="image/*"
                maxFileSize={25 * 1024 * 1024}
                chooseOptions={{
                  label: selectedFile ? 'Cambiar imagen' : 'Seleccionar imagen',
                  icon: 'pi pi-image',
                  className: 'admin-upload-trigger',
                }}
                onSelect={handleFileSelect}
              />

              {previewUrl ? (
                <div className="admin-image-preview-wrap">
                  <img src={previewUrl} alt="Vista previa" className="admin-image-preview" />
                  <Button
                    type="button"
                    label="Quitar imagen"
                    icon="pi pi-times"
                    className="p-button-sm p-button-text admin-remove-image-btn"
                    onClick={handleRemovePreviewImage}
                  />
                </div>
              ) : (
                <p className="admin-dialog-note">Sube una imagen horizontal para mejor resultado en catalogo.</p>
              )}
            </div>
          </div>

          <div className="admin-prime-actions">
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              className="admin-modal-cancel"
              onClick={closeDialog}
              disabled={saving}
            />
            <Button
              type="submit"
              label={saving ? 'Guardando...' : isEditing ? 'Actualizar producto' : 'Crear producto'}
              icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
              className="admin-modal-save"
              disabled={saving}
            />
          </div>
        </form>
      </Dialog>
    </AdminLayout>
  )
}

export default ProductosPage
