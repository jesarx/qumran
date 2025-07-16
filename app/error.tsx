// Save this as: app/error.tsx

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Home, AlertTriangle, BookOpen, Bug } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-4xl p-4 bg-background min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <Card className="relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-destructive/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-muted/50 to-transparent rounded-full blur-2xl"></div>

          <CardHeader className="text-center relative z-10">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="p-4 bg-destructive/10 rounded-full">
                  <Bug className="h-12 w-12 text-destructive" />
                </div>
                <div className="absolute -top-1 -right-1 h-6 w-6 bg-destructive rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            <CardTitle className="text-3xl font-semibold text-destructive mb-2">
              ¡Algo salió mal!
            </CardTitle>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Ha ocurrido un error inesperado. Como un manuscrito dañado,
              esta página necesita ser restaurada.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 relative z-10">
            {/* Error Details (in development) */}
            {process.env.NODE_ENV === 'development' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-mono text-xs">
                  <strong>Error details:</strong><br />
                  {error.message}
                  {error.digest && (
                    <>
                      <br />
                      <strong>Error ID:</strong> {error.digest}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={reset}
                variant="default"
                className="flex items-center gap-2"
                size="lg"
              >
                <RefreshCw className="h-4 w-4" />
                Intentar de Nuevo
              </Button>

              <Link href="/" className="flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2"
                  size="lg"
                >
                  <Home className="h-4 w-4" />
                  Ir al Inicio
                </Button>
              </Link>
            </div>

            {/* Quick Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
              <Link href="/books" className="group">
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                  <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Ver Biblioteca</h3>
                    <p className="text-xs text-muted-foreground">Explorar la colección</p>
                  </div>
                </div>
              </Link>

              <Link href="/about" className="group">
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                  <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                    <AlertTriangle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Reportar Problema</h3>
                    <p className="text-xs text-muted-foreground">Información de contacto</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Help Message */}
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Si el problema persiste, puedes{' '}
                <Link
                  href="/about"
                  className="text-primary hover:underline font-medium"
                >
                  contactar al desarrollador
                </Link>
                {' '}o intentar{' '}
                <button
                  onClick={() => window.location.reload()}
                  className="text-primary hover:underline font-medium"
                >
                  recargar la página
                </button>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
