import { getBooksAction, getAuthorsAction, getPublishersAction, getCategoriesAction, getLocationsAction } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, LayoutList, ArrowRight, Scroll, Library, LibraryBig, Book, TrendingUp, Calendar, Award, Star } from 'lucide-react';
import Link from 'next/link';

export default async function HomePage() {
  // Get comprehensive data for statistics
  const [booksData, authorsData, publishersData, categories] = await Promise.all([
    getBooksAction({ limit: 8, sort: '-created_at' }), // Get recent books
    getAuthorsAction('', '-book_count', 1), // Get top authors by book count
    getPublishersAction('', '-book_count', 1), // Get top publishers by book count
    getCategoriesAction(),
    getLocationsAction(),
  ]);

  // Calculate advanced statistics
  const totalBooks = booksData.total;
  const totalAuthors = authorsData.total;
  const totalPublishers = publishersData.total;
  const totalCategories = categories.length;

  // Calculate average books per author
  const avgBooksPerAuthor = totalAuthors > 0 ? (totalBooks / totalAuthors).toFixed(1) : '0';

  // Calculate average books per publisher
  const avgBooksPerPublisher = totalPublishers > 0 ? (totalBooks / totalPublishers).toFixed(1) : '0';

  // Get most productive authors (top 5)
  const topAuthors = authorsData.authors.slice(0, 10);

  // Get most active publishers (top 5)
  const topPublishers = publishersData.publishers.slice(0, 10);

  // Calculate category distribution
  const categoryStats = categories
    .filter(cat => (cat.book_count ?? 0) > 0)
    .sort((a, b) => (b.book_count ?? 0) - (a.book_count ?? 0))
    .slice(0, 6);

  const stats = [
    {
      title: 'Libros',
      value: totalBooks,
      icon: BookOpen,
      href: '/books',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      description: 'volúmenes únicos',
    },
    {
      title: 'Autores',
      value: totalAuthors,
      icon: Users,
      href: '/authors',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      description: `${avgBooksPerAuthor} libros/autor`,
    },
    {
      title: 'Editoriales',
      value: totalPublishers,
      icon: LibraryBig,
      href: '/publishers',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      description: `${avgBooksPerPublisher} libros/editorial`,
    },
    {
      title: 'Categorías',
      value: totalCategories,
      icon: LayoutList,
      href: '/tags',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      description: 'temas diversos',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4 bg-background min-h-screen">
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-8 py-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <Library className="h-64 w-64" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <Scroll className="h-12 w-12 text-primary" />
                <h1 className="text-6xl font-thin text-foreground tracking-[0.2em] uppercase">
                  Qumran
                </h1>
              </div>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent mx-auto"></div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Biblioteca personal de Eduardo Partida
              </p>
              <p className="text-base text-muted-foreground/80 max-w-xl mx-auto">
                Una colección curada de {totalBooks} libros que han moldeado mi forma de pensar y ver el mundo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <Link href="/books">
              <Button variant="outline" size="lg" className="gap-2 cursor-pointer">
                <BookOpen className="h-5 w-5" />
                Explorar Biblioteca
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" className="gap-2 cursor-pointer">
                Acerca de Qumran
                <ArrowRight className="h-4 w-4" />
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-xs ${stat.color} font-medium`}>
                      Explorar
                    </span>
                    <ArrowRight className={`h-3 w-3 ${stat.color} group-hover:translate-x-1 transition-transform`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Books */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl"></div>
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Adquisiciones Recientes
              </CardTitle>
              <Link href="/books">
                <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
                  Ver todos
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {booksData.books.slice(0, 8).map((book) => (
                <div key={book.id} className="group p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Book className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {book.title}
                      </h3>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 flex-shrink-0" />
                        <span className="font-medium truncate">
                          {book.author1_last_name}
                          {book.author1_first_name && `, ${book.author1_first_name}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <LibraryBig className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{book.publisher_name}</span>
                      </div>
                      {book.category_name && (
                        <div className="flex items-center gap-1">
                          <LayoutList className="h-3 w-3 flex-shrink-0" />
                          <span className="text-primary/70 truncate">{book.category_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Authors */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-full blur-2xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Autores Más Prolíficos
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {topAuthors.map((author, index) => {
                  const bookCount = author.book_count || 0;
                  const maxBooks = topAuthors[0]?.book_count || 1;
                  const percentage = (bookCount / maxBooks) * 100;

                  return (
                    <div key={author.id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-sm mb-1">
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
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/authors">
                  <Button variant="outline" size="sm" className="w-full gap-2 cursor-pointer">
                    Ver todos los autores
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Top Publishers */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-violet-500/5 rounded-full blur-2xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Editoriales destacadas
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {topPublishers.slice(0, 10).map((publisher, index) => {
                  const bookCount = publisher.book_count || 0;
                  const maxBooks = topPublishers[0]?.book_count || 1;
                  const percentage = (bookCount / maxBooks) * 100;

                  return (
                    <div key={publisher.id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium truncate">{publisher.name}</span>
                          <span className="text-muted-foreground ml-2">
                            {bookCount} {bookCount === 1 ? 'libro' : 'libros'}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/publishers">
                  <Button variant="outline" size="sm" className="w-full gap-2 cursor-pointer">
                    Ver todas las editoriales
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Distribution */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 center w-32 h-32 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-full blur-3xl"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-orange-600" />
              Distribución por Categorías
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryStats.map((category) => {
                const bookCount = category.book_count || 0;
                const percentage = totalBooks > 0 ? ((bookCount / totalBooks) * 100).toFixed(1) : '0';

                return (
                  <Link key={category.id} href={`/books?categorySlug=${category.slug}`}>
                    <div className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer group">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {percentage}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{bookCount} {bookCount === 1 ? 'libro' : 'libros'}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <Link href="/tags">
                <Button variant="outline" size="sm" className="w-full gap-2 cursor-pointer">
                  Ver todas las categorías
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
