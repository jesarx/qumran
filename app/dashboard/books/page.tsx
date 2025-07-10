import Search from "@/components/search";
import { Button } from "@/components/ui/button";
import BooksTableDashboard from "@/components/books-table-dashboard"
import { PlusIcon } from "lucide-react";
import Link from "next/link";



export default async function DashboardBooksPage(
  props: {
    searchParams?: Promise<{
      title?: string;
      page?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const title = searchParams?.title || '';
  const currentPage = Number(searchParams?.page) || 1;


  return (
    <div className="mx-auto md:w-3/4 flex-col justify-center items-center p-4 bg-gray-100">
      <div className="flex justify-between mb-5">
        <Search />
        <Link href="/dashboard/books/new" className="shadow-sm">
          <Button className="shadow-sm cursor-pointer">
            <PlusIcon className="mr-2 h-4 w-4" />
            Añadir libro
          </Button>
        </Link>
      </div>

      <div className="w-full rounded-xl p-4 bg-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]">

        <BooksTableDashboard title={title} currentPage={currentPage} />
      </div>
    </div>
  )
}
