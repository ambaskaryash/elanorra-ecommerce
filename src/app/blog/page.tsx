import Link from 'next/link';
import Image from 'next/image';
import { blogAPI, type ApiBlogPost } from '@/lib/services/api';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const { posts } = await blogAPI.getPosts({ published: true, page: 1, limit: 12 });

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[40vh] bg-gray-900 flex items-center justify-center text-center">
        <div className="absolute inset-0">
          <Image
            src="/images/placeholder.svg"
            alt="Blog"
            fill
            className="object-cover opacity-50"
            priority
          />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Blog</h1>
          <p className="mt-3 text-white/90">Stories, tips, and inspiration from ElanorraLiving</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="text-center text-gray-600">No posts published yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post: ApiBlogPost) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-48 w-full bg-gray-100">
                    <Image
                      src={post.coverImage || '/images/placeholder.svg'}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-rose-600 transition-colors">{post.title}</h3>
                    {post.excerpt && <p className="mt-2 text-gray-600 line-clamp-2">{post.excerpt}</p>}
                    <div className="mt-4 text-sm text-gray-500">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}