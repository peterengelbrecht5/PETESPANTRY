import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PageLoader, Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { formatDistance } from 'date-fns';

// Form schema
const profileFormSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  shippingAddress: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

const depositFormSchema = z.object({
  amount: z.string().refine(val => {
    const num = Number(val);
    return !isNaN(num) && num >= 50;
  }, { message: "Amount must be at least R50" }),
  paymentMethod: z.enum(["credit-card", "debit-card", "eft"]),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type DepositFormData = z.infer<typeof depositFormSchema>;

export default function Profile() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    navigate('/api/login');
    return null;
  }
  
  if (isLoading || !user) {
    return <PageLoader />;
  }
  
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row">
        <ProfileSidebar user={user} />
        <div className="w-full md:w-3/4 md:pl-8">
          <Tabs defaultValue="profile">
            <TabsList className="hidden md:flex w-full mb-6">
              <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
              <TabsTrigger value="orders" className="flex-1">Order History</TabsTrigger>
              <TabsTrigger value="account" className="flex-1">Account Balance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <ProfileTab user={user} />
            </TabsContent>
            
            <TabsContent value="orders">
              <OrdersTab userId={user.id} />
            </TabsContent>
            
            <TabsContent value="account">
              <AccountTab userId={user.id} balance={Number(user.balance)} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ProfileSidebar({ user }: { user: any }) {
  const [tab, setTab] = useState('profile');
  
  return (
    <div className="w-full md:w-1/4 mb-8 md:mb-0">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="object-cover w-full h-full" />
              ) : (
                <FontAwesomeIcon icon={faUser} className="text-gray-500 text-2xl" />
              )}
            </div>
            <div className="ml-4">
              <p className="font-bold text-lg">{user.firstName || user.email || "User"}</p>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>
          
          <nav className="space-y-2 md:hidden">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full">
                <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
                <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
                <TabsTrigger value="account" className="flex-1">Balance</TabsTrigger>
              </TabsList>
            </Tabs>
          </nav>
          
          <nav className="space-y-2 hidden md:block">
            <Button 
              variant={tab === 'profile' ? 'default' : 'outline'} 
              className="w-full justify-start"
              onClick={() => setTab('profile')}
            >
              Profile
            </Button>
            <Button 
              variant={tab === 'orders' ? 'default' : 'outline'} 
              className="w-full justify-start"
              onClick={() => setTab('orders')}
            >
              Order History
            </Button>
            <Button 
              variant={tab === 'account' ? 'default' : 'outline'} 
              className="w-full justify-start"
              onClick={() => setTab('account')}
            >
              Account Balance
            </Button>
            <a href="/api/logout">
              <Button 
                variant="outline" 
                className="w-full justify-start text-gray-700 hover:bg-gray-100 mt-6"
              >
                Sign Out
              </Button>
            </a>
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileTab({ user }: { user: any }) {
  const { toast } = useToast();
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      shippingAddress: user.shippingAddress || '',
      city: user.city || '',
      province: user.province || '',
      postalCode: user.postalCode || '',
      country: user.country || 'South Africa',
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest('PUT', '/api/profile', data);
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update profile',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };
  
  return (
    <Card>
      <CardContent className="p-8">
        <h2 className="font-heading text-2xl font-bold mb-6">My Profile</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your billing address" 
                      className="resize-none" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-lg mb-4">Shipping Information</h3>
              
              <FormField
                control={form.control}
                name="shippingAddress"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Shipping Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Street address" 
                        className="resize-none" 
                        rows={2}
                        {...field} 
                        data-testid="input-shipping-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province</FormLabel>
                      <FormControl>
                        <Input placeholder="Province" {...field} data-testid="input-province" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Postal code" {...field} data-testid="input-postal-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Country" {...field} data-testid="input-country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="font-accent bg-primary hover:bg-opacity-90 text-white font-semibold"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <><Loader size="sm" className="mr-2" /> Saving...</>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function OrdersTab({ userId }: { userId: string }) {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['/api/orders'],
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }
  
  if (error || !orders || orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h2 className="font-heading text-2xl font-bold mb-6">Order History</h2>
          <p className="text-gray-500">You haven't placed any orders yet.</p>
          <Button asChild className="mt-4">
            <a href="/products">Browse Products</a>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-8">
        <h2 className="font-heading text-2xl font-bold mb-6">Order History</h2>
        
        <div className="space-y-6">
          {orders.map((order: any) => (
            <OrderItem key={order.id} order={order} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OrderItem({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const { data: orderItems, isLoading } = useQuery({
    queryKey: [`/api/orders/${order.id}/items`],
    enabled: expanded,
  });
  
  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <p className="font-bold">Order #{order.id}</p>
          <p className="text-sm text-gray-500">Placed on {formattedDate}</p>
        </div>
        <div className="mt-2 sm:mt-0">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            order.status === 'completed' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>
      
      {expanded && orderItems && (
        <div className="p-4 border-t border-gray-200">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader />
            </div>
          ) : (
            <div className="space-y-4">
              {orderItems.map((item: any) => (
                <div key={item.id} className="flex items-center space-x-4 py-2">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">R{Number(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="p-4 border-t border-gray-200 flex justify-between">
        <div>
          <p className="text-sm text-gray-500">Total</p>
          <p className="font-bold">R{Number(order.total).toFixed(2)}</p>
        </div>
        <Button
          variant="ghost"
          className="text-primary hover:text-opacity-80 font-semibold text-sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide Details' : 'View Details'}
        </Button>
      </div>
    </div>
  );
}

function AccountTab({ userId, balance }: { userId: string, balance: number }) {
  const { toast } = useToast();
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/transactions'],
  });
  
  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: '',
      paymentMethod: 'credit-card',
    },
  });
  
  const depositMutation = useMutation({
    mutationFn: async (data: { amount: number }) => {
      const response = await apiRequest('POST', '/api/transactions/deposit', data);
      if (!response.ok) {
        throw new Error('Failed to process deposit');
      }
      return await response.json();
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: 'Deposit successful',
        description: 'Funds have been added to your account.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Deposit failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: DepositFormData) => {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount < 50) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount (minimum R50).',
        variant: 'destructive',
      });
      return;
    }
    
    depositMutation.mutate({ amount });
  };
  
  return (
    <Card>
      <CardContent className="p-8">
        <h2 className="font-heading text-2xl font-bold mb-6">Account Balance</h2>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500">Current Balance</p>
            <p className="font-bold text-xl">R{balance.toFixed(2)}</p>
          </div>
          
          <div className="h-2 bg-gray-200 rounded-full mb-2">
            <div 
              className="h-2 bg-primary rounded-full" 
              style={{ width: `${Math.min(balance/1000 * 100, 100)}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-gray-500">Use your balance to pay for future orders</p>
        </div>
        
        <h3 className="font-heading text-xl font-bold mb-4">Add Funds</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (R)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      min="50"
                      step="10"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Minimum deposit: R50</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      {...field}
                    >
                      <option value="credit-card">Credit Card</option>
                      <option value="debit-card">Debit Card</option>
                      <option value="eft">Bank Transfer (EFT)</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="font-accent bg-primary hover:bg-opacity-90 text-white font-semibold"
              disabled={depositMutation.isPending}
            >
              {depositMutation.isPending ? (
                <><Loader size="sm" className="mr-2" /> Processing...</>
              ) : (
                'Add Funds'
              )}
            </Button>
          </form>
        </Form>
        
        <div className="mt-8">
          <h3 className="font-heading text-xl font-bold mb-4">Transaction History</h3>
          
          {isLoadingTransactions ? (
            <div className="flex justify-center py-4">
              <Loader />
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No transactions yet</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction: any) => (
                <div key={transaction.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      {transaction.type === 'deposit' ? 'Deposit' : 
                       transaction.type === 'payment' ? `Order #${transaction.orderId} Payment` : 
                       transaction.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDistance(new Date(transaction.createdAt), new Date(), { addSuffix: true })}
                    </p>
                  </div>
                  <p className={`font-semibold ${
                    transaction.type === 'deposit' ? 'text-success' : 'text-accent'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : ''}
                    R{Number(transaction.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
