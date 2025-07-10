// components/LatestPosts.jsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Heart } from 'lucide-react';


export default function LatestPosts() {
  return (
    <Alert className='md:max-w-1/2'>
      <Heart className="h-4 w-4" />
      <AlertTitle className='font-bold'>Volvimos!</AlertTitle>
      <AlertDescription>
        Aún estamos trabajando en el nuevo sitio. Tengan paciencia, por favor.
      </AlertDescription>
    </Alert>
  );
}
