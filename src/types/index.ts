export interface ProductData {
  title: string;
  price: string;
  description: string;
  images: string[];
}

export interface UrlData {
  loc: string;
  lastmod?: string;
  type: string;
  data: ProductData;
}
