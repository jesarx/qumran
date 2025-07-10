/* eslint-disable */
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from './ui/button';
import { Switch } from "@/components/ui/switch"

// Define the Zod schema for validation
const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  external_link: z.string().url().optional().or(z.string().length(0)),
  short_title: z.string().min(1, "Short title is required"),
  year: z.number().int().min(1000, "Year must be valid").max(new Date().getFullYear(), "Year cannot be in the future"),
  author_name: z.string().optional(),
  author_last_name: z.string().min(1, "Author last name is required"),
  author2_name: z.string().optional(),
  author2_last_name: z.string().optional(),
  publisher_name: z.string().min(1, "Publisher name is required"),
  isbn: z.string().min(1, "ISBN is required"),
  pages: z.number().int().min(1, "Pages must be valid"),
  dirdwl: z.boolean().optional().default(true),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// Type definition based on Zod schema
type BookFormData = z.infer<typeof bookSchema>;

export default function NewBookForm({ token }: { token: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [isSearchingISBN, setIsSearchingISBN] = useState(false);

  // State for file uploads
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Initialize the form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      tags: [],
      external_link: '',
      dirdwl: true,
      year: new Date().getFullYear(),
    }
  });

  // Function to search book by ISBN using Open Library API
  const searchBookByISBN = async () => {
    try {
      const isbn = getValues('isbn');
      if (!isbn) {
        setError('Please enter an ISBN to search');
        return;
      }

      setIsSearchingISBN(true);
      setError(null);

      // Clean ISBN by removing hyphens or spaces
      const cleanIsbn = isbn.replace(/[-\s]/g, '');

      // Fetch book data from Open Library API
      const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);

      if (!response.ok) {
        throw new Error('Failed to fetch book data');
      }

      const data = await response.json();
      const bookKey = `ISBN:${cleanIsbn}`;

      if (!data[bookKey]) {
        throw new Error('No book found with that ISBN');
      }

      const bookData = data[bookKey];

      // Extract and populate form fields
      if (bookData.title) {
        setValue('title', bookData.title);
        setValue('short_title', bookData.title);
      }

      if (bookData.authors && bookData.authors.length > 0) {
        // Parse author name - assume format is "First Last"
        const authorFullName = bookData.authors[0].name || '';
        const nameParts = authorFullName.split(' ');

        if (nameParts.length > 1) {
          const lastName = nameParts.pop() || '';
          const firstName = nameParts.join(' ');
          setValue('author_last_name', lastName);
          setValue('author_name', firstName);
        } else {
          setValue('author_last_name', authorFullName);
        }

        // Handle second author if available
        if (bookData.authors.length > 1) {
          const author2FullName = bookData.authors[1].name || '';
          const name2Parts = author2FullName.split(' ');

          if (name2Parts.length > 1) {
            const lastName2 = name2Parts.pop() || '';
            const firstName2 = name2Parts.join(' ');
            setValue('author2_last_name', lastName2);
            setValue('author2_name', firstName2);
          } else {
            setValue('author2_last_name', author2FullName);
          }
        }
      }

      if (bookData.publishers && bookData.publishers.length > 0) {
        setValue('publisher_name', bookData.publishers[0]);
      }

      if (bookData.publish_date) {
        // Extract year from publish date
        const yearMatch = bookData.publish_date.match(/\d{4}/);
        if (yearMatch) {
          setValue('year', parseInt(yearMatch[0]));
        }
      }

      if (bookData.number_of_pages) {
        setValue('pages', bookData.number_of_pages);
      }

      if (bookData.subjects) {
        // Convert subjects to tags
        const tags = bookData.subjects.slice(0, 5).map((subject: any) => subject.name || subject);
        setValue('tags', tags);
        setTagsInput(tags.join(', '));
      }

      if (bookData.description) {
        // Handle description which might be an object or string
        const description = typeof bookData.description === 'object'
          ? bookData.description.value
          : bookData.description;
        setValue('description', description);
      }

      // Set external link if available
      if (bookData.url) {
        setValue('external_link', bookData.url);
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search book by ISBN';
      setError(errorMessage);
    } finally {
      setIsSearchingISBN(false);
    }
  };

  // Handle the tags Input change
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    // Split by comma and trim whitespace
    const tagsArray = e.target.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    setValue('tags', tagsArray);
  };

  // Handle cover image upload
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  // Handle PDF upload
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const onSubmit = async (data: BookFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get token from session storage

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Step 1: Check if author 1 exists
      let author1Id: number | null = null;
      const author1Response = await fetch(
        `${API_URL}/authors?name=${encodeURIComponent(data.author_name || '')}&last_name=${encodeURIComponent(data.author_last_name)}`,
      );

      if (!author1Response.ok) {
        throw new Error('Failed to check author 1');
      }

      const author1Data = await author1Response.json();

      // If author 1 exists, get the ID
      if (author1Data.authors && author1Data.authors.length > 0) {
        author1Id = author1Data.authors[0].id;
      } else {
        // Create author 1
        const createAuthor1Response = await fetch(`${API_URL}/authors`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: data.author_name,
            last_name: data.author_last_name
          })
        });

        if (!createAuthor1Response.ok) {
          throw new Error('Failed to create author 1');
        }

        const newAuthor1Data = await createAuthor1Response.json();
        author1Id = newAuthor1Data.author.id;
      }

      // Step 2: Check for author 2 if provided
      let author2Id: number | null = null;
      if (data.author2_name && data.author2_last_name) {
        const author2Response = await fetch(
          `${API_URL}/authors?name=${encodeURIComponent(data.author2_name)}&last_name=${encodeURIComponent(data.author2_last_name)}`,
        );

        if (!author2Response.ok) {
          throw new Error('Failed to check author 2');
        }

        const author2Data = await author2Response.json();

        // If author 2 exists, get the ID
        if (author2Data.authors && author2Data.authors.length > 0) {
          author2Id = author2Data.authors[0].id;
        } else {
          // Create author 2
          const createAuthor2Response = await fetch(`${API_URL}/authors`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: data.author2_name,
              last_name: data.author2_last_name
            })
          });

          if (!createAuthor2Response.ok) {
            throw new Error('Failed to create author 2');
          }

          const newAuthor2Data = await createAuthor2Response.json();
          author2Id = newAuthor2Data.author.id;
        }
      }

      // Step 3: Check if publisher exists
      let publisherId: number | null = null;
      const publisherResponse = await fetch(
        `${API_URL}/publishers?name=${encodeURIComponent(data.publisher_name)}`,
      );

      if (!publisherResponse.ok) {
        throw new Error('Failed to check publisher');
      }

      const publisherData = await publisherResponse.json();

      // If publisher exists, get the ID
      if (publisherData.publishers && publisherData.publishers.length > 0) {
        publisherId = publisherData.publishers[0].id;
      } else {
        // Create publisher
        const createPublisherResponse = await fetch(`${API_URL}/publishers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: data.publisher_name
          })
        });

        if (!createPublisherResponse.ok) {
          throw new Error('Failed to create publisher');
        }

        const newPublisherData = await createPublisherResponse.json();
        publisherId = newPublisherData.publisher.id;
      }

      // Step 4: Create the book with all the collected IDs
      // Create FormData for file uploads and JSON data
      const formData = new FormData();

      // Prepare book data with author and publisher IDs
      const bookData = {
        title: data.title,
        external_link: data.external_link || '',
        short_title: data.short_title,
        year: data.year,
        author_id: author1Id,
        ...(author2Id ? { author2_id: author2Id } : {}),
        // author2_id: author2Id || null,
        publisher_id: publisherId,
        isbn: data.isbn,
        pages: data.pages,
        dir_dwl: data.dirdwl || true,
        description: data.description || '',
        tags: data.tags
      };

      // Append the JSON data with the key "data"
      formData.append('data', JSON.stringify(bookData));

      // Add files if they exist
      if (coverImage) {
        formData.append('image', coverImage);
      }

      if (pdfFile) {
        formData.append('pdf', pdfFile);
      }


      // Send POST request to create the book
      const createBookResponse = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header when using FormData
          // Browser will automatically set it with the correct boundary
        },
        body: formData
      });

      if (!createBookResponse.ok) {
        const errorData = await createBookResponse.json();
        throw new Error(errorData.message || 'Failed to create book');
      }

      // Get the created book data
      const responseData = await createBookResponse.json();

      // Redirect to the book detail page
      router.push(`/books/${responseData.book.slug}`);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while creating the book';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-3/4 mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">New Book</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>

        <div className="grid grid-cols-2 gap-6">

          {/* Cover Image Upload */}
          <div>
            <Label htmlFor="cover-image" className="block text-sm font-medium text-gray-700">
              Cover Image
            </Label>
            <div className="mt-1 flex flex-col items-start">
              <Input
                id="cover-image"
                type="file"
                accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                onChange={handleCoverImageChange}
              />
            </div>
          </div>


          {/* PDF Upload */}
          <div>
            <Label htmlFor="pdf-file" className="block text-sm font-medium text-gray-700">
              PDF File
            </Label>
            <div className="mt-1">
              <Input
                id="pdf-file"
                type="file"
                accept=".pdf"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                onChange={handlePdfFileChange}
              />
            </div>
          </div>

          {/* ISBN */}
          <div>
            <Label htmlFor="isbn" className="block text-sm font-medium text-gray-700">
              ISBN
            </Label>
            <div className="flex">
              <Input
                id="isbn"
                type="text"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.isbn ? 'border-red-500' : ''}`}
                {...register('isbn')}
              />
              <Button
                type="button"
                onClick={searchBookByISBN}
                disabled={isSearchingISBN}
                className="mt-1 ml-2 whitespace-nowrap px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSearchingISBN ? 'Searching...' : 'Search'}
              </Button>
            </div>
            {errors.isbn && (
              <p className="mt-1 text-sm text-red-600">{errors.isbn.message}</p>
            )}
          </div>

          <div></div>

          {/* Title */}
          <div className='col-span-2'>
            <Label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </Label>
            <Input
              id="title"
              type="text"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.title ? 'border-red-500' : ''}`}
              {...register('title')}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>


          {/* Short Title */}
          <div className='col-span-2'>
            <Label htmlFor="short_title" className="block text-sm font-medium text-gray-700">
              Short Title
            </Label>
            <Input
              id="short_title"
              type="text"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.short_title ? 'border-red-500' : ''}`}
              {...register('short_title')}
            />
            {errors.short_title && (
              <p className="mt-1 text-sm text-red-600">{errors.short_title.message}</p>
            )}
          </div>


          <div className='col-span-2 border-2 border-red-300 p-2 grid grid-cols-2 gap-2 pb-6'>

            <p className='col-span-2 font-bold'>Author 1</p>
            {/* Author Last Name */}
            <div>
              <Label htmlFor="author_last_name" className="block text-sm font-medium text-gray-700">
                Last Name
              </Label>
              <Input
                id="author_last_name"
                type="text"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.author_last_name ? 'border-red-500' : ''}`}
                {...register('author_last_name')}
              />
              {errors.author_last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.author_last_name.message}</p>
              )}
            </div>

            {/* Author Name */}
            <div>
              <Label htmlFor="author_name" className="block text-sm font-medium text-gray-700">
                First Name
              </Label>
              <Input
                id="author_name"
                type="text"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.author_name ? 'border-red-500' : ''}`}
                {...register('author_name')}
              />
              {errors.author_name && (
                <p className="mt-1 text-sm text-red-600">{errors.author_name.message}</p>
              )}
            </div>





            <p className='col-span-2 font-bold mt-4'>Author 2 (optional)</p>

            {/* Author 2 Last Name */}
            <div>
              <Label htmlFor="author2_last_name" className="block text-sm font-medium text-gray-700">
                Last Name
              </Label>
              <Input
                id="author2_last_name"
                type="text"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.author2_last_name ? 'border-red-500' : ''}`}
                {...register('author2_last_name')}
              />
              {errors.author2_last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.author2_last_name.message}</p>
              )}
            </div>

            {/* Author Name 2 */}
            <div>
              <Label htmlFor="author2_name" className="block text-sm font-medium text-gray-700">
                First Name
              </Label>
              <Input
                id="author2_name"
                type="text"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.author2_name ? 'border-red-500' : ''}`}
                {...register('author2_name')}
              />
              {errors.author2_name && (
                <p className="mt-1 text-sm text-red-600">{errors.author2_name.message}</p>
              )}
            </div>
          </div>

          {/* Year */}
          <div>
            <Label htmlFor="year" className="block text-sm font-medium text-gray-700">
              Year
            </Label>
            <Input
              id="year"
              type="number"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.year ? 'border-red-500' : ''}`}
              {...register('year', { valueAsNumber: true })}
            />
            {errors.year && (
              <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
            )}
          </div>

          {/* Publisher Name */}
          <div>
            <Label htmlFor="publisher_name" className="block text-sm font-medium text-gray-700">
              Publisher
            </Label>
            <Input
              id="publisher_name"
              type="text"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.publisher_name ? 'border-red-500' : ''}`}
              {...register('publisher_name')}
            />
            {errors.publisher_name && (
              <p className="mt-1 text-sm text-red-600">{errors.publisher_name.message}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags (comma separated)
            </Label>
            <Input
              id="tags"
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={tagsInput}
              onChange={handleTagsChange}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {watch('tags').map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Pages */}
          <div>
            <Label htmlFor="pages" className="block text-sm font-medium text-gray-700">
              Pages
            </Label>
            <Input
              id="pages"
              type="number"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.pages ? 'border-red-500' : ''}`}
              {...register('pages', { valueAsNumber: true })}
            />
            {errors.pages && (
              <p className="mt-1 text-sm text-red-600">{errors.pages.message}</p>
            )}
          </div>

          {/* Direct Download */}
          <div className='flex flex-row items-center'>
            <Switch
              id="dirdwl"
              className={`mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.dirdwl ? 'border-red-500' : ''}`}
              {...register('dirdwl', {
                setValueAs: (value) => value === 'true' || value === true
              })}
            />
            <Label htmlFor="dirdwl" className="block text-sm font-medium ml-4 text-gray-700">
              Direct Download
            </Label>
            {errors.dirdwl && (
              <p className="mt-1 text-sm text-red-600">{errors.dirdwl.message}</p>
            )}
          </div>

          {/* External link */}
          <div className='col-span-2'>
            <Label htmlFor="external_link" className="block text-sm font-medium text-gray-700">
              External Link
            </Label>
            <Input
              id="external_link"
              type="text"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.external_link ? 'border-red-500' : ''}`}
              {...register('external_link')}
            />
            {errors.external_link && (
              <p className="mt-1 text-sm text-red-600">{errors.external_link.message}</p>
            )}
          </div>


          {/* Description */}
          <div className='col-span-2'>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              rows={12}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              {...register('description')}
            />
          </div>

          {/* Submit button */}
          <div className="col-span-2 flex justify-end">
            <button
              type="button"
              className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </button>
            <Button
              type="submit"
              onClick={() => {
                handleSubmit((data) => {
                  onSubmit(data);
                })();
              }}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Book'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
