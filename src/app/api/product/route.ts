import { NextResponse } from 'next/server';
import { parse } from 'node-html-parser';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);

    const html = await response.text();
    const root = parse(html);

    // Extract product details
    const data = {
      title: root.querySelector('h1, .product-title, .product-name, [itemprop="name"]')?.text?.trim() || '',
      price: root.querySelector('.price, [itemprop="price"], .product-price')?.text?.trim() || '',
      description: root.querySelector('[itemprop="description"], .description, .product-description, #description')?.text?.trim() || '',
      images: [],
      sku: root.querySelector('[itemprop="sku"], .sku')?.text?.trim() || '',
      stock: root.querySelector('[itemprop="availability"], .stock-status')?.text?.trim() || '',
    };

    // Extract images
    const images = root.querySelectorAll('img[itemprop="image"], .product-image img, .product-gallery img, [property="og:image"]');
    data.images = images.map(img => img.getAttribute('src') || img.getAttribute('content')).filter(Boolean);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 });
  }
}
