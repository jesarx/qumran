import EditBookForm from '@/components/EditBookForm'; // Adjust the path as needed

import { auth } from '@/auth';

export default async function EditBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const token = session?.user?.token || "default-token";

  return (
    <div className="container mx-auto py-8">
      <EditBookForm slug={slug} token={token} />
    </div>
  );
}
