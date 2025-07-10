export type Book = {
  id: string;
  title: string;
  short_title: string;
  author_name: string;
  author_last_name: string;
  author_slug: string;
  author2_name: string;
  author2_last_name: string;
  author2_slug: string;
  filename: string;
  slug: string;
  year: number;
  description: string;
  publisher_name: string;
  publisher_slug: string;
  pages: number;
  isbn: string;
  tags: string[];
  external_link: string;
  dir_dwl: boolean;
  cid: string;
};

export type Author = {
  id: number;
  name: string;
  last_name: string;
  slug: string;
  books: number;
}

export type Publisher = {
  id: number;
  name: string;
  slug: string;
  books: number;
}

export type Tags = {
  name: string;
  books: number;
}

// Your existing application User type
export type User = {
  name: string;
  email: string;
  token: string;
  password: string;
};

export type BookMetadata = {
  current_page: number;
  page_size: number;
  first_page: number;
  last_page: number;
  total_records: number;
}

export type BooksResponse = {
  books: Book[];
  metadata: BookMetadata;
}

// Import NextAuth types
import { DefaultSession } from "next-auth"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { JWT as NextAuthJWT } from "next-auth/jwt" // Add 'type' keyword

// NextAuth type extensions with careful property typing
declare module "next-auth" {
  interface Session {
    user: {
      // Make sure these match the types in DefaultSession["user"] or are compatible
      id?: string;
      email?: string; // Use optional to avoid conflicts
      token: string;
      expiry: string;
    } & DefaultSession["user"];
  }
  // This extends NextAuth's internal User interface
  interface User {
    // Match the type from DefaultSession but make it required if needed
    id?: string;
    email?: string | null | undefined;
    token: string;
    expiry: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: {
      id: string;
      email: string;
    }
    authToken: {
      token: string;
      expiry: string;
    }
  }
}
