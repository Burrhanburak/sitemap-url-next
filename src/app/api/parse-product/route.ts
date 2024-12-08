import { NextResponse } from 'next/server';
import { parse } from 'node-html-parser';

const SELECTORS = {
  title: [
    'h1.product-name',
    'h1.product-title',
    'h1[itemprop="name"]',
    'meta[property="og:title"]',
    'meta[name="title"]'
  ],
  description: [
    'div[itemprop="description"]',
    'meta[property="og:description"]',
    'meta[name="description"]',
    '#product-description',
    '.product-description'
  ],
  price: [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'span[itemprop="price"]',
    '.product-price',
    '.price'
  ],
  images: [
    'meta[property="og:image"]',
    'img[itemprop="image"]',
    '.product-image img',
    '#product-images img',
    '.gallery img'
  ],
  category: [
    'meta[property="product:category"]',
    'span[itemprop="category"]',
    '.breadcrumb li:last-child',
    '.product-category'
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

function extractMultipleContent(root: any, selectors: string[], isAttribute = false, attributeName = ''): string[] {
  const results: string[] = [];
  for (const selector of selectors) {
    const elements = root.querySelectorAll(selector);
    elements.forEach((element: any) => {
      const value = isAttribute ? element.getAttribute(attributeName) : (element.text || element.innerText);
      if (value && !results.includes(value)) {
        results.push(value.trim());
      }
    });
  }
  return results;
}

function extractStructuredData(html: string) {
  const matches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
  if (!matches) return null;

  for (const match of matches) {
    try {
      const jsonStr = match.replace(/<script type="application\/ld\+json">|<\/script>/g, '');
      const data = JSON.parse(jsonStr);
      
      if (data['@type'] === 'Product' || data['@type'] === 'Product') {
        return {
          title: data.name,
          description: data.description,
          price: data.offers?.price,
          images: Array.isArray(data.image) ? data.image : [data.image],
          category: data.category,
          brand: data.brand?.name,
          specs: data.additionalProperty?.reduce((acc: any, prop: any) => {
            acc[prop.name] = prop.value;
            return acc;
          }, {})
        };
      }
    } catch (e) {
      console.error('Error parsing structured data:', e);
    }
  }
  return null;
}

function normalizePrice(price: string): string {
  if (!price) return '';
  
  // Remove currency symbols and normalize format
  const normalized = price.replace(/[^0-9.,]/g, '');
  
  // Try to convert to a standard format
  try {
    const num = parseFloat(normalized.replace(',', '.'));
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(num);
  } catch (e) {
    return price;
  }
}

function normalizeImageUrl(imageUrl: string, baseUrl: string): string {
  if (!imageUrl) return '';
  
  try {
    const url = new URL(imageUrl, baseUrl);
    return url.href;
  } catch (e) {
    if (imageUrl.startsWith('//')) {
      return `https:${imageUrl}`;
    }
    if (imageUrl.startsWith('/')) {
      return `${baseUrl}${imageUrl}`;
    }
    return imageUrl;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch product page: ${response.statusText}`);
    }

    const html = await response.text();
    const root = parse(html);

    // Try to extract structured data first
    const structuredData = extractStructuredData(html);
    if (structuredData) {
      return NextResponse.json({
        ...structuredData,
        images: structuredData.images.map(img => normalizeImageUrl(img, url)),
        price: normalizePrice(structuredData.price)
      });
    }

    // Fallback to selector-based extraction
    const title = extractContent(root, SELECTORS.title) || 
                 extractContent(root, SELECTORS.title, true, 'content');
                 
    const description = extractContent(root, SELECTORS.description) || 
                       extractContent(root, SELECTORS.description, true, 'content');
                       
    const price = normalizePrice(
      extractContent(root, SELECTORS.price) || 
      extractContent(root, SELECTORS.price, true, 'content')
    );

    const images = [
      ...extractMultipleContent(root, SELECTORS.images, true, 'src'),
      ...extractMultipleContent(root, SELECTORS.images, true, 'content'),
      ...extractMultipleContent(root, SELECTORS.images, true, 'data-src')
    ].map(img => normalizeImageUrl(img, url));

    const category = extractContent(root, SELECTORS.category) || 
                    extractContent(root, SELECTORS.category, true, 'content');

    // Extract additional specifications
    const specs: Record<string, string> = {};
    const specRows = root.querySelectorAll('.product-specs tr, .specifications tr, .attributes tr');
    specRows.forEach((row: any) => {
      const label = row.querySelector('th, td:first-child')?.text?.trim();
      const value = row.querySelector('td:last-child')?.text?.trim();
      if (label && value) {
        specs[label] = value;
      }
    });

    return NextResponse.json({
      title,
      description,
      price,
      images: [...new Set(images)], // Remove duplicates
      category,
      specs,
      url
    });

  } catch (error) {
    console.error('Error parsing product page:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse product page' },
      { status: 500 }
    );
  }
}
