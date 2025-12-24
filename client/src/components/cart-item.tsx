import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';
import { CartItem as CartItemType } from '@/lib/cart';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { increaseQuantity, decreaseQuantity, removeItem } = useCart();
  
  const handleDecrease = () => {
    if (item.quantity > 1) {
      decreaseQuantity(item.id);
    } else {
      removeItem(item.id);
    }
  };
  
  const handleIncrease = () => {
    increaseQuantity(item.id);
  };
  
  const totalPrice = item.price * item.quantity;
  
  return (
    <li className="py-6 flex">
      <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      
      <div className="ml-4 flex-1 flex flex-col">
        <div>
          <div className="flex justify-between text-base font-medium text-gray-900">
            <h3>{item.name}</h3>
            <p className="ml-4">R{totalPrice.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex-1 flex items-end justify-between text-sm">
          <div className="flex items-center border rounded">
            <Button 
              variant="ghost" 
              className="px-2 h-8 text-gray-500"
              onClick={handleDecrease}
            >
              -
            </Button>
            <span className="mx-2 w-8 text-center">{item.quantity}</span>
            <Button 
              variant="ghost" 
              className="px-2 h-8 text-gray-500"
              onClick={handleIncrease}
            >
              +
            </Button>
          </div>
          
          <div className="flex">
            <Button
              variant="ghost"
              className="font-medium text-primary hover:text-accent"
              onClick={() => removeItem(item.id)}
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
