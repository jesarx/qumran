import { getBooksAction, getAuthorsAction, getPublishersAction, getCategoriesAction, getLocationsAction } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { BookOpen, Users, Building2, LayoutList, MapPin } from 'lucide-react';

export default async function DashboardPage() {
  const [booksData, authorsData, publishersData, categories, locations] = await Promise.all([
    getBooksAction({ limit: 5 }),
    getAuthorsAction(),
    getPublishersAction(),
    getCategoriesAction(),
    getLocationsAction(),
  ]);

  const stats = [
    {
      title: 'Libros',
      value: booksData.total,
      icon: BookOpen,
      href: '/dashboard/books',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Autores',
      value: authorsData.total, // Use .total instead of .length
      icon: Users,
      href: '/dashboard/authors',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Editoriales',
      value: publishersData.total, // Use .total instead of .length
      icon: Building2,
      href: '/dashboard/publishers',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Categorías',
      value: categories.length,
      icon: LayoutList,
      href: '/tags',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Ubicaciones',
      value: locations.length,
      icon: MapPin,
      href: '/dashboard/locations',
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="text-3xl font-bold text-foreground mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${stat.color} mt-1`}>
                  Ver todos →
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Books */}
      <Card>
        <CardHeader>
          <CardTitle>Libros Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {booksData.books.map((book) => (
              <div key={book.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{book.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {book.author1_first_name} {book.author1_last_name} • {book.publisher_name}
                    {book.location_name && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {book.location_name}
                      </span>
                    )}
                  </p>
                </div>
                <Link
                  href={`/dashboard/books/${book.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Editar
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/dashboard/books"
              className="text-sm text-blue-600 hover:underline"
            >
              Ver todos los libros →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
