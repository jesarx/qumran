// Save this as: app/not-found.tsx

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Home, Search, ArrowLeft, MapPin, Scroll } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl p-4 bg-background min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Main 404 Content */}
        <Card className="relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-muted/50 to-transparent rounded-full blur-2xl"></div>

          <CardHeader className="text-center relative z-10">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Scroll className="h-16 w-16 text-primary/60" />
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-destructive rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">?</span>
                </div>
              </div>
            </div>

            <CardTitle className="text-6xl font-light text-primary mb-2">
              404
            </CardTitle>
            <div className="text-xl text-foreground mb-2">
              Manuscrito no encontrado
            </div>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              El documento que buscas parece haberse en las arenas del tiempo,
              como los antiguos manuscritos de Qumran.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 relative z-10">
            {/* Quick Navigation Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/" className="group">
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Ir al Inicio</h3>
                    <p className="text-xs text-muted-foreground">Volver a la biblioteca</p>
                  </div>
                </div>
              </Link>

              <Link href="/books" className="group">
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                  <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Explorar Libros</h3>
                    <p className="text-xs text-muted-foreground">Ver toda la colección</p>
                  </div>
                </div>
              </Link>

              <Link href="/authors" className="group">
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                  <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                    <Search className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Buscar Autores</h3>
                    <p className="text-xs text-muted-foreground">Navegar por autor</p>
                  </div>
                </div>
              </Link>

              <Link href="/about" className="group">
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                  <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                    <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Acerca de Qumran</h3>
                    <p className="text-xs text-muted-foreground">Información del proyecto</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.history.back();
                  }
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver Atrás
              </Button>

              <Link href="/" className="flex-1 sm:flex-initial">
                <Button className="w-full flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Ir al Inicio
                </Button>
              </Link>
            </div>

            {/* Help Text */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                ¿Necesitas ayuda? Puedes{' '}
                <Link
                  href="/books"
                  className="text-primary hover:underline font-medium"
                >
                  explorar la biblioteca
                </Link>
                {' '}o{' '}
                <Link
                  href="/about"
                  className="text-primary hover:underline font-medium"
                >
                  obtener más información
                </Link>
                {' '}sobre este proyecto.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
