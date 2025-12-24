import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/cart-context';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { CartItem } from '@/components/cart-item';
import { Loader } from '@/components/ui/loader';

export default function Cart() {
  const { cartItems, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [useBalance, setUseBalance] = useState(false);
  
  const cartItemCount = cartItems.length;
  
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 30 : 0;
  const total = subtotal + shipping;
  
  const userBalance = user ? Number(user.balance) : 0;
  const canUseBalance = userBalance >= total;
  
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to complete your purchase",
        variant: "destructive",
      });
      navigate("/api/login");
      return;
    }
    
    // Navigate to checkout page instead of processing payment directly
    navigate("/checkout");
  };
  
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-center mb-8">Your Cart</h1>
      
      {/* Empty Cart Message */}
      {cartItemCount === 0 ? (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faShoppingCart} className="text-5xl text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-500 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some of our delicious marmalades to get started.</p>
          <Button asChild className="font-accent bg-primary hover:bg-opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition duration-300">
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flow-root">
              <ul className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </ul>
            </div>
          </div>
          
          {/* Cart Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>R{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span>Shipping</span>
              <span>R{shipping.toFixed(2)}</span>
            </div>
            
            {isAuthenticated && userBalance > 0 && (
              <div className="mt-4 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="use-balance"
                      checked={useBalance}
                      onCheckedChange={setUseBalance}
                      disabled={!canUseBalance}
                    />
                    <label htmlFor="use-balance" className="text-sm">
                      Use account balance (R{userBalance.toFixed(2)})
                    </label>
                  </div>
                  {!canUseBalance && useBalance && (
                    <span className="text-xs text-destructive">Insufficient balance</span>
                  )}
                </div>
              </div>
            )}
            
            <Separator className="my-4" />
            
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>R{total.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Checkout Actions */}
          <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              variant="outline"
              className="font-accent text-center border border-primary text-primary hover:bg-primary hover:text-white font-semibold"
              asChild
            >
              <Link href="/products">Continue Shopping</Link>
            </Button>
            <Button 
              className="font-accent bg-primary hover:bg-opacity-90 text-white font-semibold"
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <><Loader size="sm" className="mr-2" /> Processing...</>
              ) : (
                "Proceed to Checkout"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
