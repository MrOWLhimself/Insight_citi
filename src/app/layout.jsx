import Providers from '@/components/Providers'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata = {
  title: 'Insight — Premium Stories, Features & Local Intelligence',
  description: 'Insight by CitiPlug — premium news and magazine platform for features, stories, spotlight, culture, business and city discovery.',
  openGraph: { title:'Insight by CitiPlug', description:'Premium local journalism, features and culture.', type:'website' }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin:0, fontFamily:'Inter, sans-serif', background:'var(--paper)', color:'#111827', WebkitFontSmoothing:'antialiased' }}>
        <Providers>
          <Navbar />
          <main style={{ minHeight:'calc(100vh - 72px)' }}>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}