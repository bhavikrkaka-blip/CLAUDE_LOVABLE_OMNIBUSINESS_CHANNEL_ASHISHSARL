import { useState } from "react";
import { useBanners, useUpdateBanner, useDeleteBanner, useUploadBannerImage, useCreateBanner } from "@/hooks/useBanners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Image as ImageIcon, 
  Pencil, 
  Trash2, 
  Upload, 
  Plus,
  ExternalLink,
  LayoutTemplate
} from "lucide-react";
import type { Banner } from "@/hooks/useBanners";

const BANNER_CATEGORIES = [
  { id: "hero", label: "Hero Banners", prefix: "hero-" },
  { id: "category", label: "Category Banners", prefix: "category-" },
  { id: "promo", label: "Promotional Banners", prefix: "promo-" },
];

const BannerManager = () => {
  const { data: banners, isLoading } = useBanners();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const uploadImage = useUploadBannerImage();
  const createBanner = useCreateBanner();
  
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBanner, setNewBanner] = useState({
    placement: "",
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    button_text: "",
    is_active: true,
    display_order: 0,
  });

  const handleImageUpload = async (file: File, bannerId?: string) => {
    try {
      const url = await uploadImage.mutateAsync(file);
      
      if (bannerId) {
        await updateBanner.mutateAsync({
          id: bannerId,
          updates: { image_url: url },
        });
        toast.success("Banner image updated");
      }
      
      return url;
    } catch (error) {
      toast.error("Failed to upload image");
      throw error;
    }
  };

  const handleUpdateBanner = async (id: string, updates: Partial<Banner>) => {
    try {
      await updateBanner.mutateAsync({ id, updates });
      toast.success("Banner updated");
      setEditingBanner(null);
    } catch (error) {
      toast.error("Failed to update banner");
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    
    try {
      await deleteBanner.mutateAsync(id);
      toast.success("Banner deleted");
    } catch (error) {
      toast.error("Failed to delete banner");
    }
  };

  const handleCreateBanner = async () => {
    if (!newBanner.placement || !newBanner.image_url) {
      toast.error("Placement and image are required");
      return;
    }
    
    try {
      await createBanner.mutateAsync(newBanner);
      toast.success("Banner created");
      setIsCreateOpen(false);
      setNewBanner({
        placement: "",
        title: "",
        subtitle: "",
        image_url: "",
        link_url: "",
        button_text: "",
        is_active: true,
        display_order: 0,
      });
    } catch (error) {
      toast.error("Failed to create banner");
    }
  };

  const filterBannersByPrefix = (prefix: string) => {
    return banners?.filter(b => b.placement.startsWith(prefix)) || [];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Banner Management</h2>
          <p className="text-sm text-muted-foreground">
            Edit website banners and promotional images
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Placement ID</Label>
                <Input
                  value={newBanner.placement}
                  onChange={(e) => setNewBanner({ ...newBanner, placement: e.target.value })}
                  placeholder="e.g., promo-3, category-electronics"
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={newBanner.subtitle}
                  onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={newBanner.image_url}
                    onChange={(e) => setNewBanner({ ...newBanner, image_url: e.target.value })}
                    placeholder="Image URL"
                  />
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleImageUpload(file);
                          setNewBanner({ ...newBanner, image_url: url });
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="icon" asChild>
                      <span><Upload className="h-4 w-4" /></span>
                    </Button>
                  </label>
                </div>
              </div>
              <div>
                <Label>Link URL</Label>
                <Input
                  value={newBanner.link_url}
                  onChange={(e) => setNewBanner({ ...newBanner, link_url: e.target.value })}
                  placeholder="/products or https://..."
                />
              </div>
              <div>
                <Label>Button Text</Label>
                <Input
                  value={newBanner.button_text}
                  onChange={(e) => setNewBanner({ ...newBanner, button_text: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateBanner} className="w-full">
                Create Banner
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="hero">
        <TabsList>
          {BANNER_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {BANNER_CATEGORIES.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="space-y-4">
            {filterBannersByPrefix(cat.prefix).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <LayoutTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No {cat.label.toLowerCase()} configured</p>
              </div>
            ) : (
              filterBannersByPrefix(cat.prefix).map((banner) => (
                <Card key={banner.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Preview Image */}
                      <div className="relative w-40 h-24 flex-shrink-0 rounded overflow-hidden bg-muted">
                        {banner.image_url && banner.image_url !== "/placeholder.svg" ? (
                          <img
                            src={banner.image_url}
                            alt={banner.title || banner.placement}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, banner.id);
                            }}
                          />
                          <Upload className="h-6 w-6 text-white" />
                        </label>
                      </div>

                      {/* Banner Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {banner.title || banner.placement}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {banner.subtitle || "No subtitle"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ID: {banner.placement}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={banner.is_active}
                              onCheckedChange={(checked) =>
                                handleUpdateBanner(banner.id, { is_active: checked })
                              }
                            />
                            <Dialog
                              open={editingBanner?.id === banner.id}
                              onOpenChange={(open) => !open && setEditingBanner(null)}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingBanner(banner)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Banner</DialogTitle>
                                </DialogHeader>
                                {editingBanner && (
                                  <BannerEditForm
                                    banner={editingBanner}
                                    onSave={(updates) =>
                                      handleUpdateBanner(editingBanner.id, updates)
                                    }
                                    onImageUpload={(file) =>
                                      handleImageUpload(file, editingBanner.id)
                                    }
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteBanner(banner.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {banner.link_url && (
                          <a
                            href={banner.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-2"
                          >
                            {banner.link_url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

// Separate form component for editing
const BannerEditForm = ({
  banner,
  onSave,
  onImageUpload,
}: {
  banner: Banner;
  onSave: (updates: Partial<Banner>) => void;
  onImageUpload: (file: File) => Promise<string>;
}) => {
  const [formData, setFormData] = useState({
    title: banner.title || "",
    subtitle: banner.subtitle || "",
    link_url: banner.link_url || "",
    button_text: banner.button_text || "",
    display_order: banner.display_order,
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>
      <div>
        <Label>Subtitle</Label>
        <Input
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
        />
      </div>
      <div>
        <Label>Link URL</Label>
        <Input
          value={formData.link_url}
          onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
        />
      </div>
      <div>
        <Label>Button Text</Label>
        <Input
          value={formData.button_text}
          onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
        />
      </div>
      <div>
        <Label>Display Order</Label>
        <Input
          type="number"
          value={formData.display_order}
          onChange={(e) =>
            setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
          }
        />
      </div>
      <div>
        <Label>Replace Image</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              await onImageUpload(file);
            }
          }}
        />
      </div>
      <Button onClick={() => onSave(formData)} className="w-full">
        Save Changes
      </Button>
    </div>
  );
};

export default BannerManager;
