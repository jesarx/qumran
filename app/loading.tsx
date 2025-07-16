// Replace app/loading.tsx with this version:

import { Card, CardContent } from '@/components/ui/card';
import { Scroll } from 'lucide-react';

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl p-4 bg-background min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <Card className="relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-muted/30 to-transparent rounded-full blur-2xl"></div>

          <CardContent className="p-8 relative z-10">
            <div className="text-center space-y-6">
              {/* Animated Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <Scroll className="h-12 w-12 text-primary animate-pulse" />
                  <div className="absolute inset-0 h-12 w-12 border-2 border-primary/20 rounded-full animate-spin border-t-primary"></div>
                </div>
              </div>

              {/* Loading Text */}
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Consultando los manuscritos...
                </h2>
                <p className="text-muted-foreground">
                  Por favor espera mientras buscamos en la biblioteca
                </p>
              </div>

              {/* Simple Loading Animation */}
              <div className="space-y-4 pt-4">
                <div className="h-4 bg-primary/10 rounded animate-pulse w-3/4 mx-auto"></div>
                <div className="h-4 bg-primary/10 rounded animate-pulse w-1/2 mx-auto"></div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="h-16 bg-primary/10 rounded animate-pulse"></div>
                  <div className="h-16 bg-primary/10 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
