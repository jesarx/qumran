import { getBooksAction, getAuthorsAction, getPublishersAction, getCategoriesAction } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Building2, LayoutList, ArrowRight, Scroll, Library, LibraryBig, MapPin, Book } from 'lucide-react';
import Link from 'next/link';

export default async function HomePage() {
  // Get summary data
  const [booksData, authorsData, publishersData, categories] = await Promise.all([
    getBooksAction({ limit: 6, sort: '-created_at' }), // Get recent books sorted by creation date
    getAuthorsAction('', '-book_count', 1), // Get authors sorted by book count (descending)
    getPublishersAction('', '-book_count', 1), // Get publishers sorted by book count (descending)
    getCategoriesAction(),
  ]);

  const stats = [
    {
      title: 'Libros',
      value: booksData.total,
      icon: BookOpen,
      href: '/books',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Autores',
      value: authorsData.total,
      icon: Users,
      href: '/authors',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Editoriales',
      value: publishersData.total,
      icon: Building2,
      href: '/publishers',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'Categorías',
      value: categories.length,
      icon: LayoutList,
      href: '/tags',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
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
                Una colección curada de libros que han moldeado mi forma de pensar y ver el mundo.
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

        {/* Recent Books */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl"></div>
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Libros Recientes
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {booksData.books.slice(0, 6).map((book) => (
                <div key={book.id} className="group p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Book className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {book.title}
                      </h3>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-2">
                      <div className="flex items-start gap-2">
                        <Users className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">
                            {book.author1_last_name}
                            {book.author1_first_name && `, ${book.author1_first_name}`}
                          </span>
                          {book.author2_last_name && (
                            <span className="block">
                              {book.author2_last_name}
                              {book.author2_first_name && `, ${book.author2_first_name}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <LibraryBig className="h-3 w-3 flex-shrink-0" />
                        <span>{book.publisher_name}</span>
                      </div>
                      {book.category_name && (
                        <div className="flex items-center gap-2">
                          <LayoutList className="h-3 w-3 flex-shrink-0" />
                          <span className="text-primary/70">{book.category_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
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

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Explorar por Autores</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-2 mb-4">
                {authorsData.authors.slice(0, 10).map((author) => (
                  <div key={author.id} className="flex items-center justify-between text-sm">
                    <span>
                      {author.last_name}
                      {author.first_name && `, ${author.first_name}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {author.book_count} {author.book_count === 1 ? 'libro' : 'libros'}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/authors">
                <Button variant="outline" size="sm" className="w-full gap-2 cursor-pointer">
                  Ver todos los autores
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <LibraryBig className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Explorar por Editoriales</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-2 mb-4">
                {publishersData.publishers.slice(0, 10).map((publisher) => (
                  <div key={publisher.id} className="flex items-center justify-between text-sm">
                    <span>{publisher.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {publisher.book_count} {publisher.book_count === 1 ? 'libro' : 'libros'}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/publishers">
                <Button variant="outline" size="sm" className="w-full gap-2 cursor-pointer">
                  Ver todas las editoriales
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
