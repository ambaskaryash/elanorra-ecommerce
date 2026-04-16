import { prisma } from '@/lib/prisma';
import type { MetadataRoute } from 'next';
import { isMedusaCatalogEnabled } from '@/lib/medusa/config';
import { listMedusaProducts, listMedusaCollections } from '@/lib/medusa/catalog';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://elanorraliving.in';
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/collections`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/cart`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/checkout`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/wishlist`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  // Fetch dynamic routes from Medusa if enabled
  if (isMedusaCatalogEnabled()) {
    try {
      const [{ products }, collections] = await Promise.all([
        listMedusaProducts({ limit: 1000 }),
        listMedusaCollections(100),
      ]);

      const medusaProductRoutes: MetadataRoute.Sitemap = products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: new Date(product.updatedAt || now),
        changeFrequency: 'daily',
        priority: 0.8,
      }));

      const medusaCollectionRoutes: MetadataRoute.Sitemap = collections.map((collection) => ({
        url: `${baseUrl}/collections/${collection.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

      dynamicRoutes = [...medusaProductRoutes, ...medusaCollectionRoutes];
    } catch (error) {
      logger.warn('Failed to generate Medusa sitemap routes:', { error });
    }
  }

  // Fetch local dynamic routes if database is available and Medusa is not primary or as fallback
  if (process.env.DATABASE_URL && dynamicRoutes.length === 0) {
    try {
      const [products, collections] = await Promise.all([
        prisma.product.findMany({
          select: { slug: true, updatedAt: true },
          where: { inStock: true },
        }),
        prisma.collection.findMany({
          select: { slug: true, updatedAt: true },
        }),
      ]);

      const productRoutes: MetadataRoute.Sitemap = products.map((product: { slug: string; updatedAt: Date }) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'daily',
        priority: 0.8,
      }));

      const collectionRoutes: MetadataRoute.Sitemap = collections.map((collection: { slug: string; updatedAt: Date }) => ({
        url: `${baseUrl}/collections/${collection.slug}`,
        lastModified: collection.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

      dynamicRoutes = [...productRoutes, ...collectionRoutes];
    } catch (error) {
      console.warn('Failed to generate dynamic sitemap routes:', error);
    }
  }

  return [...staticRoutes, ...dynamicRoutes];
}