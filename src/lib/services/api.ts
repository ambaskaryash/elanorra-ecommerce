// API service functions for interacting with the database

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  tags: string[];
  inStock: boolean;
  inventory: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  avgRating: number;
  reviewCount: number;
  images: Array<{
    id: string;
    src: string;
    alt: string;
    position: number;
  }>;
  variants: Array<{
    id: string;
    name: string;
    value: string;
    priceAdjustment: number;
    inStock: boolean;
    inventory: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiOrder {
  id: string;
  orderNumber: string;
  userId?: string;
  email: string;
  financialStatus: string;
  fulfillmentStatus: string;
  subtotal: number;
  taxes: number;
  shipping: number;
  discount: number;
  totalPrice: number;
  currency: string;
  paymentMethod?: string;
  paymentId?: string;
  couponCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    variants?: Record<string, unknown>;
    product: {
      name: string;
      slug: string;
      images: Array<{ src: string; alt: string }>;
    };
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
}

export interface ApiAddress {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiReview {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  helpful: number;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  product?: {
    name: string;
    slug: string;
    images: Array<{ src: string; alt: string }>;
  };
}

// API Error type
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
  }
}

// Generic API fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseURL}/api${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error occurred'
    );
  }
}

// Product API functions
export const productAPI = {
  // Get all products with optional filters
  getProducts: async (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    products: ApiProduct[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiFetch<{
      products: ApiProduct[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  },

  // Get single product by slug
  getProduct: async (slug: string): Promise<{ product: ApiProduct }> => {
    return apiFetch<{ product: ApiProduct }>(`/products/${slug}`);
  },

  // Create new product (admin only)
  createProduct: async (productData: {
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number;
    category: string;
    tags?: string[];
    inStock?: boolean;
    inventory?: number;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    images?: Array<{
      src: string;
      alt: string;
      position?: number;
    }>;
    variants?: Array<{
      name: string;
      value: string;
      priceAdjustment?: number;
      inStock?: boolean;
      inventory?: number;
    }>;
  }): Promise<{ product: ApiProduct }> => {
    return apiFetch<{ product: ApiProduct }>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  // Update product (admin only)
  updateProduct: async (
    slug: string,
    updates: Partial<{
      name: string;
      slug: string;
      description: string;
      price: number;
      compareAtPrice: number;
      category: string;
      tags: string[];
      inStock: boolean;
      inventory: number;
      weight: number;
      dimensions: {
        length: number;
        width: number;
        height: number;
      };
    }>
  ): Promise<{ product: ApiProduct }> => {
    return apiFetch<{ product: ApiProduct }>(`/products/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete product (admin only)
  deleteProduct: async (slug: string): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>(`/products/${slug}`, {
      method: 'DELETE',
    });
  },
};

// Order API functions
export const orderAPI = {
  // Get orders with optional filters
  getOrders: async (params?: {
    userId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    orders: ApiOrder[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiFetch<{
      orders: ApiOrder[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  },

  // Create new order
  createOrder: async (orderData: {
    userId?: string;
    email: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
      variants?: Record<string, any>;
    }>;
    shippingAddress: {
      firstName: string;
      lastName: string;
      company?: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      zipCode: string;
      country?: string;
      phone?: string;
    };
    billingAddress?: {
      firstName: string;
      lastName: string;
      company?: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      zipCode: string;
      country?: string;
      phone?: string;
    };
    subtotal: number;
    taxes?: number;
    shipping?: number;
    discount?: number;
    totalPrice: number;
    paymentMethod?: string;
    paymentId?: string;
    couponCode?: string;
    notes?: string;
  }): Promise<{ order: ApiOrder }> => {
    return apiFetch<{ order: ApiOrder }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
};

// Review API functions
export const reviewAPI = {
  // Get reviews with optional filters
  getReviews: async (params?: {
    productId?: string;
    userId?: string;
    rating?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    reviews: ApiReview[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/reviews${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiFetch<{
      reviews: ApiReview[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  },

  // Create new review
  createReview: async (reviewData: {
    productId: string;
    userId?: string;
    userName: string;
    rating: number;
    title: string;
    comment: string;
    verified?: boolean;
  }): Promise<{ review: ApiReview }> => {
    return apiFetch<{ review: ApiReview }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },
};

// Address API functions
export const addressAPI = {
  // Get addresses for a user
  getAddresses: async (userId: string): Promise<{ addresses: ApiAddress[] }> => {
    return apiFetch<{ addresses: ApiAddress[] }>(`/addresses?userId=${userId}`);
  },

  // Create a new address
  createAddress: async (addressData: {
    userId?: string;
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    phone?: string;
    isDefaultShipping?: boolean;
    isDefaultBilling?: boolean;
  }): Promise<{ address: ApiAddress }> => {
    return apiFetch<{ address: ApiAddress }>('/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  },

  // Update an existing address
  updateAddress: async (
    id: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      company: string;
      address1: string;
      address2: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      phone: string;
      isDefaultShipping: boolean;
      isDefaultBilling: boolean;
    }>
  ): Promise<{ address: ApiAddress }> => {
    return apiFetch<{ address: ApiAddress }>(`/addresses?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete an address
  deleteAddress: async (id: string): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>(`/addresses?id=${id}`, {
      method: 'DELETE',
    });
  },
};

export const api = {
  products: productAPI,
  orders: orderAPI,
  reviews: reviewAPI,
  addresses: addressAPI,
};
