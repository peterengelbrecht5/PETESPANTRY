import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  CartItem, 
  getCartFromStorage, 
  saveCartToStorage, 
  addItemToCart, 
  removeItemFromCart, 
  updateItemQuantity, 
  clearCart as clearCartStorage
} from '@/lib/cart';

interface CartContextType {
  cartItems: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: number) => void;
  increaseQuantity: (itemId: number) => void;
  decreaseQuantity: (itemId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    setCartItems(getCartFromStorage());
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    saveCartToStorage(cartItems);
  }, [cartItems]);
  
  const addItem = (item: CartItem) => {
    setCartItems((prevItems) => addItemToCart(prevItems, item));
  };
  
  const removeItem = (itemId: number) => {
    setCartItems((prevItems) => removeItemFromCart(prevItems, itemId));
  };
  
  const increaseQuantity = (itemId: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };
  
  const decreaseQuantity = (itemId: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };
  
  const clearCart = () => {
    setCartItems([]);
    clearCartStorage();
  };
  
  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItem,
        removeItem,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
