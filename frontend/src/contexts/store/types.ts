import type {
  Address,
  CartItem,
  CategoryItemData,
  Customer,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ReturnRequest,
  ReturnStatus,
  Review,
  TimelineEvent,
} from '@/types/commerce';
import type { CollectionItem } from '@/types/collection';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
}

export interface PlaceOrderInput {
  contact: { name: string; email: string; phone: string };
  address: Address;
  shippingMethod: string;
  shippingCost: number;
  paymentMethod: PaymentMethod;
  discount: number;
  couponCode?: string;
  customerNote?: string;
  subtotal: number;
  total: number;
}

export interface StoreContextValue {
  isStoreLoading: boolean;
  products: Product[];
  orders: Order[];
  returns: ReturnRequest[];
  reviews: Review[];
  customers: Customer[];
  cart: CartItem[];
  wishlist: string[];
  compare: string[];
  recentlyViewed: string[];
  user: User | null;
  addresses: Address[];
  storeCredit: number;
  miniCartOpen: boolean;
  quickViewId: string | null;
  compareOpen: boolean;
  searchOpen: boolean;
  setMiniCartOpen: (v: boolean) => void;
  setQuickViewId: (id: string | null) => void;
  setCompareOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  addToCart: (productId: string, variantId: string, qty?: number) => void;
  updateQty: (key: string, qty: number) => void;
  changeVariant: (key: string, variantId: string) => void;
  removeFromCart: (key: string) => void;
  toggleSaveForLater: (key: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  toggleCompare: (productId: string) => void;
  trackView: (productId: string) => void;
  login: (email: string) => void;
  register: (u: Omit<User, 'id'>) => void;
  logout: () => void;
  saveAddress: (a: Address) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  placeOrder: (input: PlaceOrderInput) => Order;
  completePayment: (orderId: string, result: 'success' | 'fail' | 'cancel') => void;
  retryPayment: (orderId: string, method: PaymentMethod) => void;
  setOrderStatus: (
    orderId: string,
    status: OrderStatus,
    event?: Partial<TimelineEvent> & { courier?: string; tracking?: string }
  ) => void;
  addOrderNote: (orderId: string, text: string, internal: boolean, by: string) => void;
  refundOrder: (orderId: string, amount: number, by: string, reason: string) => void;
  markCodCollected: (orderId: string, by: string) => void;
  cancelOrder: (orderId: string, by: string) => void;
  createReturn: (r: Omit<ReturnRequest, 'id' | 'createdAt' | 'timeline' | 'status'>) => ReturnRequest;
  updateReturn: (id: string, status: ReturnStatus, by: string, note?: string) => void;
  saveProduct: (p: Product) => void;
  adjustStock: (productId: string, variantId: string, delta: number) => void;
  updateReview: (id: string, patch: Partial<Review>) => void;
  addReview: (r: Omit<Review, 'id' | 'date' | 'status' | 'helpful'>) => void;
  categories: CategoryItemData[];
  collections: CollectionItem[];
  addCategory: (c: CategoryItemData) => void;
  saveCategory: (key: string, patch: Partial<CategoryItemData>) => void;
  deleteCategory: (key: string) => void;
  addSubcategory: (categoryKey: string, subcategoryName: string) => void;
  removeSubcategory: (categoryKey: string, subcategoryName: string) => void;
  renameSubcategory: (categoryKey: string, oldName: string, newName: string) => void;
  toggleCustomerStatus: (id: string) => void;
}
