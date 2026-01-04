import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="bg-red-600 text-white py-12 md:py-16">
      <div className="container-custom text-center">
        <p className="text-sm md:text-base mb-3 text-red-100 font-medium">Welcome to</p>
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          <span className="bg-black px-4 py-2 rounded inline-block">
            <span className="text-red-600">RED</span>
            <span className="text-white ml-1.5">STORE</span>
          </span>
        </h1>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3">Shop Everything You Need</h2>
        <p className="text-base md:text-lg mb-8 text-red-100 max-w-2xl mx-auto">
          Discover millions of products at unbeatable prices across Sri Lanka
        </p>
        <Link
          href="/products"
          className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold text-base hover:bg-gray-100 transition-colors inline-block shadow-lg"
        >
          Start Shopping
        </Link>
      </div>
    </section>
  )
}
