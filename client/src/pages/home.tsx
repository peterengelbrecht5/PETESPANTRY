import { useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import { PageLoader } from '@/components/ui/loader';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Product } from '@shared/schema';

export default function Home() {
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
    <>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-black to-gray-900">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="text-center">
            <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Pete's Pantry</h1>
            <p className="font-body text-xl md:text-3xl mb-8 text-cream">Artisanal Pineapple & Habanero Marmalade</p>
            <p className="text-lg md:text-xl mb-10 text-gray-300 max-w-2xl mx-auto">Handcrafted in small batches with fresh pineapple and habanero peppers</p>
            <Button asChild size="lg" className="font-accent bg-primary hover:bg-primary/90 text-white font-semibold">
              <Link href="/products" data-testid="link-shop-now">Shop Now</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="bg-background py-16 px-4">
        <div className="container mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">Our Signature Marmalades</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {products.slice(0, 2).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-black py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://pixabay.com/get/gabc7ca0f6d403b36e24ef65fa6973b8f8a6296024fc9e4b498b70ac9f877d58fade516dda25a0c834de682cd120beb548e49b374eb2eb44d50ccdc7b8a8c20fd_1280.jpg" 
                alt="Fresh Ingredients" 
                className="rounded-lg shadow-lg border-4 border-secondary"
              />
            </div>
            <div>
              <h2 className="font-heading text-3xl font-bold mb-6 text-secondary">Our Story</h2>
              <p className="mb-4 text-gray-300">Pete's Pantry was born from a passion for bold flavors and quality ingredients. What started as a hobby quickly grew into a beloved artisanal brand.</p>
              <p className="mb-6 text-gray-300">Each jar of our marmalade is handcrafted in small batches using fresh pineapple, red onion, and carefully selected habanero peppers to ensure the perfect balance of sweetness and heat.</p>
              <Button 
                className="font-accent bg-secondary hover:bg-secondary/90 text-black font-semibold"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-background py-16 px-4">
        <div className="container mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">What Our Customers Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-card p-6 rounded-lg shadow-md border-2 border-secondary/30">
              <div className="flex items-center mb-4">
                <div className="text-secondary">
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                </div>
              </div>
              <p className="text-muted-foreground italic mb-4">"The mild marmalade is perfect for my morning toast. Sweet with just the right amount of heat. I'm completely addicted!"</p>
              <p className="font-semibold text-foreground">- Sarah J.</p>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-card p-6 rounded-lg shadow-md border-2 border-secondary/30">
              <div className="flex items-center mb-4">
                <div className="text-secondary">
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                </div>
              </div>
              <p className="text-muted-foreground italic mb-4">"The Xtra Hot variety is a game changer for my grilled cheese sandwiches. The heat is serious but balanced perfectly with sweetness."</p>
              <p className="font-semibold text-foreground">- Michael T.</p>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-card p-6 rounded-lg shadow-md border-2 border-secondary/30">
              <div className="flex items-center mb-4">
                <div className="text-secondary">
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStarHalfAlt} />
                </div>
              </div>
              <p className="text-muted-foreground italic mb-4">"I love serving both varieties at our dinner parties. Everyone always asks where they can buy some. The quality is outstanding!"</p>
              <p className="font-semibold text-foreground">- Lisa R.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
