import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Product } from '@shared/schema';
import { PageLoader } from '@/components/ui/loader';
import { ProductCard } from '@/components/product-card';

export default function Products() {
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !products) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-red-500">Error loading products</h2>
        <p className="mt-4">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12">Our Products</h1>
      
      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {/* Recipe Ideas */}
      <div className="mt-16">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-8">Recipe Ideas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recipe 1 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <img 
              src="https://pixabay.com/get/g82314de41fc9d2941a4ce667168a11fd80b6bfa90ebb91cbf2adb7dcab65ca056e42de234e861d70d4d4cb1a6d5fb16831422cb46f969e86cc773a4d8654f56d_1280.jpg" 
              alt="Cheese Board with Marmalade" 
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h3 className="font-heading text-xl font-bold mb-2">Artisanal Cheese Board</h3>
              <p className="text-gray-600">Pair our Mild Marmalade with brie, gouda, and aged cheddar for a perfect appetizer that will impress your guests.</p>
            </div>
          </div>
          
          {/* Recipe 2 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80" 
              alt="Glazed Pork Chops" 
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h3 className="font-heading text-xl font-bold mb-2">Glazed Pork Tenderloin</h3>
              <p className="text-gray-600">Use our Xtra Hot Marmalade as a glaze for pork or chicken for a sweet and spicy main course that's bursting with flavor.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
