import { Link } from "react-router-dom";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { Loader2, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";

const Blog = () => {
  const { data: posts, isLoading } = useBlogPosts(true);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Blog | Ashish SARL - Tips, Trends & Home Inspiration</title>
        <meta name="description" content="Discover home décor tips, appliance guides, and lifestyle inspiration from Ashish SARL in Yaoundé, Cameroon." />
        <link rel="canonical" href="https://ashishsarl.com/blog" />
      </Helmet>
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">Blog</h1>
            <p className="text-muted-foreground text-lg mb-12">
              Tips, trends, and inspiration for your home.
            </p>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !posts?.length ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No blog posts yet. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group block bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row">
                      {post.featured_image && (
                        <div className="md:w-72 h-48 md:h-auto flex-shrink-0">
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(post.published_at || post.created_at), "MMMM d, yyyy")}
                        </div>
                        <h2 className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                        )}
                        <span className="inline-flex items-center gap-1 text-primary text-sm font-medium">
                          Read more <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Blog;
