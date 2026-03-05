import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  meta_description: string | null;
  is_published: boolean;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const useBlogPosts = (publishedOnly = false) => {
  return useQuery({
    queryKey: ["blog-posts", publishedOnly],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (publishedOnly) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });
};

export const useBlogPost = (slug: string) => {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: { title: string; content: string; excerpt?: string; meta_description?: string; featured_image?: string; is_published?: boolean }) => {
      const slug = generateSlug(post.title);
      const { data, error } = await supabase
        .from("blog_posts")
        .insert({
          ...post,
          slug,
          published_at: post.is_published ? new Date().toISOString() : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-posts"] }),
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BlogPost> & { id: string }) => {
      if (updates.title) {
        updates.slug = generateSlug(updates.title);
      }
      if (updates.is_published && !updates.published_at) {
        updates.published_at = new Date().toISOString();
      }
      const { data, error } = await supabase
        .from("blog_posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-posts"] }),
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-posts"] }),
  });
};
