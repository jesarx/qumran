import { getBooksAction, getAuthorsAction, getPublishersAction, getCategoriesAction, getLocationsAction } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  BookOpen, Users, LayoutList, MapPin, LibraryBig,
  ArrowRight, TrendingUp, Calendar, BarChart3,
  PieChart, Target, Award, Plus,
  BookmarkPlus, Zap
} from 'lucide-react';

export default async function DashboardPage() {
  // Get comprehensive data for dashboard analytics
  const [booksData, authorsData, publishersData, categories, locations] = await Promise.all([
    getBooksAction({ limit: 10, sort: '-created_at' }), // Recent books
    getAuthorsAction('', '-book_count', 1), // Top authors
    getPublishersAction('', '-book_count', 1), // Top publishers
    getCategoriesAction(),
    getLocationsAction(),
  ]);

  // Calculate comprehensive statistics
  const totalBooks = booksData.total;
  const totalAuthors = authorsData.total;
  const totalPublishers = publishersData.total;
  const totalCategories = categories.length;
  const totalLocations = locations.length;

  // Advanced analytics
  const avgBooksPerAuthor = totalAuthors > 0 ? (totalBooks / totalAuthors).toFixed(1) : '0';
  const avgBooksPerPublisher = totalPublishers > 0 ? (totalBooks / totalPublishers).toFixed(1) : '0';

  // Get recent activity (books added in the last period)
  const recentBooks = booksData.books.slice(0, 5);

  // Top performers
  const topAuthors = authorsData.authors.slice(0, 8);
  const topPublishers = publishersData.publishers.slice(0, 10);

  // Category statistics
  const categoryStats = categories
    .filter(cat => (cat.book_count ?? 0) > 0)
    .sort((a, b) => (b.book_count ?? 0) - (a.book_count ?? 0))
    .slice(0, 8);

  // Location distribution
  const locationStats = locations
    .filter(loc => (loc.book_count ?? 0) > 0)
    .sort((a, b) => (b.book_count ?? 0) - (a.book_count ?? 0));

  const stats = [
    {
      title: 'Total Libros',
      value: totalBooks,
      icon: BookOpen,
      href: '/dashboard/books',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      change: '+' + recentBooks.length + ' recientes',
      changeType: 'positive' as const,
    },
    {
      title: 'Autores',
      value: totalAuthors,
      icon: Users,
      href: '/dashboard/authors',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      change: `${avgBooksPerAuthor} libros/autor`,
      changeType: 'neutral' as const,
    },
    {
      title: 'Editoriales',
      value: totalPublishers,
      icon: LibraryBig,
      href: '/dashboard/publishers',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      change: `${avgBooksPerPublisher} libros/editorial`,
      changeType: 'neutral' as const,
    },
    {
      title: 'Ubicaciones',
      value: totalLocations,
      icon: MapPin,
      href: '/dashboard/locations',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-950',
      change: `${locationStats.length} en uso`,
      changeType: 'neutral' as const,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Gestión completa de tu biblioteca personal
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/dashboard/books/new">
              <Button className="gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                Agregar Libro
              </Button>
            </Link>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden">
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${stat.bgColor}`}></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-xs ${stat.changeType === 'positive' ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-xs ${stat.color} font-medium`}>
                      Gestionar
                    </span>
                    <ArrowRight className={`h-3 w-3 ${stat.color} group-hover:translate-x-1 transition-transform`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/dashboard/books/new">
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <BookmarkPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Agregar Libro</h3>
                    <p className="text-xs text-muted-foreground">Nuevo volumen</p>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/authors">
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Gestionar Autores</h3>
                    <p className="text-xs text-muted-foreground">{totalAuthors} registrados</p>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/publishers">
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <LibraryBig className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Editoriales</h3>
                    <p className="text-xs text-muted-foreground">{totalPublishers} casas editoras</p>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/locations/new">
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                    <MapPin className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Nueva Ubicación</h3>
                    <p className="text-xs text-muted-foreground">Organizar espacio</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBooks.map((book) => (
                  <div key={book.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{book.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {book.author1_last_name}
                          {book.author1_first_name && `, ${book.author1_first_name}`}
                        </span>
                        <span>•</span>
                        <span>{book.publisher_name}</span>
                      </div>
                    </div>
                    <Link href={`/dashboard/books/${book.id}`}>
                      <Button size="sm" variant="ghost" className="cursor-pointer">
                        Editar
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/dashboard/books">
                  <Button variant="outline" size="sm" className="w-full gap-2 cursor-pointer">
                    Ver todos los libros
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Top Authors Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Autores Más Prolíficos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topAuthors.map((author, index) => {
                  const bookCount = author.book_count || 0;
                  const maxBooks = topAuthors[0]?.book_count || 1;
                  const percentage = (bookCount / maxBooks) * 100;

                  return (
                    <div key={author.id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-bold">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium truncate">
                            {author.last_name}
                            {author.first_name && `, ${author.first_name}`}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            {bookCount} {bookCount === 1 ? 'libro' : 'libros'}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <Link href={`/dashboard/authors/${author.id}`}>
                        <Button size="sm" variant="ghost" className="cursor-pointer">
                          <Users className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/dashboard/authors">
                  <Button variant="outline" size="sm" className="w-full gap-2 cursor-pointer">
                    Gestionar autores
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-orange-600" />
                Distribución por Categorías
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryStats.slice(0, 8).map((category) => {
                  const bookCount = category.book_count || 0;
                  const percentage = totalBooks > 0 ? ((bookCount / totalBooks) * 100).toFixed(1) : '0';

                  return (
                    <div key={category.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium truncate">{category.name}</span>
                          <span className="text-muted-foreground ml-2">{percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/tags">
                  <Button variant="outline" size="sm" className="w-full gap-2 cursor-pointer">
                    Ver categorías
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Publisher Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Editoriales Destacadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPublishers.slice(0, 8).map((publisher, index) => {
                  const bookCount = publisher.book_count || 0;
                  const maxBooks = topPublishers[0]?.book_count || 1;
                  const percentage = (bookCount / maxBooks) * 100;

                  return (
                    <div key={publisher.id} className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium truncate">{publisher.name}</span>
                          <span className="text-muted-foreground">{bookCount}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div
                            className="bg-purple-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/dashboard/publishers">
                  <Button variant="outline" size="sm" className="w-full gap-2 cursor-pointer">
                    Gestionar editoriales
                    <LibraryBig className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Location Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-teal-600" />
                Distribución Física
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {locationStats.slice(0, 6).map((location) => {
                  const bookCount = location.book_count || 0;
                  const percentage = totalBooks > 0 ? ((bookCount / totalBooks) * 100).toFixed(1) : '0';

                  return (
                    <div key={location.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MapPin className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium truncate">{location.name}</span>
                            <span className="text-muted-foreground ml-2">
                              {bookCount} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/dashboard/locations">
                  <Button variant="outline" size="sm" className="w-full gap-2 cursor-pointer">
                    Gestionar ubicaciones
                    <MapPin className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collection Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Insights de la Colección
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">{avgBooksPerAuthor}</div>
                <div className="text-sm text-muted-foreground">Promedio libros/autor</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-green-600">{avgBooksPerPublisher}</div>
                <div className="text-sm text-muted-foreground">Promedio libros/editorial</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-orange-600">
                  {totalCategories > 0 ? (totalBooks / totalCategories).toFixed(1) : '0'}
                </div>
                <div className="text-sm text-muted-foreground">Promedio libros/categoría</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-teal-600">
                  {locationStats.length > 0 ? (totalBooks / locationStats.length).toFixed(1) : '0'}
                </div>
                <div className="text-sm text-muted-foreground">Promedio libros/ubicación</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
