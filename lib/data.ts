import { Book, Author, Publisher } from "@/lib/definitions"


const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchLatestBooks(
  options: {
    title?: string;
    authslug?: string;
    pubslug?: string;
    tags?: string;
    page?: number;
    sort?: string;
    // Add other parameters as needed
  } = {}
) {
  try {
    // Build URL with query parameters
    const baseUrl = `${API_URL}/books`;
    const queryParams = new URLSearchParams();

    // Add parameters only if they exist
    if (options.title) queryParams.append('title', options.title);
    if (options.authslug) queryParams.append('authslug', options.authslug);
    if (options.pubslug) queryParams.append('pubslug', options.pubslug);
    if (options.tags) queryParams.append('tags', options.tags);
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.sort) queryParams.append('sort', options.sort);

    // Construct the final URL
    const url = queryParams.toString()
      ? `${baseUrl}?${queryParams.toString()}`
      : baseUrl;

    // Fetch data from your API
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch books');
    }

    // Parse the response as JSON
    const data = await response.json();
    const books = data.books;

    // Transform the data (if needed)
    const latestBooks = books.map((book: Book) => ({
      ...book,
      // Add any transformations here, e.g., formatting
    }));

    // Return the transformed data
    return {
      books: latestBooks,
      metadata: data.metadata
    };
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch the latest books.');
  }
}

export async function fetchBookBySlug(slug: string): Promise<Book> {
  try {
    // Fetch data from your API using the slug parameter
    const response = await fetch(`${API_URL}/books/${slug}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch book with slug: ${slug}`);
    }

    // Parse the response as JSON
    const data = await response.json();
    const bookData = data.book;

    // Transform the API response to match the Book type
    const book: Book = {
      id: bookData.id.toString(),
      title: bookData.title,
      short_title: bookData.short_title,
      author_name: bookData.author_name,
      author_last_name: bookData.author_last_name,
      author_slug: bookData.author_slug,
      author2_last_name: bookData.author2_last_name,
      author2_name: bookData.author2_name,
      author2_slug: bookData.author2_slug,
      filename: bookData.filename, // Default if not provided
      slug: bookData.slug,
      year: bookData.year,
      description: bookData.description || "", // Default if not provided
      pages: bookData.pages || 0, // Default if not provided
      isbn: bookData.isbn || "", // Default if not provided
      tags: bookData.tags || [],
      publisher_name: bookData.publisher_name,
      publisher_slug: bookData.publisher_slug,
      external_link: bookData.external_link,
      dir_dwl: bookData.dir_dwl,
      cid: bookData.cid,
    };

    return book;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(`Failed to fetch book with slug: ${slug}.`);
  }
}

export async function fetchAuthors(
  options: {
    name?: string;
    page?: number;
    sort?: string;
    // Add other parameters as needed
  } = {}
) {
  try {
    // Build URL with query parameters
    const baseUrl = `${API_URL}/authors`;
    const queryParams = new URLSearchParams();
    // Add parameters only if they exist
    if (options.name) queryParams.append('name', options.name);
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.sort) queryParams.append('sort', options.sort);

    // Construct the final URL
    const url = queryParams.toString()
      ? `${baseUrl}?${queryParams.toString()}`
      : baseUrl;
    // Fetch data from your API
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch authors');
    }
    // Parse the response as JSON
    const data = await response.json();
    const authors = data.authors;
    // Transform the data (if needed)
    const fetchedAuthors = authors.map((author: Author) => ({
      ...author,
      // Add any transformations here, e.g., formatting
    }));
    // Return the transformed data
    return {
      authors: fetchedAuthors,
      metadata: data.metadata
    };
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch authors.');
  }
}

export async function fetchPublishers(
  options: {
    name?: string;
    page?: number;
    sort?: string;
    // Add other parameters as needed
  } = {}
) {
  try {
    // Build URL with query parameters
    const baseUrl = `${API_URL}/publishers`;
    const queryParams = new URLSearchParams();
    // Add parameters only if they exist
    if (options.name) queryParams.append('name', options.name);
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.sort) queryParams.append('sort', options.sort);
    // Construct the final URL
    const url = queryParams.toString()
      ? `${baseUrl}?${queryParams.toString()}`
      : baseUrl;
    // Fetch data from your API
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch publishers');
    }
    // Parse the response as JSON
    const data = await response.json();
    const publishers = data.publishers;
    // Transform the data (if needed)
    const fetchedPublishers = publishers.map((publisher: Publisher) => ({
      ...publisher,
      // Add any transformations here, e.g., formatting
    }));
    // Return the transformed data
    return {
      publishers: fetchedPublishers,
      metadata: data.metadata
    };
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch publishers.');
  }
}

export async function fetchTags() {
  try {
    // Build URL with no query parameters since we simplified the API
    const url = `${API_URL}/tags`;

    // Fetch data from your API
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch tags');
    }

    // Parse the response as JSON
    const data = await response.json();
    const tags = data.tags;

    // Transform the data (if needed)
    const fetchedTags = tags.map((tag: { name: string, books: number }) => ({
      ...tag,
      // Add any transformations here if needed
    }));

    // Return the transformed data
    return {
      tags: fetchedTags
    };
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch tags.');
  }
}




