import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

// Auth gate intentionally deferred: the inventory tool is reachable without
// sign-in for now so the frontend can be tested against the backend. The
// shared brand-green chrome (Navbar/Footer) frames the page; the dark "vault"
// theme lives inside it (see the .vault-* styles in globals.css).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
