'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';

// Define the Zod schema for validation
const authorEditSchema = z.object({
  id: z.number(),
  last_name: z.string().min(1, "Last name is required"),
  name: z.string().min(1, "First name is required")
});

// Type definition based on Zod schema
type AuthorEditFormData = z.infer<typeof authorEditSchema>;

export default function EditAuthorForm({
  token,
  authorId
}: {
  token: string,
  authorId: number
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Initialize the form
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AuthorEditFormData>({
    resolver: zodResolver(authorEditSchema),
    defaultValues: {
      id: authorId,
      last_name: '',
      name: ''
    }
  });

  // Fetch author data on component mount
  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        const response = await fetch(`${API_URL}/authors/${authorId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch author data');
        }

        const authorData = await response.json();
        const author = authorData.author;

        // Set form values
        reset({
          id: author.id,
          last_name: author.last_name,
          name: author.name
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching author data';
        setError(errorMessage);
        console.error(err);
      }
    };

    fetchAuthorData();
  }, [authorId, API_URL, reset]);

  // Handle form submission
  const onSubmit = async (data: AuthorEditFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Send PATCH request to update the author
      const updateAuthorResponse = await fetch(`${API_URL}/authors/${authorId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          last_name: data.last_name,
          name: data.name
        })
      });

      if (!updateAuthorResponse.ok) {
        const errorData = await updateAuthorResponse.json();
        throw new Error(errorData.message || 'Failed to update author');
      }

      // Redirect or handle success
      router.push('/dashboard/authors');

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating the author';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-3/4 mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Edit Author</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-6">
          {/* Hidden input for ID */}
          <input type="hidden" {...register('id', { valueAsNumber: true })} />

          {/* Author ID (Disabled) */}
          <div>
            <Label htmlFor="id" className="block text-sm font-medium text-gray-700">
              Author ID
            </Label>
            <Input
              id="id"
              type="text"
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
              {...register('id')}
            />
          </div>
          <div></div>


          {/* Last Name */}
          <div>
            <Label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
              Last Name
            </Label>
            <Input
              id="last_name"
              type="text"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.last_name ? 'border-red-500' : ''}`}
              {...register('last_name')}
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
            )}
          </div>

          {/* First Name */}
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700">
              First Name
            </Label>
            <Input
              id="name"
              type="text"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.name ? 'border-red-500' : ''}`}
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 flex justify-between">
            {/* Delete Button */}
            <Button
              type="button"
              variant="destructive"
              className="text-white bg-red-600 hover:bg-red-700 focus:ring-red-500"
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this author? This action cannot be undone.')) {
                  try {
                    setIsLoading(true);
                    const response = await fetch(`${API_URL}/authors/${watch('id')}`, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      },
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.message || 'Failed to delete author');
                    }

                    // Redirect to authors list
                    router.push('/authors');
                  } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the author';
                    setError(errorMessage);
                    console.error(err);
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              disabled={isLoading}
            >
              Delete Author
            </Button>

            {/* Navigation and Submit Buttons */}
            <div className="flex space-x-3">
              <Button
                type="button"
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Author'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
