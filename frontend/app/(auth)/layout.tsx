import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

// Auth gate intentionally deferred: the inventory tool is reachable without
// sign-in for now so the frontend can be tested against the backend. The
// shared green chrome frames the page; the steel theme lives inside it.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
