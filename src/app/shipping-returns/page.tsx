import Link from 'next/link';

export const metadata = {
  title: 'Shipping & Returns — ElanorraLiving',
  description: 'Learn about our shipping policy, delivery timelines, and returns process at ElanorraLiving.',
};

const SECTIONS = [
  {
    title: 'Shipping Policy',
    items: [
      {
        heading: 'Processing Time',
        body: 'All orders are processed within 1–2 business days after payment confirmation. Orders placed on weekends or public holidays are processed the next business day.',
      },
      {
        heading: 'Domestic Shipping (India)',
        body: 'Standard delivery takes 5–7 business days. Express delivery (select pin codes) takes 2–3 business days. Free shipping on all orders above ₹1,499.',
      },
      {
        heading: 'International Shipping',
        body: 'We ship to select international destinations. Delivery takes 10–15 business days. International orders may be subject to customs duties and taxes as per destination country regulations.',
      },
      {
        heading: 'Order Tracking',
        body: 'Once dispatched, you will receive an email and SMS with a tracking link. You can also track your order in real-time from My Account → Orders.',
      },
    ],
  },
  {
    title: 'Returns & Refunds',
    items: [
      {
        heading: 'Return Window',
        body: 'Returns are accepted within 7 days of delivery for unused, undamaged items in their original packaging. Customised or final-sale items are not eligible unless defective.',
      },
      {
        heading: 'How to Initiate a Return',
        body: 'Email info@elanorraliving.in with your order number, the items you wish to return, and the reason. Our team will respond within 24 hours with return instructions and arrange a pickup.',
      },
      {
        heading: 'Refund Processing',
        body: 'Approved refunds are credited back to your original payment method within 5–7 business days of us receiving and inspecting the returned item.',
      },
      {
        heading: 'Damaged or Defective Items',
        body: 'If your item arrives damaged, please email us within 48 hours of delivery with clear photographs. We will arrange a replacement or full refund at no cost to you.',
      },
      {
        heading: 'Exchanges',
        body: 'We currently do not offer direct exchanges. Please return the original item and place a new order for the desired product.',
      },
    ],
  },
];

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100 py-20 text-center">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">Policies</p>
        <h1 className="text-4xl sm:text-5xl font-serif uppercase tracking-widest text-gray-900 mb-6">
          Shipping & Returns
        </h1>
        <p className="text-sm text-gray-500 max-w-lg mx-auto tracking-wide">
          Clear, fair policies designed around your confidence. Every purchase is backed by our commitment to quality.
        </p>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-20">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-gray-900 mb-8 pb-4 border-b border-gray-900">
              {section.title}
            </h2>
            <div className="space-y-8">
              {section.items.map((item) => (
                <div key={item.heading}>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">{item.heading}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed tracking-wide">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div className="border border-gray-200 p-10 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Questions?</p>
          <h3 className="text-2xl font-serif uppercase tracking-widest text-gray-900 mb-4">Get in Touch</h3>
          <p className="text-sm text-gray-500 mb-2 tracking-wide">Email: info@elanorraliving.in</p>
          <p className="text-sm text-gray-500 mb-8 tracking-wide">Mon – Sat, 10am – 6pm IST</p>
          <Link
            href="/contact"
            className="inline-block border border-gray-900 bg-gray-900 text-white text-[10px] uppercase tracking-widest px-10 py-4 hover:bg-white hover:text-gray-900 transition-all duration-300"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
