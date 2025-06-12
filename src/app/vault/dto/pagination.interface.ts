export interface Paginated<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VaultFilterOptions {
  category?: string;
  favorite?: boolean;
  tags?: string[];
}
