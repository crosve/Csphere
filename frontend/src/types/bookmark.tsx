interface Tag {
  tag_id: string;
  tag_name: string;
}

interface Category {
  category_id: string;
  category_name: string;
}

export interface Bookmark {
  content_id: string;
  title?: string;
  url: string;
  source?: string;
  ai_summary?: string;
  first_saved_at?: string; // ISO timestamp, might also be Date if parsed
  tags?: Tag[];
  categories?: Category[];
  html_url?: string;
  notes?: string;
}
