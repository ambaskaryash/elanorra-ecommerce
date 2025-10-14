import Image from 'next/image';
import { notFound } from 'next/navigation';
import { blogAPI } from '@/lib/services/api';

interface Props {
  params: { slug: string };
}

export default async function BlogPostPage({ params }: Props) {
  let postData: { post: any } | null = null;
  try {
    postData = await blogAPI.getPostBySlug(params.slug);
  } catch {
    postData = null;
  }

  if (!postData || !postData.post) {
    notFound();
  }

  const { post } = postData;

  return (
    <article className="min-h-screen bg-white">
      <section className="relative h-[50vh] bg-gray-900">
        <Image
          src={post.coverImage || '/images/placeholder.jpg'}
          alt={post.title}
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="relative z-10 h-full flex items-center justify-center text-center text-white">
          <div className="max-w-3xl px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
            {post.excerpt && <p className="text-lg text-white/90">{post.excerpt}</p>}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-lg">
          <div
            className="text-gray-800"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </section>
    </article>
  );
}