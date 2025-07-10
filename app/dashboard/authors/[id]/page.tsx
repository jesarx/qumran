import EditAuthorForm from '@/components/edit-author'; // Adjust the path as needed
import { auth } from '@/auth';

export default async function EditPublisherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const token = session?.user?.token || "default-token";

  return (
    <div className="container mx-auto py-8">
      <EditAuthorForm authorId={parseInt(id)} token={token} />
    </div>
  );
}
