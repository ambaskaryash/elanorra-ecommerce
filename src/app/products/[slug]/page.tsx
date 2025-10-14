import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProductPageClient from './ProductPageClient';
import { productAPI, type ApiProduct } from '@/lib/services/api';
import { type Product } from '@/types';

interface Props {
  params: Promise<{ slug: string }>;
}

function mapApiProductToProduct(api: ApiProduct): Product {
  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    description: api.description,
    shortDescription: undefined,
    price: api.price,
    compareAtPrice: api.compareAtPrice,
    images: api.images.map((img) => ({
      id: img.id,
      src: img.src,
      alt: img.alt,
      width: 800,
      height: 800,
      position: img.position,
    })),
    category: api.category,
    subcategory: undefined,
    collection: undefined,
    tags: api.tags ?? [],
    inStock: api.inStock,
    inventory: api.inventory,
    weight: api.weight,
    dimensions: api.dimensions,
    featured: false,
    bestseller: false,
    newArrival: false,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  let apiProduct: ApiProduct | null = null;
  try {
    const { product } = await productAPI.getProduct(slug);
    apiProduct = product;
  } catch {
    apiProduct = null;
  }

  if (!apiProduct) {
    notFound();
  }

  const product = mapApiProductToProduct(apiProduct);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const canonicalUrl = `${baseUrl}/products/${product.slug}`;

  return <ProductPageClient product={product} canonicalUrl={canonicalUrl} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { product: apiProduct } = await productAPI.getProduct(slug);
    const product = mapApiProductToProduct(apiProduct);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/products/${product.slug}`;
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Shop';
    const title = `${product.name} | ${siteName}`;
    const description = product.shortDescription || product.description || `${product.name}`;
    const images = product.images?.length
      ? product.images.map(img => ({ url: img.src, alt: img.alt || product.name }))
      : [{ url: `${baseUrl}/images/placeholder.jpg`, alt: product.name }];

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'website',
        url,
        title,
        description,
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: images.map(i => i.url),
      },
    };
  } catch {
    return {};
  }
}