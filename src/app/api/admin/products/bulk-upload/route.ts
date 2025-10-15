import { NextRequest, NextResponse } from 'next/server';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { prisma } from '@/lib/prisma';

interface ProductCsvData {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  category: string;
  tags?: string;
  inStock?: string;
  inventory: string;
  weight?: string;
  dimensions?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No CSV file uploaded' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('utf-8');

    const productsToProcess: ProductCsvData[] = [];
    const stream = Readable.from(fileContent);

    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data: ProductCsvData) => productsToProcess.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const results = [];
    for (const productData of productsToProcess) {
      try {
        const price = parseFloat(productData.price);
        const compareAtPrice = productData.compareAtPrice ? parseFloat(productData.compareAtPrice) : undefined;
        const inventory = parseInt(productData.inventory, 10);
        const inStock = productData.inStock?.toLowerCase() === 'true';
        const tags = productData.tags ? productData.tags.split(',').map((tag: string) => tag.trim()) : [];

        const existingProduct = await prisma.product.findUnique({
          where: { slug: productData.slug },
        });

        if (existingProduct) {
          const updatedProduct = await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              name: productData.name,
              description: productData.description,
              price: price,
              compareAtPrice: compareAtPrice,
              category: productData.category,
              tags: tags,
              inStock: inStock,
              inventory: inventory,
              weight: productData.weight ? parseFloat(productData.weight) : undefined,
              dimensions: productData.dimensions ? JSON.parse(productData.dimensions) : undefined,
            },
          });
          results.push({ status: 'updated', product: updatedProduct.name });
        } else {
          const newProduct = await prisma.product.create({
            data: {
              name: productData.name,
              slug: productData.slug,
              description: productData.description,
              price: price,
              compareAtPrice: compareAtPrice,
              category: productData.category,
              tags: tags,
              inStock: inStock,
              inventory: inventory,
              weight: productData.weight ? parseFloat(productData.weight) : undefined,
              dimensions: productData.dimensions ? JSON.parse(productData.dimensions) : undefined,
            },
          });
          results.push({ status: 'created', product: newProduct.name });
        }
      } catch (rowError: unknown) {
        console.error(`Error processing row for slug ${productData.slug}:`, rowError);
        results.push({ status: 'failed', slug: productData.slug, error: rowError instanceof Error ? rowError.message : String(rowError) });
      }
    }

    return NextResponse.json({ message: 'Bulk upload processed successfully', results }, { status: 200 });
  } catch (error: unknown) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ message: 'Failed to process bulk upload', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
