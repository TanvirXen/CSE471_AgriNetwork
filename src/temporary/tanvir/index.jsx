import { Link } from 'react-router-dom'
import '../../App.css'

function TanvirPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-xl">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Tanvir Workspace</p>
          <h1 className="text-4xl font-black text-gray-900">Tanvir section</h1>
          <p className="max-w-2xl text-base leading-7 text-gray-600">
            This section is currently available as a simple landing page.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
          >
            Back To Home
          </Link>
        </div>
      </div>
    </main>
  )
}

export default TanvirPage
