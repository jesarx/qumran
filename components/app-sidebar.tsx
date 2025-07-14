import { Home, BookOpen, Users, Building2, LayoutList, LogIn, LogOut } from "lucide-react";
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
    icon: Building2,
  },
  {
    title: "Categorías",
    url: "/tags",
    icon: LayoutList,
  },
];

const adminItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
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
    icon: Building2,
  },
];

export async function AppSidebar() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <Sidebar>
      <SidebarContent>
        {/* Text-based Logo */}
        <div className="px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-sidebar-primary mb-2 tracking-tight uppercase">
              Qumran
            </h1>
            <p className="text-xs text-sidebar-foreground/70 leading-relaxed font-medium">
              biblioteca personal de<br />
              eduardo partida
            </p>
          </div>
        </div>

        {/* Public Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegación Pública</SidebarGroupLabel>
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
              Pirateca v0.1β
            </span>
            <span className="text-xs text-sidebar-foreground/50">
              Powered by Qumran
            </span>
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
