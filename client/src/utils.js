export const currency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0))
export const formatDate = (s) => {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d)) return s
  return d.toISOString().slice(0,10)
}
export const sum = (arr, key) => arr.reduce((acc, it) => acc + Number(it[key] || 0), 0)