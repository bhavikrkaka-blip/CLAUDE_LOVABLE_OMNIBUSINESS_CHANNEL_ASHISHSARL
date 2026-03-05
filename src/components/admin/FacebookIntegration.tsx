import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Facebook, Copy, ExternalLink, Check, BarChart3 } from "lucide-react";
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/useSystemSettings";

const FacebookIntegration = () => {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();

  const [pixelId, setPixelId] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [ga4Id, setGa4Id] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // Sync local state when DB data loads
  useEffect(() => {
    if (settings) {
      setPixelId(settings.fb_pixel_id ?? "");
      setIsEnabled(settings.fb_pixel_enabled);
      setGa4Id(settings.ga4_measurement_id ?? "");
    }
  }, [settings]);

  const handleSavePixel = () => {
    updateSettings.mutate({ fb_pixel_id: pixelId, fb_pixel_enabled: isEnabled });
  };

  const handleSaveGA4 = () => {
    updateSettings.mutate({ ga4_measurement_id: ga4Id });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  };

  const generateUTMLink = (campaignName: string) => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      utm_source: "facebook",
      utm_medium: "paid",
      utm_campaign: campaignName || "default_campaign",
      utm_content: "{{ad.name}}",
    });
    return `${baseUrl}?${params.toString()}`;
  };

  if (isLoading) {
    return <div className="text-muted-foreground p-4">Loading settings…</div>;
  }

  return (
    <div className="space-y-6">
      {/* ─── Facebook Pixel ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Facebook Pixel Integration
          </CardTitle>
          <CardDescription>
            Track conversions and visitors from your Facebook ads. Settings saved to database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Facebook Pixel</Label>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <div>
            <Label>Pixel ID</Label>
            <Input
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              placeholder="Enter your Facebook Pixel ID (e.g. 123456789012345)"
              disabled={!isEnabled}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Find this in your Facebook Events Manager
            </p>
          </div>

          <Button
            onClick={handleSavePixel}
            disabled={updateSettings.isPending || (!pixelId && isEnabled)}
          >
            Save Pixel Settings
          </Button>

          {isEnabled && pixelId && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Pixel is active
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Tracking PageView, ViewContent, AddToCart, and Purchase events
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Google Analytics 4 ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            Google Analytics 4
          </CardTitle>
          <CardDescription>
            Track traffic, user behaviour, and e-commerce conversions with GA4.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Measurement ID</Label>
            <Input
              value={ga4Id}
              onChange={(e) => setGa4Id(e.target.value)}
              placeholder="G-XXXXXXXXXX"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Find this in Google Analytics → Admin → Data Streams → your stream
            </p>
          </div>

          <Button onClick={handleSaveGA4} disabled={updateSettings.isPending}>
            Save GA4 Settings
          </Button>

          {ga4Id && (
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-800 dark:text-orange-200">
                  GA4 is active — Measurement ID: {ga4Id}
                </span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Tracking page_view, view_item, add_to_cart, begin_checkout, and purchase events
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── UTM Link Generator ─── */}
      <Card>
        <CardHeader>
          <CardTitle>UTM Link Generator</CardTitle>
          <CardDescription>
            Create trackable links for your Facebook ad campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Homepage with Facebook tracking</Label>
            <div className="flex gap-2 mt-1">
              <Input
                readOnly
                value={generateUTMLink("homepage")}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(generateUTMLink("homepage"), "homepage")}
              >
                {copied === "homepage" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label>Products page with Facebook tracking</Label>
            <div className="flex gap-2 mt-1">
              <Input
                readOnly
                value={`${window.location.origin}/products?utm_source=facebook&utm_medium=paid&utm_campaign=products`}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  copyToClipboard(
                    `${window.location.origin}/products?utm_source=facebook&utm_medium=paid&utm_campaign=products`,
                    "products"
                  )
                }
              >
                {copied === "products" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">UTM Parameters Guide</h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <Badge variant="outline">utm_source</Badge>
                <span className="text-muted-foreground">Traffic source (facebook, google, instagram)</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">utm_medium</Badge>
                <span className="text-muted-foreground">Marketing medium (paid, organic, email)</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">utm_campaign</Badge>
                <span className="text-muted-foreground">Campaign name (summer_sale, new_arrivals)</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">utm_content</Badge>
                <span className="text-muted-foreground">Ad variation or content identifier</span>
              </div>
            </div>
          </div>

          <a
            href="https://www.facebook.com/business/help/952192354843755"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Learn more about Facebook Pixel
            <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacebookIntegration;
