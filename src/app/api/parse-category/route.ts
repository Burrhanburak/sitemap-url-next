import { NextResponse } from 'next/server';
import { parse } from 'node-html-parser';

const SELECTORS = {
  categoryName: [
    'h1.category-title',
    '.category-name',
    'meta[property="og:title"]',
    '.breadcrumb .active'
  ],
  description: [
    '.category-description',
    'meta[property="og:description"]',
    '.category-content'
  ],
  subcategories: [
    '.subcategories .category-item',
    '.category-grid .item',
    '.category-list .item'
  ],
  products: [
    '.product-grid .product-item',
    '.product-list .product-item',
    '[data-product-id]'
  ]
};

async function fetchWithTimeout(url: string, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function extractContent(root: any, selectors: string[], isAttribute = false, attributeName = ''): string {
  for (const selector of selectors) {
    const element = root.querySelector(selector);
    if (element) {
      if (isAttribute) {
        const value = element.getAttribute(attributeName);
        if (value) return value;
      } else {
        const text = element.text || element.innerText;
        if (text) return text.trim();
      }
    }
  }
  return '';
}

function normalizeUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch (e) {
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    return url;
  }
}

function extractSubcategories(root: any, baseUrl: string) {
  const subcategories: Array<{ name: string; url: string }> = [];
  
  for (const selector of SELECTORS.subcategories) {
    const elements = root.querySelectorAll(selector);
    elements.forEach((element: any) => {
      const link = element.querySelector('a');
      const name = link?.text?.trim();
      const url = link?.getAttribute('href');
      
      if (name && url) {
        subcategories.push({
          name,
          url: normalizeUrl(url, baseUrl)
        });
      }
    });
    
    if (subcategories.length > 0) break;
  }
  
  return subcategories;
}

function extractProducts(root: any, baseUrl: string) {
  const products: Array<{
    name: string;
    url: string;
    image?: string;
    price?: string;
  }> = [];
  
  for (const selector of SELECTORS.products) {
    const elements = root.querySelectorAll(selector);
    elements.forEach((element: any) => {
      const link = element.querySelector('a');
      const name = element.querySelector('.product-name, .product-title')?.text?.trim() ||
                  link?.text?.trim();
      const url = link?.getAttribute('href');
      const image = element.querySelector('img')?.getAttribute('src') ||
                   element.querySelector('img')?.getAttribute('data-src');
      const price = element.querySelector('.price, .product-price')?.text?.trim();
      
      if (name && url) {
        products.push({
          name,
          url: normalizeUrl(url, baseUrl),
          ...(image && { image: normalizeUrl(image, baseUrl) }),
          ...(price && { price })
        });
      }
    });
    
    if (products.length > 0) break;
  }
  
  return products;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch category page: ${response.statusText}`);
    }

    const html = await response.text();
    const root = parse(html);

    // Extract category information
    const name = extractContent(root, SELECTORS.categoryName) || 
                extractContent(root, SELECTORS.categoryName, true, 'content');
                
    const description = extractContent(root, SELECTORS.description) || 
                       extractContent(root, SELECTORS.description, true, 'content');

    // Extract subcategories and products
    const subcategories = extractSubcategories(root, url);
    const products = extractProducts(root, url);

    // Extract pagination information if available
    const pagination = {
      currentPage: parseInt(root.querySelector('.pagination .active')?.text?.trim() || '1'),
      hasNextPage: !!root.querySelector('.pagination .next, .pagination [rel="next"]'),
      hasPrevPage: !!root.querySelector('.pagination .prev, .pagination [rel="prev"]')
    };

    return NextResponse.json({
      name,
      description,
      url,
      subcategories,
      products,
      pagination,
      totalProducts: products.length,
      totalSubcategories: subcategories.length
    });

  } catch (error) {
    console.error('Error parsing category page:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse category page' },
      { status: 500 }
    );
  }
}
