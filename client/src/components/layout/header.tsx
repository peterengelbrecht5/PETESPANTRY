import { useState } from "react";
import { Link, useLocation } from "wouter";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faShoppingCart, 
  faBars, 
  faTimes 
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { cartItems } = useCart();
  
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="font-heading text-2xl md:text-3xl font-bold text-secondary">
            Pete's Pantry
          </Link>
          
          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`font-accent text-secondary hover:text-primary transition duration-200 ${isActive('/') ? 'text-primary' : ''}`}
            >
              Home
            </Link>
            <Link 
              href="/products" 
              className={`font-accent text-secondary hover:text-primary transition duration-200 ${isActive('/products') ? 'text-primary' : ''}`}
            >
              Products
            </Link>
            <Link href="#" className="font-accent text-secondary hover:text-primary transition duration-200">
              About
            </Link>
            <Link href="#" className="font-accent text-secondary hover:text-primary transition duration-200">
              Contact
            </Link>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <Link 
              href={isAuthenticated ? "/profile" : "/login"} 
              className="text-secondary hover:text-primary transition duration-200"
            >
              <FontAwesomeIcon icon={faUser} className="text-lg" />
            </Link>
            <Link 
              href="/cart" 
              className="text-secondary hover:text-primary transition duration-200 relative"
            >
              <FontAwesomeIcon icon={faShoppingCart} className="text-lg" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-secondary focus:outline-none" 
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} className="text-lg" />
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="py-3 space-y-3">
            <Link 
              href="/" 
              className={`block font-accent text-secondary hover:text-primary transition duration-200 py-2 ${isActive('/') ? 'text-primary' : ''}`}
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            <Link 
              href="/products" 
              className={`block font-accent text-secondary hover:text-primary transition duration-200 py-2 ${isActive('/products') ? 'text-primary' : ''}`}
              onClick={closeMobileMenu}
            >
              Products
            </Link>
            <Link 
              href="#" 
              className="block font-accent text-secondary hover:text-primary transition duration-200 py-2"
              onClick={closeMobileMenu}
            >
              About
            </Link>
            <Link 
              href="#" 
              className="block font-accent text-secondary hover:text-primary transition duration-200 py-2"
              onClick={closeMobileMenu}
            >
              Contact
            </Link>
            {isAuthenticated ? (
              <Link 
                href="/api/logout" 
                className="block font-accent text-secondary hover:text-primary transition duration-200 py-2"
                onClick={closeMobileMenu}
              >
                Sign Out
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="block font-accent text-secondary hover:text-primary transition duration-200 py-2"
                onClick={closeMobileMenu}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
