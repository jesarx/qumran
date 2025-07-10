'use client'

import { Button } from "@/components/ui/button"
import { SquarePen } from "lucide-react";


import Link from "next/link"

export default function EditButton({ href }: { href: string }) {
  return (
    <Link href={`/dashboard/books/${href}`}>
      <Button variant='destructive' className="w-full text-white py-4 px-6 rounded-md flex items-center justify-center text-base mt-2 cursor-pointer"
      >
        <SquarePen className="mr-2 h-4 w-4" />
        Editar entrada
      </Button>
    </Link>


  );
}
