// Update this in: lib/queries/locations.ts

import { queryOne, queryMany, query, createSlug } from '@/lib/db';
import { QueryResultRow } from 'pg';

export interface Location extends QueryResultRow {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
  book_count?: number;
}

export interface LocationFilters {
  searchTerm?: string;
  sort?: 'name' | '-name' | 'book_count' | '-book_count';
}

// Get all locations with book count and sorting
export async function getLocations(filters: LocationFilters = {}): Promise<Location[]> {
  let sql = `
    SELECT 
      l.*,
      COUNT(b.id) as book_count
    FROM locations l
    LEFT JOIN books b ON l.id = b.location_id
  `;

  const params: unknown[] = [];

  if (filters.searchTerm) {
    sql += ` WHERE LOWER(l.name) LIKE LOWER($1)`;
    params.push(`%${filters.searchTerm}%`);
  }

  sql += ` GROUP BY l.id`;

  // Add sorting
  let orderBy = 'l.name ASC'; // default
  switch (filters.sort) {
    case 'name':
      orderBy = 'l.name ASC';
      break;
    case '-name':
      orderBy = 'l.name DESC';
      break;
    case 'book_count':
      orderBy = 'book_count ASC, l.name ASC';
      break;
    case '-book_count':
      orderBy = 'book_count DESC, l.name ASC';
      break;
  }

  sql += ` ORDER BY ${orderBy}`;

  return queryMany<Location>(sql, params);
}

// Get location by ID
export async function getLocationById(id: number): Promise<Location | null> {
  return queryOne<Location>(
    'SELECT * FROM locations WHERE id = $1',
    [id]
  );
}

// Get location by slug
export async function getLocationBySlug(slug: string): Promise<Location | null> {
  return queryOne<Location>(
    'SELECT * FROM locations WHERE slug = $1',
    [slug]
  );
}

// Get default location (Casa)
export async function getDefaultLocation(): Promise<Location | null> {
  return queryOne<Location>(
    'SELECT * FROM locations WHERE slug = $1',
    ['casa']
  );
}

// Create new location
export async function createLocation(name: string): Promise<Location> {
  const baseSlug = createSlug(name);
  let slug = baseSlug;
  let counter = 1;

  // Check if slug exists and generate unique one
  while (await getLocationBySlug(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const result = await queryOne<Location>(
    `INSERT INTO locations (name, slug) 
     VALUES ($1, $2) 
     RETURNING *`,
    [name, slug]
  );

  if (!result) {
    throw new Error('Failed to create location');
  }

  return result;
}

// Update location
export async function updateLocation(
  id: number,
  name: string
): Promise<Location> {
  const result = await queryOne<Location>(
    `UPDATE locations 
     SET name = $1
     WHERE id = $2
     RETURNING *`,
    [name, id]
  );

  if (!result) {
    throw new Error('Location not found');
  }

  return result;
}

// Delete location (only if no books reference it)
export async function deleteLocation(id: number): Promise<boolean> {
  try {
    await query(
      'DELETE FROM locations WHERE id = $1',
      [id]
    );
    return true;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23503') {
      throw new Error('Cannot delete location with existing books');
    }
    throw error;
  }
}
