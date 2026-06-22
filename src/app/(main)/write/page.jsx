'use client'
export const dynamic = 'force-dynamic'
import dynamic_import from 'next/dynamic'

const WriteEditor = dynamic_import(() => import('@/components/editor/WriteEditor'), { ssr: false })

export default function WritePage() {
  return <WriteEditor />
}
