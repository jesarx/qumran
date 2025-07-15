import { Home, BookOpen, Users, Building2, LayoutList, MapPin, LogIn, LogOut, Info, LibraryBig, FilePlus } from "lucide-react";
import ThemeToggle from '@/components/theme-toggle';
import { auth } from "@/auth";
import { logout } from '@/lib/actions';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Menu items
const publicItems = [
  {
    title: "Libros",
    url: "/books",
    icon: BookOpen,
  },
  {
    title: "Autores",
    url: "/authors",
    icon: Users,
  },
  {
    title: "Editoriales",
    url: "/publishers",
    icon: LibraryBig,
  },
  {
    title: "Categorías",
    url: "/tags",
    icon: LayoutList,
  },
  {
    title: "Acerca de",
    url: "/about",
    icon: Info,
  },
];

const adminItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Añadir libro",
    url: "/dashboard/books/new",
    icon: FilePlus,
  },
  {
    title: "Gestionar Libros",
    url: "/dashboard/books",
    icon: BookOpen,
  },
  {
    title: "Gestionar Autores",
    url: "/dashboard/authors",
    icon: Users,
  },
  {
    title: "Gestionar Editoriales",
    url: "/dashboard/publishers",
    icon: LibraryBig,
  },
  {
    title: "Gestionar Ubicaciones",
    url: "/dashboard/locations",
    icon: MapPin,
  },
];

export async function AppSidebar() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <Sidebar>
      <SidebarContent>
        {/* Text-based Logo */}
        <div className="px-6 py-10">
          <div className="text-center space-y-4">
            <div className="relative">
              <h1 className="text-4xl font-light text-sidebar-primary tracking-[0.2em] uppercase">
                Qumran
              </h1>
              {/* Subtle accent line */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-px bg-gradient-to-r from-transparent via-sidebar-primary/60 to-transparent"></div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs text-sidebar-foreground/70 leading-relaxed font-medium">
                biblioteca personal de<br />
                eduardo partida
              </p>

            </div>
          </div>
        </div>

        {/* Public Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {publicItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isAuthenticated ? (
                <>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {/* Logout Button */}
                  <SidebarMenuItem>
                    <form action={logout} className="w-full">
                      <SidebarMenuButton asChild>
                        <button type="submit" className="w-full justify-start">
                          <LogOut />
                          <span>Cerrar Sesión</span>
                        </button>
                      </SidebarMenuButton>
                    </form>
                  </SidebarMenuItem>
                </>
              ) : (
                /* Login Button */
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/login">
                      <LogIn />
                      <span>Iniciar Sesión</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Theme Toggle */}
      <SidebarFooter>
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex flex-col">
            <span className="text-xs text-sidebar-foreground/70">
              <a href="https://github.com/jesarx/qumran">Qumran</a>
            </span>

            <span className="text-xs text-sidebar-foreground/70">
              por <a href="https://edpartida.com/">eduardo partida</a>
            </span>
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
