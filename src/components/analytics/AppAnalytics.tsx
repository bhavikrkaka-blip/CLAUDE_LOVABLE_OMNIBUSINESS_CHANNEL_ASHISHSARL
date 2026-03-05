/**
 * AppAnalytics — reads system_settings from DB and mounts
 * Facebook Pixel + Google Analytics 4.
 * Must be rendered inside QueryClientProvider.
 */
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { FacebookPixel } from "./FacebookPixel";
import { GoogleAnalytics } from "./GoogleAnalytics";

const AppAnalytics = () => {
  const { data: settings } = useSystemSettings();

  const pixelId =
    settings?.fb_pixel_enabled && settings?.fb_pixel_id
      ? settings.fb_pixel_id
      : "";

  const ga4Id = settings?.ga4_measurement_id ?? "";

  return (
    <>
      <FacebookPixel pixelId={pixelId} />
      <GoogleAnalytics measurementId={ga4Id} />
    </>
  );
};

export default AppAnalytics;
