import { Home, BookOpen, Users, Building2, LayoutList } from "lucide-react";
import LogoP from '@/public/images/logo.png';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";

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

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-6 py-8">
          <Image
            src={LogoP}
            alt="Qumran logo"
            className="w-full mx-auto"
          />
        </div>

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

        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
