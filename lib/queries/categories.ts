import { queryOne, queryMany } from '@/lib/db';
import { QueryResultRow } from 'pg';

export interface Category extends QueryResultRow {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
  book_count?: number;
}

// Get all categories with book count
export async function getCategories(): Promise<Category[]> {
  return queryMany<Category>(`
    SELECT 
      c.*,
      COUNT(b.id) as book_count
    FROM categories c
    LEFT JOIN books b ON c.id = b.category_id
    GROUP BY c.id
    ORDER BY c.name
  `);
}

// Get category by ID
export async function getCategoryById(id: number): Promise<Category | null> {
  return queryOne<Category>(
    'SELECT * FROM categories WHERE id = $1',
    [id]
  );
}

// Get category by slug
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return queryOne<Category>(
    'SELECT * FROM categories WHERE slug = $1',
    [slug]
  );
}

// Note: We typically don't create/update/delete categories since they're predefined
// But here are the functions if needed:

// Update category name
export async function updateCategory(
  id: number,
  name: string
): Promise<Category> {
  const result = await queryOne<Category>(
    `UPDATE categories 
     SET name = $1
     WHERE id = $2
     RETURNING *`,
    [name, id]
  );

  if (!result) {
    throw new Error('Category not found');
  }

  return result;
}
