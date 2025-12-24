var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertProductSchema: () => insertProductSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  orderItems: () => orderItems,
  orders: () => orders,
  products: () => products,
  sessions: () => sessions,
  transactions: () => transactions,
  users: () => users
});
import {
  pgTable,
  text,
  varchar,
  serial,
  integer,
  timestamp,
  numeric,
  jsonb,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number"),
  address: text("address"),
  shippingAddress: text("shipping_address"),
  city: varchar("city"),
  province: varchar("province"),
  postalCode: varchar("postal_code"),
  country: varchar("country"),
  balance: numeric("balance").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  imageUrl: varchar("image_url", { length: 255 }).notNull(),
  heatLevel: integer("heat_level").notNull().default(1),
  stock: integer("stock").default(100).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertProductSchema = createInsertSchema(products);
var orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  total: numeric("total").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
  paymentTransactionId: varchar("payment_transaction_id"),
  cryptoAddress: varchar("crypto_address"),
  cryptoAmount: varchar("crypto_amount"),
  shippingAddress: text("shipping_address"),
  city: varchar("city"),
  province: varchar("province"),
  postalCode: varchar("postal_code"),
  country: varchar("country"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertOrderSchema = createInsertSchema(orders);
var orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var insertOrderItemSchema = createInsertSchema(orderItems);
var transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: numeric("amount").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  // 'deposit' or 'payment'
  description: text("description"),
  orderId: integer("order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow()
});
var insertTransactionSchema = createInsertSchema(transactions);

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, sql } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async updateUserProfile(id, data) {
    const [updatedUser] = await db.update(users).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  // Product operations
  async getProducts() {
    return await db.select().from(products);
  }
  async getProductById(id) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  // Order operations
  async createOrder(order) {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }
  async addOrderItem(item) {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }
  async getOrdersByUserId(userId) {
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }
  async getOrderItemsByOrderId(orderId) {
    const results = await db.select({
      orderItem: orderItems,
      product: products
    }).from(orderItems).innerJoin(products, eq(orderItems.productId, products.id)).where(eq(orderItems.orderId, orderId));
    return results.map(({ orderItem, product }) => ({
      ...orderItem,
      product
    }));
  }
  // Transaction operations
  async createTransaction(transaction) {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }
  async getTransactionsByUserId(userId) {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }
  // Balance operations
  async updateUserBalance(userId, amount) {
    const [updatedUser] = await db.update(users).set({
      balance: sql`${users.balance} + ${amount}`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
};
var storage = new DatabaseStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  if (!process.env.SESSION_SECRET) {
    console.warn("SESSION_SECRET not found in environment, using a default secret");
    process.env.SESSION_SECRET = "pete_pantry_default_secret_" + Date.now();
  }
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    // Create table if it doesn't exist
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // Allow non-HTTPS in development
      maxAge: sessionTtl,
      sameSite: "lax"
      // Allows for Replit auth redirects
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  const domains = process.env.REPLIT_DOMAINS.split(",");
  for (const domain of domains) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    const hostDomain = req.headers.host || req.hostname;
    console.log("Login request from domain:", hostDomain);
    const domain = process.env.REPLIT_DOMAINS.split(",")[0];
    console.log("Using authentication domain:", domain);
    try {
      passport.authenticate(`replitauth:${domain}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"]
      })(req, res, next);
    } catch (error) {
      console.error("Login authentication error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
  app2.get("/api/callback", (req, res, next) => {
    const hostDomain = req.headers.host || req.hostname;
    console.log("Callback request from domain:", hostDomain);
    const domain = process.env.REPLIT_DOMAINS.split(",")[0];
    console.log("Using authentication domain for callback:", domain);
    try {
      passport.authenticate(`replitauth:${domain}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login"
      })(req, res, next);
    } catch (error) {
      console.error("Callback authentication error:", error);
      res.status(500).json({ error: "Authentication callback failed" });
    }
  });
  app2.get("/api/logout", (req, res) => {
    const domain = process.env.REPLIT_DOMAINS.split(",")[0];
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${domain}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.redirect("/api/login");
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};

// server/routes.ts
import { sql as sql2 } from "drizzle-orm";

// server/services/yoco.ts
import fetch from "node-fetch";
var YOCO_API_URL = "https://online.yoco.com/v1";
async function processYocoPayment(token, amountInCents, currency = "ZAR") {
  const secretKey = process.env.YOCO_SECRET_KEY;
  if (!secretKey) {
    throw new Error("YOCO_SECRET_KEY is not configured");
  }
  const response = await fetch(`${YOCO_API_URL}/charges/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token,
      amountInCents,
      currency
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Yoco payment failed: ${JSON.stringify(error)}`);
  }
  return await response.json();
}

