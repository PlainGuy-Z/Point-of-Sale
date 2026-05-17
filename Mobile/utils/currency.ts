export function formatRupiah(amount: number): string {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount)
}

export function formatRupiahShort(amount: number): string {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`
  return `Rp ${amount}`
}
