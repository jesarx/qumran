'use client';
import { useState, useEffect } from 'react';
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
const bookEditSchema = z.object({
  id: z.number(),
  slug: z.string().min(1, "Slug is required"),
  filename: z.string(),
  title: z.string().min(1, "Title is required"),
  external_link: z.string().url().optional().or(z.string().length(0)),
  short_title: z.string(),
  year: z.number().int().min(1000, "Year must be valid").max(new Date().getFullYear(), "Year cannot be in the future"),
  author_name: z.string(),
  author_last_name: z.string(),
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
type BookEditFormData = z.infer<typeof bookEditSchema>;

export default function EditBookForm({
  token,
  slug
}: {
  token: string,
  slug: string
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Initialize the form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookEditFormData>({
    resolver: zodResolver(bookEditSchema),
    defaultValues: {
      tags: [],
      external_link: '',
      dirdwl: true,
    }
  });

  // Fetch book data on component mount
  useEffect(() => {
    const fetchBookData = async () => {
      try {
        const response = await fetch(`${API_URL}/books/${slug}`);

        if (!response.ok) {
          throw new Error('Failed to fetch book data');
        }

        const bookData = await response.json();
        const book = bookData.book;

        // Prepare form data
        const formData = {
          id: book.id,
          slug: book.slug,
          filename: book.filename,
          title: book.title,
          external_link: book.external_link || '',
          short_title: book.short_title,
          year: book.year,
          author_name: book.author_name,
          author_last_name: book.author_last_name,
          author2_name: book.author2 ? book.author2_name : '',
          author2_last_name: book.author2 ? book.author2_last_name : '',
          publisher_name: book.publisher_name,
          isbn: book.isbn,
          pages: book.pages,
          dirdwl: book.dir_dwl,
          description: book.description || '',
          tags: book.tags || []
        };

        // Set form values
        reset(formData);

        // Set tags input
        setTagsInput(formData.tags.join(', '));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching book data';
        setError(errorMessage);
        console.error(err);
      }
    };

    fetchBookData();
  }, [slug, API_URL, reset]);

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

  // Handle form submission
  const onSubmit = async (data: BookEditFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!token) {
        throw new Error('Authentication token not found');
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

      // Create FormData for file uploads and JSON data
      const formData = new FormData();

      // Prepare book data
      const bookData = {
        title: data.title,
        external_link: data.external_link || '',
        year: data.year,
        publisher_id: publisherId,
        author2_id: author2Id,
        isbn: data.isbn,
        pages: data.pages,
        dir_dwl: data.dirdwl !== undefined ? data.dirdwl : true, // Explicitly handle the value
        description: data.description || '',
        tags: data.tags
      };

      // Append the JSON data with the key "data"
      formData.append('data', JSON.stringify(bookData));

      // Add cover image if it exists
      if (coverImage) {
        formData.append('image', coverImage);
      }

      // Send PATCH request to update the book
      const updateBookResponse = await fetch(`${API_URL}/books/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!updateBookResponse.ok) {
        const errorData = await updateBookResponse.json();
        throw new Error(errorData.message || 'Failed to update book');
      }

      // Get the updated book data
      const responseData = await updateBookResponse.json();

      // Redirect to the book detail page
      router.push(`/books/${responseData.book.slug}`);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating the book';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-3/4 mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Edit Book</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-6">
          {/* Hidden inputs for ID, slug, and filename */}
          <input type="hidden" {...register('id')} />
          <input type="hidden" {...register('slug')} />
          <input type="hidden" {...register('filename')} />

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

          <div>
            <Label htmlFor="id" className="block text-sm font-medium text-gray-700">
              Book ID
            </Label>
            <Input
              id="id"
              type="text"
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
              {...register('id', { valueAsNumber: true })}
            />
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              Filename
            </Label>
            <Input
              disabled
              id="filename"
              type="text"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.slug ? 'border-red-500' : ''}`}
              {...register('filename')}
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
            )}
          </div>



          {/* Slug */}
          <div>
            <Label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              Slug
            </Label>
            <Input
              id="slug"
              type="text"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.slug ? 'border-red-500' : ''}`}
              {...register('slug')}
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
            )}
          </div>

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

          {/* Short Title (Disabled) */}
          <div className='col-span-2'>
            <Label htmlFor="short_title" className="block text-sm font-medium text-gray-700">
              Short Title
            </Label>
            <Input
              id="short_title"
              type="text"
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
              {...register('short_title')}
            />
          </div>

          <div className='col-span-2 border-2 border-red-300 p-2 grid grid-cols-2 gap-2 pb-6'>
            <p className='col-span-2 font-bold'>Author 1</p>
            {/* Author Last Name (Disabled) */}
            <div>
              <Label htmlFor="author_last_name" className="block text-sm font-medium text-gray-700">
                Last Name
              </Label>
              <Input
                id="author_last_name"
                type="text"
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                {...register('author_last_name')}
              />
            </div>

            {/* Author Name (Disabled) */}
            <div>
              <Label htmlFor="author_name" className="block text-sm font-medium text-gray-700">
                First Name
              </Label>
              <Input
                id="author_name"
                type="text"
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                {...register('author_name')}
              />
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

          {/* ISBN */}
          <div>
            <Label htmlFor="isbn" className="block text-sm font-medium text-gray-700">
              ISBN
            </Label>
            <Input
              id="isbn"
              type="text"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.isbn ? 'border-red-500' : ''}`}
              {...register('isbn')}
            />
            {errors.isbn && (
              <p className="mt-1 text-sm text-red-600">{errors.isbn.message}</p>
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
              checked={watch('dirdwl')}
              onCheckedChange={(checked) => setValue('dirdwl', checked)}
              className={`mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.dirdwl ? 'border-red-500' : ''}`}
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

          {/* Buttons */}

          <div className="col-span-2 flex justify-between">
            <Button
              type="button"
              variant="destructive"
              className="mr-3 cursor-pointer"
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
                  try {
                    setIsLoading(true);
                    const response = await fetch(`${API_URL}/books/${watch('id')}`, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      },
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.message || 'Failed to delete book');
                    }

                    // Redirect to books list or home page after successful deletion
                    router.push('/books');
                  } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the book';
                    setError(errorMessage);
                    console.error(err);
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              disabled={isLoading}
            >
              Delete Book
            </Button>
            <div className="flex space-x-3">

              <Button
                type="button"
                className="cursor-pointer mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
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
                {isLoading ? 'Updating...' : 'Update Book'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
