export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.trunc(Number(amount) || 0));
}

export function formatRupiahShort(amount: number): string {
  if (amount >= 1_000_000_000)
    return `Rp ${parseFloat((amount / 1_000_000_000).toFixed(2))}M`;
  if (amount >= 1_000_000)
    return `Rp ${parseFloat((amount / 1_000_000).toFixed(2))}jt`;
  if (amount >= 1_000)
    return `Rp ${parseFloat((amount / 1_000).toFixed(1))}rb`;
  return `Rp ${amount}`;
}
