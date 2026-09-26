export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export type PaymentMethod = 'cash_table' | 'mobile_money' | 'cashier';

export interface Supplement {
  id: string;
  name: string;
  price: number; // in FCFA
}

export interface PortionSize {
  id: string;
  name: string;
  priceOffset: number; // in FCFA (e.g. 0 for standard, +2000 for XL)
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'grillades' | 'locales' | 'entrees' | 'monde' | 'cocktails_jus' | 'desserts';
  price: number; // in FCFA
  description: string;
  ingredients: string;
  image: string;
  tags?: string[];
  spicyLevel?: 0 | 1 | 2 | 3;
  isChefSpecial?: boolean;
  isVegetarian?: boolean;
  isAvailable?: boolean;
  preparationTime?: string;
  sizes?: PortionSize[];
  availableSupplements?: Supplement[];
}

export interface CartItem {
  cartItemId: string; // unique per cart line
  menuItem: MenuItem;
  quantity: number;
  selectedSize?: PortionSize;
  selectedSupplements: Supplement[];
  specialInstructions: string;
  unitPrice: number; // base + size + supplements
  totalPrice: number;
}

export interface OrderItemPayload {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sizeName?: string;
  supplements: string[];
  specialInstructions?: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  customerName: string;
  customerPhone?: string;
  items: OrderItemPayload[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'pending' | 'paid';
  specialNotes?: string;
  createdAt: number; // timestamp ms
  updatedAt?: number;
}

export type WaiterCallReason = 'addition' | 'service' | 'eau' | 'question';

export interface WaiterCall {
  id: string;
  tableNumber: number;
  reason: WaiterCallReason;
  status: 'pending' | 'resolved';
  notes?: string;
  createdAt: number;
  resolvedAt?: number;
}
