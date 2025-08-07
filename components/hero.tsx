import { Button } from '@/components/ui/button'
import { FileText, Download, Users } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Share Knowledge,{' '}
            <span className="text-orange">Empower</span>{' '}
            <span className="text-blue">Learning</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A modern platform designed for educators to seamlessly upload, organize, 
            and share PDF resources with students. Simple, secure, and accessible.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" className="bg-orange hover:bg-orange/90 text-white" asChild>
            <Link href="/history">
              <FileText className="mr-2 h-5 w-5" />
              Browse Resources
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/contact">
              <Users className="mr-2 h-5 w-5" />
              Learn More
            </Link>
          </Button>
        </div>

        {/* Dynamic Stats - These will show 0 initially until data is loaded */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue mb-2">
              <span id="total-resources">0</span>+
            </div>
            <div className="text-muted-foreground">PDF Resources</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange mb-2">
              <span id="total-downloads">0</span>+
            </div>
            <div className="text-muted-foreground">Downloads</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue mb-2">24/7</div>
            <div className="text-muted-foreground">Access</div>
          </div>
        </div>
      </div>
    </section>
  )
}
