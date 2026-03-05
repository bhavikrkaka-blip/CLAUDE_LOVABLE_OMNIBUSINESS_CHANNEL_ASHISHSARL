/**
 * PrintLabelDialog — shows a printable product label with barcode.
 * Supports thermal (57mm) and A4 (4-per-row) layouts.
 * Uses JsBarcode via the BarcodeDisplay component.
 */
import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Printer } from "lucide-react";
import BarcodeDisplay from "./BarcodeDisplay";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  retail_price?: number | null;
  price?: number;
}

interface PrintLabelDialogProps {
  product: Product;
}

const PrintLabelDialog = ({ product }: PrintLabelDialogProps) => {
  const [copies, setCopies] = useState(1);
  const [layout, setLayout] = useState<"thermal" | "a4">("thermal");
  const printRef = useRef<HTMLDivElement>(null);

  const barcodeValue = product.barcode || product.sku || product.id;
  const displayPrice =
    product.retail_price != null
      ? product.retail_price
      : product.price ?? 0;

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const labelHtml = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Product Label — ${product.name}</title>
          <style>
            @page {
              ${layout === "thermal" ? "size: 57mm auto; margin: 2mm;" : "size: A4; margin: 10mm;"}
            }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
            body { background: white; }
            .label-grid {
              display: ${layout === "a4" ? "grid" : "block"};
              ${layout === "a4" ? "grid-template-columns: repeat(4, 1fr); gap: 4mm;" : ""}
            }
            .label {
              border: 1px solid #ccc;
              padding: 3mm;
              text-align: center;
              ${layout === "thermal" ? "width: 53mm;" : ""}
              break-inside: avoid;
            }
            .label-name {
              font-size: ${layout === "thermal" ? "9pt" : "8pt"};
              font-weight: bold;
              margin-bottom: 2mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .label-price {
              font-size: ${layout === "thermal" ? "14pt" : "11pt"};
              font-weight: bold;
              color: #111;
              margin-bottom: 1mm;
            }
            .label-sku {
              font-size: 7pt;
              color: #555;
              margin-top: 1mm;
            }
            svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="label-grid">
            ${Array.from({ length: copies })
              .map(() => labelHtml)
              .join("")}
          </div>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-1" />
          Print Label
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Print Product Label</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Layout</Label>
              <Select
                value={layout}
                onValueChange={(v) => setLayout(v as "thermal" | "a4")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal">Thermal (57mm)</SelectItem>
                  <SelectItem value="a4">A4 (4-per-row)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Copies</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>

          {/* Label preview */}
          <div className="border rounded-lg p-4 bg-white flex justify-center">
            <div
              ref={printRef}
              className="label border border-gray-300 p-3 text-center"
              style={{ width: layout === "thermal" ? "160px" : "180px" }}
            >
              <p className="text-xs font-bold truncate mb-1">{product.name}</p>
              <p className="text-lg font-bold mb-1">
                {displayPrice.toLocaleString("fr-CM")} XAF
              </p>
              <BarcodeDisplay
                value={barcodeValue}
                height={50}
                width={1.5}
                displayValue={true}
              />
              {product.sku && (
                <p className="text-[10px] text-gray-500 mt-1">SKU: {product.sku}</p>
              )}
            </div>
          </div>

          <Button className="w-full" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print {copies} Label{copies > 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintLabelDialog;
