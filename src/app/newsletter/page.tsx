import NewsletterSubscription from '@/components/newsletter/NewsletterSubscription';

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join the ElanorraLiving Community
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Subscribe for exclusive offers, design inspiration, and the latest in luxury home living.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎁</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Exclusive Offers</h3>
            <p className="text-gray-600">
              Be the first to know about special promotions, early access to sales, and member-only discounts.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Design Inspiration</h3>
            <p className="text-gray-600">
              Get curated design tips, styling guides, and interior design trends delivered to your inbox.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏠</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Luxury Living</h3>
            <p className="text-gray-600">
              Discover the latest in luxury home products, new arrivals, and expert recommendations.
            </p>
          </div>
        </div>

        {/* Newsletter Subscription Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <NewsletterSubscription />
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 mb-4">
            Join over 10,000+ design enthusiasts who trust ElanorraLiving
          </p>
          <div className="flex justify-center items-center space-x-8 text-gray-400">
            <div className="flex items-center">
              <span className="text-lg mr-2">🔒</span>
              <span className="text-sm">Secure & Private</span>
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-2">📧</span>
              <span className="text-sm">No Spam</span>
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-2">🚫</span>
              <span className="text-sm">Unsubscribe Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Join the ElanorraLiving Community - Newsletter Subscription',
  description: 'Subscribe to ElanorraLiving newsletter for exclusive offers, design inspiration, and luxury home living updates.',
};