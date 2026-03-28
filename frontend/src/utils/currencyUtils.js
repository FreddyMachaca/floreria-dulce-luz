export const formatCurrency = (amount) => {
  const numeric = parseFloat(amount)

  if (Number.isNaN(numeric)) {
    return 'Bs 0.00'
  }

  return `Bs ${numeric.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