// server/services/luno.ts
import fetch2 from "node-fetch";
var LUNO_API_URL = "https://api.luno.com/api/1";
async function createLunoReceiveAddress(asset) {
  const apiKey = process.env.LUNO_API_KEY;
  const apiSecret = process.env.LUNO_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("LUNO credentials are not configured");
  }
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const response = await fetch2(`${LUNO_API_URL}/funding_address`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      asset
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create LUNO receive address: ${JSON.stringify(error)}`);
  }
  return await response.json();
}
async function checkLunoTransaction(addressId, expectedAmount) {
  const apiKey = process.env.LUNO_API_KEY;
  const apiSecret = process.env.LUNO_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("LUNO credentials are not configured");
  }
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const response = await fetch2(`${LUNO_API_URL}/funding_address/${addressId}`, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${auth}`
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to check LUNO transaction: ${JSON.stringify(error)}`);
  }
  const address = await response.json();
  const received = parseFloat(address.total_received);
  const expected = parseFloat(expectedAmount);
  return received >= expected;
}
function convertZARToCrypto(zarAmount, asset) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch2(`${LUNO_API_URL}/ticker?pair=${asset}ZAR`);
      if (!response.ok) {
        reject(new Error("Failed to get crypto exchange rate"));
        return;
      }
      const data = await response.json();
      const rate = parseFloat(data.last_trade);
      const cryptoAmount = zarAmount / rate;
      resolve(parseFloat(cryptoAmount.toFixed(8)));
    } catch (error) {
      reject(error);
    }
  });
}

// server/routes.ts
async function seedProducts() {
  const productCount = await db.select({ count: sql2`count(*)` }).from(products);
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
async function registerRoutes(app2) {
  await setupAuth(app2);
  await seedProducts();
  app2.get("/api/products", async (req, res) => {
    try {
      const products2 = await storage.getProducts();
      res.json(products2);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  app2.get("/api/products/:id", async (req, res) => {
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
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/auth/simple-login", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const demoUser = {
        id: "demo-user-" + Date.now(),
        email,
        firstName: "Demo",
        lastName: "User",
        profileImageUrl: null,
        balance: "100"
      };
      const user = await storage.upsertUser(demoUser);
      req.login({
        claims: { sub: user.id, email: user.email },
        access_token: "demo-token",
        expires_at: Math.floor(Date.now() / 1e3) + 86400
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
  app2.put("/api/profile", isAuthenticated, async (req, res) => {
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
  app2.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders2 = await storage.getOrdersByUserId(userId);
      res.json(orders2);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  app2.get("/api/orders/:id/items", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const orderItems2 = await storage.getOrderItemsByOrderId(orderId);
      res.json(orderItems2);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });
  app2.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { total, items, useBalance } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (useBalance && Number(user.balance) < total) {
        return res.status(400).json({
          message: "Insufficient balance",
          balance: user.balance
        });
      }
      const order = await storage.createOrder({
        userId,
        total: total.toString(),
        status: "completed"
      });
      const orderItemPromises = items.map(async (item) => {
        const product = await storage.getProductById(item.id);
        if (!product) {
          throw new Error(`Product with ID ${item.id} not found`);
        }
        return storage.addOrderItem({
          orderId: order.id,
          productId: item.id,
          quantity: item.quantity,
          price: product.price.toString()
        });
      });
      await Promise.all(orderItemPromises);
      if (useBalance) {
        await storage.updateUserBalance(userId, -total);
        await storage.createTransaction({
          userId,
          amount: (-total).toString(),
          type: "payment",
          description: `Payment for order #${order.id}`,
          orderId: order.id
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
  app2.post("/api/transactions/deposit", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      const updatedUser = await storage.updateUserBalance(userId, amount);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.createTransaction({
        userId,
        amount: amount.toString(),
        type: "deposit",
        description: "Funds deposit"
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
  app2.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions2 = await storage.getTransactionsByUserId(userId);
      res.json(transactions2);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  app2.post("/api/payment/yoco", isAuthenticated, async (req, res) => {
    try {
      const { token, items, shippingAddress, city, province, postalCode, country } = req.body;
      const userId = req.user.claims.sub;
      if (!token || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Missing required payment information" });
      }
      if (!shippingAddress || !city || !province || !postalCode || !country) {
        return res.status(400).json({ message: "Complete shipping address is required" });
      }
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
          itemTotal
        });
      }
      const shipping = 50;
      verifiedTotal += shipping;
      const amountInCents = Math.round(verifiedTotal * 100);
      const payment = await processYocoPayment(token, amountInCents, "ZAR");
      if (payment.status !== "successful") {
        return res.status(400).json({ message: "Payment failed", details: payment });
      }
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
        country
      });
      for (const item of verifiedItems) {
        await storage.addOrderItem({
          orderId: order.id,
          productId: item.id,
          quantity: item.quantity,
          price: item.price.toString()
        });
      }
      await storage.createTransaction({
        userId,
        amount: verifiedTotal.toString(),
        type: "payment",
        description: `Yoco card payment for order #${order.id}`,
        orderId: order.id
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
  app2.post("/api/payment/crypto/init", isAuthenticated, async (req, res) => {
    try {
      const { asset, items, shippingAddress, city, province, postalCode, country } = req.body;
      const userId = req.user.claims.sub;
      if (!asset || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Missing required payment information" });
      }
      if (!shippingAddress || !city || !province || !postalCode || !country) {
        return res.status(400).json({ message: "Complete shipping address is required" });
      }
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
          itemTotal
        });
      }
      const shipping = 50;
      verifiedTotal += shipping;
      const cryptoAmount = await convertZARToCrypto(verifiedTotal, asset);
      const receiveAddress = await createLunoReceiveAddress(asset);
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
        country
      });
      for (const item of verifiedItems) {
        await storage.addOrderItem({
          orderId: order.id,
          productId: item.id,
          quantity: item.quantity,
          price: item.price.toString()
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
  app2.post("/api/payment/crypto/verify", isAuthenticated, async (req, res) => {
    try {
      const { orderId, addressId, expectedAmount } = req.body;
      const userId = req.user.claims.sub;
      if (!orderId || !addressId || !expectedAmount) {
        return res.status(400).json({ message: "Missing verification parameters" });
      }
      const paymentReceived = await checkLunoTransaction(addressId, expectedAmount);
      if (!paymentReceived) {
        return res.json({
          success: false,
          message: "Payment not yet received"
        });
      }
      await db.execute(sql2`
        UPDATE orders 
        SET status = 'paid', payment_status = 'completed', updated_at = NOW()
        WHERE id = ${orderId} AND user_id = ${userId}
      `);
      await storage.createTransaction({
        userId,
        amount: expectedAmount,
        type: "payment",
        description: `Cryptocurrency payment for order #${orderId}`,
        orderId: parseInt(orderId)
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
