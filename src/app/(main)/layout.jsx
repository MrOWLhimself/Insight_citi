import Providers from '@/components/layout/Providers'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileNav from '@/components/layout/MobileNav'

export default function MainLayout({ children }) {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 md:pb-0 pb-20">{children}</main>
        <Footer />
        <MobileNav />
      </div>
    </Providers>
  )
}
