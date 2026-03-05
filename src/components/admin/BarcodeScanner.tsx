/**
 * BarcodeScanner — mobile camera barcode/QR scanner using ZXing.
 * Shows a live camera feed in a dialog and fires onDetected(code)
 * when a barcode is successfully decoded.
 */
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, X, SwitchCamera } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  /** Optional trigger element — if omitted a default "Scan" button is rendered */
  trigger?: React.ReactNode;
}

const BarcodeScanner = ({ onDetected, trigger }: BarcodeScannerProps) => {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // Enumerate cameras
  useEffect(() => {
    if (!open) return;
    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devs) => {
        setDevices(devs);
        // Prefer back camera
        const back = devs.find((d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("environment")
        );
        setSelectedDeviceId(back?.deviceId ?? devs[0]?.deviceId ?? "");
      })
      .catch(() => {
        toast.error("Camera access denied");
      });
  }, [open]);

  // Start decoding when device is selected
  useEffect(() => {
    if (!open || !selectedDeviceId || !videoRef.current) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader
      .decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
        if (result) {
          const code = result.getText();
          onDetected(code);
          toast.success(`Scanned: ${code}`);
          handleClose();
        }
        // NotFoundException is thrown every frame when no barcode found — ignore it
        if (err && !(err instanceof NotFoundException)) {
          console.warn("BarcodeScanner error:", err);
        }
      })
      .catch((e) => {
        console.error("BarcodeScanner start error:", e);
        toast.error("Could not start camera");
      });

    return () => {
      reader.reset();
    };
  }, [open, selectedDeviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    readerRef.current?.reset();
    setOpen(false);
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button variant="outline" size="sm" type="button">
            <Camera className="h-4 w-4 mr-1" />
            Scan
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center justify-between">
              Scan Barcode
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Camera feed */}
          <div className="relative bg-black aspect-square">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            {/* Scanning crosshair overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-primary rounded-lg opacity-80" />
            </div>
          </div>

          {/* Camera selector (only shown if multiple cameras) */}
          {devices.length > 1 && (
            <div className="p-4 flex items-center gap-2">
              <SwitchCamera className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((d) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground pb-4 px-4">
            Point your camera at a barcode or QR code. It will be detected automatically.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BarcodeScanner;
