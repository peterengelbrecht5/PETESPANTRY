import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { products, insertOrderSchema, insertOrderItemSchema, insertTransactionSchema } from "@shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { processYocoPayment, verifyYocoPayment } from "./services/yoco";
import { createLunoReceiveAddress, checkLunoTransaction, convertZARToCrypto, type CryptoAsset } from "./services/luno";

// Initialize the database with our products if they don't exist
async function seedProducts() {
  const productCount = await db.select({ count: sql`count(*)` }).from(products);
  
  if (Number(productCount[0].count) === 0) {
    await db.insert(products).values([
      {
        name: "Mild Pineapple & Habanero Marmalade",
        description: "A delicate balance of sweet pineapple and subtle heat, perfect for cheese boards or breakfast toast.",
        price: "60",
        imageUrl: "https://pixabay.com/get/g55a70925c0593ff30365e3a84bf4c691a5c288a394c166046792c3ef660990c9678f1106577d1c8d917317b6b77ac889ab95b998413bb70e6b73e258f36b497a_1280.jpg",
        heatLevel: 1,
        stock: 100
      },
      {
        name: "Xtra Hot Pineapple & Habanero Marmalade",
        description: "Bold flavors of sweet pineapple with an intense habanero kick, perfect for adventurous food lovers.",
        price: "60",
        imageUrl: "https://images.unsplash.com/photo-1515942400420-2b98fed1f515?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
        heatLevel: 3,
        stock: 100
      }
    ]);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Seed products
  await seedProducts();

  // Public routes
  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Simple alternative login for testing
  app.post('/api/auth/simple-login', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Create a demo user or use existing one
      const demoUser = {
        id: "demo-user-" + Date.now(),
        email: email,
        firstName: "Demo",
        lastName: "User",
        profileImageUrl: null,
        balance: "100"
      };
      
      const user = await storage.upsertUser(demoUser);
      
      // Set up the session
      req.login({
        claims: { sub: user.id, email: user.email },
        access_token: "demo-token",
        expires_at: Math.floor(Date.now() / 1000) + 86400
      }, (err) => {
        if (err) {
          console.error("Session setup error:", err);
          return res.status(500).json({ message: "Failed to setup session" });
        }
        
        res.json({ success: true, user });
      });
    } catch (error) {
      console.error("Simple login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Protected routes
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, phoneNumber, address, shippingAddress, city, province, postalCode, country } = req.body;
      
      const updateData = {
        firstName,
        lastName,
        phoneNumber,
        address,
        shippingAddress,
        city,
        province,
        postalCode,
        country
      };
      
      const updatedUser = await storage.updateUserProfile(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrdersByUserId(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id/items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orderId = parseInt(req.params.id);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const orderItems = await storage.getOrderItemsByOrderId(orderId);
      res.json(orderItems);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { total, items, useBalance } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate if using balance
      if (useBalance && Number(user.balance) < total) {
        return res.status(400).json({ 
          message: "Insufficient balance", 
          balance: user.balance 
        });
      }
      
      // Create order
      const order = await storage.createOrder({
        userId,
        total: total.toString(),
        status: "completed",
      });
      
      // Add order items
      const orderItemPromises = items.map(async (item: any) => {
        const product = await storage.getProductById(item.id);
        if (!product) {
          throw new Error(`Product with ID ${item.id} not found`);
        }
        
        return storage.addOrderItem({
          orderId: order.id,
          productId: item.id,
          quantity: item.quantity,
          price: product.price.toString(),
        });
      });
      
      await Promise.all(orderItemPromises);
      
      // If using balance, update user balance
      if (useBalance) {
        await storage.updateUserBalance(userId, -total);
        
        // Create transaction record
        await storage.createTransaction({
          userId,
          amount: (-total).toString(),
          type: "payment",
          description: `Payment for order #${order.id}`,
          orderId: order.id,
        });
      }
      
      res.status(201).json({ 
        message: "Order created successfully", 
        order,
        newBalance: useBalance ? Number(user.balance) - total : user.balance
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.post('/api/transactions/deposit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      // Update user balance
      const updatedUser = await storage.updateUserBalance(userId, amount);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create transaction record
      await storage.createTransaction({
        userId,
        amount: amount.toString(),
        type: "deposit",
        description: "Funds deposit",
      });
      
      res.status(201).json({ 
        message: "Deposit successful", 
        newBalance: updatedUser.balance 
      });
    } catch (error) {
      console.error("Error making deposit:", error);
      res.status(500).json({ message: "Failed to process deposit" });
    }
  });

  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getTransactionsByUserId(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Payment routes
  app.post('/api/payment/yoco', isAuthenticated, async (req: any, res) => {
    try {
      const { token, items, shippingAddress, city, province, postalCode, country } = req.body;
      const userId = req.user.claims.sub;

      if (!token || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Missing required payment information" });
      }

      // Validate shipping address
      if (!shippingAddress || !city || !province || !postalCode || !country) {
        return res.status(400).json({ message: "Complete shipping address is required" });
      }

      // Re-fetch products server-side and calculate verified total
      let verifiedTotal = 0;
      const verifiedItems = [];
      
      for (const item of items) {
        const product = await storage.getProductById(item.id);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.id} not found` });
        }
        
        if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
          return res.status(400).json({ message: "Invalid quantity" });
        }
        
        const itemTotal = Number(product.price) * item.quantity;
        verifiedTotal += itemTotal;
        
        verifiedItems.push({
          id: product.id,
          quantity: item.quantity,
          price: product.price,
          itemTotal,
        });
      }

      // Add shipping
      const shipping = 50;
      verifiedTotal += shipping;

      // Process Yoco payment with verified amount
      const amountInCents = Math.round(verifiedTotal * 100);
      const payment = await processYocoPayment(token, amountInCents, 'ZAR');

      if (payment.status !== 'successful') {
        return res.status(400).json({ message: "Payment failed", details: payment });
      }

      // Create order with verified total
      const order = await storage.createOrder({
        userId,
        total: verifiedTotal.toString(),
        status: "paid",
        paymentMethod: "yoco_card",
        paymentStatus: "completed",
        paymentTransactionId: payment.id,
        shippingAddress,
        city,
        province,
        postalCode,
        country,
      });

      // Add order items with verified prices
      for (const item of verifiedItems) {
        await storage.addOrderItem({
          orderId: order.id,
          productId: item.id,
          quantity: item.quantity,
          price: item.price.toString(),
        });
      }

      // Create transaction record with verified amount
      await storage.createTransaction({
        userId,
        amount: verifiedTotal.toString(),
        type: "payment",
        description: `Yoco card payment for order #${order.id}`,
        orderId: order.id,
      });

      res.status(201).json({ 
        success: true,
        order,
        paymentId: payment.id,
        amountCharged: verifiedTotal
      });
    } catch (error) {
      console.error("Yoco payment error:", error);
      res.status(500).json({ 
        message: "Payment processing failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post('/api/payment/crypto/init', isAuthenticated, async (req: any, res) => {
    try {
      const { asset, items, shippingAddress, city, province, postalCode, country } = req.body;
      const userId = req.user.claims.sub;

      if (!asset || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Missing required payment information" });
      }

      // Validate shipping address
      if (!shippingAddress || !city || !province || !postalCode || !country) {
        return res.status(400).json({ message: "Complete shipping address is required" });
      }

      // Re-fetch products server-side and calculate verified total
      let verifiedTotal = 0;
      const verifiedItems = [];
      
      for (const item of items) {
        const product = await storage.getProductById(item.id);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.id} not found` });
        }
        
        if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
          return res.status(400).json({ message: "Invalid quantity" });
        }
        
        const itemTotal = Number(product.price) * item.quantity;
        verifiedTotal += itemTotal;
        
        verifiedItems.push({
          id: product.id,
          quantity: item.quantity,
          price: product.price,
          itemTotal,
        });
      }

      // Add shipping
      const shipping = 50;
      verifiedTotal += shipping;

      // Convert ZAR to crypto
      const cryptoAmount = await convertZARToCrypto(verifiedTotal, asset as CryptoAsset);
      
      // Create receive address
      const receiveAddress = await createLunoReceiveAddress(asset as CryptoAsset);

      // Create pending order with verified total
      const order = await storage.createOrder({
        userId,
        total: verifiedTotal.toString(),
        status: "pending_payment",
        paymentMethod: `crypto_${asset.toLowerCase()}`,
        paymentStatus: "pending",
        cryptoAddress: receiveAddress.address,
        cryptoAmount: cryptoAmount.toString(),
        shippingAddress,
        city,
        province,
        postalCode,
        country,
      });

      // Add order items with verified prices
      for (const item of verifiedItems) {
        await storage.addOrderItem({
          orderId: order.id,
          productId: item.id,
          quantity: item.quantity,
          price: item.price.toString(),
        });
      }

      res.status(201).json({ 
        success: true,
        order,
        cryptoAddress: receiveAddress.address,
        cryptoAmount,
        asset,
        addressId: receiveAddress.id,
        verifiedTotal
      });
    } catch (error) {
      console.error("Crypto payment init error:", error);
      res.status(500).json({ 
        message: "Failed to initialize crypto payment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post('/api/payment/crypto/verify', isAuthenticated, async (req: any, res) => {
    try {
      const { orderId, addressId, expectedAmount } = req.body;
      const userId = req.user.claims.sub;

      if (!orderId || !addressId || !expectedAmount) {
        return res.status(400).json({ message: "Missing verification parameters" });
      }

      // Check if payment received
      const paymentReceived = await checkLunoTransaction(addressId, expectedAmount);

      if (!paymentReceived) {
        return res.json({ 
          success: false,
          message: "Payment not yet received"
        });
      }

      // Update order status
      await db.execute(sql`
        UPDATE orders 
        SET status = 'paid', payment_status = 'completed', updated_at = NOW()
        WHERE id = ${orderId} AND user_id = ${userId}
      `);

      // Create transaction record
      await storage.createTransaction({
        userId,
        amount: expectedAmount,
        type: "payment",
        description: `Cryptocurrency payment for order #${orderId}`,
        orderId: parseInt(orderId),
      });

      res.json({ 
        success: true,
        message: "Payment confirmed"
      });
    } catch (error) {
      console.error("Crypto verification error:", error);
      res.status(500).json({ 
        message: "Failed to verify payment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
