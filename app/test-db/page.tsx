import { testConnection } from '@/lib/db';
import { getCategoriesAction } from '@/lib/actions';

export default async function TestDBPage() {
  // Test database connection
  const isConnected = await testConnection();

  // Test fetching categories
  let categories = [];
  let error = null;

  try {
    categories = await getCategoriesAction();
  } catch (e: any) {
    error = e.message;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test Page</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Connection Status:</h2>
          <p className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? '✅ Connected to database' : '❌ Failed to connect'}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Categories Test:</h2>
          {error ? (
            <p className="text-red-600">Error: {error}</p>
          ) : (
            <ul className="list-disc list-inside">
              {categories.map((cat) => (
                <li key={cat.id}>
                  {cat.name} (slug: {cat.slug}) - {cat.book_count || 0} books
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">
            If you see the categories above, your database is set up correctly!
          </p>
        </div>
      </div>
    </div>
  );
}
