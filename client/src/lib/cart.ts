export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const CART_STORAGE_KEY = 'petes-pantry-cart';

export function getCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  const storedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (!storedCart) {
    return [];
  }
  
  try {
    return JSON.parse(storedCart);
  } catch (error) {
    console.error('Failed to parse cart from localStorage:', error);
    return [];
  }
}

export function saveCartToStorage(cart: CartItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export function addItemToCart(cart: CartItem[], item: CartItem): CartItem[] {
  const existingItem = cart.find((cartItem) => cartItem.id === item.id);
  
  if (existingItem) {
    return cart.map((cartItem) =>
      cartItem.id === item.id
        ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
        : cartItem
    );
  }
  
  return [...cart, item];
}

export function removeItemFromCart(cart: CartItem[], itemId: number): CartItem[] {
  return cart.filter((item) => item.id !== itemId);
}

export function updateItemQuantity(cart: CartItem[], itemId: number, quantity: number): CartItem[] {
  return cart.map((item) =>
    item.id === itemId ? { ...item, quantity } : item
  );
}

export function clearCart(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(CART_STORAGE_KEY);
}
