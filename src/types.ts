// Edge Mart Global TypeScript Types

export interface UserProfile {
  id: string; // auth uid
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string; // e.g. "fresh-produce"
  image: string; // Cloudinary URL
  stock: number;
  description: string;
}

export interface Category {
  id: string; // e.g. "fresh-produce"
  name: string; // e.g. "Fresh Produce"
  budget: number;
  spent: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  categoryBreakdown: Record<string, number>;
  createdAt: string; // date-time string
  status: "pending" | "approved" | "rejected"; // Enterprise Status flow
  rejectionReason?: string;
  deliveryInfo?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// 1. Payment Methods (managed by admin)
export interface PaymentMethod {
  id: string;
  type: "crypto" | "bank" | "giftcard" | "zelle" | "cashapp" | "venmo" | "wire";
  name: string; // e.g., "Company Bitcoin Wallet" or "Chase Bank ACH"
  details: string; // e.g., wallet address "bc1..." or Routing/Account No
  enabled: boolean;
  createdAt: string;
}

// 2. Payment Receipts (uploaded by customer)
export interface PaymentReceipt {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderId: string;
  totalAmount: number;
  paymentMethodId: string;
  paymentMethodName: string;
  receiptUrl: string; // Cloudinary URL
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

// 3. Live Support Chats
export interface SupportConversation {
  id: string; // usually customer's userId
  userId: string;
  userName: string;
  userEmail: string;
  status: "active" | "resolved";
  createdAt: string;
  updatedAt: string;
  lastMessageText: string;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "user" | "admin";
  text: string;
  image?: string; // Opt base64 or cloudinary attachment screenshot
  createdAt: string;
}

// 4. Notifications
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
