import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Script from 'next/script';
import { blogAPI } from '@/lib/services/api';

type RouteParamsPromise = Promise<{ slug: string }>;

interface Props {
  params: RouteParamsPromise;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { post } = await blogAPI.getPostBySlug(slug);

    if (!post) {
      return {
        title: 'Post Not Found',
        description: 'The requested blog post could not be found.',
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://elanorraliving.in';
    const url = `${baseUrl}/blog/${post.slug}`;
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Blog';
    const title = `${post.title} | ${siteName}`;
    const description = post.excerpt || post.content.substring(0, 150) + '...' || post.title;
    const imageUrl = post.coverImage || `${baseUrl}/images/placeholder.svg`;

    const blogPostSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "image": imageUrl,
      "url": url,
      "datePublished": post.createdAt, // Assuming post has createdAt field
      "dateModified": post.updatedAt || post.createdAt, // Assuming post has updatedAt field
      "author": {
        "@type": "Person",
        "name": post.author ? `${post.author.firstName} ${post.author.lastName}` : siteName, // Assuming post has author with firstName and lastName
      },
      "publisher": {
        "@type": "Organization",
        "name": siteName,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/elanorra-logo.svg`, // Assuming logo path
        }
      },
      "description": description,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url
      }
    };

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
        locale: 'en_US',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: url,
      },
      other: {
        'application/ld+json': JSON.stringify(blogPostSchema),
      },
    };
  } catch (error) {
    console.warn('⚠️ Failed to generate metadata for blog post during build:', error);
    return {
      title: 'Blog Post',
      description: 'A blog post from ElanorraLiving',
    };
  }
}

export default async function BlogPostPage({ params }: Props) {
  try {
    const { slug } = await params;
    const { post } = await blogAPI.getPostBySlug(slug);

    if (!post) {
      notFound();
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://elanorraliving.in';
    const url = `${baseUrl}/blog/${post.slug}`;
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Blog';
    const description = post.excerpt || post.content.substring(0, 150) + '...' || post.title;
    const imageUrl = post.coverImage || `${baseUrl}/images/placeholder.svg`;

    const blogPostSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "image": imageUrl,
      "url": url,
      "datePublished": post.createdAt, // Assuming post has createdAt field
      "dateModified": post.updatedAt || post.createdAt, // Assuming post has updatedAt field
      "author": {
        "@type": "Person",
        "name": post.author ? `${post.author.firstName} ${post.author.lastName}` : siteName, // Assuming post has author with firstName and lastName
      },
      "publisher": {
        "@type": "Organization",
        "name": siteName,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/elanorra-logo.svg`, // Assuming logo path
        }
      },
      "description": description,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url
      }
    };

    return (
      <article className="min-h-screen bg-white">
        <Script
          id="blog-post-jsonld"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(blogPostSchema),
          }}
        />
        <section className="relative h-[50vh] bg-gray-900">
          <Image
            src={post.coverImage || '/images/placeholder.svg'}
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
  } catch (error) {
    console.warn('⚠️ Failed to fetch blog post during build:', error);
    notFound();
  }
}
