import { useState } from "react";
import { FormLabel } from "@/components/ui/form";
import { Loader2, Upload, X, Star } from "lucide-react";
import { toast } from "sonner";
import { useUploadProductImage, useDeleteProductImage } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface ImageUploadSectionProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  images,
  onImagesChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const uploadImage = useUploadProductImage();
  const deleteImage = useDeleteProductImage();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      const newImages: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadImage.mutateAsync(file);
        newImages.push(url);
      }
      onImagesChange([...images, ...newImages]);
      toast.success("Image(s) uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      await deleteImage.mutateAsync(imageUrl);
      onImagesChange(images.filter((url) => url !== imageUrl));
      toast.success("Image removed");
    } catch (error) {
      // Still remove from local state even if delete fails
      onImagesChange(images.filter((url) => url !== imageUrl));
    }
  };

  const handleSetPrimary = (imageUrl: string) => {
    const currentIndex = images.indexOf(imageUrl);
    if (currentIndex > 0) {
      const newImages = [...images];
      newImages.splice(currentIndex, 1);
      newImages.unshift(imageUrl);
      onImagesChange(newImages);
      toast.success("Primary image set");
    }
  };

  return (
    <div className="space-y-2">
      <FormLabel>Product Images</FormLabel>
      <p className="text-xs text-muted-foreground mb-2">
        Click the star to set an image as the primary/highlighted image (first in list)
      </p>
      <div className="flex flex-wrap gap-2">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Product ${index + 1}`}
              className={cn(
                "w-20 h-20 object-cover rounded border-2 transition-colors",
                index === 0 ? "border-primary ring-2 ring-primary/20" : "border-transparent"
              )}
            />
            {index === 0 && (
              <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground rounded-full p-0.5">
                <Star className="h-3 w-3 fill-current" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(url)}
                  className="bg-primary text-primary-foreground rounded-full p-1.5 hover:bg-primary/90"
                  title="Set as primary"
                >
                  <Star className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(url)}
                className="bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        <label className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );
};

export default ImageUploadSection;
