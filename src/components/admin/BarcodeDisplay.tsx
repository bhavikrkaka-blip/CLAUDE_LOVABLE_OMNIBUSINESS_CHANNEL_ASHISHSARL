/**
 * BarcodeDisplay — renders a JsBarcode SVG barcode.
 * Uses CODE128 by default (works for any alphanumeric string).
 * Falls back to showing the raw barcode string if rendering fails.
 */
import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeDisplayProps {
  value: string;
  /** JsBarcode format — defaults to CODE128 */
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

const BarcodeDisplay = ({
  value,
  format = "CODE128",
  width = 2,
  height = 60,
  displayValue = true,
  className = "",
}: BarcodeDisplayProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        fontSize: 11,
        margin: 6,
        background: "#ffffff",
      });
    } catch (e) {
      console.warn("BarcodeDisplay: failed to render barcode", e);
    }
  }, [value, format, width, height, displayValue]);

  if (!value) return null;

  return <svg ref={svgRef} className={className} />;
};

export default BarcodeDisplay;
