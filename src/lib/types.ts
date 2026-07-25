export interface Category {
  id: string;
  wp_id?: number | null;
  name: string;
  slug: string;
  parent_slug: string | null;
  color: string;
  description: string | null;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author: string;
  category_slug: string | null;
  tags: string[];
  status: string;
  published_at: string;
  read_time_minutes: number;
  views: number;
  meta_description?: string | null;
  focus_keywords?: string[];
  // Convenience: hydrated from categories lookup
  categories?: Category | null;
  // Back-compat shim — some callers still read category_id
  category_id?: string | null;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
}
