export interface OrderCustomer {
  fullName: string;
  phone: string;
  address: string;
  note?: string;
}

export interface CreateOrderPayload {
  customer: OrderCustomer;
  items: { productId: number; quantity: number }[];
  voucherCode?: string | null;
}

export interface SavedOrderItem {
  productId: number;
  name: string;
  price: string;
  priceValue: number;
  image: string;
  quantity: number;
}

export interface SavedOrder {
  _id?: string;
  orderCode: string;
  customer: OrderCustomer;
  items: SavedOrderItem[];
  voucherCode: string | null;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  status: string;
  createdAt?: string;
}
