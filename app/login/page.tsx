// app/login/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import LoginForm from "@/components/login-form" // Your client-side login form

export default async function LoginPage() {
  // Check if user is already authenticated on the server
  const session = await auth()

  // If yes, redirect to dashboard
  if (session?.user) {
    redirect("/dashboard")
  }

  // If not authenticated, show login form
  return (
    <div className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">

        <LoginForm />
      </div>
    </div>
  )
}
