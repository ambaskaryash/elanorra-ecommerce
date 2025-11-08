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
  // Shipment tracking
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  estimatedDelivery?: string;
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
  // Invoice related fields
  invoiceNumber?: string;
  invoiceGenerated: boolean;
  invoiceFilePath?: string;
  invoiceEmailSent: boolean;
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

export interface ApiBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  tags: string[];
  published: boolean;
  publishedAt?: string | null;
  author?: { id: string; firstName?: string; lastName?: string };
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}

// API Error type
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
  }
}

// Simple in-memory cache for server-side requests
const serverCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

// Generic API fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isBrowser = typeof window !== 'undefined';
  // Build a robust base URL for server-side fetches to avoid relative URL errors
  let baseURL = '';
  if (!isBrowser) {
    baseURL =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      '';

    // If envs are not set, derive from incoming request headers where possible
    if (!baseURL) {
      try {
        const { headers } = await import('next/headers');
        const hdrs = await headers();
        const host = hdrs.get('host');
        const proto = hdrs.get('x-forwarded-proto') || 'http';
        if (host) baseURL = `${proto}://${host}`;
      } catch {}
    }

    // Final fallback to production domain
    if (!baseURL) {
      const port = process.env.PORT || 3001;
      baseURL = process.env.NODE_ENV === 'production' 
        ? 'https://elanorraliving.in'
        : `http://localhost:${port}`;
    }
  }
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Avoid double /api/ prefix if endpoint already includes it
  const url = normalizedEndpoint.startsWith('/api/') 
    ? `${baseURL}${normalizedEndpoint}` 
    : `${baseURL}/api${normalizedEndpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for authentication
    ...options,
  };

  // Generate cache key for GET requests
  const cacheKey = `${url}-${JSON.stringify(config)}`;
  const isGetRequest = !options.method || options.method.toUpperCase() === 'GET';

  if (!isBrowser && isGetRequest) {
    const cached = serverCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      console.log(`Cache hit for ${url}`);
      return cached.data;
    }
    console.log(`Cache miss for ${url}`);
  }

  if (isBrowser) {
    // Include cookies on client-side requests for authenticated endpoints
    (config as RequestInit).credentials = 'include';
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();

    if (!isBrowser && isGetRequest) {
      serverCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
    }

    return data;
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
  updateProduct: async (slug: string, updates: Partial<ApiProduct>): Promise<ApiProduct> => {
    const response = await fetch(`/api/products/${slug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update product');
    }

    const data = await response.json();
    return data.product;
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
      variants?: Record<string, unknown>;
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

// Blog API functions
export const blogAPI = {
  // Get blog posts with optional filters
  getPosts: async (params?: {
    search?: string;
    published?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    posts: ApiBlogPost[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const endpoint = `/blog${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiFetch<{ posts: ApiBlogPost[]; pagination: { page: number; limit: number; total: number; pages: number } }>(endpoint);
  },

  // Get single post by slug (public)
  getPostBySlug: async (slug: string): Promise<{ post: ApiBlogPost }> => {
    return apiFetch<{ post: ApiBlogPost }>(`/blog/slug/${slug}`);
  },

  // Create new blog post (admin only)
  createPost: async (postData: {
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    coverImage?: string;
    tags?: string[];
    published?: boolean;
  }): Promise<{ post: ApiBlogPost }> => {
    return apiFetch<{ post: ApiBlogPost }>(`/blog`, {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  // Update blog post (admin only)
  updatePost: async (
    id: string,
    updates: Partial<{
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      coverImage: string;
      tags: string[];
      published: boolean;
    }>
  ): Promise<{ post: ApiBlogPost }> => {
    return apiFetch<{ post: ApiBlogPost }>(`/blog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete blog post (admin only)
  deletePost: async (id: string): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>(`/blog/${id}`, {
      method: 'DELETE',
    });
  },
};

// User API functions
export const userAPI = {
  getMe: async (): Promise<{ user: { id: string; email: string; firstName?: string; lastName?: string; phone?: string; image?: string; isAdmin?: boolean } }> => {
    return apiFetch<{ user: { id: string; email: string; firstName?: string; lastName?: string; phone?: string; image?: string; isAdmin?: boolean } }>(`/users/me`);
  },
  updateMe: async (updates: Partial<{ firstName: string; lastName: string; phone: string; image: string; email: string }>): Promise<{ user: { id: string; email: string; firstName?: string; lastName?: string; phone?: string; image?: string; isAdmin?: boolean } }> => {
    return apiFetch<{ user: { id: string; email: string; firstName?: string; lastName?: string; phone?: string; image?: string; isAdmin?: boolean } }>(`/users/me`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// Auth API functions
export const authAPI = {
  changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message?: string } | { error: string } > => {
    return apiFetch(`/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const returnAPI = {
  getReturnRequests: async (): Promise<ApiReturnRequest[]> => {
    return apiFetch<ApiReturnRequest[]>('/api/returns');
  },
  getReturnRequest: async (returnId: string): Promise<ApiReturnRequest> => {
    return apiFetch<ApiReturnRequest>(`/api/returns/${returnId}`);
  },
  createReturnRequest: async (data: { orderId: string; reason: string; items: { orderItemId: string; quantity: number }[] }): Promise<ApiReturnRequest> => {
    return apiFetch<ApiReturnRequest>('/api/returns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // Admin functions
  getAllReturnRequests: async (): Promise<{ returnRequests: ApiReturnRequest[] }> => {
    return apiFetch<{ returnRequests: ApiReturnRequest[] }>('/api/admin/returns');
  },
  updateReturnStatus: async (returnId: string, status: string, adminNotes?: string): Promise<ApiReturnRequest> => {
    return apiFetch<ApiReturnRequest>('/api/admin/returns', {
      method: 'PATCH',
      body: JSON.stringify({ returnId, status, adminNotes }),
    });
  },
};

export const api = {
  products: productAPI,
  orders: orderAPI,
  reviews: reviewAPI,
  addresses: addressAPI,
  blog: blogAPI,
  users: userAPI,
  auth: authAPI,
  returns: returnAPI,
};

export type ApiReturnRequest = {
  id: string;
  orderId: string;
  order: ApiOrder & {
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
      email: string;
    };
  };
  reason: string;
  status: string;
  createdAt: string;
  items: {
    id: string;
    orderItem: {
      id: string;
      product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        images: Array<{ src: string; alt: string }>;
      };
    };
    quantity: number;
  }[];
};
