import { Hero } from '@/components/hero'
import { RecentPDFs } from '@/components/recent-pdfs'

export default function HomePage() {
  return (
    <div className="space-y-12">
      <Hero />
      <RecentPDFs />
    </div>
  )
}
