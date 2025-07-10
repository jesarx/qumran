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
const publisherEditSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Publisher name is required"),
});

// Type definition based on Zod schema
type PublisherEditFormData = z.infer<typeof publisherEditSchema>;

export default function EditPublisherForm({
  token,
  publisherId
}: {
  token: string,
  publisherId: number
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
  } = useForm<PublisherEditFormData>({
    resolver: zodResolver(publisherEditSchema),
    defaultValues: {
      id: publisherId,
      name: '',
    }
  });

  console.log(publisherId);

  // Fetch publisher data on component mount
  useEffect(() => {
    const fetchPublisherData = async () => {
      try {
        const response = await fetch(`${API_URL}/publishers/${publisherId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch publisher data');
        }

        const publisherData = await response.json();
        const publisher = publisherData.publisher;

        // Set form values
        reset({
          id: publisher.id,
          name: publisher.name
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching publisher data';
        setError(errorMessage);
        console.error(err);
      }
    };

    fetchPublisherData();
  }, [publisherId, API_URL, reset]);

  // Handle form submission
  const onSubmit = async (data: PublisherEditFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Send PATCH request to update the publisher
      const updatePublisherResponse = await fetch(`${API_URL}/publishers/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: data.name
        })
      });

      if (!updatePublisherResponse.ok) {
        const errorData = await updatePublisherResponse.json();
        throw new Error(errorData.message || 'Failed to update publisher');
      }

      // Redirect or handle success (you might want to customize this)
      router.push('/publishers');

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating the publisher';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-3/4 mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Edit Publisher</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-6">
          {/* Hidden input for ID */}
          <input type="hidden" {...register('id', { valueAsNumber: true })} />

          {/* Publisher ID (Disabled) */}
          <div>
            <Label htmlFor="id" className="block text-sm font-medium text-gray-700">
              Publisher ID
            </Label>
            <Input
              id="id"
              type="text"
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
              {...register('id')}
            />
          </div>

          {/* Publisher Name */}
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Publisher Name
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
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this publisher? This action cannot be undone.')) {
                  try {
                    setIsLoading(true);
                    console.log(`${register('id')}`)
                    const response = await fetch(`${API_URL}/publishers/${watch('id')}`, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      },
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.message || 'Failed to delete publisher');
                    }

                    // Redirect to publishers list
                    router.push('/publishers');
                  } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the publisher';
                    setError(errorMessage);
                    console.error(err);
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              disabled={isLoading}
            >
              Delete Publisher
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
                {isLoading ? 'Updating...' : 'Update Publisher'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
