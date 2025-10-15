import { prisma } from '@/lib/prisma';
import Fuse from 'fuse.js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      select: {
        name: true,
        tags: true,
        category: true,
      },
    });

    const searchData = products.flatMap(p => [
        p.name, 
        ...p.tags, 
        p.category
    ]);
    const uniqueSearchData = [...new Set(searchData)];

    const fuse = new Fuse(uniqueSearchData, {
      threshold: 0.3,
      keys: [],
    });

    const results = fuse.search(query).slice(0, 10);
    const suggestions = results.map(r => r.item);

    let didYouMean = null;
    if (suggestions.length > 0 && suggestions[0].toLowerCase() !== query.toLowerCase()) {
        didYouMean = suggestions[0];
    }


    return NextResponse.json({
      suggestions,
      didYouMean
    });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search suggestions' },
      { status: 500 }
    );
  }
}