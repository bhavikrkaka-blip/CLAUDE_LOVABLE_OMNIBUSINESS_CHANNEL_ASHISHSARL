import { useParams, Link } from "react-router-dom";
import { useBlogPost } from "@/hooks/useBlogPosts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { Loader2, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Helmet } from "react-helmet-async";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-40 text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Link to="/blog" className="text-primary hover:underline">Back to blog</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description || post.excerpt || "",
    image: post.featured_image || "https://ashishsarl.com/og-image.jpg",
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: "Ashish SARL" },
    publisher: {
      "@type": "Organization",
      name: "Ashish SARL",
      logo: { "@type": "ImageObject", url: "https://ashishsarl.com/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://ashishsarl.com/blog/${post.slug}` },
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{post.title} | Ashish SARL Blog</title>
        <meta name="description" content={post.meta_description || post.excerpt || post.title} />
        <link rel="canonical" href={`https://ashishsarl.com/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt || post.title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://ashishsarl.com/blog/${post.slug}`} />
        {post.featured_image && <meta property="og:image" content={post.featured_image} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.meta_description || post.excerpt || post.title} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Header />
      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-8 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>

          {post.featured_image && (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-xl mb-8"
            />
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4" />
            {format(new Date(post.published_at || post.created_at), "MMMM d, yyyy")}
          </div>

          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-8">
            {post.title}
          </h1>

          <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-serif prose-a:text-primary">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </article>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default BlogPost;
