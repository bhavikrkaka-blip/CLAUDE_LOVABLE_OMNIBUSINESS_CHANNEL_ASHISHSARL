import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface VoucherLine {
  product_id: string;
  name: string;
  sku: string;
  qty: number;
  rate: number;
  amount: number;
}

interface POSPrintInvoiceProps {
  invoiceNo: string;
  voucherDate: string;
  storeName: string;
  customerName: string;
  lines: VoucherLine[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: string;
  cashTendered?: number;
  changeAmount?: number;
  printSize?: "thermal" | "a4";
}

const fmtCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

const POSPrintInvoice = ({
  invoiceNo, voucherDate, storeName, customerName,
  lines, subtotal, discount, grandTotal,
  paymentMethod, cashTendered = 0, changeAmount = 0,
  printSize = "thermal",
}: POSPrintInvoiceProps) => {
  const handlePrintThermal = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Invoice ${invoiceNo}</title>
<style>
  @page { size: 80mm auto; margin: 3mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 11px; width: 80mm; margin: 0 auto; color: #000; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 4px 0; }
  .store-name { font-size: 14px; font-weight: bold; text-align: center; }
  .invoice-no { font-size: 10px; text-align: center; color: #333; }
  table { width: 100%; border-collapse: collapse; }
  th { font-weight: bold; border-bottom: 1px solid #000; padding: 2px 0; font-size: 10px; }
  td { padding: 2px 0; font-size: 10px; vertical-align: top; }
  .item-name { width: 60%; }
  .qty { width: 8%; text-align: center; }
  .price { width: 20%; text-align: right; }
  .amount { width: 22%; text-align: right; }
  .totals td { font-size: 11px; padding: 2px 0; }
  .grand-total td { font-size: 13px; font-weight: bold; border-top: 2px solid #000; padding-top: 4px; }
  .footer { text-align: center; margin-top: 8px; font-size: 9px; }
</style>
</head>
<body>
<div class="store-name">ASHISH SARL</div>
<div class="invoice-no">${storeName}</div>
<div class="divider"></div>
<div class="center" style="font-size:10px;">
  Tél: +237 673 750 693<br/>
  Date: ${voucherDate} | Facture: ${invoiceNo}
</div>
${customerName ? `<div class="center" style="font-size:10px;">Client: ${customerName}</div>` : ""}
<div class="divider"></div>
<table>
  <thead>
    <tr>
      <th class="item-name">Article</th>
      <th class="qty">Qté</th>
      <th class="price">P.U.</th>
      <th class="amount">Total</th>
    </tr>
  </thead>
  <tbody>
    ${lines.map(l => `
    <tr>
      <td class="item-name">${l.name}${l.sku ? `<br/><span style="font-size:9px;color:#555;">${l.sku}</span>` : ""}</td>
      <td class="qty">${l.qty}</td>
      <td class="price">${fmtCFA(l.rate)}</td>
      <td class="amount">${fmtCFA(l.amount)}</td>
    </tr>`).join("")}
  </tbody>
</table>
<div class="divider"></div>
<table class="totals">
  <tr><td>Sous-total</td><td class="right">${fmtCFA(subtotal)} FCFA</td></tr>
  ${discount > 0 ? `<tr><td>Remise</td><td class="right">-${fmtCFA(discount)} FCFA</td></tr>` : ""}
</table>
<table class="grand-total">
  <tr><td class="bold">TOTAL</td><td class="right bold">${fmtCFA(grandTotal)} FCFA</td></tr>
</table>
<div class="divider"></div>
<div style="font-size:10px; margin-top:4px;">
  <strong>Paiement:</strong> ${paymentMethod}<br/>
  ${cashTendered > 0 ? `<strong>Reçu:</strong> ${fmtCFA(cashTendered)} FCFA<br/>` : ""}
  ${changeAmount > 0 ? `<strong>Rendu:</strong> ${fmtCFA(changeAmount)} FCFA<br/>` : ""}
</div>
<div class="footer">
  <div class="divider"></div>
  Merci pour votre achat!<br/>
  www.ashishsarl.com
</div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const handlePrintA4 = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Invoice ${invoiceNo}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; width: 210mm; margin: 0 auto; color: #000; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px solid #ccc; margin: 8px 0; }
  .store-name { font-size: 20px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; }
  th { font-weight: bold; background: #f5f5f5; border-bottom: 2px solid #333; padding: 6px 4px; font-size: 11px; }
  td { padding: 5px 4px; font-size: 11px; border-bottom: 1px solid #eee; vertical-align: top; }
  .item-name { width: 40%; }
  .qty { width: 8%; text-align: center; }
  .price { width: 22%; text-align: right; }
  .amount { width: 22%; text-align: right; }
  .totals td { font-size: 12px; padding: 3px 4px; border: none; }
  .grand-total td { font-size: 15px; font-weight: bold; border-top: 2px solid #333; padding-top: 6px; }
  .a4-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
  .company-info { text-align: left; }
  .invoice-info { text-align: right; }
  .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #666; }
</style>
</head>
<body>
<div class="a4-header">
  <div class="company-info">
    <div class="store-name">ASHISH SARL</div>
    <div style="font-size:11px;">${storeName}</div>
    <div style="font-size:11px;">Tél: +237 673 750 693</div>
    <div style="font-size:11px;">Yaoundé, Cameroun</div>
  </div>
  <div class="invoice-info">
    <div style="font-size:18px; font-weight:bold;">FACTURE</div>
    <div style="font-size:11px;">N°: ${invoiceNo}</div>
    <div style="font-size:11px;">Date: ${voucherDate}</div>
    ${customerName ? `<div style="font-size:11px;">Client: ${customerName}</div>` : ""}
  </div>
</div>
<div class="divider"></div>
<table>
  <thead>
    <tr>
      <th class="item-name">Article</th>
      <th class="qty">Qté</th>
      <th class="price">Prix Unitaire</th>
      <th class="amount">Total</th>
    </tr>
  </thead>
  <tbody>
    ${lines.map(l => `
    <tr>
      <td class="item-name">${l.name}${l.sku ? `<div style="font-size:9px;color:#777;">${l.sku}</div>` : ""}</td>
      <td class="qty">${l.qty}</td>
      <td class="price">${fmtCFA(l.rate)} FCFA</td>
      <td class="amount">${fmtCFA(l.amount)} FCFA</td>
    </tr>`).join("")}
  </tbody>
</table>
<div class="divider"></div>
<table class="totals" style="width:40%; margin-left:auto;">
  <tr><td>Sous-total</td><td class="right">${fmtCFA(subtotal)} FCFA</td></tr>
  ${discount > 0 ? `<tr><td>Remise</td><td class="right">-${fmtCFA(discount)} FCFA</td></tr>` : ""}
</table>
<table class="grand-total" style="width:40%; margin-left:auto;">
  <tr><td class="bold">TOTAL</td><td class="right bold">${fmtCFA(grandTotal)} FCFA</td></tr>
</table>
<div class="divider"></div>
<div style="font-size:11px; margin-top:8px;">
  <strong>Mode de paiement:</strong> ${paymentMethod}<br/>
  ${cashTendered > 0 ? `<strong>Montant reçu:</strong> ${fmtCFA(cashTendered)} FCFA<br/>` : ""}
  ${changeAmount > 0 ? `<strong>Monnaie rendue:</strong> ${fmtCFA(changeAmount)} FCFA<br/>` : ""}
</div>
<div class="footer">
  Merci pour votre achat! | www.ashishsarl.com<br/>
  Tout article vendu ne sera ni repris ni échangé.
</div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePrintThermal}
        title="Print thermal receipt (80mm)"
      >
        <Printer className="h-4 w-4 mr-1" />
        Receipt
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePrintA4}
        title="Print A4 invoice"
      >
        <Printer className="h-4 w-4 mr-1" />
        A4
      </Button>
    </div>
  );
};

export default POSPrintInvoice;
