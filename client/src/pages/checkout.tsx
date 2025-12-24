import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/cart-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { PageLoader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Bitcoin } from 'lucide-react';

type PaymentMethod = 'card' | 'crypto';
type CryptoAsset = 'XBT' | 'ETH' | 'USDT' | 'DOGE' | 'XMR';

export default function Checkout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cryptoAsset, setCryptoAsset] = useState<CryptoAsset>('XBT');
  const [processing, setProcessing] = useState(false);
  const [cryptoPaymentData, setCryptoPaymentData] = useState<any>(null);
  
  // Shipping form state
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('South Africa');

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/api/login');
    }
    if (cartItems.length === 0 && !cryptoPaymentData) {
      navigate('/cart');
    }
  }, [isLoading, isAuthenticated, cartItems, navigate, cryptoPaymentData]);

  // Pre-fill shipping from user profile
  useEffect(() => {
    if (user) {
      setShippingAddress(user.shippingAddress || '');
      setCity(user.city || '');
      setProvince(user.province || '');
      setPostalCode(user.postalCode || '');
      setCountry(user.country || 'South Africa');
    }
  }, [user]);

  if (isLoading || !user) {
    return <PageLoader />;
  }

  if (cartItems.length === 0 && !cryptoPaymentData) {
    return null;
  }

  const total = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const shipping = 50;
  const grandTotal = total + shipping;

  const handleCardPayment = async () => {
    if (!shippingAddress || !city || !province || !postalCode || !country) {
      toast({
        title: 'Incomplete shipping information',
        description: 'Please fill in all shipping details',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    try {
      // Check if Yoco SDK is loaded
      if (typeof (window as any).YocoSDK === 'undefined') {
        throw new Error('Payment system is not available. Please refresh the page and try again.');
      }

      // Load Yoco Inline JS
      const yoco = new (window as any).YocoSDK({
        publicKey: import.meta.env.VITE_YOCO_PUBLIC_KEY || 'pk_live_257021379AZKeP17a684',
      });

      yoco.showPopup({
        amountInCents: Math.round(grandTotal * 100),
        currency: 'ZAR',
        name: "Pete's Pantry",
        description: 'Artisanal Marmalade Order',
        callback: async function (result: any) {
          if (result.error) {
            toast({
              title: 'Payment failed',
              description: result.error.message,
              variant: 'destructive',
            });
            setProcessing(false);
            return;
          }

          try {
            // Process payment on backend
            const response = await apiRequest('POST', '/api/payment/yoco', {
              token: result.id,
              items: cartItems,
              shippingAddress,
              city,
              province,
              postalCode,
              country,
            });

            if (!response.ok) {
              const error = await response.json();
              toast({
                title: 'Payment processing failed',
                description: error.message,
                variant: 'destructive',
              });
              setProcessing(false);
              return;
            }

            const data = await response.json();
            
            toast({
              title: 'Payment successful!',
              description: `Order #${data.order.id} has been placed successfully.`,
            });

            clearCart();
            queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
            navigate('/profile?tab=orders');
          } catch (error) {
            console.error('Payment backend error:', error);
            toast({
              title: 'Payment processing failed',
              description: error instanceof Error ? error.message : 'An error occurred',
              variant: 'destructive',
            });
            setProcessing(false);
          }
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      setProcessing(false);
    }
  };

  const handleCryptoPayment = async () => {
    if (!shippingAddress || !city || !province || !postalCode || !country) {
      toast({
        title: 'Incomplete shipping information',
        description: 'Please fill in all shipping details',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    try {
      const response = await apiRequest('POST', '/api/payment/crypto/init', {
        asset: cryptoAsset,
        items: cartItems,
        shippingAddress,
        city,
        province,
        postalCode,
        country,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const data = await response.json();
      setCryptoPaymentData(data);

      toast({
        title: 'Crypto payment initialized',
        description: `Please send ${data.cryptoAmount} ${data.asset} to the address shown`,
      });
    } catch (error) {
      console.error('Crypto payment error:', error);
      toast({
        title: 'Failed to initialize payment',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      setProcessing(false);
    }
  };

  const checkCryptoPayment = async () => {
    if (!cryptoPaymentData) return;

    setProcessing(true);

    try {
      const response = await apiRequest('POST', '/api/payment/crypto/verify', {
        orderId: cryptoPaymentData.order.id,
        addressId: cryptoPaymentData.addressId,
        expectedAmount: cryptoPaymentData.cryptoAmount.toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Payment confirmed!',
          description: `Order #${cryptoPaymentData.order.id} has been confirmed.`,
        });

        clearCart();
        setCryptoPaymentData(null);
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        navigate('/profile?tab=orders');
      } else {
        toast({
          title: 'Payment not received yet',
          description: 'Please wait for the transaction to be confirmed',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: 'Verification failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main checkout form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street address"
                  data-testid="input-checkout-address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    data-testid="input-checkout-city"
                  />
                </div>
                <div>
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Province"
                    data-testid="input-checkout-province"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Postal code"
                    data-testid="input-checkout-postal"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                    data-testid="input-checkout-country"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          {!cryptoPaymentData && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                  <div className="flex items-center space-x-2 mb-4 p-4 border rounded-lg">
                    <RadioGroupItem value="card" id="card" data-testid="radio-payment-card" />
                    <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                      <CreditCard className="mr-2 text-primary" />
                      <span>Credit/Debit Card (Yoco)</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="crypto" id="crypto" data-testid="radio-payment-crypto" />
                    <Label htmlFor="crypto" className="flex items-center cursor-pointer flex-1">
                      <Bitcoin className="mr-2 text-secondary" />
                      <span>Cryptocurrency</span>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === 'crypto' && (
                  <div className="mt-4">
                    <Label htmlFor="cryptoAsset">Select Cryptocurrency</Label>
                    <RadioGroup value={cryptoAsset} onValueChange={(value) => setCryptoAsset(value as CryptoAsset)} className="mt-2">
                      <div className="flex items-center space-x-2 p-2 border rounded">
                        <RadioGroupItem value="XBT" id="btc" />
                        <Label htmlFor="btc" className="cursor-pointer flex-1">Bitcoin (BTC)</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 border rounded">
                        <RadioGroupItem value="ETH" id="eth" />
                        <Label htmlFor="eth" className="cursor-pointer flex-1">Ethereum (ETH)</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 border rounded">
                        <RadioGroupItem value="USDT" id="usdt" />
                        <Label htmlFor="usdt" className="cursor-pointer flex-1">Tether (USDT)</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 border rounded">
                        <RadioGroupItem value="DOGE" id="doge" />
                        <Label htmlFor="doge" className="cursor-pointer flex-1">Dogecoin (DOGE)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Crypto Payment Display */}
          {cryptoPaymentData && (
            <Card className="border-secondary">
              <CardHeader>
                <CardTitle className="text-secondary">Cryptocurrency Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-black p-4 rounded-lg text-center">
                  <p className="text-gray-400 mb-2">Send exactly</p>
                  <p className="text-3xl font-bold text-secondary mb-2">{cryptoPaymentData.cryptoAmount} {cryptoPaymentData.asset}</p>
                  <p className="text-gray-400 mb-4">to this address:</p>
                  <p className="text-sm font-mono bg-gray-900 p-3 rounded break-all text-gray-300">{cryptoPaymentData.cryptoAddress}</p>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>• Order #{cryptoPaymentData.order.id} created</p>
                  <p>• Waiting for blockchain confirmation</p>
                  <p>• This may take a few minutes</p>
                </div>

                <Button 
                  onClick={checkCryptoPayment} 
                  disabled={processing}
                  className="w-full bg-secondary hover:bg-secondary/90 text-black"
                  data-testid="button-verify-crypto"
                >
                  {processing ? 'Checking...' : 'Check Payment Status'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span>R{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>R{total.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>R{shipping.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>R{grandTotal.toFixed(2)}</span>
              </div>

              {!cryptoPaymentData && (
                <Button 
                  onClick={paymentMethod === 'card' ? handleCardPayment : handleCryptoPayment}
                  disabled={processing}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  data-testid="button-complete-payment"
                >
                  {processing ? 'Processing...' : `Pay R${grandTotal.toFixed(2)}`}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
