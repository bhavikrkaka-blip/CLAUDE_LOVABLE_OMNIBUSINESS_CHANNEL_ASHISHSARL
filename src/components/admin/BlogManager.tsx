import { useState } from "react";
import { useBlogPosts, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost, BlogPost } from "@/hooks/useBlogPosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const BlogManager = () => {
  const { data: posts, isLoading } = useBlogPosts();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setExcerpt("");
    setMetaDescription("");
    setFeaturedImage("");
    setIsPublished(false);
    setEditingPost(null);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setExcerpt(post.excerpt || "");
    setMetaDescription(post.meta_description || "");
    setFeaturedImage(post.featured_image || "");
    setIsPublished(post.is_published);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    try {
      if (editingPost) {
        await updatePost.mutateAsync({
          id: editingPost.id,
          title,
          content,
          excerpt: excerpt || null,
          meta_description: metaDescription || null,
          featured_image: featuredImage || null,
          is_published: isPublished,
        });
        toast.success("Blog post updated");
      } else {
        await createPost.mutateAsync({
          title,
          content,
          excerpt: excerpt || undefined,
          meta_description: metaDescription || undefined,
          featured_image: featuredImage || undefined,
          is_published: isPublished,
        });
        toast.success("Blog post created");
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to save blog post");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePost.mutateAsync(id);
      toast.success("Blog post deleted");
    } catch {
      toast.error("Failed to delete blog post");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Blog Management</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      <div className="bg-background rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !posts?.length ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No blog posts yet</p>
            <Button variant="outline" className="mt-4" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Write your first post
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-[300px] truncate">
                    {post.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.is_published ? "default" : "secondary"}>
                      {post.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(post.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {post.is_published && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(post)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Post</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{post.title}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(post.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Blog Post Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "New Blog Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="blog-title">Title *</Label>
              <Input
                id="blog-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter blog post title"
              />
            </div>
            <div>
              <Label htmlFor="blog-excerpt">Excerpt (short summary)</Label>
              <Input
                id="blog-excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary for listing pages"
              />
            </div>
            <div>
              <Label htmlFor="blog-meta">Meta Description (for SEO)</Label>
              <Input
                id="blog-meta"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="SEO description under 160 characters"
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground mt-1">{metaDescription.length}/160</p>
            </div>
            <div>
              <Label htmlFor="blog-image">Featured Image URL</Label>
              <Input
                id="blog-image"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label htmlFor="blog-content">Content * (Markdown supported)</Label>
              <Textarea
                id="blog-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your blog post content here... Markdown is supported."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="blog-published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
              <Label htmlFor="blog-published">Publish immediately</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createPost.isPending || updatePost.isPending}
              >
                {(createPost.isPending || updatePost.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingPost ? "Update" : "Create"} Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManager;
