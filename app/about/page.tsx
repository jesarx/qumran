import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Github, Mail, ExternalLink, Code, Database, Shield, User, Heart, Lightbulb, Coffee } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl p-4 bg-background min-h-screen">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="relative">
            <h1 className="uppercase text-5xl font-light text-foreground tracking-wide">
              Qumran
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"></div>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sistema de gestión de biblioteca personal.
          </p>
        </div>

        {/* Main Description */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              ¿Qué es Qumran?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <p className="text-foreground leading-relaxed text-lg">
              Qumran es un sistema de gestión de biblioteca personal diseñado para organizar,
              catalogar y administrar colecciones de libros de manera eficiente. Desarrollado
              como una aplicación web moderna, permite llevar un control detallado de autores,
              editoriales, categorías y ubicaciones físicas de los libros.
              El nombre "Qumran" hace referencia al sitio arqueológico donde se descubrieron
              los famosos Manuscritos del Mar Muerto.

            </p>
          </CardContent>
        </Card>

        {/* About Me - Enhanced */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/80">
          <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-amber-500/5 to-orange-500/5 rounded-full blur-2xl"></div>

          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              Sobre mí
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 relative z-10">
            {/* Personal intro with avatar placeholder */}
            <div className="flex flex-col md:flex-row gap-6 items-start">

              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Eduardo Partida
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground leading-relaxed">
                      Los libros son una parte muy importante de mi cosmología.
                      Lo que está en este sitio web describe una buena parte de mi sistema de pensamiento.
                      Cada libro en esta biblioteca ha contribuido de alguna manera a mi forma de ver el mundo.
                    </p>
                  </div>


                  <div className="flex items-start gap-3">
                    <Coffee className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground leading-relaxed">
                      Qumran nació de la necesidad personal de organizar mi biblioteca física.
                      Al convertirlo en código abierto, espero que pueda ayudar a otros bibliófitos
                      a gestionar sus propias colecciones.
                    </p>
                  </div>
                </div>
              </div>
            </div>


            {/* Contact buttons with better styling */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="https://edpartida.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950 dark:hover:border-blue-800 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                  Sitio Personal
                </Button>
              </Link>
              <Link href="mailto:edpartida@proton.me">
                <Button variant="outline" size="sm" className="flex items-center gap-2 hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950 dark:hover:border-green-800 transition-colors">
                  <Mail className="h-4 w-4" />
                  Contacto
                </Button>
              </Link>
              <Link href="https://github.com/jesarx/qumran" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="flex items-center gap-2 hover:bg-gray-50 hover:border-gray-200 dark:hover:bg-gray-950 dark:hover:border-gray-800 transition-colors">
                  <Github className="h-4 w-4" />
                  Código Fuente
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features - Enhanced */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Lightbulb className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              Características Principales
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                    <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Catalogación Completa</h4>
                    <p className="text-sm text-muted-foreground">
                      Gestión de títulos, autores, editoriales, ISBN y categorías
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                    <Code className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Búsqueda Avanzada</h4>
                    <p className="text-sm text-muted-foreground">
                      Filtros por título, autor, editorial, categoría y ubicación
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="p-2 bg-orange-500/10 rounded-lg flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Ubicaciones Físicas</h4>
                    <p className="text-sm text-muted-foreground">
                      Control de dónde se encuentran físicamente los libros
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="p-2 bg-green-500/10 rounded-lg flex-shrink-0">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Escáner de Código de Barras</h4>
                    <p className="text-sm text-muted-foreground">
                      Búsqueda automática de información mediante ISBN
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="p-2 bg-teal-500/10 rounded-lg flex-shrink-0">
                    <ExternalLink className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Interfaz Responsiva</h4>
                    <p className="text-sm text-muted-foreground">
                      Diseño adaptado para escritorio y dispositivos móviles
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="p-2 bg-indigo-500/10 rounded-lg flex-shrink-0">
                    <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Tema Oscuro/Claro</h4>
                    <p className="text-sm text-muted-foreground">
                      Soporte para modo oscuro y claro según preferencia
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack - Enhanced */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-36 h-36 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <Code className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              Tecnologías Utilizadas
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-lg">Frontend</h4>
                </div>
                <div className="space-y-2 pl-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Next.js 14 (App Router)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">React 18</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">TypeScript</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Tailwind CSS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Radix UI</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-semibold text-lg">Backend</h4>
                </div>
                <div className="space-y-2 pl-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Next.js API Routes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">PostgreSQL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Server Actions</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-lg">Autenticación</h4>
                </div>
                <div className="space-y-2 pl-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">NextAuth.js</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Google OAuth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Session Management</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
