import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { collection, onSnapshot, doc, getDoc, setDoc, writeBatch, query, where } from "firebase/firestore";
import { auth, db, OperationType, handleFirestoreError } from "../lib/firebase";
import { checkAndSeedDatabase } from "../lib/seeding";
import { Product, Category, CartItem, Order, UserProfile } from "../types";

interface StoreContext {
  user: User | null;
  profile: UserProfile | null;
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  orders: Order[];
  isHydrating: boolean;
  hydrationMessage: string;
  isCheckingOut: boolean;
  
  // Cart operations
  addToCart: (product: Product, qty: number) => { success: boolean; error?: string };
  updateCartQuantity: (productId: string, qty: number) => { success: boolean; error?: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartCategoryTotal: (categoryId: string) => number;
  getCategoryRemainingBudget: (categoryId: string) => number;
  
  // Auth operations
  logout: () => Promise<void>;
  
  // Checkout operation
  checkoutCart: (customerName: string, deliveryAddress?: string, notes?: string) => Promise<{ success: boolean; orderId?: string; error?: string }>;
}

const StoreContext = createContext<StoreContext | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Hydration status
  const [isHydrating, setIsHydrating] = useState(true);
  const [hydrationMessage, setHydrationMessage] = useState("Checking Edge Mart core database...");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // 1. Core Seeding & Subscriptions Init
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initializeStore = async () => {
      try {
        // Run database check / seed first
        await checkAndSeedDatabase((msg) => setHydrationMessage(msg));
        
        setIsHydrating(false);

        // Subscribe to Categories
        const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
          const list: Category[] = [];
          snap.forEach((docSnap) => {
            list.push(docSnap.data() as Category);
          });
          setCategories(list);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, "categories");
        });
        unsubs.push(unsubCategories);

        // Subscribe to Products
        const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
          const list: Product[] = [];
          snap.forEach((docSnap) => {
            list.push(docSnap.data() as Product);
          });
          setProducts(list);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, "products");
        });
        unsubs.push(unsubProducts);

      } catch (err: any) {
        console.error("Store init failure", err);
        setIsHydrating(false);
      }
    };

    initializeStore();

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, []);

  // 2. Auth state observer
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create profile
        const userRef = doc(db, "users", currentUser.uid);
        const profileSnap = await getDoc(userRef);
        
        let pData: UserProfile;
        
        if (profileSnap.exists()) {
          pData = profileSnap.data() as UserProfile;
          if (currentUser.email === "edgemartstores.site@gmail.com" && pData.role !== "admin") {
            pData.role = "admin";
            try {
              await setDoc(userRef, { role: "admin" }, { merge: true });
            } catch (roleErr) {
              console.warn("Could not sync admin role to DB:", roleErr);
            }
          }
        } else {
          // Auto promotion for administrative emails
          const isAdminEmail =
            currentUser.email === "edgemartstores.site@gmail.com";

          pData = {
            id: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split("@")[0] || "Edge Customer",
            email: currentUser.email || "",
            role: isAdminEmail ? "admin" : "user",
            createdAt: new Date().toISOString()
          };

          try {
            await setDoc(userRef, pData);
          } catch (createProfileErr) {
            console.warn("Could not persist user profile to DB:", createProfileErr);
          }
        }
        setProfile(pData);

        // Subscribe to private orders, applying query dynamic constraints based on role
        const ordersQuery = pData.role === "admin" 
          ? collection(db, "orders")
          : query(collection(db, "orders"), where("userId", "==", currentUser.uid));

        const unsubOrders = onSnapshot(ordersQuery, (snap) => {
          const uOrders: Order[] = [];
          snap.forEach((docSnap) => {
            uOrders.push(docSnap.data() as Order);
          });
          // Sort by date newest first
          uOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(uOrders);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, "orders");
        });
        
        return () => unsubOrders();
      } else {
        setProfile(null);
        setOrders([]);
      }
    });

    return () => unsubAuth();
  }, [user?.uid]);

  // 3. Helper: calculate current cart amount for a category
  const getCartCategoryTotal = (categoryId: string): number => {
    return cart
      .filter((item) => item.product.category === categoryId)
      .reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  // 4. Helper: dynamic remaining budget calculation
  const getCategoryRemainingBudget = (categoryId: string): number => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return 0;
    // budget - active total spent in DB - candidate checkout total in active cart
    const activeSpent = category.spent || 0;
    const cartPending = getCartCategoryTotal(categoryId);
    return Math.max(0, category.budget - activeSpent - cartPending);
  };

  // 5. Cart Guard Logic during modification
  const addToCart = (product: Product, qty: number): { success: boolean; error?: string } => {
    // Check stock
    const existingCartItem = cart.find((item) => item.product.id === product.id);
    const candidateQty = (existingCartItem?.quantity || 0) + qty;
    
    if (candidateQty > product.stock) {
      return { success: false, error: `Available stock is limited to ${product.stock} units.` };
    }

    // Check category budget ceiling
    const category = categories.find((c) => c.id === product.category);
    if (category) {
      const activeSpentInDB = category.spent || 0;
      // All other items from this category currently in cart (excluding the product's previous cart sum)
      const otherCartSpends = cart
        .filter((item) => item.product.category === product.category && item.product.id !== product.id)
        .reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      const computedNewCategorySpend = activeSpentInDB + otherCartSpends + (product.price * candidateQty);
      
      if (computedNewCategorySpend > category.budget) {
        const allowedMaxNewSpend = category.budget - activeSpentInDB - otherCartSpends;
        const purchaseAllowance = Math.floor(allowedMaxNewSpend / product.price);
        return {
          success: false,
          error: `Under Edge Mart budget controls, adding this item would exceed the ${category.name} ceiling of $${category.budget.toLocaleString()}. You can add at most ${Math.max(0, purchaseAllowance)} more of this item.`
        };
      }
    }

    // Pass rules, update state
    if (existingCartItem) {
      setCart(cart.map((item) => item.product.id === product.id ? { ...item, quantity: candidateQty } : item));
    } else {
      setCart([...cart, { product, quantity: qty }]);
    }
    return { success: true };
  };

  // 6. Update Quantity in Cart
  const updateCartQuantity = (productId: string, qty: number): { success: boolean; error?: string } => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return { success: false, error: "Product not in cart" };

    if (qty <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    // Check stock
    if (qty > item.product.stock) {
      return { success: false, error: `Inventory contains only ${item.product.stock} items of ${item.product.name}.` };
    }

    // Check budget
    const category = categories.find((c) => c.id === item.product.category);
    if (category) {
      const activeSpentInDB = category.spent || 0;
      const otherCartSpends = cart
        .filter((i) => i.product.category === item.product.category && i.product.id !== productId)
        .reduce((sum, i) => sum + i.product.price * i.quantity, 0);

      const computedNewCategorySpend = activeSpentInDB + otherCartSpends + (item.product.price * qty);

      if (computedNewCategorySpend > category.budget) {
        return {
          success: false,
          error: `Increasing this item's quantity would exceed the strict budget limit for ${category.name} ($${category.budget.toLocaleString()}).`
        };
      }
    }

    setCart(cart.map((i) => i.product.id === productId ? { ...i, quantity: qty } : i));
    return { success: true };
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Sign out helper
  const logout = async () => {
    await signOut(auth);
  };

  // 7. Atomic transaction checkout process
  const checkoutCart = async (customerName: string, deliveryAddress?: string, notes?: string): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    console.log("[PROCUREMENT CHECKOUT] Initiating procurement submission flow...");
    
    if (!user) {
      console.error("[PROCUREMENT CHECKOUT] Blocked: Authentication required.");
      return { success: false, error: "Sign in required to perform checkout operations." };
    }
    if (cart.length === 0) {
      console.warn("[PROCUREMENT CHECKOUT] Blocked: Cart is empty.");
      return { success: false, error: "Shopping cart is empty." };
    }
    if (isCheckingOut) {
      console.warn("[PROCUREMENT CHECKOUT] Blocked: Duplicate submission prevented. A transaction is already in progress.");
      return { success: false, error: "A checkout operation is currently processing. Please wait." };
    }

    setIsCheckingOut(true);

    try {
      console.log(`[PROCUREMENT CHECKOUT] Step 1/5: Formatting reference numbers for customer: ${customerName}`);
      const newOrderId = `order_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const configDocRandom = Math.floor(1000 + Math.random() * 9000);
      const procurementRefNum = `PR-${formattedDate}-${configDocRandom}`;
      
      console.log(`[PROCUREMENT CHECKOUT] Generated Order ID: ${newOrderId}, Reference: ${procurementRefNum}`);

      // Re-read current database status to prevent double-spending in race conditions
      const batch = writeBatch(db);
      const categoryTotalMap: Record<string, number> = {};
      
      // Calculate spending breakdown for order record
      cart.forEach((item) => {
        const catId = item.product.category;
        categoryTotalMap[catId] = (categoryTotalMap[catId] || 0) + item.product.price * item.quantity;
      });

      console.log("[PROCUREMENT CHECKOUT] Step 2/5: Verifying category limits and pre-allocating budgets...");
      // 1. Verify and increment categories expenditures
      for (const [catId, amount] of Object.entries(categoryTotalMap)) {
        const catRef = doc(db, "categories", catId);
        const catSnap = await getDoc(catRef);
        
        if (!catSnap.exists()) {
          throw new Error(`Integrity error: Category '${catId}' not found in registry.`);
        }
        
        const catData = catSnap.data() as Category;
        const newSpent = (catData.spent || 0) + amount;
        
        console.log(`[PROCUREMENT CHECKOUT] Category check: ${catData.name}. Current Spent: $${catData.spent}, Incrementing: $${amount}, New Spent: $${newSpent}, Limit: $${catData.budget}`);
        
        if (newSpent > catData.budget) {
          throw new Error(`Checkout Aborted: ${catData.name} budget exceeded. Current Spent: $${catData.spent.toLocaleString()}, Cart Amount: $${amount.toLocaleString()}, Budget: $${catData.budget.toLocaleString()}`);
        }

        batch.update(catRef, { spent: newSpent });
      }

      console.log("[PROCUREMENT CHECKOUT] Step 3/5: Checking active catalog inventory reservations...");
      // 2. Verify and decrement product inventory stocks
      for (const item of cart) {
        const prodRef = doc(db, "products", item.product.id);
        const prodSnap = await getDoc(prodRef);
        
        if (!prodSnap.exists()) {
          throw new Error(`Inventory core collision: '${item.product.name}' was removed from store catalog.`);
        }

        const prodData = prodSnap.data() as Product;
        const remainingStock = (prodData.stock || 0) - item.quantity;
        
        console.log(`[PROCUREMENT CHECKOUT] Product stock query: ${prodData.name}. Available: ${prodData.stock}, Reserving: ${item.quantity}, Remaining: ${remainingStock}`);
        
        if (remainingStock < 0) {
          throw new Error(`Stock Outage: '${item.product.name}' has only ${prodData.stock} items remaining.`);
        }

        batch.update(prodRef, { stock: remainingStock });
      }

      console.log("[PROCUREMENT CHECKOUT] Step 4/5: Compiling general ledger audit payload...");
      // 3. Create the Order document
      const orderRef = doc(db, "orders", newOrderId);

      const formattedDeliveryAddress = deliveryAddress 
        ? `${deliveryAddress}${notes ? ` (Notes: ${notes})` : ""}`
        : "Direct Dock Delivery";

      const orderData: Order = {
        id: newOrderId,
        userId: user.uid,
        items: cart.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          category: i.product.category
        })),
        totalAmount: cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
        categoryBreakdown: categoryTotalMap,
        createdAt: new Date().toISOString(),
        status: "pending",
        deliveryInfo: formattedDeliveryAddress
      };

      batch.set(orderRef, orderData);

      console.log("[PROCUREMENT CHECKOUT] Step 5/5: Initiating transaction commit to cloud Firestore...");
      // Commit full batch to firestore
      await batch.commit();
      console.log("[PROCUREMENT CHECKOUT] Transaction successfully committed. Database ledger synchronized.");

      // 4. Notify Administrator about the new procurement request
      try {
        console.log("[PROCUREMENT CHECKOUT] Depositing admin dashboard notification...");
        const adminNotifId = `not_admin_${Date.now()}`;
        const adminNotifRef = doc(db, "notifications", adminNotifId);
        await setDoc(adminNotifRef, {
          id: adminNotifId,
          userId: "admin", // Administrator designated
          title: "New Procurement Request",
          message: `Procurement Request ${procurementRefNum} (\$${orderData.totalAmount.toFixed(2)}) was submitted by ${customerName}. Status is pending clearance.`,
          read: false,
          createdAt: new Date().toISOString()
        });
        console.log("[PROCUREMENT CHECKOUT] Admin notification documented.");
      } catch (notifErr) {
        console.warn("[PROCUREMENT CHECKOUT] Non-blocking warn: Admin notification failed:", notifErr);
      }

      // 5. Call server-side API proxy to dispatch invoice email receipt
      const checkoutTotal = orderData.totalAmount;
      const checkoutItems = orderData.items;
      const checkoutBreakdown = orderData.categoryBreakdown;
      const checkoutTimestamp = orderData.createdAt;

      try {
        console.log("[PROCUREMENT CHECKOUT] Dispatching official invoice receipt notification...");
        const mailRes = await fetch("/api/send-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: customerName || profile?.name || user.email?.split("@")[0] || "Customer",
            customerEmail: user.email,
            orderId: newOrderId,
            items: checkoutItems,
            totalAmount: checkoutTotal,
            categoryBreakdown: checkoutBreakdown,
            timestamp: checkoutTimestamp,
            originUrl: window.location.origin
          })
        });

        if (!mailRes.ok) {
          console.warn("[PROCUREMENT CHECKOUT] Email dispatch proxy returned status code", mailRes.status);
        } else {
          console.log("[PROCUREMENT CHECKOUT] Email receipt dispatch approved.");
        }
      } catch (mailErr) {
        // Warn but do not block confirmation UI, as db order is already safely committed
        console.warn("[PROCUREMENT CHECKOUT] Warning: Email dispatch notification bypassed: ", mailErr);
      }

      // Reset local cart state
      setCart([]);
      setIsCheckingOut(false);
      return { success: true, orderId: newOrderId };

    } catch (err: any) {
      console.error("[PROCUREMENT CHECKOUT] Critical failure: transaction aborted.", err);
      setIsCheckingOut(false);
      if (err?.code === "permission-denied" || err?.message?.includes("permission") || err?.message?.includes("Permission denied")) {
        handleFirestoreError(err, OperationType.WRITE, "checkout");
      }
      return { success: false, error: err.message || "An unexpected transaction fault occurred." };
    }
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        profile,
        products,
        categories,
        cart,
        setCart,
        orders,
        isHydrating,
        hydrationMessage,
        isCheckingOut,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        getCartCategoryTotal,
        getCategoryRemainingBudget,
        logout,
        checkoutCart
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be consumed within a cohesive StoreProvider parent.");
  }
  return context;
};
