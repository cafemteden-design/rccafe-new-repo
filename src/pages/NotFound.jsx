import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="section-light min-h-[70vh] grid place-items-center">
      <div className="container-x text-center py-24">
        <div className="font-display text-[120px] sm:text-[180px] leading-none text-orange-500 font-extrabold">404</div>
        <h1 className="heading-display mt-2 text-charcoal-300">Page Not Found</h1>
        <p className="mt-4 max-w-md mx-auto text-muted">The arena route you’re looking for doesn’t exist. Let’s get you back on track.</p>
        <Link to="/" className="btn-primary mt-6">Back to Home</Link>
      </div>
    </section>
  )
}
