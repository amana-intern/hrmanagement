// Shared parser for PaymentRequest.detail (free-form JSON blob) fields surfaced
// as table columns across the OPS/Partner payment approval & scheduler pages.
export interface PaymentDetailFields {
  chargecode?: string;
  submittingAs?: string;
  paymentUnder?: string;
}

export function parsePaymentDetail(raw: string | null): PaymentDetailFields {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as PaymentDetailFields;
  } catch {
    return {};
  }
}
