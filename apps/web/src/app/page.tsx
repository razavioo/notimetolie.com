export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">No Time To Lie</h1>
        <p className="text-xl text-muted-foreground mb-8">
          A Living Knowledge Infrastructure
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-3">Blocks</h2>
            <p className="text-muted-foreground">
              Atomic units of knowledge that are reusable and embeddable.
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-3">Paths</h2>
            <p className="text-muted-foreground">
              Structured learning journeys composed of ordered blocks.
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-3">Embed</h2>
            <p className="text-muted-foreground">
              Content-as-a-Service for seamless integration.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}