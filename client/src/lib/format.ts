export const formatCount = (value: number | string) => {
  if (typeof value === 'string' && /[a-z]/i.test(value)) return value
  const numeric = typeof value === 'string' ? Number(value.replace(/[^\d.-]/g, '')) : value
  if (!Number.isFinite(numeric)) return String(value)
  if (Math.abs(numeric) < 1000) return numeric.toLocaleString('en-US')
  const units = [{ value: 1_000_000_000, suffix: 'B' }, { value: 1_000_000, suffix: 'M' }, { value: 1_000, suffix: 'K' }]
  const unit = units.find(item => Math.abs(numeric) >= item.value)!
  const compact = numeric / unit.value
  return `${Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1).replace(/\.0$/, '')}${unit.suffix}`
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)

export const parseCount = (value: number | string) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const cleaned=value.trim().replace(/,/g,'')
  const numeric=Number.parseFloat(cleaned)
  if (!Number.isFinite(numeric)) return 0
  if (/b$/i.test(cleaned)) return Math.round(numeric*1_000_000_000)
  if (/m$/i.test(cleaned)) return Math.round(numeric*1_000_000)
  if (/k$/i.test(cleaned)) return Math.round(numeric*1_000)
  return numeric
}
