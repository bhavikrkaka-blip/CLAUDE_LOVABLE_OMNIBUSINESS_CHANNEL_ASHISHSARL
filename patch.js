var fs = require("fs");
var path = "src/pages/AdminInventory.tsx";
var c = fs.readFileSync(path, "utf8");

// ── Step 1: Replace InventoryRow interface ──
var old1 = "interface InventoryRow {\n  product_id: string;\n  product_name: string;\n  sku: string;\n  barcode: string | null;\n  quantity: number;\n  reorder_level: number;\n  cost_price: number;\n  wholesale_price: number;\n  retail_price: number;\n}";
var new1 = "interface InventoryRow {\n  product_id: string;\n  product_name: string;\n  sku: string;\n  barcode: string | null;\n  quantity: number;           // total (sum across locations if all-mode)\n  reorder_level: number;\n  cost_price: number;\n  wholesale_price: number;\n  retail_price: number;\n  location_id?: string;       // undefined when in all-locations mode\n  location_name?: string;     // undefined when in all-locations mode\n  locationBreakdown?: { name: string; qty: number }[]; // only in all-locations mode\n}";
if (c.indexOf(old1) >= 0) { c = c.replace(old1, new1); console.log("Step 1 OK: interface replaced"); }
else if (c.indexOf("locationBreakdown") >= 0) { console.log("Step 1 SKIP"); }
else { console.error("Step 1 FAIL"); process.exit(1); }

// ── Step 2: Add All Locations dropdown item ──
var old2 = "<SelectContent>\n              {locations.map((loc) => (\n                <SelectItem key={loc.id} value={loc.id}>\n                  {loc.name} ({loc.type})\n                </SelectItem>\n              ))}\n            </SelectContent>";
var new2 = "<SelectContent>\n              <SelectItem value=\"all\">All Locations</SelectItem>\n              {locations.map((loc) => (\n                <SelectItem key={loc.id} value={loc.id}>\n                  {loc.name} ({loc.type})\n                </SelectItem>\n              ))}\n            </SelectContent>";
if (c.indexOf(old2) >= 0) { c = c.replace(old2, new2); console.log("Step 2 OK: All Locations added"); }
else if (c.indexOf("value=\"all\"") >= 0) { console.log("Step 2 SKIP"); }
else { console.error("Step 2 FAIL: " + JSON.stringify(c.substring(c.indexOf("<SelectContent>"), c.indexOf("<SelectContent>")+200))); process.exit(1); }
