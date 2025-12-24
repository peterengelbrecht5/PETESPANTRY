import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { SimpleLogin } from '@/components/simple-login';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt } from '@fortawesome/free-solid-svg-icons';

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect to profile if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12">Sign In to Pete's Pantry</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Replit Auth */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Sign in with Replit</h2>
          <p className="text-gray-600 mb-6 text-center">
            Use your Replit account to sign in securely to Pete's Pantry.
          </p>
          
          <div className="flex justify-center">
            <Button 
              className="font-accent bg-primary hover:bg-opacity-90 text-white font-semibold py-3 px-6"
              asChild
            >
              <a href="/api/login">
                <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
                Sign in with Replit
              </a>
            </Button>
          </div>
        </div>
        
        {/* Simple Login */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <SimpleLogin />
        </div>
      </div>
    </div>
  );
}