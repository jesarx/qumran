import NewBookForm from "@/components/new-book-form"
import { auth } from '@/auth';

export default async function NewBook() {
  const session = await auth();
  const token = session?.user?.token || "default-token";

  return (
    <div className="container mx-auto py-8">
      <NewBookForm token={token} />
    </div>


  )
} 
