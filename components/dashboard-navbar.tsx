import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { signOut } from '@/auth';


export default async function DashboardNavbar() {
  return (
    <header className="shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center flex-col md:flex-row">
          <div className="text-xl font-bold mb-4 md:mb-0">
            <Link href="/dashboard">Panel de administración</Link>
          </div>
          <ul className="flex space-x-6 flex-col md:flex-row items-center gap-4 md:gap-0">
            <li>
              <Button variant='outline' className='cursor-pointer'>Dashboard</Button>
            </li>
            <li>
              <Link href="/dashboard/books">
                <Button variant='outline' className='cursor-pointer'>Libros</Button>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/authors">
                <Button variant='outline' className='cursor-pointer'>Autores</Button>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/publishers">
                <Button variant='outline' className='cursor-pointer'>Editoriales</Button>
              </Link>
            </li>
            <li>
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}
              ><Button
                variant='destructive'
                className='cursor-pointer'
              >Salir</Button>
              </form>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
