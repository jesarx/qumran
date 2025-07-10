import LatestBooksCards from "@/components/latest-books-cards";

export default async function AuthorsPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    title?: string;
    pubslug?: string;
    tags?: string;
    page?: string;
    sort?: string;
  }>;
}) {
  const { slug } = await props.params; // Get the author slug from URL path
  const searchParams = await props.searchParams || {};
  const title = searchParams?.title || '';
  const pubslug = searchParams?.pubslug || '';
  const tags = searchParams?.tags || '';
  const sort = searchParams?.sort || '';
  const currentPage = Number(searchParams?.page) || 1;

  return (
    <div className="flex-col justify-center items-center p-4 bg-gray-100">
      <div
        className="w-full rounded-xl p-4 bg-white
        shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]"
      >
        <LatestBooksCards
          title={title}
          authslug={slug}
          pubslug={pubslug}
          tags={tags}
          currentPage={currentPage}
          sort={sort}
        />
      </div>
    </div>
  );
}
