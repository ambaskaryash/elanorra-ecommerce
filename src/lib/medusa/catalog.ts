import type { ApiProduct } from '@/lib/services/api';
import type { Product } from '@/types';
import { medusaConfig } from './config';
import { medusaFetch } from './client';

type MedusaMoneyAmount = {
  amount?: number;
  calculated_amount?: number;
};

type MedusaVariant = {
  id: string;
  title?: string;
  sku?: string | null;
  manage_inventory?: boolean;
  inventory_quantity?: number;
  calculated_price?: MedusaMoneyAmount | null;
};

type MedusaImage = {
  id: string;
  url: string;
};

type MedusaProduct = {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  thumbnail?: string | null;
  tags?: Array<{ value?: string | null }>;
  type?: { value?: string | null } | null;
  categories?: Array<{ name?: string | null; handle?: string | null }>;
  collection?: { title?: string | null; handle?: string | null } | null;
  images?: MedusaImage[];
  variants?: MedusaVariant[];
  created_at?: string;
  updated_at?: string;
};

type ListMedusaProductsResponse = {
  products: MedusaProduct[];
  count: number;
  limit: number;
  offset: number;
};

export type MedusaProductListParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  handle?: string;
  collection_id?: string;
};

export type MedusaCollection = {
  id: string;
  title: string;
  handle: string;
  products?: MedusaProduct[];
};

export type ListMedusaCollectionsResponse = {
  collections: MedusaCollection[];
  count: number;
  limit: number;
  offset: number;
};

function normalizePrice(amount?: number) {
  if (typeof amount !== 'number') {
    return 0;
  }

  // Medusa returns prices as integers in the minor unit (e.g., 5000 for 50.00 INR).
  // The storefront expects prices in the major unit (e.g., 50.00).
  return amount / 100;
}

function getProductPrice(product: MedusaProduct) {
  const firstVariant = product.variants?.[0];
  const price = firstVariant?.calculated_price;

  return normalizePrice(price?.calculated_amount ?? price?.amount);
}

export function mapMedusaProduct(product: MedusaProduct): Product {
  const apiProduct = mapMedusaProductToApiProduct(product);

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    slug: apiProduct.slug,
    description: apiProduct.description,
    price: apiProduct.price,
    compareAtPrice: apiProduct.compareAtPrice,
    images: apiProduct.images.map((image) => ({
      ...image,
      width: 800,
      height: 800,
    })),
    category: apiProduct.category,
    collection: product.collection?.handle || product.collection?.title || undefined,
    tags: apiProduct.tags,
    inStock: apiProduct.inStock,
    inventory: apiProduct.inventory,
    avgRating: apiProduct.avgRating,
    reviewCount: apiProduct.reviewCount,
    featured: false,
    bestseller: false,
    newArrival: false,
  };
}

export function mapMedusaProductToApiProduct(product: MedusaProduct): ApiProduct {
  const images = product.images?.length
    ? product.images
    : product.thumbnail
      ? [{ id: `${product.id}-thumbnail`, url: product.thumbnail }]
      : [];

  const category =
    product.categories?.[0]?.handle ||
    product.categories?.[0]?.name ||
    product.type?.value ||
    'uncategorized';

  return {
    id: product.id,
    name: product.title,
    slug: product.handle,
    description: product.description || '',
    price: getProductPrice(product),
    images: images.map((image, index) => ({
      id: image.id,
      src: image.url,
      alt: product.title,
      position: index,
    })),
    category,
    tags: product.tags?.map((tag) => tag.value).filter(Boolean) as string[] || [],
    inStock: product.variants?.some((v) => !v.manage_inventory || (v.inventory_quantity || 0) > 0) ?? true,
    inventory: product.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0,
    avgRating: 0,
    reviewCount: 0,
    variants: product.variants?.map((variant) => ({
      id: variant.id,
      name: 'option',
      value: variant.title || variant.sku || variant.id,
      priceAdjustment: 0,
      inStock: !variant.manage_inventory || (variant.inventory_quantity || 0) > 0,
      inventory: variant.inventory_quantity || 0,
    })) || [],
    createdAt: product.created_at || new Date().toISOString(),
    updatedAt: product.updated_at || product.created_at || new Date().toISOString(),
  };
}

export async function listMedusaProducts(params: MedusaProductListParams = {}) {
  const limit = params.limit ?? 12;
  const page = params.page ?? 1;
  const offset = (page - 1) * limit;

  const response = await medusaFetch<ListMedusaProductsResponse>('/store/products', {
    query: {
      limit,
      offset,
      q: params.search,
      category_id: params.category,
      collection_id: params.collection_id,
      handle: params.handle,
      fields: '*variants.calculated_price,*images,*categories,*collection,*tags,*type',
    },
    next: {
      revalidate: 60,
    },
  });

  return {
    products: response.products.map(mapMedusaProductToApiProduct),
    pagination: {
      page,
      limit,
      total: response.count,
      pages: Math.ceil(response.count / limit),
    },
  };
}

export async function listMedusaCollections(limit: number = 100) {
  // 1. Fetch collections without nested products to avoid the pricing context error
  const response = await medusaFetch<ListMedusaCollectionsResponse>('/store/collections', {
    query: {
      limit,
    },
    next: {
      revalidate: 60,
    },
  });

  // 2. Map collections and hydrate sample products using the working listMedusaProducts function
  return Promise.all(response.collections.map(async (collection) => {
    // Fetch top 4 products for this collection using the working method
    const productsResponse = await listMedusaProducts({
      collection_id: collection.id,
      limit: 4
    });

    return {
      id: collection.id,
      name: collection.title,
      slug: collection.handle,
      description: '',
      image: productsResponse.products[0]?.images[0]?.src || null,
      featured: true,
      productCount: productsResponse.pagination.total || 0,
      sampleProducts: productsResponse.products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: p.images[0]?.src || null,
      })),
    };
  }));
}

export async function listMedusaCategories() {
  const response = await medusaFetch<{ product_categories: any[] }>('/store/product-categories', {
    query: {
      fields: '*category_children',
    },
    next: {
      revalidate: 60,
    },
  });

  return response.product_categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.handle,
    description: category.description,
    children: category.category_children?.map((child: any) => ({
      id: child.id,
      name: child.name,
      slug: child.handle,
    })),
  }));
}

export async function getMedusaProductBySlug(slug: string) {
  const response = await listMedusaProducts({
    handle: slug,
    limit: 1,
  });

  return response.products[0] || null;
}
