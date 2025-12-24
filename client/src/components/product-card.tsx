import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FireMeter } from '@/components/ui/fire-meter';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Product } from '@shared/schema';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.imageUrl,
      quantity: 1
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
      variant: "default",
    });
  };

  return (
    <Card className={cn("product-card overflow-hidden", className)}>
      <div className="product-img-container relative pt-[100%]">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardContent className="p-6">
        <h3 className="font-heading text-xl font-bold mb-2">{product.name}</h3>
        <div className="mb-4">
          <FireMeter level={product.heatLevel} />
        </div>
        <p className="text-gray-600 mb-4">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">R{Number(product.price).toFixed(2)}</span>
          <Button 
            variant="default" 
            className={cn(
              "font-accent font-semibold",
              product.heatLevel >= 3 ? "bg-accent hover:bg-accent-light" : "bg-primary hover:bg-opacity-90"
            )}
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
