import LatestBooksCards from "@/components/latest-books-cards";
import LatestPosts from "@/components/lastest-posts";

export default async function Home(
  props: {
    searchParams?: Promise<{
      title?: string;
      authslug?: string;
      pubslug?: string;
      tags?: string;
      page?: string;
      sort?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const title = searchParams?.title || '';
  const authslug = searchParams?.authslug || '';
  const pubslug = searchParams?.pubslug || '';
  const tags = searchParams?.tags || '';
  const sort = searchParams?.sort || '';
  const currentPage = Number(searchParams?.page) || 1;


  return (

    <div className="flex-col justify-center items-center p-4 bg-gray-100">
      <h1 className="text-xl font-bold mb-2 text-gray-800">Anuncios</h1>
      <div className="flex flex-col md:flex-row mb-6">
        <LatestPosts />
      </div>

      <div
        className="w-full rounded-xl p-4 bg-white
        shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]"
      >
        <LatestBooksCards title={title} authslug={authslug} pubslug={pubslug} tags={tags} currentPage={currentPage} sort={sort} />
      </div>
    </div>

  );
}
