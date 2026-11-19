const VALID_VOUCHERS = new Set(['FLEURE20', 'YEUHOA15', 'FREESHIP60']);

/** Computes verified order pricing on the server using MongoDB product unit prices. */
export function calculateOrderTotals(subtotal, rawVoucherCode) {
  const code = typeof rawVoucherCode === 'string' ? rawVoucherCode.trim().toUpperCase() : '';
  let appliedVoucher = null;

  if (code && VALID_VOUCHERS.has(code)) {
    if (code === 'FLEURE20' && subtotal < 450000) {
      appliedVoucher = null;
    } else {
      appliedVoucher = code;
    }
  }

  let discountAmount = 0;
  if (appliedVoucher === 'FLEURE20' && subtotal >= 450000) {
    discountAmount = Math.round(subtotal * 0.2);
  } else if (appliedVoucher === 'YEUHOA15') {
    discountAmount = Math.round(subtotal * 0.15);
  }

  const shippingFee =
    subtotal === 0 || appliedVoucher === 'FREESHIP60' || subtotal >= 399000 ? 0 : 25000;

  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  return {
    voucherCode: appliedVoucher,
    subtotal,
    discountAmount,
    shippingFee,
    grandTotal,
  };
}

/** Generates a human-friendly FLEURÉ order reference code. */
export function createOrderCode() {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `FL-${randomDigits}`;
}
