/** Listing price is the total for the quantity offered, not per unit. */

export function formatPriceAmount(price) {
  if (price == null || Number.isNaN(Number(price))) return null;
  return `$${Number(price).toLocaleString()}`;
}

export function formatListingPrice(price, quantity, t) {
  const formatted = formatPriceAmount(price);
  if (!formatted) return '—';
  const qty = quantity != null ? Number(quantity) : null;
  if (qty != null && qty > 1 && t) {
    const suffix = t('priceLotSuffix');
    if (suffix) return `${formatted} ${suffix}`;
  }
  return formatted;
}
