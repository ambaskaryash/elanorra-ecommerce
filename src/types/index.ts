// Product types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  category: string;
  subcategory?: string;
  collection?: string;
  tags: string[];
  inStock: boolean;
  inventory: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  avgRating?: number; // Added for stored average rating
  reviewCount?: number; // Added for stored count of reviews
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
}

export interface ProductImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  position: number;
}

// Cart types
export interface CartItem {
  productId: string;
  quantity: number;
  variant?: ProductVariant;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price?: number;
}

// Collection types
export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  products: Product[];
  featured: boolean;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

// Navigation types
export interface NavigationItem {
  id: string;
  name: string;
  href: string;
  children?: NavigationItem[];
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addresses: Address[];
}

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  country: string;
  state: string;
  zipCode: string;
  phone?: string;
  isDefault?: boolean;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: number;
  subtotalPrice: number;
  totalTax: number;
  totalShipping: number;
  currency: string;
  financialStatus: string;
  fulfillmentStatus: string;
  lineItems: OrderLineItem[];
  shippingAddress: Address;
  billingAddress: Address;
}

export interface OrderLineItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  quantity: number;
  price: number;
  totalDiscount: number;
  image: string;
}

// Store types
export interface StoreInfo {
  name: string;
  description: string;
  email: string;
  phone: string;
  address: Address;
  socialMedia: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
}
