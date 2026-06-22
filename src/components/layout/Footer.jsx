import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-ink-900 rounded-lg flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
                <line x1="16" y1="8" x2="2" y2="22"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'Lora, serif' }} className="font-semibold text-gray-900">Insight</span>
            <span className="text-[11px] text-ink-400 ml-1">by CitiPlug</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-[11px] text-ink-400">
            {['News','Culture','Lifestyle','Opinion','Tech'].map(c => (
              <Link key={c} href={`/topic/${c.toLowerCase()}`} className="hover:text-orange-500 transition-colors">{c}</Link>
            ))}
            <Link href="/write" className="hover:text-orange-500 transition-colors font-medium">Write</Link>
            <span>© {new Date().getFullYear()} Insight</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
