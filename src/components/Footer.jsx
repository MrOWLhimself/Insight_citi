import Link from 'next/link'
const CATS = ['News','Features','Stories','Business','Culture','Nigeria','Africa','Sports']
export default function Footer() {
  return (
    <footer style={{ borderTop:'1px solid var(--line)', background:'#fffaf3', marginTop:52 }}>
      <div className="container" style={{ padding:'22px 0', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
        <div>
          <strong style={{ fontFamily:'var(--display)', fontSize:20, letterSpacing:'-.05em' }}>Insight</strong>
          <span style={{ color:'var(--orange)', fontSize:11, fontWeight:950, letterSpacing:'.12em', textTransform:'uppercase', marginLeft:8 }}>by CitiPlug</span>
          <p style={{ color:'var(--muted)', fontSize:12, marginTop:4 }}>Premium news, magazine stories and contributor voices.</p>
        </div>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          {CATS.map(c => (
            <Link key={c} className="footer-link" href={`/topic/${c.toLowerCase().replace(/\s+/g,'-')}`}>{c}</Link>
          ))}
        </div>
        <p style={{ color:'var(--muted)', fontSize:12 }}>© {new Date().getFullYear()} CitiPlug</p>
      </div>
    </footer>
  )
}