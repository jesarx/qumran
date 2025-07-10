import { Home, Scroll, Users, Library, LayoutList, BookHeart, MessageCircleHeartIcon } from "lucide-react"
import LogoP from '@/public/images/logo.png'


import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image"
import Search from "@/components/search"

// Menu items.
const items = [
  {
    title: "Inicio",
    url: "/books",
    icon: Home,
  },
  {
    title: "Autores",
    url: "/authors",
    icon: Users,
  },
  {
    title: "Editoriales",
    url: "/publishers",
    icon: Library,
  },
  {
    title: "Categorías",
    url: "/tags",
    icon: LayoutList,
  },
  {
    title: "Manifiesto",
    url: "/manifest",
    icon: Scroll,
  },
  {
    title: "Otras bibliotecas",
    url: "#",
    icon: BookHeart,
  },
  {
    title: "Contacto",
    url: "/contact",
    icon: MessageCircleHeartIcon,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <Image
          src={LogoP}
          alt="Pirateca logo"
          className="w-3/4 mx-auto my-8"

        />
        <SidebarGroup>
          <SidebarGroupLabel>Buscar</SidebarGroupLabel>
          <SidebarGroupContent>
            <Search />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
  )
}

