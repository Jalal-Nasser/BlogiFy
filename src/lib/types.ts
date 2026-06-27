export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
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
  category_id: string | null;
  tags: string[];
  status: string;
  published_at: string;
  read_time_minutes: number;
  views: number;
  categories?: Category | null;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
}
