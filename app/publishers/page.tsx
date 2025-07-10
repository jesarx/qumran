import PublishersTable from "@/components/publishers-table";
import OrderBy from "@/components/order-by";


export default async function DashboardAuthorsPage(
  props: {
    searchParams?: Promise<{
      name?: string;
      page?: string;
      sort?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const name = searchParams?.name || '';
  const currentPage = Number(searchParams?.page) || 1;
  const sort = searchParams?.sort || '';

  return (
    <div className="mx-auto md:w-3/4 flex-col justify-center items-center p-4 bg-gray-100">
      <div className="flex justify-between mb-3">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Editoriales</h1>
        <OrderBy />
      </div>

      <div className="w-full rounded-xl p-4 bg-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]">

        <PublishersTable name={name} currentPage={currentPage} location="public" sort={sort} />
      </div>
    </div>
  )
}

