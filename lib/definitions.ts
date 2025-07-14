// Type definitions for the application

export interface BookMetadata {
  current_page: number;
  last_page: number;
  page_size: number;
  total_records: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  metadata: BookMetadata;
}

// Author types
export interface AuthorFormData {
  firstName?: string;
  lastName: string;
}

// Publisher types
export interface PublisherFormData {
  name: string;
}

// Location types
export interface LocationFormData {
  name: string;
}

// Book types
export interface BookFormData {
  title: string;
  isbn?: string;
  author1FirstName?: string;
  author1LastName: string;
  author2FirstName?: string;
  author2LastName?: string;
  publisherName: string;
  categoryId: number;
  locationId: number;
}

// Filter types
export interface BaseFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface BookFilters extends BaseFilters {
  title?: string;
  authorSlug?: string;
  publisherSlug?: string;
  categorySlug?: string;
  locationSlug?: string;
  sort?: 'title' | '-title' | 'author' | '-author' | 'created_at' | '-created_at';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form state types
export interface FormState {
  success: boolean;
  error?: string;
  data?: any;
}

// Database row types (for type safety with query results)
export interface DatabaseRow {
  id: number;
  created_at: Date;
  updated_at: Date;
}

// Search and pagination helpers
export interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// ISBN validation
export type IsbnLength = 10 | 13;

export interface IsbnValidation {
  isValid: boolean;
  length?: IsbnLength;
  normalized?: string;
  error?: string;
}
