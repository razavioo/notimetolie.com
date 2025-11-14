export default function Home() {
  return (
    <main className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block mb-4 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-sm font-medium text-primary">
              Living Knowledge Infrastructure
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
              <span className="text-foreground">No Time</span>{' '}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                To Lie
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Create, organize, and share modular knowledge with powerful AI-assisted tools. 
              Built for accuracy, collaboration, and perpetual relevance.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <a
                href="/blocks"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Get Started
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="/developers"
                className="inline-flex items-center justify-center px-8 py-3.5 border border-input bg-background text-foreground rounded-lg font-medium hover:bg-accent transition-all duration-200"
              >
                View Docs
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto py-8 border-y border-border/40">
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">10K+</div>
                <div className="text-sm text-muted-foreground">Knowledge Blocks</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">500+</div>
                <div className="text-sm text-muted-foreground">Learning Paths</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime SLA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Build Knowledge That Lasts
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Modular architecture designed for accuracy, reusability, and seamless integration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="group p-8 border border-border/40 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Atomic Blocks</h3>
              <p className="text-muted-foreground leading-relaxed">
                Self-contained units of knowledge. Reusable, embeddable, and always up-to-date with complete revision history.
              </p>
            </div>

            <div className="group p-8 border border-border/40 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Learning Paths</h3>
              <p className="text-muted-foreground leading-relaxed">
                Structured learning journeys. Compose blocks into complete guides with progress tracking and mastery validation.
              </p>
            </div>

            <div className="group p-8 border border-border/40 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">AI-Powered</h3>
              <p className="text-muted-foreground leading-relaxed">
                Intelligent content creation with MCP support. AI assists, humans approve, ensuring quality and accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Ready to Start Building?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join our community of knowledge builders creating the future of learning.
            </p>
            <a
              href="/auth/signin"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}