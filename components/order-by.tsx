"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FC } from "react";

// Define the types for sort options
type SortOption = {
  label: string;
  value: string;
};

// Define the configuration for each page
type SortConfig = {
  label: string;
  options: SortOption[];
};

// Configuration for different pages
const sortConfigs: Record<string, SortConfig> = {
  "/authors": {
    label: "Apellidos (A-Z)",
    options: [
      { label: "Apellido (A-Z)", value: "last_name" },
      { label: "Apellido (Z-A)", value: "-last_name" },
      { label: "Nombre (A-Z)", value: "name" },
      { label: "Nombre (Z-A)", value: "-name" },
      { label: "# de libros (menor a mayor)", value: "book_count" },
      { label: "# de libros (mayor a menor)", value: "-book_count" },
    ],
  },
  "/publishers": {
    label: "Nombre (A-Z)",
    options: [
      { label: "Nombre (A-Z)", value: "name" },
      { label: "Nombre (Z-A)", value: "-name" },
      { label: "Cantidad de libros (Menor a Mayor)", value: "book_count" },
      { label: "Cantidad de libros (Mayor a Menor)", value: "-book_count" },
    ],
  },
  default: {
    label: "Fecha de agregado (reciente a antiguo)",
    options: [
      { label: "Aleatorio", value: "random" },
      { label: "Título (A-Z)", value: "title" },
      { label: "Título (Z-A)", value: "-title" },
      { label: "Fecha de agregado (antiguo a reciente)", value: "created_at" },
      { label: "Fecha de agregado (reciente a antiguo)", value: "-created_at" },
      { label: "Año de publicación (antiguo a reciente)", value: "year" },
      { label: "Año de publicación (reciente a antiguo)", value: "-year" },
    ],
  },
  // Default configuration
};

interface SortDropdownProps {
  className?: string;
  customConfig?: SortConfig;
}

const SortDropdown: FC<SortDropdownProps> = ({ customConfig }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get the current configuration based on the pathname
  const getConfig = () => {
    if (customConfig) return customConfig;

    // Find the matching config by stripping dashboard prefix if exists
    const strippedPath = pathname.replace(/^\/dashboard/, '');
    return sortConfigs[strippedPath] || sortConfigs.default;
  };

  const config = getConfig();

  // Get current sort value from URL
  const currentSort = searchParams.get("sort") || "";

  // Update URL with sort parameter
  const handleSort = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sortValue);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Find the current option label
  const getCurrentSortLabel = () => {
    const option = config.options.find(opt => opt.value === currentSort);
    return option ? option.label : config.label;
  };

  return (
    <div className="relative mr-2">
      <span className="mr-2">Ordenar por: </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            {getCurrentSortLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {config.options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSort(option.value)}
              className={currentSort === option.value ? "bg-muted" : ""}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SortDropdown;
