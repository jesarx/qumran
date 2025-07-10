import TagsTable from "@/components/tags-table";


export default async function DashboardAuthorsPage(
) {

  return (
    <div className="mx-auto md:w-3/4 flex-col justify-center items-center p-4 bg-gray-100">
      <div className="flex justify-between mb-3">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Categorías</h1>
      </div>

      <div className="w-full rounded-xl p-4 bg-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]">

        <TagsTable />
      </div>
    </div>
  )
}
