export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  reference: string;
  code: string;
  price: number;
  description?: string;
  features?: string[];
  imageUrl?: string;
  inStock: boolean;
}

export type Category = 
  | "CLIMATISEUR"
  | "CONGELATEUR"
  | "FRIGO"
  | "MACHINE A LAVER"
  | "TELEVISEUR"
  | "VENTILATEUR"
  | "MICRO ONDE"
  | "CUISINIERE"
  | "REGULATEUR"
  | "FER A REPASSER"
  | "AIR COOLER"
  | "DISPENSEUR EAU"
  | "ROBOT MIXEUR"
  | "CHAUFFE-EAU"
  | "SECHE-LINGE"
  | "CAVE A VIN"
  | "AUTRES";

export type Brand = 
  | "OCEAN"
  | "DELTA"
  | "WESTPOINT"
  | "FIABTEC"
  | "HISENSE"
  | "SPJ"
  | "SOLSTAR"
  | "SHARP"
  | "SAMSUNG"
  | "OSCAR"
  | "TORNADO"
  | "EUROLUX"
  | "LG"
  | "ICONA"
  | "INNOVA"
  | "SIGNATURE"
  | "VERVE"
  | "ROCH"
  | "SUPER FLAME"
  | "TCL"
  | "MIDEA"
  | "BINATONE"
  | "MEWE"
  | "MILLENIUM"
  | "DAIKIN"
  | "ARF"
  | "VALENCIA"
  | "VESTEL"
  | "SKYWORTH"
  | "SKYWORLD"
  | "MITSUMI"
  | "BELLE FRANCE"
  | "GOODWIN"
  | "PREMAX"
  | "LIGHTWAVE"
  | "STARSAT"
  | "KENWOOD"
  | "KEPAS"
  | "UFESA"
  | "UBIT"
  | "BLACK DECKER"
  | "MR UK"
  | "HOME BASE"
  | "ASTECH"
  | "AUX";

export const brands: Brand[] = [
  "OCEAN",
  "DELTA",
  "WESTPOINT",
  "FIABTEC",
  "HISENSE",
  "SPJ",
  "SOLSTAR",
  "SHARP",
  "SAMSUNG",
  "OSCAR",
  "TORNADO",
  "LG",
  "TCL",
  "ROCH",
  "MIDEA",
  "ICONA",
  "SIGNATURE",
  "DAIKIN",
  "VESTEL",
  "BELLE FRANCE",
  "GOODWIN",
  "KENWOOD",
  "MITSUMI",
  "ASTECH",
  "AUX"
];

export const categories: { id: Category; labelEn: string; labelFr: string }[] = [
  { id: "CLIMATISEUR", labelEn: "Air Conditioner", labelFr: "Climatiseur" },
  { id: "CONGELATEUR", labelEn: "Freezer", labelFr: "Congélateur" },
  { id: "FRIGO", labelEn: "Refrigerator", labelFr: "Réfrigérateur" },
  { id: "MACHINE A LAVER", labelEn: "Washing Machine", labelFr: "Machine à Laver" },
  { id: "TELEVISEUR", labelEn: "Television", labelFr: "Téléviseur" },
  { id: "VENTILATEUR", labelEn: "Fan", labelFr: "Ventilateur" },
  { id: "MICRO ONDE", labelEn: "Microwave", labelFr: "Micro-ondes" },
  { id: "CUISINIERE", labelEn: "Cooker/Stove", labelFr: "Cuisinière" },
  { id: "REGULATEUR", labelEn: "Voltage Regulator", labelFr: "Régulateur" },
  { id: "FER A REPASSER", labelEn: "Iron", labelFr: "Fer à Repasser" },
  { id: "AIR COOLER", labelEn: "Air Cooler", labelFr: "Refroidisseur d'Air" },
  { id: "DISPENSEUR EAU", labelEn: "Water Dispenser", labelFr: "Distributeur d'Eau" },
  { id: "ROBOT MIXEUR", labelEn: "Blender/Mixer", labelFr: "Robot Mixeur" },
  { id: "CHAUFFE-EAU", labelEn: "Water Heater", labelFr: "Chauffe-eau" },
  { id: "SECHE-LINGE", labelEn: "Dryer", labelFr: "Sèche-linge" },
  { id: "CAVE A VIN", labelEn: "Wine Cellar", labelFr: "Cave à Vin" },
  { id: "AUTRES", labelEn: "Other", labelFr: "Autres" },
];

// Helper function to generate product ID
const generateId = (brand: string, reference: string): string => {
  return `${brand.toLowerCase()}-${reference.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
};

// Parse price from string like "165,000 FCFA" to number
const parsePrice = (priceStr: string): number => {
  return parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
};

// Extract features from product description
const extractFeatures = (description: string): string[] => {
  const features: string[] = [];
  
  // Extract capacity/size
  const capacityMatch = description.match(/(\d+)\s*(kg|litres|liters|l\b)/i);
  if (capacityMatch) features.push(`${capacityMatch[1]} ${capacityMatch[2].toUpperCase()}`);
  
  // Extract BTU
  const btuMatch = description.match(/(\d+[\s,]?\d*)\s*BTU/i);
  if (btuMatch) features.push(`${btuMatch[1].replace(/\s/g, '')} BTU`);
  
  // Extract CV/HP
  const cvMatch = description.match(/(\d+[.,]?\d*)\s*(CV|HP)/i);
  if (cvMatch) features.push(`${cvMatch[1]} ${cvMatch[2].toUpperCase()}`);
  
  // Extract warranty
  const warrantyMatch = description.match(/(\d+)\s*(mois|months?)/i);
  if (warrantyMatch) features.push(`Garantie ${warrantyMatch[1]} mois`);
  
  // Extract class
  const classMatch = description.match(/classe?\s*(énergétique\s*)?(a\+*)/i);
  if (classMatch) features.push(`Classe ${classMatch[2].toUpperCase()}`);
  
  // Extract No Frost
  if (description.toLowerCase().includes('no frost')) features.push('No Frost');
  
  // Extract Inverter
  if (description.toLowerCase().includes('inverter')) features.push('Inverter');
  
  // Extract Smart/Wi-Fi
  if (description.toLowerCase().includes('wi-fi') || description.toLowerCase().includes('wifi')) features.push('Wi-Fi');
  if (description.toLowerCase().includes('smart')) features.push('Smart');
  
  return features.slice(0, 5); // Limit to 5 features
};

// Determine category from description
const determineCategory = (description: string): Category => {
  const desc = description.toLowerCase();
  if (desc.includes('climatiseur') || desc.includes('air conditioner')) return 'CLIMATISEUR';
  if (desc.includes('congélateur') || desc.includes('freezer') || desc.includes('coffre')) return 'CONGELATEUR';
  if (desc.includes('réfrigérateur') || desc.includes('refrigerator') || desc.includes('frigo')) return 'FRIGO';
  if (desc.includes('machine à laver') || desc.includes('washing machine') || desc.includes('lave-linge')) return 'MACHINE A LAVER';
  if (desc.includes('sèche-linge') || desc.includes('dryer')) return 'SECHE-LINGE';
  if (desc.includes('ventilateur') || desc.includes('fan')) return 'VENTILATEUR';
  if (desc.includes('cuisinière') || desc.includes('cooker') || desc.includes('gazinière')) return 'CUISINIERE';
  if (desc.includes('chauffe-eau') || desc.includes('water heater')) return 'CHAUFFE-EAU';
  if (desc.includes('cave à vin') || desc.includes('wine')) return 'CAVE A VIN';
  if (desc.includes('micro-onde') || desc.includes('microwave')) return 'MICRO ONDE';
  return 'AUTRES';
};

// Determine brand from description
const determineBrand = (description: string): string => {
  const desc = description.toUpperCase();
  if (desc.includes('TORNADO')) return 'TORNADO';
  if (desc.includes('HISENSE')) return 'HISENSE';
  if (desc.includes('FIABTEC')) return 'FIABTEC';
  if (desc.includes('OSCAR')) return 'OSCAR';
  if (desc.includes('EUROLUX')) return 'EUROLUX';
  if (desc.includes('LG ') || desc.startsWith('LG')) return 'LG';
  if (desc.includes('ICONA')) return 'ICONA';
  if (desc.includes('INNOVA')) return 'INNOVA';
  if (desc.includes('SIGNATURE')) return 'SIGNATURE';
  if (desc.includes('VERVE')) return 'VERVE';
  if (desc.includes('ROCH')) return 'ROCH';
  if (desc.includes('SUPER FLAME') || desc.includes('SUPERFLAME')) return 'SUPER FLAME';
  if (desc.includes('DELTA')) return 'DELTA';
  if (desc.includes('TCL')) return 'TCL';
  if (desc.includes('MIDEA')) return 'MIDEA';
  if (desc.includes('SAMSUNG')) return 'SAMSUNG';
  if (desc.includes('BINATONE')) return 'BINATONE';
  if (desc.includes('WESTPOINT')) return 'WESTPOINT';
  if (desc.includes('MEWE')) return 'MEWE';
  if (desc.includes('MILLENIUM')) return 'MILLENIUM';
  if (desc.includes('DAIKIN')) return 'DAIKIN';
  if (desc.includes('ARF')) return 'ARF';
  if (desc.includes('VALENCIA')) return 'VALENCIA';
  return 'AUTRES';
};

// Products from Excel sourcing list with real images
export const products: Product[] = [
  // TORNADO Washing Machines
  {
    id: generateId("TORNADO", "TVH-HM10TS-SK"),
    name: "Machine à laver semi-automatique TORNADO 10 Kg – TVH-HM10TS(SK)",
    brand: "TORNADO",
    category: "MACHINE A LAVER",
    reference: "TVH-HM10TS(SK)",
    code: "TORN001",
    price: 165000,
    description: "Deux Cuves – Essorage 1400 tr/min – Système Vortex à deux directions – Gris",
    features: ["10 Kg", "1400 tr/min", "Deux Cuves", "Système Vortex", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_semi_automatique_tornado_10_kg_tvh-hm10ts_sk_8_.jpg",
    inStock: true
  },
  {
    id: generateId("TORNADO", "TVH-HM12TS-BK"),
    name: "Machine à laver semi-automatique TORNADO 12 Kg – TVH-HM12TS(BK)",
    brand: "TORNADO",
    category: "MACHINE A LAVER",
    reference: "TVH-HM12TS(BK)",
    code: "TORN002",
    price: 155000,
    description: "Deux Cuves – Essorage 1400 tr/min – Système Vortex à deux directions – Noir",
    features: ["12 Kg", "1400 tr/min", "Deux Cuves", "Système Vortex", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_semi_automatique_tornado_12_kg_tvh-hm12ts_bk_8_.jpg",
    inStock: true
  },
  {
    id: generateId("TORNADO", "TMH-HS07C-WB"),
    name: "Machine à laver semi-automatique TORNADO 7 Kg – TMH-HS07C(WB)",
    brand: "TORNADO",
    category: "MACHINE A LAVER",
    reference: "TMH-HS07C(WB)",
    code: "TORN003",
    price: 120000,
    description: "Deux Cuves – Essorage 1200 tr/min – Système Vortex à deux directions – Blanc & Bleu",
    features: ["7 Kg", "1200 tr/min", "Deux Cuves", "Système Vortex", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_semi_automatique_tornado_7_kg_10_.jpg",
    inStock: true
  },
  {
    id: generateId("TORNADO", "TMH-HS10C-WB"),
    name: "Machine à laver semi-automatique TORNADO 10 Kg – TMH-HS10C(WB)",
    brand: "TORNADO",
    category: "MACHINE A LAVER",
    reference: "TMH-HS10C(WB)",
    code: "TORN004",
    price: 125000,
    description: "Deux Cuves – Essorage 1200 tr/min – Système Vortex à deux directions – Blanc & Bleu",
    features: ["10 Kg", "1200 tr/min", "Deux Cuves", "Système Vortex", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_semi_automatique_tornado_10_kg_9_.jpg",
    inStock: true
  },
  {
    id: generateId("TORNADO", "TMH-HS12C-WK"),
    name: "Machine à laver semi-automatique TORNADO 12 Kg – TMH-HS12C(WK)",
    brand: "TORNADO",
    category: "MACHINE A LAVER",
    reference: "TMH-HS12C(WK)",
    code: "TORN005",
    price: 150000,
    description: "Deux Cuves – Essorage 1200 tr/min – Système Vortex à deux directions – Blanc & Noir",
    features: ["12 Kg", "1200 tr/min", "Deux Cuves", "Système Vortex", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_semi_automatique_tornado_12_kg_1200trmin_1__1.jpg",
    inStock: true
  },
  
  // TORNADO Refrigerators
  {
    id: generateId("TORNADO", "RF-31FTV-SL"),
    name: "TORNADO Refrigerator RF-31FTV-SL - 296 Liters",
    brand: "TORNADO",
    category: "FRIGO",
    reference: "RF-31FTV-SL",
    code: "TORN006",
    price: 345000,
    description: "Inverter Technology - No Frost - Platinum Filter - Class A - Silver",
    features: ["296 Litres", "Inverter", "No Frost", "Platinum Filter", "Classe A"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_tornado_2.jpg",
    inStock: true
  },
  {
    id: generateId("TORNADO", "RF-40FTV-DST"),
    name: "TORNADO Refrigerator RF-40FTV-DST - 355 Liters",
    brand: "TORNADO",
    category: "FRIGO",
    reference: "RF-40FTV-DST",
    code: "TORN007",
    price: 333500,
    description: "Inverter Technology - No Frost - Plasma Deodorizer Filter - Dark Stainless Steel",
    features: ["355 Litres", "Inverter", "No Frost", "Plasma Filter", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_tornado2.jpg",
    inStock: true
  },
  {
    id: generateId("TORNADO", "RF-33FTV-DST"),
    name: "TORNADO Refrigerator RF-33FTV-DST - 304 Liters",
    brand: "TORNADO",
    category: "FRIGO",
    reference: "RF-33FTV-DST",
    code: "TORN008",
    price: 322000,
    description: "Inverter technology - No Frost - Platinum filter - Class A",
    features: ["304 Litres", "Inverter", "No Frost", "Platinum Filter", "Classe A"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_tornado.jpg",
    inStock: true
  },
  {
    id: generateId("TORNADO", "RF-31FTV-DST"),
    name: "TORNADO Combined Refrigerator RF-31FTV-DST - 296 Liters",
    brand: "TORNADO",
    category: "FRIGO",
    reference: "RF-31FTV-DST",
    code: "TORN009",
    price: 287500,
    description: "Inverter Technology - No Frost - Energy Class A - Dark Stainless Steel",
    features: ["296 Litres", "Inverter", "No Frost", "Classe A", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_tornado_2.jpg",
    inStock: true
  },

  // HISENSE Products
  {
    id: generateId("HISENSE", "WT3K1423UB"),
    name: "Machine à laver automatique HISENSE 14 Kg – WT3K1423UB",
    brand: "HISENSE",
    category: "MACHINE A LAVER",
    reference: "WT3K1423UB",
    code: "HIS001",
    price: 258795,
    description: "Top Load – Super basse consommation – Lavage, Rinçage & Essorage – Noir",
    features: ["14 Kg", "Top Load", "Basse consommation", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_top_load_hisense_14_kg_2_.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "WT3K1123UB"),
    name: "Machine à laver automatique HISENSE 11 Kg – WT3K1123UB",
    brand: "HISENSE",
    category: "MACHINE A LAVER",
    reference: "WT3K1123UB",
    code: "HIS002",
    price: 195545,
    description: "Top Load - Basse consommation, Protection IPX4 – Lavage & Essorage – Noir",
    features: ["11 Kg", "Top Load", "Basse consommation", "IPX4", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_top_load_hisense_11_kg_2_.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "WT3K9022UB"),
    name: "Machine à laver automatique HISENSE 9 Kg – WT3K9022UB",
    brand: "HISENSE",
    category: "MACHINE A LAVER",
    reference: "WT3K9022UB",
    code: "HIS003",
    price: 161045,
    description: "Top Load - Haute efficacité énergétique – Noir",
    features: ["9 Kg", "Top Load", "Haute efficacité", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_hisense_9_kg_top_load_2_.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "AP12NXG"),
    name: "Climatiseur Portable HISENSE 12 000 BTU - AP12NXG",
    brand: "HISENSE",
    category: "CLIMATISEUR",
    reference: "AP12NXG",
    code: "HIS004",
    price: 172545,
    description: "1,5 CV - Refroidissement + Déshumidification + Ventilation - Gaz R32",
    features: ["12 000 BTU", "1,5 CV", "Portable", "Gaz R32", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_portable_hisense_-_12_000_btu_1_5_cv_.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "AP-09CR4RKVS00"),
    name: "Climatiseur Portable HISENSE 9 000 BTU",
    brand: "HISENSE",
    category: "CLIMATISEUR",
    reference: "AP-09CR4RKVS00",
    code: "HIS005",
    price: 143795,
    description: "1,25 CV - Refroidissement + Déshumidification + Ventilation - Gaz R410A, Wi-Fi",
    features: ["9 000 BTU", "1,25 CV", "Portable", "Wi-Fi", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_portable_hisense_9_000_btu.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "AS-18TR4"),
    name: "Split Air Conditioner HISENSE AS-18TR4 - Inverter 2.5 HP",
    brand: "HISENSE",
    category: "CLIMATISEUR",
    reference: "AS-18TR4",
    code: "HIS006",
    price: 344250,
    description: "18,000 BTU - Dehumidifier Function - R410A Gas",
    features: ["18 000 BTU", "2.5 CV", "Inverter", "R410A", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_-_hisense_-_as-18tr4_1.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "AS-12TR4"),
    name: "Hisense Split Air Conditioner AS-12TR4 - Inverter 1.5 HP",
    brand: "HISENSE",
    category: "CLIMATISEUR",
    reference: "AS-12TR4",
    code: "HIS007",
    price: 235000,
    description: "12000 BTU - R410A/R32 Gas - Energy Saving",
    features: ["12 000 BTU", "1.5 CV", "Inverter", "Économie d'énergie", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_hisense_-_as-12tr4_1.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "AS-24TR4"),
    name: "Climatiseur Mural Split HISENSE AS-24TR4 - Inverter 3 CV",
    brand: "HISENSE",
    category: "CLIMATISEUR",
    reference: "AS-24TR4",
    code: "HIS008",
    price: 448545,
    description: "24000 BTU - R410 gas - 220-240V",
    features: ["24 000 BTU", "3 CV", "Inverter", "R410", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_mural_split.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "REF349DR"),
    name: "Réfrigérateur Combiné Hisense REF349DR – 349 litres",
    brand: "HISENSE",
    category: "FRIGO",
    reference: "REF349DR",
    code: "HIS009",
    price: 356545,
    description: "avec Distributeur d'eau Ultra-slim – Congélateur en bas – Classe A+ – Éclairage LED – Noir Premium",
    features: ["349 Litres", "Distributeur d'eau", "Classe A+", "LED", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_avec_distributeur_d_eau_hisense_349_litres_2_.jpg",
    inStock: true
  },

  // OSCAR Products
  {
    id: generateId("OSCAR", "OSC-DRY-XD100"),
    name: "Sèche-linge automatique frontal OSCAR 10 Kg",
    brand: "OSCAR",
    category: "SECHE-LINGE",
    reference: "OSC-DRY-XD100",
    code: "OSC001",
    price: 470941,
    description: "Pompe à chaleur - Modèle OSC-DRY-XD100 - Blanc",
    features: ["10 Kg", "Pompe à chaleur", "Frontal", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/e/se_che-linge_automatique_frontal_oscar_10_kg_.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-480DF"),
    name: "Chest Freezer Oscar OSC-480DF - 271 Liters",
    brand: "OSCAR",
    category: "CONGELATEUR",
    reference: "OSC-480DF",
    code: "OSC002",
    price: 189795,
    description: "Static Cooling - Adjustable Thermostat - Removable Basket - White",
    features: ["271 Litres", "Thermostat réglable", "Panier amovible", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_-_oscar_-_osc-480df_3.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-440DF"),
    name: "Congélateur Coffre Oscar OSC-440DF - 240 Litres",
    brand: "OSCAR",
    category: "CONGELATEUR",
    reference: "OSC-440DF",
    code: "OSC003",
    price: 184045,
    description: "Refroidissement Statique - Thermostat Réglable - Panier Amovible - Blanc",
    features: ["240 Litres", "Thermostat réglable", "Panier amovible", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_oscar_-_osc-440df_2.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-320DF"),
    name: "Oscar Chest Freezer OSC-320DF - 157 Liters",
    brand: "OSCAR",
    category: "CONGELATEUR",
    reference: "OSC-320DF",
    code: "OSC004",
    price: 143795,
    description: "Static Cooling - Adjustable Thermostat - Removable Basket - White",
    features: ["157 Litres", "Thermostat réglable", "Panier amovible", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_oscar_-_osc-320df1.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-280DF"),
    name: "Oscar Chest Freezer OSC-280DF - 131 Liters",
    brand: "OSCAR",
    category: "CONGELATEUR",
    reference: "OSC-280DF",
    code: "OSC005",
    price: 138045,
    description: "Static Cooling System - Adjustable Thermostat - Removable Basket - White",
    features: ["131 Litres", "Thermostat réglable", "Panier amovible", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_oscar_-_osc-280df1.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-220DF"),
    name: "Oscar Chest Freezer OSC-220DF - 116 Liters",
    brand: "OSCAR",
    category: "CONGELATEUR",
    reference: "OSC-220DF",
    code: "OSC006",
    price: 109295,
    description: "Static System - Adjustable Thermostat - Removable Basket - Gray Black",
    features: ["116 Litres", "Thermostat réglable", "Panier amovible", "Gris Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_oscar_-_osc-220df1.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-SD586A"),
    name: "Congélateur coffre professionnel OSCAR OSC-SD586A – 586 Litres",
    brand: "OSCAR",
    category: "CONGELATEUR",
    reference: "OSC-SD586A",
    code: "OSC007",
    price: 402545,
    description: "Vitrine Commerciale - Couvercle coulissant en verre - Classe Énergétique A",
    features: ["586 Litres", "Vitrine commerciale", "Classe A", "Verre coulissant", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_oscar1.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-SD730"),
    name: "OSCAR Professional Freezer OSC-SD730 – 730 Liters",
    brand: "OSCAR",
    category: "CONGELATEUR",
    reference: "OSC-SD730",
    code: "OSC008",
    price: 1955045,
    description: "Commercial display case - Double sliding glass door - Energy Class A",
    features: ["730 Litres", "Vitrine commerciale", "Double porte", "Classe A", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_oscar.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-V1100"),
    name: "OSCAR Professional Refrigerator OSC-V1100 – 960 Liters",
    brand: "OSCAR",
    category: "FRIGO",
    reference: "OSC-V1100",
    code: "OSC009",
    price: 862545,
    description: "Commercial Display Case - Triple Glass Door - Energy Class A",
    features: ["960 Litres", "Triple porte vitrée", "Classe A", "Commercial", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_professionnel_oscar.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-V950"),
    name: "Réfrigérateur vitrine commercial OSCAR OSC-V950 – 730 litres",
    brand: "OSCAR",
    category: "FRIGO",
    reference: "OSC-V950",
    code: "OSC010",
    price: 632545,
    description: "Double Porte – Etagères ajustables, Classe énergétique A+ , Éclairage LED",
    features: ["730 Litres", "Double porte", "Classe A+", "LED", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_vitrine_commercial_oscar_950_litres_double_porte.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-V750"),
    name: "Réfrigérateur vitrine double porte OSCAR OSC-V750 – 750 litres",
    brand: "OSCAR",
    category: "FRIGO",
    reference: "OSC-V750",
    code: "OSC011",
    price: 517545,
    description: "Etagères ajustables, Classe énergétique A+ , Éclairage LED",
    features: ["750 Litres", "Double porte", "Classe A+", "LED", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_vitrine_double_porte_oscar_osc-v750_750_litres.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-V370"),
    name: "Réfrigérateur vitrine OSCAR OSC-V370 – 370 litres",
    brand: "OSCAR",
    category: "FRIGO",
    reference: "OSC-V370",
    code: "OSC012",
    price: 316295,
    description: "No Frost, Classe énergétique A+ – Porte vitrée simple, Éclairage LED",
    features: ["370 Litres", "No Frost", "Classe A+", "LED", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_vitrine_oscar_osc-v370_370_litres.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "18CRN1"),
    name: "Climatiseur Split Mural OSCAR 18CRN1 – 18 000 BTU",
    brand: "OSCAR",
    category: "CLIMATISEUR",
    reference: "18CRN1",
    code: "OSC013",
    price: 247295,
    description: "Gaz R410A (0,9 kg) - Faible Bruit - Protection IPX4",
    features: ["18 000 BTU", "R410A", "Faible bruit", "IPX4", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/o/songe0313112025cm.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "12CRN1"),
    name: "OSCAR Wall Split Air Conditioner 12CRN1 - 12,000 BTU",
    brand: "OSCAR",
    category: "CLIMATISEUR",
    reference: "12CRN1",
    code: "OSC014",
    price: 158050,
    description: "R410A Gas (0.44 kg) - Low Noise - IPX4 Protection",
    features: ["12 000 BTU", "R410A", "Faible bruit", "IPX4", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/o/songe0213112025cm.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "09CRN1"),
    name: "OSCAR Split Wall Air Conditioner OSCAR-09CRN1 - 9,000 BTU",
    brand: "OSCAR",
    category: "CLIMATISEUR",
    reference: "09CRN1",
    code: "OSC015",
    price: 141700,
    description: "R410A gas (0.37 kg) - Low noise - IPX4 protection",
    features: ["9 000 BTU", "R410A", "Faible bruit", "IPX4", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/o/songe0113112025cm.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OS8918"),
    name: "Ventilateur à Eau OSCAR OS8918 - Rechargeable Hybride",
    brand: "OSCAR",
    category: "VENTILATEUR",
    reference: "OS8918",
    code: "OSC016",
    price: 57545,
    description: "USB/Secteur - 18 pouces - 9 vitesses - Télécommande & Veilleuse LED - Blanc",
    features: ["18 pouces", "9 vitesses", "Rechargeable", "Télécommande", "LED"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur-_-eau-oscar-os8918.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-FL-XG80"),
    name: "Machine à laver automatique Oscar 8Kg - OSC-FL-XG80",
    brand: "OSCAR",
    category: "MACHINE A LAVER",
    reference: "OSC-FL-XG80",
    code: "OSC017",
    price: 201650,
    description: "Gris + Fer à repasser PHILIPS 1000 W OFFERT",
    features: ["8 Kg", "Automatique", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_automatique_oscar_8kg_fer_a_repasser_philips_1000_w_.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-C60S"),
    name: "Cuisinière à Gaz 4 Feux Oscar OSC-C60S",
    brand: "OSCAR",
    category: "CUISINIERE",
    reference: "OSC-C60S",
    code: "OSC018",
    price: 116000,
    description: "Four Automatique avec Grill - 60 cm - Argent",
    features: ["4 Feux", "Four avec Grill", "60 cm", "Argent", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisinie_re_a_gaz_4_feux_oscar1.jpg",
    inStock: true
  },

  // FIABTEC Products
  {
    id: generateId("FIABTEC", "FTSCS-450GW"),
    name: "FIABTEC Showcase Refrigerator FTSCS-450GW - 350 Liters",
    brand: "FIABTEC",
    category: "FRIGO",
    reference: "FTSCS-450GW",
    code: "FIA001",
    price: 365059,
    description: "Ventilated Cold - Energy Class A++ - Adjustable Shelves - Silent 40 dB",
    features: ["350 Litres", "Froid ventilé", "Classe A++", "Silencieux 40 dB", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_vitrine_fiabtec_04.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTBMS-512BED"),
    name: "FIABTEC Combined Refrigerator FTBMS-512BED - 320 Liters",
    brand: "FIABTEC",
    category: "FRIGO",
    reference: "FTBMS-512BED",
    code: "FIA002",
    price: 353294,
    description: "No Frost - Touch Screen - Water Dispenser - Class A++ - Silent 40 dB",
    features: ["320 Litres", "No Frost", "Touch Screen", "Distributeur d'eau", "Classe A++"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_-_fiabtec_3.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTTMS-589DF"),
    name: "FIABTEC Combined Refrigerator FTTMS-589DF - 344 Liters",
    brand: "FIABTEC",
    category: "FRIGO",
    reference: "FTTMS-589DF",
    code: "FIA003",
    price: 323882,
    description: "No Frost Technology - Touch Screen - Energy Class A+ - Quiet 41 dB",
    features: ["344 Litres", "No Frost", "Touch Screen", "Classe A+", "Silencieux"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_fiabtec2.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTBMS-505DF"),
    name: "FIABTEC Combined Fridge FTBMS-505DF - 296 Liters",
    brand: "FIABTEC",
    category: "FRIGO",
    reference: "FTBMS-505DF",
    code: "FIA004",
    price: 282706,
    description: "Energy Class A+ - 3 Freezer Drawers - Silent 40 dB",
    features: ["296 Litres", "Classe A+", "3 tiroirs congélateur", "Silencieux", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_fiabtec_-_ftbms-505df_3_1.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTBMS-428DF"),
    name: "Réfrigérateur Combiné FIABTEC 251 Litres - FTBMS-428DF",
    brand: "FIABTEC",
    category: "FRIGO",
    reference: "FTBMS-428DF",
    code: "FIA005",
    price: 265059,
    description: "5 Tiroirs Congélateur - Classe A+, Silencieux 40 dB - Finition Moderne",
    features: ["251 Litres", "5 tiroirs", "Classe A+", "Silencieux", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_fiabtec_251_litres.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTCFF-510Q"),
    name: "Congélateur coffre FIABTEC 510 Litres – FTCFF-510Q",
    brand: "FIABTEC",
    category: "CONGELATEUR",
    reference: "FTCFF-510Q",
    code: "FIA006",
    price: 353294,
    description: "Grande Capacité et Congélation Rapide – Tropicalisé – Deux couvercles",
    features: ["510 Litres", "Tropicalisé", "Deux couvercles", "Congélation rapide", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_fiabtec_510_litres_1_.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FFTCFF-800Q"),
    name: "FIABTEC 800 Liter Chest Freezer – FFTCFF-800Q",
    brand: "FIABTEC",
    category: "CONGELATEUR",
    reference: "FFTCFF-800Q",
    code: "FIA007",
    price: 470941,
    description: "Very Large Capacity and Fast Freezing – Tropicalized",
    features: ["800 Litres", "Tropicalisé", "Congélation rapide", "Grande capacité", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_fiabtec_fiabtec_800_litres_1_.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTCFF-600Q"),
    name: "Congélateur Coffre FIABTEC 600 Litres – FTCFF-600Q",
    brand: "FIABTEC",
    category: "CONGELATEUR",
    reference: "FTCFF-600Q",
    code: "FIA008",
    price: 412118,
    description: "Grande Capacité et Congélation Rapide – Tropicalisé – Deux couvercles",
    features: ["600 Litres", "Tropicalisé", "Deux couvercles", "Congélation rapide", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_fiabtec_fiabtec_600_litres_2_.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTCFF-450Q"),
    name: "Congélateur Coffre FIABTEC 450 Litres – FTCFF-450Q",
    brand: "FIABTEC",
    category: "CONGELATEUR",
    reference: "FTCFF-450Q",
    code: "FIA009",
    price: 312118,
    description: "Grande Capacité et Congélation Rapide – Deux couvercles",
    features: ["450 Litres", "Deux couvercles", "Congélation rapide", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_fiabtec_450_litre_1_.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTSAG-1556"),
    name: "FIABTEC Semi-Automatic Washing Machine - Double Tub - 15 kg",
    brand: "FIABTEC",
    category: "MACHINE A LAVER",
    reference: "FTSAG-1556",
    code: "FIA010",
    price: 200353,
    description: "15 kg Wash / 7.5 kg Spin - Black",
    features: ["15 Kg", "Double cuve", "Semi-automatique", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_fiabtec_-_semi-automatique_double_cuve_15_kg.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTTMS-220DF"),
    name: "Mini-Réfrigérateur FIABTEC 83 litres - FTTMS-220DF",
    brand: "FIABTEC",
    category: "FRIGO",
    reference: "FTTMS-220DF",
    code: "FIA011",
    price: 82706,
    description: "1 Porte - Classe Énergétique A+ - 109 kWh/an - Silencieux 41 dB",
    features: ["83 Litres", "1 porte", "Classe A+", "Silencieux", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/i/mini-re_frige_rateur_fiabtec_83_litres1.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "JC-130"),
    name: "Cave à Vins FIABTEC 126 litres - JC-130",
    brand: "FIABTEC",
    category: "CAVE A VIN",
    reference: "JC-130",
    code: "FIA012",
    price: 200353,
    description: "Refroidissement Silencieux – Étagères en Bois – Porte Vitrée Anti-UV - Noir",
    features: ["126 Litres", "Étagères bois", "Anti-UV", "Silencieux", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/a/cave-_-vins-fiabtec-126-litres---jc-130.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTWHY-D100L"),
    name: "Electric Storage Water Heater - 100 Liters – FIABTEC",
    brand: "FIABTEC",
    category: "CHAUFFE-EAU",
    reference: "FTWHY-D100L",
    code: "FIA013",
    price: 102395,
    description: "1500W – 220V – IPX4 – Pressure 0.8MPa – Durable & Energy Saving",
    features: ["100 Litres", "1500W", "IPX4", "Économique", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/h/chauffe-eau_lectrique_accumulation_1_.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTWHY-D80L"),
    name: "Electric Storage Water Heater - 80 Liters – FIABTEC",
    brand: "FIABTEC",
    category: "CHAUFFE-EAU",
    reference: "FTWHY-D80L",
    code: "FIA014",
    price: 89745,
    description: "1500W – 220V – IPX4 – Pressure 0.8MPa – Durable & Energy Saving",
    features: ["80 Litres", "1500W", "IPX4", "Économique", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/h/chauffe-eau_lectrique_accumulation_4_.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTWHY-D50L"),
    name: "Electric Storage Water Heater - 50 Liters – FIABTEC",
    brand: "FIABTEC",
    category: "CHAUFFE-EAU",
    reference: "FTWHY-D50L",
    code: "FIA015",
    price: 71345,
    description: "1500W – 220V – IPX4 – Pressure 0.8MPa",
    features: ["50 Litres", "1500W", "IPX4", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/h/chauffe-eau_lectrique_accumulation_2__1.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTWHY-D30L"),
    name: "Electric Storage Water Heater - 30 Liters – FIABTEC",
    brand: "FIABTEC",
    category: "CHAUFFE-EAU",
    reference: "FTWHY-D30L",
    code: "FIA016",
    price: 59845,
    description: "1500W – 220V / 50Hz – IPX4 – Pressure 0.8MPa – Durable & Energy Saving",
    features: ["30 Litres", "1500W", "IPX4", "Économique", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/h/chauffe-eau_lectrique_accumulation_2__2.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTWHY-SF10L"),
    name: "Electric Storage Water Heater - 10 Liters – FIABTEC",
    brand: "FIABTEC",
    category: "CHAUFFE-EAU",
    reference: "FTWHY-SF10L",
    code: "FIA017",
    price: 48345,
    description: "1500W – 220V / 50Hz – IPX4 – Pressure 0.8MPa – Compact & Economical",
    features: ["10 Litres", "1500W", "Compact", "Économique", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/h/chauffe-eau_lectrique_accumulation_2__1_1.jpg",
    inStock: true
  },

  // LG Products
  {
    id: generateId("LG", "GCFB316BQCF"),
    name: "Congélateur coffre LG 300 L – GCFB316BQCF",
    brand: "LG",
    category: "CONGELATEUR",
    reference: "GCFB316BQCF",
    code: "LG001",
    price: 269000,
    description: "Régulateur de tension intégré (sans stabilisateur), Froid homogène, Contrôle externe – Gris",
    features: ["300 Litres", "Sans stabilisateur", "Froid homogène", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur-coffre-lg-300-l.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GCFB145BQCF"),
    name: "Congélateur coffre LG 150 L – GCFB145BQCF",
    brand: "LG",
    category: "CONGELATEUR",
    reference: "GCFB145BQCF",
    code: "LG002",
    price: 159000,
    description: "Régulateur de tension intégré, Froid homogène, Contrôle externe – Gris",
    features: ["150 Litres", "Sans stabilisateur", "Froid homogène", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur-coffre-lg-150-l.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GCFB251BQCF"),
    name: "Congélateur coffre LG 250 L – GCFB251BQCF",
    brand: "LG",
    category: "CONGELATEUR",
    reference: "GCFB251BQCF",
    code: "LG003",
    price: 229000,
    description: "Régulateur de tension intégré (sans stabilisateur), Froid homogène, Contrôle externe – Gris",
    features: ["250 Litres", "Sans stabilisateur", "Froid homogène", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur-coffre-lg-250-l.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GCFB200BQCF"),
    name: "Congélateur coffre LG 200 L – GCFB200BQCF",
    brand: "LG",
    category: "CONGELATEUR",
    reference: "GCFB200BQCF",
    code: "LG004",
    price: 179000,
    description: "Régulateur de tension intégré (sans stabilisateur), Froid homogène, Contrôle externe – Gris",
    features: ["200 Litres", "Sans stabilisateur", "Froid homogène", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur-coffre-lg-200-l.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GC-L257KLKW"),
    name: "Refrigerator LG GC-L257KLKW - Side by Side - 684 Litres",
    brand: "LG",
    category: "FRIGO",
    reference: "GC-L257KLKW",
    code: "LG005",
    price: 1057100,
    description: "Cooling technologies - Water & ice dispenser - LG ThinQ - Stainless steel finish",
    features: ["684 Litres", "Side by Side", "Distributeur eau/glace", "LG ThinQ", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_lg_2__1.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GC-B459NLXM"),
    name: "Bottom freezer refrigerator LG GC-B459NLXM – 374L",
    brand: "LG",
    category: "FRIGO",
    reference: "GC-B459NLXM",
    code: "LG006",
    price: 483000,
    description: "DoorCooling⁺ – LinearCooling – Smart Inverter Compressor – Total No Frost – A++",
    features: ["374 Litres", "DoorCooling+", "Smart Inverter", "No Frost", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_double_battant_lg.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GN-F452PFAQ"),
    name: "Refrigerator LG GN-F452PFAQ - 473 liters",
    brand: "LG",
    category: "FRIGO",
    reference: "GN-F452PFAQ",
    code: "LG007",
    price: 661100,
    description: "Automatic ice machine - Water distributor - LG Freshness Technologies",
    features: ["473 Litres", "Machine à glace", "Distributeur eau", "Freshness Tech", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur-lg-473-litres.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GN-F392PFAK"),
    name: "Double door refrigerator LG GN-F392PFAK – 423L",
    brand: "LG",
    category: "FRIGO",
    reference: "GN-F392PFAK",
    code: "LG008",
    price: 599900,
    description: "LINEARCooling™ – DoorCooling+™ – Smart Inverter Compressor – Movable ice maker",
    features: ["423 Litres", "LinearCooling", "DoorCooling+", "Smart Inverter", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_lg_-_423_litres.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GL-F682HLHL"),
    name: "American Refrigerator LG 473 Litres - GL-F682HLHL",
    brand: "LG",
    category: "FRIGO",
    reference: "GL-F682HLHL",
    code: "LG009",
    price: 798000,
    description: "Water dispenser - No frost - Grey",
    features: ["473 Litres", "Distributeur eau", "No Frost", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur-double-battant-lg-473litres_1.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GCFB507PQAM"),
    name: "Pack Réfrigérateur LG Side-by-Side 519 L + Micro-ondes LG 20 L",
    brand: "LG",
    category: "FRIGO",
    reference: "GCFB507PQAM",
    code: "LG010",
    price: 650000,
    description: "No Frost, Multi Air Flow, Smart Inverter + Micro-ondes LG 20 L Offert",
    features: ["519 Litres", "Side-by-Side", "Smart Inverter", "Multi Air Flow", "Pack promo"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_lg_side_by_side_519_litres_micro_onde_lg_20_litres_offert.jpg",
    inStock: true
  },

  // SIGNATURE Products  
  {
    id: generateId("SIGNATURE", "SGMAC-WH-SMARTINV-24K"),
    name: "Climatiseur Split Inverter SIGNATURE 3 CV – 24 000 BTU – Blanc",
    brand: "SIGNATURE",
    category: "CLIMATISEUR",
    reference: "SGMAC-WH-SMARTINV-24K",
    code: "SIG001",
    price: 425636,
    description: "Smart Wi-Fi – Blanc",
    features: ["24 000 BTU", "3 CV", "Inverter", "Smart Wi-Fi", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_inverter_signature_3_cv_blanc.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SGMAC-WH-SMARTINV-18K"),
    name: "Climatiseur Split Inverter SIGNATURE 2 CV – 18 000 BTU – Blanc",
    brand: "SIGNATURE",
    category: "CLIMATISEUR",
    reference: "SGMAC-WH-SMARTINV-18K",
    code: "SIG002",
    price: 330436,
    description: "Smart Wi-Fi – Blanc",
    features: ["18 000 BTU", "2 CV", "Inverter", "Smart Wi-Fi", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-split-inverter-signature-_-2-cv-_18-000-btu_.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SGMAC-WH-SMARTINV-12K"),
    name: "Climatiseur Split Inverter SIGNATURE 1,5 CV – 12 000 BTU – Blanc",
    brand: "SIGNATURE",
    category: "CLIMATISEUR",
    reference: "SGMAC-WH-SMARTINV-12K",
    code: "SIG003",
    price: 240836,
    description: "Smart Wi-Fi – Blanc",
    features: ["12 000 BTU", "1,5 CV", "Inverter", "Smart Wi-Fi", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_inverter_signature_1_5_cv_blanc.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SGMAC-WH-SMARTINV-09K"),
    name: "Climatiseur Split Inverter SIGNATURE 1,25 CV – 9 000 BTU – Blanc",
    brand: "SIGNATURE",
    category: "CLIMATISEUR",
    reference: "SGMAC-WH-SMARTINV-09K",
    code: "SIG004",
    price: 218436,
    description: "Smart Wi-Fi – Blanc",
    features: ["9 000 BTU", "1,25 CV", "Inverter", "Smart Wi-Fi", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_inverter_signature_1_25_cv_blanc.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SGMAC-BL-SMARTINV-24K"),
    name: "Climatiseur Split Inverter SIGNATURE 3 CV – 24 000 BTU – Noir",
    brand: "SIGNATURE",
    category: "CLIMATISEUR",
    reference: "SGMAC-BL-SMARTINV-24K",
    code: "SIG005",
    price: 386436,
    description: "Smart Wi-Fi – Noir",
    features: ["24 000 BTU", "3 CV", "Inverter", "Smart Wi-Fi", "Noir"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_inverter_signature_3_cv.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SGMAC-BL-SMARTINV-18K"),
    name: "Climatiseur Split Inverter SIGNATURE 2 CV – 18 000 BTU – Noir",
    brand: "SIGNATURE",
    category: "CLIMATISEUR",
    reference: "SGMAC-BL-SMARTINV-18K",
    code: "SIG006",
    price: 308036,
    description: "Smart Wi-Fi – Noir",
    features: ["18 000 BTU", "2 CV", "Inverter", "Smart Wi-Fi", "Noir"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_inverter_signature_2_cv_4_.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SGMAC-BL-SMARTINV-12K"),
    name: "Climatiseur Split Inverter SIGNATURE 1,5 CV – 12 000 BTU – Noir",
    brand: "SIGNATURE",
    category: "CLIMATISEUR",
    reference: "SGMAC-BL-SMARTINV-12K",
    code: "SIG007",
    price: 212836,
    description: "Smart Wi-Fi – Noir",
    features: ["12 000 BTU", "1,5 CV", "Inverter", "Smart Wi-Fi", "Noir"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_inverter_signature_1_5_cv_1_.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SGMAC-BL-SMARTINV-09K"),
    name: "Climatiseur Split Inverter SIGNATURE 1,25 CV – 9 000 BTU – Noir",
    brand: "SIGNATURE",
    category: "CLIMATISEUR",
    reference: "SGMAC-BL-SMARTINV-09K",
    code: "SIG008",
    price: 196036,
    description: "Smart Wi-Fi – Noir",
    features: ["9 000 BTU", "1,25 CV", "Inverter", "Smart Wi-Fi", "Noir"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_inverter_signature_1_25_cv.jpg",
    inStock: true
  },

  // ICONA Products
  {
    id: generateId("ICONA", "ILFSAC-3430C"),
    name: "ICONA Split Air Conditioner ILFSAC-3430C - 24000 BTU - 3HP",
    brand: "ICONA",
    category: "CLIMATISEUR",
    reference: "ILFSAC-3430C",
    code: "ICO001",
    price: 336000,
    description: "R410A Gas - Auto-restart - Antibacterial Function",
    features: ["24 000 BTU", "3 CV", "R410A", "Antibactérien", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur2.jpg",
    inStock: true
  },
  {
    id: generateId("ICONA", "ILSAC-1215C"),
    name: "ICONA Split Air Conditioner ILSAC-1215C - 12000 BTU - 1.5HP",
    brand: "ICONA",
    category: "CLIMATISEUR",
    reference: "ILSAC-1215C",
    code: "ICO002",
    price: 165000,
    description: "R410a Gas - Auto-restart - Anti-corrosion treatment",
    features: ["12 000 BTU", "1,5 CV", "R410a", "Anti-corrosion", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_icona_2.jpg",
    inStock: true
  },
  {
    id: generateId("ICONA", "ILSAC-09105s"),
    name: "ICONA Split Air Conditioner ILSAC-09105s - 9000 BTU - 1.25HP",
    brand: "ICONA",
    category: "CLIMATISEUR",
    reference: "ILSAC-09105s",
    code: "ICO003",
    price: 155295,
    description: "R410a Gas - Auto-restart - Anti-corrosion treatment",
    features: ["9 000 BTU", "1,25 CV", "R410a", "Anti-corrosion", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_icona_-_ilsac-09105s_1.jpg",
    inStock: true
  },

  // TCL Products
  {
    id: generateId("TCL", "P409BF"),
    name: "Réfrigérateur combiné TCL P409BF – 409 Litres",
    brand: "TCL",
    category: "FRIGO",
    reference: "P409BF",
    code: "TCL001",
    price: 291600,
    description: "Congélateur en bas – Total No Frost – Twin Eco Inverter – Variable Zone – Ultra Silent",
    features: ["409 Litres", "No Frost", "Inverter", "Ultra Silent", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur-combin_-tcl-_-p409bf-_-409-litres.jpg",
    inStock: true
  },
  {
    id: generateId("TCL", "P608FLG"),
    name: "Machine à laver automatique TCL P608FLG – 8 Kg",
    brand: "TCL",
    category: "MACHINE A LAVER",
    reference: "P608FLG",
    code: "TCL002",
    price: 184800,
    description: "Moteur Digital Inverter – Classe A+++ – 1400 tr/min",
    features: ["8 Kg", "Digital Inverter", "Classe A+++", "1400 tr/min", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_automatique_tcl_8_kg.jpg",
    inStock: true
  },
  {
    id: generateId("TCL", "FG320CF"),
    name: "Congélateur Coffre TCL 248 Litres – FG320CF",
    brand: "TCL",
    category: "CONGELATEUR",
    reference: "FG320CF",
    code: "TCL003",
    price: 170500,
    description: "Refroidissement rapide – Basse consommation – Gaz R600a",
    features: ["248 Litres", "Refroidissement rapide", "Basse consommation", "R600a", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/conge_lateur_coffre_tcl_248_litres.jpg",
    inStock: true
  },
  {
    id: generateId("TCL", "FG200CF"),
    name: "Congélateur Coffre TCL 152 Litres - FG200CF",
    brand: "TCL",
    category: "CONGELATEUR",
    reference: "FG200CF",
    code: "TCL004",
    price: 138045,
    description: "Refroidissement rapide et basse consommation – Gaz écologique R600a",
    features: ["152 Litres", "Refroidissement rapide", "R600a", "Écologique", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/conge_lateur_coffre_tcl_152_litres_1.jpg",
    inStock: true
  },
  {
    id: generateId("TCL", "TAC-12CSA-XAB"),
    name: "TCL Split Inverter Smart Air Conditioner 12000 BTU",
    brand: "TCL",
    category: "CLIMATISEUR",
    reference: "TAC-12CSA/XAB",
    code: "TCL005",
    price: 253045,
    description: "Wi-Fi Fresh – 1.5 HP – Fast Cooling – Low Consumption – Silent",
    features: ["12 000 BTU", "1,5 CV", "Inverter", "Wi-Fi", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_tcl_split_inverter2.jpg",
    inStock: true
  },
  {
    id: generateId("TCL", "TAC-09CSA-XA73"),
    name: "Climatiseur Split mural TCL TAC-09CSA/XA73 – 9000 BTU",
    brand: "TCL",
    category: "CLIMATISEUR",
    reference: "TAC-09CSA/XA73",
    code: "TCL006",
    price: 166795,
    description: "1.25 CV – Refroidissement Rapide – Air Purifié – Silencieux – Wi-Fi Fresh – Classe A+",
    features: ["9 000 BTU", "1,25 CV", "Wi-Fi", "Classe A+", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_mural_tcl1.jpg",
    inStock: true
  },

  // ROCH Products
  {
    id: generateId("ROCH", "RFR-320DB-I"),
    name: "ROCH 254 Litre Combined Refrigerator – RFR-320DB-I",
    brand: "ROCH",
    category: "FRIGO",
    reference: "RFR-320DB-I",
    code: "ROCH001",
    price: 226495,
    description: "Double Door – 4-Drawer Freezer – Modern Design – Low Energy Consumption",
    features: ["254 Litres", "Double porte", "4 tiroirs", "Basse consommation", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_roch_254_litres_2_.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RSF-918RM-B"),
    name: "Ventilateur à eau rechargeable ROCH RSF-918RM-B",
    brand: "ROCH",
    category: "VENTILATEUR",
    reference: "RSF-918RM-B",
    code: "ROCH002",
    price: 56680,
    description: "Batterie 12 V 7 Ah, autonomie de 30 heures, 9 vitesses, fonction brumisation, lumière LED et port USB",
    features: ["12V", "30h autonomie", "9 vitesses", "Brumisation", "LED"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_a_eau_rechargeable_roch_.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "ROCH-293L"),
    name: "Roch horizontal chest freezer – 293 Liters",
    brand: "ROCH",
    category: "CONGELATEUR",
    reference: "ROCH-293L",
    code: "ROCH003",
    price: 189000,
    description: "Class A++ – Eco-friendly R600a – Quiet 37 dB",
    features: ["293 Litres", "Classe A++", "R600a", "Silencieux", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_horizontal_roch.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RAC-F48R4-E"),
    name: "Climatiseur Armoire ROCH 6 CV – RAC-F48R4-E",
    brand: "ROCH",
    category: "CLIMATISEUR",
    reference: "RAC-F48R4-E",
    code: "ROCH004",
    price: 862545,
    description: "Très haute puissance, Refroidissement rapide, pour grands espaces - Blanc",
    features: ["6 CV", "Haute puissance", "Grands espaces", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_armoire_roch_6_cv_3_.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RAC-F36R4-E"),
    name: "Climatiseur Armoire ROCH 5 CV – RAC-F36R4-E",
    brand: "ROCH",
    category: "CLIMATISEUR",
    reference: "RAC-F36R4-E",
    code: "ROCH005",
    price: 661295,
    description: "Haute Puissance, Refroidissement rapide, idéal pour grands espaces - Blanc",
    features: ["5 CV", "Haute puissance", "Grands espaces", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_armoire_roch_5_cv_3_.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RAC-F30R4-E"),
    name: "Climatiseur Armoire ROCH 4 CV – RAC-F30R4-E",
    brand: "ROCH",
    category: "CLIMATISEUR",
    reference: "RAC-F30R4-E",
    code: "ROCH006",
    price: 603795,
    description: "Puissance Élevée, Refroidissement rapide, idéal pour grandes surfaces - Blanc",
    features: ["4 CV", "Puissance élevée", "Grandes surfaces", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_armoire_roch_4_cv.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RWD-12W8"),
    name: "Machine à laver et sèche-linge 2 en 1 ROCH 12kg/8kg",
    brand: "ROCH",
    category: "MACHINE A LAVER",
    reference: "RWD-12W8",
    code: "ROCH007",
    price: 368045,
    description: "Automatique, Frontal – Moteur Inverter – A+++ – Noir Graphite",
    features: ["12kg/8kg", "2 en 1", "Inverter", "A+++", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_et_s_che-linge_2_en_1_roch_12kg8kg_-_automatique_frontal_1_.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RWD-10W7"),
    name: "Machine à laver et sèche-linge 2 en 1 ROCH 10kg/7kg",
    brand: "ROCH",
    category: "MACHINE A LAVER",
    reference: "RWD-10W7",
    code: "ROCH008",
    price: 270000,
    description: "Automatique, Frontal - A+++ - Moteur Inverter – Argent",
    features: ["10kg/7kg", "2 en 1", "Inverter", "A+++", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_et_s_che-linge_2_en_1_roch_10kg7kg_1_.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "ROCH-24000BTU-ROUND"),
    name: "Climatiseur Armoire Rond Inverter ROCH – 24 000 BTU (3CV)",
    brand: "ROCH",
    category: "CLIMATISEUR",
    reference: "ROCH-24000BTU-ROUND",
    code: "ROCH009",
    price: 563545,
    description: "Gaz R32 - Refroidissement très puissant, Design cylindrique",
    features: ["24 000 BTU", "3 CV", "Inverter", "R32", "Design cylindrique"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_armoire_rond_inverter_roch_24_000_btu.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "ROCH-18000BTU-ROUND"),
    name: "Climatiseur Armoire Rond Inverter ROCH – 18 000 BTU (2,5 CV)",
    brand: "ROCH",
    category: "CLIMATISEUR",
    reference: "ROCH-18000BTU-ROUND",
    code: "ROCH010",
    price: 488795,
    description: "Gaz R32 - Refroidissement puissant, Design cylindrique",
    features: ["18 000 BTU", "2,5 CV", "Inverter", "R32", "Design cylindrique"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_armoire_rond_inverter_roch_18_000_btu.jpg",
    inStock: true
  },

  // SAMSUNG Products
  {
    id: generateId("SAMSUNG", "WW80FG3M05AWNQ"),
    name: "Samsung Lave-linge frontal 8 kg - WW80FG3M05AWNQ",
    brand: "SAMSUNG",
    category: "MACHINE A LAVER",
    reference: "WW80FG3M05AWNQ",
    code: "SAM001",
    price: 250000,
    description: "1400 tr/min - Moteur Digital Inverter - Classe A - Affichage LED - Blanc",
    features: ["8 Kg", "Digital Inverter", "1400 tr/min", "Classe A", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/a/samsung_lave-linge_frontal_8_kg1.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "WW70FG3M05AW"),
    name: "Samsung Lave-linge frontal 7 kg – WW70FG3M05AW",
    brand: "SAMSUNG",
    category: "MACHINE A LAVER",
    reference: "WW70FG3M05AW",
    code: "SAM002",
    price: 225000,
    description: "1400 tr/min – Moteur Digital Inverter – Classe A – Affichage LED – Wi-Fi (SmartThings) – Blanc",
    features: ["7 Kg", "Digital Inverter", "Wi-Fi", "SmartThings", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/a/samsung_lave-linge_frontal_7_kg_1.jpg",
    inStock: true
  },

  // DELTA Products
  {
    id: generateId("DELTA", "DCF-510-UB"),
    name: "Congélateur Coffre DELTA 500 litres - DCF 510 UB",
    brand: "DELTA",
    category: "CONGELATEUR",
    reference: "DCF-510-UB",
    code: "DEL001",
    price: 361100,
    description: "Grande capacité - Classe énergétique A+ - Refroidissement rapide",
    features: ["500 Litres", "Classe A+", "Refroidissement rapide", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/conge_lateur_coffre_delta_500_litres1.jpg",
    inStock: true
  },
  {
    id: generateId("DELTA", "DCF-150-UB"),
    name: "Chest freezer DELTA DCF-150-UB – 150L",
    brand: "DELTA",
    category: "CONGELATEUR",
    reference: "DCF-150-UB",
    code: "DEL002",
    price: 139100,
    description: "Class A+ – Static cold – R600a gas – Silent 42 dB – Climate class T",
    features: ["150 Litres", "Classe A+", "R600a", "Silencieux", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_6__1.jpg",
    inStock: true
  },
  {
    id: generateId("DELTA", "DRF-467-SBS-M"),
    name: "Réfrigérateur Américain DELTA 430 Litres – DRF-467-SBS-M",
    brand: "DELTA",
    category: "FRIGO",
    reference: "DRF-467-SBS-M",
    code: "DEL003",
    price: 457100,
    description: "Grand Volume - Distributeur d'Eau & Écran LED tactile – Gris",
    features: ["430 Litres", "Side-by-Side", "Distributeur eau", "Écran LED", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//_/r/_r_frig_rateur_am_ricain_side-by-side_delta_430_litres_2_.jpg",
    inStock: true
  },
  {
    id: generateId("DELTA", "DL-WM-1210-G-J"),
    name: "Machine à laver Delta 10 kg – DL-WM-1210-G-J",
    brand: "DELTA",
    category: "MACHINE A LAVER",
    reference: "DL-WM-1210-G-J",
    code: "DEL004",
    price: 237600,
    description: "Classe A+++ – Faible consommation – 1600W",
    features: ["10 Kg", "Classe A+++", "Faible consommation", "1600W", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_delta_10_kg2.jpg",
    inStock: true
  },

  // MIDEA Products
  {
    id: generateId("MIDEA", "MSAF-24CRDN1"),
    name: "Climatiseur Split Mural Inverter MIDEA 3 CV - MSAF-24CRDN1",
    brand: "MIDEA",
    category: "CLIMATISEUR",
    reference: "MSAF-24CRDN1",
    code: "MID001",
    price: 419795,
    description: "24 000 BTU, R410A – Refroidissement intelligent, Économie d'énergie, Silencieux – Blanc",
    features: ["24 000 BTU", "3 CV", "Inverter", "R410A", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_mural_inverter_-_midea_3_cv.jpg",
    inStock: true
  },
  {
    id: generateId("MIDEA", "MDRT237"),
    name: "Réfrigérateur Midea à deux portes 173 litres - MDRT237",
    brand: "MIDEA",
    category: "FRIGO",
    reference: "MDRT237",
    code: "MID002",
    price: 135000,
    description: "Refroidissement rapide - Dégivrage manuel - Argent",
    features: ["173 Litres", "Deux portes", "Refroidissement rapide", "Argent", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur-midea-_-deux-portes-237-litres.jpg",
    inStock: true
  },
  {
    id: generateId("MIDEA", "MD-508-SL"),
    name: "Cuisinière à Gaz Midea 4 Feux - MD-508(SL)",
    brand: "MIDEA",
    category: "CUISINIERE",
    reference: "MD-508(SL)",
    code: "MID003",
    price: 74795,
    description: "50 × 50 cm - Allumage électrique - Noir",
    features: ["4 Feux", "50x50 cm", "Allumage électrique", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisinie_re_a_gaz_midea_4_feux_1.jpg",
    inStock: true
  },

  // DAIKIN Products
  {
    id: generateId("DAIKIN", "DAIKIN-3CV"),
    name: "Climatiseur Mural DAIKIN 3CV - 21 000 BTU",
    brand: "DAIKIN",
    category: "CLIMATISEUR",
    reference: "DAIKIN-3CV",
    code: "DAI001",
    price: 612801,
    description: "Inverter Froid seul - Classe A++ - Blanc",
    features: ["21 000 BTU", "3 CV", "Inverter", "Classe A++", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_mural_daikin_3cv_.jpg",
    inStock: true
  },
  {
    id: generateId("DAIKIN", "DAIKIN-2.5CV"),
    name: "Climatiseur Mural DAIKIN 2.5CV - 18 000 BTU",
    brand: "DAIKIN",
    category: "CLIMATISEUR",
    reference: "DAIKIN-2.5CV",
    code: "DAI002",
    price: 448551,
    description: "Inverter Froid seul - Classe A++ - Blanc",
    features: ["18 000 BTU", "2,5 CV", "Inverter", "Classe A++", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_mural_daikin_2.5cv_.jpg",
    inStock: true
  },
  {
    id: generateId("DAIKIN", "DAIKIN-1.5CV"),
    name: "DAIKIN 1.5 HP wall-mounted air conditioner – 12,000 BTU",
    brand: "DAIKIN",
    category: "CLIMATISEUR",
    reference: "DAIKIN-1.5CV",
    code: "DAI003",
    price: 351438,
    description: "Class A++ – Inverter Cooling Only – Anti-corrosion – Ultra-quiet 20 dB",
    features: ["12 000 BTU", "1,5 CV", "Inverter", "Ultra-silencieux", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_mural_daikin_1.5_cv.jpg",
    inStock: true
  },

  // VERVE Products
  {
    id: generateId("VERVE", "VV689-4D"),
    name: "Réfrigérateur Américain VERVE VV689-4D - Inverter",
    brand: "VERVE",
    category: "FRIGO",
    reference: "VV689-4D",
    code: "VER001",
    price: 448545,
    description: "Double Porte Side-by-Side - Gaz R600a - Puissance 180W - Classe ST",
    features: ["Side-by-Side", "Inverter", "R600a", "Classe ST", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_am_ricain_-_verve_-_vv689-4d_7.jpg",
    inStock: true
  },
  {
    id: generateId("VERVE", "VV600S"),
    name: "Réfrigérateur Américain VERVE VV600S - Inverter - No Frost",
    brand: "VERVE",
    category: "FRIGO",
    reference: "VV600S",
    code: "VER002",
    price: 391045,
    description: "Double Porte Side-by-Side - No Frost - Gaz R600a - Gris",
    features: ["Side-by-Side", "Inverter", "No Frost", "R600a", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_am_ricain_verve_-_vv600s_2.jpg",
    inStock: true
  },
  {
    id: generateId("VERVE", "VV620D4"),
    name: "Réfrigérateur Américain VERVE VV620D4 - No Frost",
    brand: "VERVE",
    category: "FRIGO",
    reference: "VV620D4",
    code: "VER003",
    price: 431295,
    description: "Double Porte Side-by-Side - No Frost - 6 Tiroirs - Gaz R600a - Gris",
    features: ["Side-by-Side", "No Frost", "6 Tiroirs", "R600a", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_am_ricain_verve_-_vv620d4_2.jpg",
    inStock: true
  },

  // EUROLUX Products
  {
    id: generateId("EUROLUX", "F6TL40G2-WO-IX"),
    name: "Cuisinière à Gaz EUROLUX - F6TL40G2-WO/IX - 4 Feux",
    brand: "EUROLUX",
    category: "CUISINIERE",
    reference: "F6TL40G2-WO/IX",
    code: "EUR001",
    price: 159500,
    description: "60x60 cm - Four avec Gril - Tournebroche - Finition Bois",
    features: ["4 Feux", "60x60 cm", "Four avec Gril", "Tournebroche", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_a_gaz_eurolux_1.jpg",
    inStock: true
  },
  {
    id: generateId("EUROLUX", "EUR-TRENDY-60X60"),
    name: "Cuisinière EUROLUX EUR.TRENDY - 60 x 60 cm - 3 Feux + 1 Plaque électrique",
    brand: "EUROLUX",
    category: "CUISINIERE",
    reference: "EUR.TRENDY",
    code: "EUR002",
    price: 165000,
    description: "Inox, Couvercle en verre",
    features: ["3 Feux + 1 plaque", "60x60 cm", "Inox", "Couvercle verre", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_eurolux_60_60_cm_2_.jpg",
    inStock: true
  },

  // SUPER FLAME Products
  {
    id: generateId("SUPER FLAME", "SFK-5057-4G-BURGENDY"),
    name: "Super Flame Gas Cooker SFK-5057-4G-BURGENDY - 4 Burners",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SFK-5057-4G-BURGENDY",
    code: "SF001",
    price: 88595,
    description: "50x50 cm - Integrated Oven - Power 9.05 kW - Bordeaux Color",
    features: ["4 Feux", "50x50 cm", "Four intégré", "Bordeaux", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_a_gaz_super_flame_1.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SFK-5057-4G-ARGENT"),
    name: "Gas Cooker Super Flame SFK-5057-4G - 4 Burners - Argent",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SFK-5057-4G",
    code: "SF002",
    price: 88595,
    description: "50x50 cm - Integrated Oven - Power 9.05 kW - Argent",
    features: ["4 Feux", "50x50 cm", "Four intégré", "Argent", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_gaz_-_super_flame_1.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SFK-5057-4G-BLACK"),
    name: "Super Flame Gas Cooker SFK-5057-4G - 4 Burners - Black",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SFK-5057-4G-BLACK",
    code: "SF003",
    price: 88595,
    description: "50x50 cm - Integrated Oven with Accessories - Power 9.05 kW - Black",
    features: ["4 Feux", "50x50 cm", "Four intégré", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_a_gaz_super_flame1.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SFKBC-90605G"),
    name: "Cuisinière mixte semi-professionnelle SUPERFLAME SFKBC-90605G",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SFKBC-90605G",
    code: "SF004",
    price: 391045,
    description: "90x60 cm – 5 Brûleurs – Four à Gaz avec Grill & Rôtissoire – Compartiment bouteille inclus",
    features: ["5 Feux", "90x60 cm", "Semi-pro", "Compartiment bouteille", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_gaz_semi-professionnelle_superflame_90x60_cm_avec_compatiment_bouteille_2_.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SFKSC-90605G"),
    name: "Cuisinière mixte semi-professionnelle SUPERFLAME SFKSC-90605G",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SFKSC-90605G",
    code: "SF005",
    price: 373795,
    description: "Gaz + Électrique – 5 Brûleurs – 90x60 cm – Four à gaz avec Grill & Rôtissoire",
    features: ["5 Feux", "90x60 cm", "Gaz+Électrique", "Semi-pro", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_gaz_semi-professionnelle_superflame_5_br_leurs_90x60_cm_1_.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SFK-606040G-SP"),
    name: "Cuisinière mixte semi-professionnelle SUPERFLAME SFK-606040G SP",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SFK-606040G SP",
    code: "SF006",
    price: 253045,
    description: "Gaz+électrique – 4 Brûleurs – 60x60 cm – Four à Gaz avec Grill & Rôtissoire – Inox",
    features: ["4 Feux", "60x60 cm", "Gaz+Électrique", "Inox", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_gaz_semi-professionnelle_superflame_4_br_leurs_2_.jpg",
    inStock: true
  },

  // MEWE Products
  {
    id: generateId("MEWE", "MWFAN-IFN2602"),
    name: "Ventilateur Industriel sur Pied MEWE 26 Pouces MWFAN-IFN2602",
    brand: "MEWE",
    category: "VENTILATEUR",
    reference: "MWFAN-IFN2602",
    code: "MEW001",
    price: 43745,
    description: "150 W - 3 Vitesses - Tête Oscillante – Structure Métallique Robuste - 72 cm",
    features: ["26 pouces", "150W", "3 vitesses", "Industriel", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur-industriel-sur-pied-mewe-26-pouces-mwfan-ifn2602---150-w---3-vitesses.jpg",
    inStock: true
  },
  {
    id: generateId("MEWE", "MWFAN-MNF0602MT"),
    name: "Mini Ventilateur rechargeable MEWE - MWFAN MNF0602MT",
    brand: "MEWE",
    category: "VENTILATEUR",
    reference: "MWFAN-MNF0602MT",
    code: "MEW002",
    price: 4070,
    description: "Puissance 5W - 2 vitesses - Autonomie 2 à 4h - Noir/Blanc",
    features: ["5W", "2 vitesses", "Rechargeable", "Compact", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_rechargeable_mewe_5_watts_1_.jpg",
    inStock: true
  },
  {
    id: generateId("MEWE", "MWFAN-ACF1206"),
    name: "Ventilateur de table MEWE 12 Pouces - MWFAN ACF1206",
    brand: "MEWE",
    category: "VENTILATEUR",
    reference: "MWFAN-ACF1206",
    code: "MEW003",
    price: 11545,
    description: "Puissance 35W - 3 vitesses - Silencieux et économique",
    features: ["12 pouces", "35W", "3 vitesses", "Silencieux", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_de_table_mewe_12_pouces.jpg",
    inStock: true
  },
  {
    id: generateId("MEWE", "MWFAN-ESF1803"),
    name: "Ventilateur Sur Pied MEWE 18 Pouces - MWFAN ESF1803",
    brand: "MEWE",
    category: "VENTILATEUR",
    reference: "MWFAN-ESF1803",
    code: "MEW004",
    price: 16720,
    description: "Puissance 60W - 3 vitesses - 05 Lames solides en plastique - Grille sécurisée",
    features: ["18 pouces", "60W", "3 vitesses", "5 lames", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//e/n/entilateur-sur-pied-mewe-18-pouces---mwfan-esf1803.jpg",
    inStock: true
  },

  // INNOVA Products
  {
    id: generateId("INNOVA", "IN8XACP"),
    name: "Climatiseur Portable INNOVA - 9 000 BTU - IN8XACP",
    brand: "INNOVA",
    category: "CLIMATISEUR",
    reference: "IN8XACP",
    code: "INN001",
    price: 109295,
    description: "1,25 CV - Refroidissement + Déshumidification - Blanc",
    features: ["9 000 BTU", "1,25 CV", "Portable", "Déshumidification", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_portable_innova_-_9_000_btu_1_25_cv_1_.jpg",
    inStock: true
  },

  // WESTPOINT Products
  {
    id: generateId("WESTPOINT", "WCNN-1723-EI"),
    name: "Réfrigérateur combiné WESTPOINT 146 litres - WCNN-1723-EI",
    brand: "WESTPOINT",
    category: "FRIGO",
    reference: "WCNN-1723-EI",
    code: "WES001",
    price: 140400,
    description: "GRIS INOX + Fer à repasser PHILIPS 1000 W Offert",
    features: ["146 Litres", "Combiné", "Gris Inox", "Pack promo", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_combine_westpoint_146_litres_fer_a_repasser_philips_1000_w_offert.jpg",
    inStock: true
  },
  {
    id: generateId("WESTPOINT", "WRNN-1523-EI"),
    name: "Réfrigérateur Double Battant WESTPOINT - WRNN-1523,EI - 138 Litres",
    brand: "WESTPOINT",
    category: "FRIGO",
    reference: "WRNN-1523,EI",
    code: "WES002",
    price: 143999,
    description: "GRIS INOX + Rallonge électrique MeWe 5 prises universelles Offerte",
    features: ["138 Litres", "Double battant", "Gris Inox", "Pack promo", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//b/u/bunge0112112025cm.jpg",
    inStock: true
  },

  // SPJ Products
  {
    id: generateId("SPJ", "RF-160C"),
    name: "Pack Réfrigérateur double porte SPJ 138 litres - RF-160C",
    brand: "SPJ",
    category: "FRIGO",
    reference: "RF-160C",
    code: "SPJ001",
    price: 148999,
    description: "Gris + Rallonge électrique MeWe à 4 prises offerte",
    features: ["138 Litres", "Double porte", "Gris", "Pack promo", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/a/pack_r_frig_rateur_double_porte_spj_138_litres.jpg",
    inStock: true
  },
  {
    id: generateId("SPJ", "RF-140C"),
    name: "Pack Réfrigérateur double porte SPJ 112 Litres - RF-140C",
    brand: "SPJ",
    category: "FRIGO",
    reference: "RF-140C",
    code: "SPJ002",
    price: 137500,
    description: "Gris + Rallonge électrique MeWe à 4 prises offerte",
    features: ["112 Litres", "Double porte", "Gris", "Pack promo", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//b/u/bunge0212112025cm.jpg",
    inStock: true
  },

  // BINATONE Products
  {
    id: generateId("BINATONE", "CDF-450"),
    name: "Congélateur Binatone 423 litres - CDF-450",
    brand: "BINATONE",
    category: "CONGELATEUR",
    reference: "CDF-450",
    code: "BIN001",
    price: 294000,
    description: "220-240 V + Régulateur de tension DELTA 1000 VA OFFERT",
    features: ["423 Litres", "220-240V", "Pack promo", "Régulateur inclus", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/conge_lateur_binatone_423_litres_re_gulateur_de_tension_delta_1000_va_offert_.jpg",
    inStock: true
  },
  {
    id: generateId("BINATONE", "FR305"),
    name: "Réfrigérateur Combiné Binatone 248L - FR305",
    brand: "BINATONE",
    category: "FRIGO",
    reference: "FR305",
    code: "BIN002",
    price: 216000,
    description: "A+ + Régulateur DELTA 1000VA Offert",
    features: ["248 Litres", "Classe A+", "Combiné", "Pack promo", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_combine_binatone_248l_re_gulateur_delta_1000va_.jpg",
    inStock: true
  },
  {
    id: generateId("BINATONE", "FR-112"),
    name: "Binatone Refrigerator - 109 Litres - FR-112",
    brand: "BINATONE",
    category: "FRIGO",
    reference: "FR-112",
    code: "BIN003",
    price: 103100,
    description: "Energy Class A+ - Compact Design - Low Energy Consumption",
    features: ["109 Litres", "Classe A+", "Compact", "Basse consommation", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_binatone.jpg",
    inStock: true
  },

  // MILLENIUM Products
  {
    id: generateId("MILLENIUM", "CF250"),
    name: "Congélateur Coffre MILLENIUM CF250 – 150 Litres",
    brand: "MILLENIUM",
    category: "CONGELATEUR",
    reference: "CF250",
    code: "MIL001",
    price: 124200,
    description: "Classe Énergétique A+ – Refroidissement rapide, Silencieux – Panier amovible – Gris",
    features: ["150 Litres", "Classe A+", "Silencieux", "Panier amovible", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_millenium_150_litres_5_.jpg",
    inStock: true
  },

  // ARF Products
  {
    id: generateId("ARF", "ARF-665L-4D"),
    name: "ARF 4-Door Cross Door Refrigerator 665 L",
    brand: "ARF",
    category: "FRIGO",
    reference: "ARF-665L-4D",
    code: "ARF001",
    price: 694471,
    description: "Inverter Compressor – Multi-Airflow Cooling – No Frost – Stainless Steel",
    features: ["665 Litres", "4 portes", "Inverter", "No Frost", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_arf_4_portes_crois_es_665_l_3_.jpg",
    inStock: true
  },
  {
    id: generateId("ARF", "ARF-585L-FD"),
    name: "ARF 4-Door French Door Refrigerator 585 L",
    brand: "ARF",
    category: "FRIGO",
    reference: "ARF-585L-FD",
    code: "ARF002",
    price: 576824,
    description: "Inverter Compressor – 3 Star EPRA – External Control – Stainless Steel",
    features: ["585 Litres", "4 portes", "Inverter", "French Door", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_arf_4_portes_fran_aises_585_l_2_.jpg",
    inStock: true
  },

  // LG AirTower
  {
    id: generateId("LG", "AIRTOWER-L-2.5CV"),
    name: "Climatiseur Armoire Dual Inverter – LG AirTower L – 2,5 CV",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "AIRTOWER-L-2.5CV",
    code: "LG011",
    price: 1201100,
    description: "LG ThinQ™ (WI-FI), Ultra Fine Filter+ & AI Dry+ – Blanc",
    features: ["2,5 CV", "Dual Inverter", "LG ThinQ", "Wi-Fi", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_armoire_dual_inverter_lg_airtower_l_2_5_cv_2_.jpg",
    inStock: true
  },

  // VALENCIA Products
  {
    id: generateId("VALENCIA", "VALSIM-6090-SLIX"),
    name: "Cuisinière mixte 5 feux VALENCIA VALSIM-6090-SLIX",
    brand: "VALENCIA",
    category: "CUISINIERE",
    reference: "VALSIM-6090-SLIX",
    code: "VAL001",
    price: 333545,
    description: "Plaque inox avec couvercle en verre, Grand four + rôtisserie+ Grill – Gris + Coupon 15 000 FCFA",
    features: ["5 Feux", "60x90 cm", "Grand four", "Rôtisserie", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisinie_re_mixte_5_feux_valencia.jpg",
    inStock: true
  },
  {
    id: generateId("VALENCIA", "VALSIM-6090-SLIX-BC"),
    name: "Cuisinière à gaz 5 feux VALENCIA VALSIM-6090-SLIX-BC",
    brand: "VALENCIA",
    category: "CUISINIERE",
    reference: "VALSIM-6090-SLIX-BC",
    code: "VAL002",
    price: 333545,
    description: "Plaque inox avec couvercle en verre, Four à gaz+ rôtisserie+ grill, Porte-bouteille intégré – Gris",
    features: ["5 Feux", "60x90 cm", "Porte-bouteille", "Rôtisserie", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/relge0411262025cm.jpg",
    inStock: true
  },
  {
    id: generateId("VALENCIA", "VALSIM-6090-RDIX-BC"),
    name: "Cuisinière à gaz 5 feux VALENCIA VALSIM-6090-RDIX-BC – Rouge",
    brand: "VALENCIA",
    category: "CUISINIERE",
    reference: "VALSIM-6090-RDIX-BC",
    code: "VAL003",
    price: 333545,
    description: "Plaque inox avec couvercle en verre, Four à gaz+ rôtisserie, Porte-bouteille intégré – Rouge",
    features: ["5 Feux", "60x90 cm", "Porte-bouteille", "Rouge", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisinie_re_a_gaz_5_feux_valencia_-_rouge.jpg",
    inStock: true
  },
  {
    id: generateId("VALENCIA", "VALSIM-6090-BGIX-BC"),
    name: "Cuisinière à gaz 5 feux VALENCIA VALSIM-6090-BGIX-BC – Crème",
    brand: "VALENCIA",
    category: "CUISINIERE",
    reference: "VALSIM-6090-BGIX-BC",
    code: "VAL004",
    price: 333545,
    description: "Plaque inox avec couvercle en verre, Four à gaz + rôtisserie + Grill, Porte-bouteille intégré – Crème",
    features: ["5 Feux", "60x90 cm", "Porte-bouteille", "Crème", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_gaz_5_feux_valencia_valsim-6090-bgix-bc.jpg",
    inStock: true
  },
  {
    id: generateId("VALENCIA", "VALSIM-6090-BLIX-BC"),
    name: "Cuisinière à gaz 5 feux VALENCIA VALSIM-6090-BLIX-BC – Noir",
    brand: "VALENCIA",
    category: "CUISINIERE",
    reference: "VALSIM-6090-BLIX-BC",
    code: "VAL005",
    price: 333545,
    description: "Plaque inox avec couvercle en verre, Four à gaz+ rôtisserie, Porte-bouteille intégré – Noir + Coupon 15 000 FCFA",
    features: ["5 Feux", "60x90 cm", "Porte-bouteille", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisinie_re_a_gaz_5_feux_valencia_coupon_de_15_000_fcfa.png",
    inStock: true
  },

  // ADDITIONAL PRODUCTS FROM EXCEL - ROCH Extended
  {
    id: generateId("ROCH", "RCF-125-E"),
    name: "ROCH Chest Freezer RCF-125-E - 96 Liters",
    brand: "ROCH",
    category: "CONGELATEUR",
    reference: "RCF-125-E",
    code: "ROCH004",
    price: 87200,
    description: "Energy Class A+ - Grey",
    features: ["96 Litres", "Classe A+", "Gris", "Compact", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur-coffre-roch---99-litres---classe-energ_tique-a_.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RCF-180-G"),
    name: "Roch RCF Chest Freezer 180-G - 142 Litres",
    brand: "ROCH",
    category: "CONGELATEUR",
    reference: "RCF-180-G",
    code: "ROCH005",
    price: 170941,
    description: "Grey - 6 Months Warranty",
    features: ["142 Litres", "Gris", "Compact", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur-coffre-roch-rcf---180-b---142-litres---gris---garantie-6-mois.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RCF-440B-B"),
    name: "ROCH Chest Freezer RCF-440B-B - 380 Liters",
    brand: "ROCH",
    category: "CONGELATEUR",
    reference: "RCF-440B-B",
    code: "ROCH006",
    price: 273000,
    description: "Gray - 6 month warranty",
    features: ["380 Litres", "Gris", "Grande capacité", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_roch_-_380_litres_prix_cameroun_-_c.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RFR-325DBL"),
    name: "Combined Refrigerator ROCH RFR-325DBL - 260 Liters",
    brand: "ROCH",
    category: "FRIGO",
    reference: "RFR-325DBL",
    code: "ROCH007",
    price: 235000,
    description: "Gray - 6 month warranty",
    features: ["260 Litres", "Combiné", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//t/e/templatefreeze.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RFR-310DBL"),
    name: "Combined Refrigerator ROCH RFR-310DBL - 251 Liters",
    brand: "ROCH",
    category: "FRIGO",
    reference: "RFR-310DBL",
    code: "ROCH008",
    price: 252000,
    description: "Gray - 6 month warranty",
    features: ["251 Litres", "Combiné", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_-_roch_251_litres_-_e.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RFR-370-DB-L"),
    name: "Combined Refrigerator Roch RFR-370 DB-L - 287 Liters",
    brand: "ROCH",
    category: "FRIGO",
    reference: "RFR-370-DB-L",
    code: "ROCH009",
    price: 310545,
    description: "Gray - 6 Month Warranty",
    features: ["287 Litres", "Combiné", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_roch_-_287_litres_prix_cameroun_-_b.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RFR-315-DT-L"),
    name: "Double-wing refrigerator Roch RFR-315 DT-L - 251 Liters",
    brand: "ROCH",
    category: "FRIGO",
    reference: "RFR-315-DT-L",
    code: "ROCH010",
    price: 235795,
    description: "Gray - 6 month warranty",
    features: ["251 Litres", "Double battant", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_double_battant_roch_-_251_litres_prix_cameroun.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RFR-260-DT-L"),
    name: "Double-wing refrigerator Roch RFR-260 DT-L - 209 Liters",
    brand: "ROCH",
    category: "FRIGO",
    reference: "RFR-260-DT-L",
    code: "ROCH011",
    price: 151200,
    description: "Gray - 6 month warranty",
    features: ["209 Litres", "Double battant", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_double_battant_roch_-_209_litres_prix_cameroun_-_c.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RSF-640"),
    name: "Réfrigérateur vitré Vertical Roch RSF-640 - 553L",
    brand: "ROCH",
    category: "FRIGO",
    reference: "RSF-640",
    code: "ROCH012",
    price: 688235,
    description: "Commercial display - 12 Mois de garantie",
    features: ["553 Litres", "Vitrine", "Commercial", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur-vitre_-vertical--roch--rsf-640.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RSF-300"),
    name: "Réfrigérateur vitré vertical Roch 300 Litres - RSF-300",
    brand: "ROCH",
    category: "FRIGO",
    reference: "RSF-300",
    code: "ROCH013",
    price: 433000,
    description: "50 Kg - 12 mois de garantie",
    features: ["300 Litres", "Vitrine", "Commercial", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_-_roch_vitr_vertical_-_300l_-_rsf-300.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RAC-S09R41-C"),
    name: "Roch Air Conditioner RAC-S09R41-C - 1.25 HP - 9000 BTU",
    brand: "ROCH",
    category: "CLIMATISEUR",
    reference: "RAC-S09R41-C",
    code: "ROCH014",
    price: 151500,
    description: "Gas R410a - 12 Months Warranty",
    features: ["9 000 BTU", "1,25 CV", "R410a", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-roch---rac-s09r41-c---1.25-cv---9000-btu.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RAC-S12R4-E"),
    name: "Climatiseur ROCH RAC-S12R4-E - 1.5 CV - 12000 BTU",
    brand: "ROCH",
    category: "CLIMATISEUR",
    reference: "RAC-S12R4-E",
    code: "ROCH015",
    price: 165000,
    description: "Gaz R410a - 6 mois garantie",
    features: ["12 000 BTU", "1,5 CV", "R410a", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//e/z/ezoge0130052023cm.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RAC-S18R41-C5CV"),
    name: "ROCH air conditioner 2 CV - 18000 BTU - RAC-S18R41-C5CV",
    brand: "ROCH",
    category: "CLIMATISEUR",
    reference: "RAC-S18R41-C5CV",
    code: "ROCH016",
    price: 270000,
    description: "Gas R410a - 12 months warranty",
    features: ["18 000 BTU", "2 CV", "R410a", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-roch_1.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "ROCH-24000BTU"),
    name: "ROCH air conditioner 24000BTU - 3CV",
    brand: "ROCH",
    category: "CLIMATISEUR",
    reference: "ROCH-24000BTU",
    code: "ROCH017",
    price: 340000,
    description: "6 months warranty",
    features: ["24 000 BTU", "3 CV", "R410", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-split---roch---24000btu---3cv---r410_1.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "RGC-302"),
    name: "Automatic gas hob ROCH RGC-302 - 3 Burners",
    brand: "ROCH",
    category: "CUISINIERE",
    reference: "RGC-302",
    code: "ROCH018",
    price: 14995,
    description: "Grey - 6 Months Warranty",
    features: ["3 Feux", "Automatique", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/l/plaque-_-gaz-allumage-automatique_-.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "ROCH-12KG-8KG"),
    name: "Machine à laver et sèche-linge 2 en 1 ROCH 12kg/8kg",
    brand: "ROCH",
    category: "MACHINE A LAVER",
    reference: "ROCH-12KG-8KG",
    code: "ROCH019",
    price: 368045,
    description: "Automatique, Frontal – Moteur Inverter – A+++ – Noir Graphite",
    features: ["12/8 Kg", "2 en 1", "Inverter", "A+++", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_et_s_che-linge_2_en_1_roch_12kg8kg_-_automatique_frontal_1_.jpg",
    inStock: true
  },
  {
    id: generateId("ROCH", "ROCH-10KG-7KG"),
    name: "Machine à laver et sèche-linge 2 en 1 ROCH 10kg/7kg",
    brand: "ROCH",
    category: "MACHINE A LAVER",
    reference: "ROCH-10KG-7KG",
    code: "ROCH020",
    price: 270000,
    description: "Automatique, Frontal - A+++ - Moteur Inverter – Argent",
    features: ["10/7 Kg", "2 en 1", "Inverter", "A+++", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_et_s_che-linge_2_en_1_roch_10kg7kg_1_.jpg",
    inStock: true
  },

  // LG Extended Products
  {
    id: generateId("LG", "S4-Q18KL28E"),
    name: "LG air conditioner DUALCOOL Inverter S4-Q18KL28E - 2.5HP",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "S4-Q18KL28E",
    code: "LG012",
    price: 460000,
    description: "Mosquito Away - 70% energy saving - white - 12 month warranty",
    features: ["18 000 BTU", "2,5 CV", "Mosquito Away", "Inverter", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_lg_2_5cv_-_b.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "S4-Q12JA28J"),
    name: "LG air conditioner DUALCOOL Inverter S4-Q12JA28J - 1.5HP",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "S4-Q12JA28J",
    code: "LG013",
    price: 350795,
    description: "Mosquito Away - 70% energy saving - white - 12 month warranty",
    features: ["12 000 BTU", "1,5 CV", "Mosquito Away", "Inverter", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_lg_dualcool_inverter_1_25cv_-_l_1.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "S4-Q09AA28B"),
    name: "LG air conditioner DUALCOOL Inverter S4-Q09AA28B - 1.25HP",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "S4-Q09AA28B",
    code: "LG014",
    price: 303000,
    description: "Mosquito Away - 70% energy saving - white - 12 month warranty",
    features: ["9 000 BTU", "1,25 CV", "Mosquito Away", "Inverter", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_lg_dualcool_inverter_1_25cv_-_l.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "S4-Q18KLRTE"),
    name: "LG ARTCOOL Inverter Air Conditioner S4-Q18KLRTE - 2.5 HP",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "S4-Q18KLRTE",
    code: "LG015",
    price: 563545,
    description: "With Smart Diagnosis technology - 12 Month Warranty",
    features: ["18 000 BTU", "2,5 CV", "ARTCOOL", "Smart Diagnosis", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_lg_artcool_inverter_prix_cameroun.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "S4-Q12JARTB"),
    name: "LG ARTCOOL Inverter Air Conditioner S4-Q12JARTB - 1.5 HP",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "S4-Q12JARTB",
    code: "LG016",
    price: 437045,
    description: "With Smart Diagnosis technology - 12 Month Warranty",
    features: ["12 000 BTU", "1,5 CV", "ARTCOOL", "Smart Diagnosis", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_lg_artcool_inverter_-_b.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "ARTCOOL-24000BTU"),
    name: "LG ARTCOOL air conditioner Inverter 24000 BTU - 3 Cv",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "ARTCOOL-24000BTU",
    code: "LG017",
    price: 635000,
    description: "Hot & Cold - Wi-Fi - 12 months",
    features: ["24 000 BTU", "3 CV", "ARTCOOL", "Wi-Fi", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_lg_artcool.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "S4-C18TZCAA"),
    name: "Air conditioner JET COOL LG S4-C18TZCAA - 2,5 CV",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "S4-C18TZCAA",
    code: "LG018",
    price: 324000,
    description: "R410 - Warranty 12 Months",
    features: ["18 000 BTU", "2,5 CV", "JET COOL", "R410", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7/no_selection",
    inStock: true
  },
  {
    id: generateId("LG", "GCS-415GQFG"),
    name: "Congélateur coffre LG GCS-415GQFG - 345 litres",
    brand: "LG",
    category: "CONGELATEUR",
    reference: "GCS-415GQFG",
    code: "LG019",
    price: 405000,
    description: "Blanc - Garantie 12 Mois",
    features: ["345 Litres", "Blanc", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/o/so.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GCS-315SQFG"),
    name: "LG Chest Freezer GCS-315SQFG - 280 liters",
    brand: "LG",
    category: "CONGELATEUR",
    reference: "GCS-315SQFG",
    code: "LG020",
    price: 313542,
    description: "White - 12 Month Warranty",
    features: ["280 Litres", "Blanc", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/conge_lateur_coffre_lg_-_280_litres_.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GCS-215SQFG"),
    name: "LG Chest Freezer GCS-215SQFG - 190 liters",
    brand: "LG",
    category: "CONGELATEUR",
    reference: "GCS-215SQFG",
    code: "LG021",
    price: 256542,
    description: "White - 12 Month Warranty",
    features: ["190 Litres", "Blanc", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/conge_lateur_coffre_lg_-_190_litres_.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GC-F689BLCM"),
    name: "LG Combined Refrigerator GC-F689BLCM - 499 liters",
    brand: "LG",
    category: "FRIGO",
    reference: "GC-F689BLCM",
    code: "LG022",
    price: 557750,
    description: "With Water Dispenser - Gray - 12 month warranty",
    features: ["499 Litres", "Distributeur d'eau", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_lg_-_d.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GR-F882HBHU"),
    name: "LG refrigerator GR-F882HBHU - 592 Liters",
    brand: "LG",
    category: "FRIGO",
    reference: "GR-F882HBHU",
    code: "LG023",
    price: 900000,
    description: "With water dispenser - Bright white steel - 12 month warranty",
    features: ["592 Litres", "Distributeur d'eau", "Blanc", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur-lg---gr-f882hlhm--592-litres.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GL-C322SLBB"),
    name: "LG 2-Door Top Freezer Refrigerator GL-C322SLBB - 260 Litres",
    brand: "LG",
    category: "FRIGO",
    reference: "GL-C322SLBB",
    code: "LG024",
    price: 270000,
    description: "Smart Inverter Compressor - Energy A+++ - Silver - 12 Month Warranty",
    features: ["260 Litres", "Smart Inverter", "A+++", "Silver", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_lg_a_double_battant_-_260_litres_.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GN-Y331SLBB"),
    name: "LG Refrigerator GN-Y331SLBB - 199 Liters",
    brand: "LG",
    category: "FRIGO",
    reference: "GN-Y331SLBB",
    code: "LG025",
    price: 280000,
    description: "Inverter Compressor",
    features: ["199 Litres", "Inverter", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur-a_-une-porte-lg---199-litres---gn-y331slbb.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GL-131-SQQP"),
    name: "LG Mini Fridge GL-131-SQQP - 92 litres",
    brand: "LG",
    category: "FRIGO",
    reference: "GL-131-SQQP",
    code: "LG026",
    price: 136800,
    description: "White",
    features: ["92 Litres", "Mini", "Blanc", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/i/mini-re_frige_rateur-lg---gl-131-sqqp---92-litres---blanc.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GL-051SQQP"),
    name: "Mini Fridge LG GL-051SQQP - 43 L",
    brand: "LG",
    category: "FRIGO",
    reference: "GL-051SQQP",
    code: "LG027",
    price: 115045,
    description: "Energy efficient A+ - White - 12 Months Warranty",
    features: ["43 Litres", "Classe A+", "Blanc", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/i/mini-r_frig_rateur-de-chambre.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GC-X257CSES"),
    name: "LG American Refrigerator GC-X257CSES - 674L",
    brand: "LG",
    category: "FRIGO",
    reference: "GC-X257CSES",
    code: "LG028",
    price: 1437500,
    description: "Advanced cooling - up to 32% energy savings - Gray - 12 months",
    features: ["674 Litres", "Advanced cooling", "32% energy savings", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7/no_selection",
    inStock: true
  },
  {
    id: generateId("LG", "P1401RONT"),
    name: "Semi-automatic washing machine LG 13,5KG P1401RONT",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "P1401RONT",
    code: "LG029",
    price: 258795,
    description: "Black - 12 month warranty",
    features: ["13,5 Kg", "Semi-automatique", "Noir", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_semi-automatique_lg_13_5kg.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "P9611RONT"),
    name: "LG Semi-Automatic Washing Machine 9KG P9611RONT",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "P9611RONT",
    code: "LG030",
    price: 172545,
    description: "Black - 12 Month Warranty",
    features: ["9 Kg", "Semi-automatique", "Noir", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_semi-automatique_lg_-_9kg_11_.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "P861RONT"),
    name: "LG Semi-Automatic Washing Machine 7KG P861RONT",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "P861RONT",
    code: "LG031",
    price: 121000,
    description: "Black - 12 month warranty",
    features: ["7 Kg", "Semi-automatique", "Noir", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_semi-automatique_lg_-_7kg_9_.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "LG-18KG"),
    name: "Machine à Laver LG à Double Cuve 18 KG – Semi-automatique",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "LG-18KG",
    code: "LG032",
    price: 290000,
    description: "Wind Jet Dry, Roller Jet, 3 Programmes – Noire – Garantie 12 Mois",
    features: ["18 Kg", "Double cuve", "Semi-auto", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_lg_double_cuve_18_kg_3_.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "F2Y1HYP6J"),
    name: "LG Automatic Washing Machine F2Y1HYP6J - 7 kg",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "F2Y1HYP6J",
    code: "LG033",
    price: 240000,
    description: "Energy Class A+++ - Silver - 12 month warranty",
    features: ["7 Kg", "A+++", "Automatique", "Silver", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_automatique_lg_-_7_kg_-.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "WT1310RH"),
    name: "Machine à laver et sécher automatique LG 13 kg/10 kg - WT1310RH",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "WT1310RH",
    code: "LG034",
    price: 1610045,
    description: "économe en énergie - Anti-allergies - Noir - Garantie 12 mois",
    features: ["13/10 Kg", "Lavage+Séchage", "Anti-allergies", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_et_se_cher_automatique_lg_-_j.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "F2V5PGP2T"),
    name: "LG Washing and Drying Machine F2V5PGP2T - 8/5 Kg",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "F2V5PGP2T",
    code: "LG035",
    price: 431818,
    description: "Grey - 12 months warranty",
    features: ["8/5 Kg", "Lavage+Séchage", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//l/a/lave-linge-_-s_che-linge-lg---f2v5pgp2t_1.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "LG-RH90V9PV8N"),
    name: "Sèche-linge LG LG-RH90V9PV8N - 9 kg",
    brand: "LG",
    category: "SECHE-LINGE",
    reference: "LG-RH90V9PV8N",
    code: "LG036",
    price: 625000,
    description: "Type à condensation - Diagnostic intelligent - GRIS - 12 mois",
    features: ["9 Kg", "Condensation", "Smart Diagnosis", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/e/seche_linge_lg_9kg_economique_sur_glotelho.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "LG-DW-14"),
    name: "LG Dishwasher - 14 Place Settings - QuadWash™ Technology",
    brand: "LG",
    category: "AUTRES",
    reference: "LG-DW-14",
    code: "LG037",
    price: 629765,
    description: "Next Generation Cleaning - 12 Month Warranty",
    features: ["14 couverts", "QuadWash", "Next Gen", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//l/a/lave-vaisselle_lg_-_14_couverts_technologie_quadwash_6_.jpg",
    inStock: true
  },

  // SAMSUNG Extended Products
  {
    id: generateId("SAMSUNG", "RS57DG4100B4GH"),
    name: "SAMSUNG American Fridge RS57DG4100B4GH - 560 Litres",
    brand: "SAMSUNG",
    category: "FRIGO",
    reference: "RS57DG4100B4GH",
    code: "SAM003",
    price: 950000,
    description: "With Water Dispenser - NO FROST - Digital Inverter - Matt Black - 12 Month Warranty",
    features: ["560 Litres", "Distributeur d'eau", "No Frost", "Digital Inverter", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_ame_ricain_samsung_-_560_litres_avec_distributeur_d_eau_-1.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "RS57DG4000B4GH"),
    name: "SAMSUNG American Fridge RS57DG4000B4GH - 560 liters",
    brand: "SAMSUNG",
    category: "FRIGO",
    reference: "RS57DG4000B4GH",
    code: "SAM004",
    price: 790000,
    description: "NO FROST - WiFi - Digital inverter - Matt black - 12 month warranty",
    features: ["560 Litres", "No Frost", "WiFi", "Digital Inverter", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_samsung_560_litres.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "RT22HAR4DSA"),
    name: "Samsung Refrigerator RT22HAR4DSA - 236 Litres",
    brand: "SAMSUNG",
    category: "FRIGO",
    reference: "RT22HAR4DSA",
    code: "SAM005",
    price: 291200,
    description: "Energy A+ - 5 shelves - 12 month warranty",
    features: ["236 Litres", "Classe A+", "5 étagères", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_samsung_-_236_litres.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "RT31"),
    name: "Double leaf refrigerator SAMSUNG RT31 - 275 Liters",
    brand: "SAMSUNG",
    category: "FRIGO",
    reference: "RT31",
    code: "SAM006",
    price: 335000,
    description: "Gray - 6 month warranty",
    features: ["275 Litres", "Double battant", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_samsung_275_litres_-_e.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "RT26HAR2DSA"),
    name: "Samsung RT26HAR2DSA Double Door Refrigerator - 203 L",
    brand: "SAMSUNG",
    category: "FRIGO",
    reference: "RT26HAR2DSA",
    code: "SAM007",
    price: 285000,
    description: "Metallic Graphite",
    features: ["203 Litres", "Double porte", "Graphite", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/r/prirt26har2dsacm.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "WW80T3040BS"),
    name: "Automatic washing machine Samsung WW80T3040BS - 8kg",
    brand: "SAMSUNG",
    category: "MACHINE A LAVER",
    reference: "WW80T3040BS",
    code: "SAM008",
    price: 322045,
    description: "Silver - 6 Months Warranty",
    features: ["8 Kg", "Automatique", "Silver", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_samsung_8kg_1_.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "WWW70T3010BS"),
    name: "Machine à Laver Automatique SAMSUNG WWW70T3010BS - 7kg",
    brand: "SAMSUNG",
    category: "MACHINE A LAVER",
    reference: "WWW70T3010BS",
    code: "SAM009",
    price: 265000,
    description: "Argent - Garantie 6 Mois",
    features: ["7 Kg", "Automatique", "Argent", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_samsung_7kg_-_f_1.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "SAM-R410A-9000"),
    name: "SAMSUNG Split Air Conditioner R410A - 9000 BTU - 1.25 Cv",
    brand: "SAMSUNG",
    category: "CLIMATISEUR",
    reference: "SAM-R410A-9000",
    code: "SAM010",
    price: 210000,
    description: "White - 6 Months",
    features: ["9 000 BTU", "1,25 CV", "R410A", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur---split---samsung_1.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "SAM-R410A-12000"),
    name: "SAMSUNG Split Air Conditioner R410A - 12000 BTU - 1.5 Cv",
    brand: "SAMSUNG",
    category: "CLIMATISEUR",
    reference: "SAM-R410A-12000",
    code: "SAM011",
    price: 242000,
    description: "White - 12 Months",
    features: ["12 000 BTU", "1,5 CV", "R410A", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_samsung_12000_btu.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "SAM-R410A-18000"),
    name: "Split air conditioner SAMSUNG R410A - 18000 BTU - 2.5 Cv",
    brand: "SAMSUNG",
    category: "CLIMATISEUR",
    reference: "SAM-R410A-18000",
    code: "SAM012",
    price: 340000,
    description: "White - 12 Months",
    features: ["18 000 BTU", "2,5 CV", "R410A", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_samsung_18000_btu.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "SAM-R410A-24000"),
    name: "Split air conditioner SAMSUNG R410A - 24000 BTU - 3 Cv",
    brand: "SAMSUNG",
    category: "CLIMATISEUR",
    reference: "SAM-R410A-24000",
    code: "SAM013",
    price: 480250,
    description: "White - 12 Months",
    features: ["24 000 BTU", "3 CV", "R410A", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/r/priar24trhgawkncm.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "SAM-INV-9000"),
    name: "Split air conditioner SAMSUNG Inverter R410A - 9000 BTU - 1.25 Cv",
    brand: "SAMSUNG",
    category: "CLIMATISEUR",
    reference: "SAM-INV-9000",
    code: "SAM014",
    price: 259000,
    description: "White - 12 Months",
    features: ["9 000 BTU", "1,25 CV", "Inverter", "R410A", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-split--samsung-inverter---r410a---9000-btu_-1.25-cv.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "SAM-INV-12000"),
    name: "Climatiseur Split SAMSUNG Inverter R410A - 12000 BTU - 1.5 Cv",
    brand: "SAMSUNG",
    category: "CLIMATISEUR",
    reference: "SAM-INV-12000",
    code: "SAM015",
    price: 293000,
    description: "Blanc - 12 Mois",
    features: ["12 000 BTU", "1,5 CV", "Inverter", "R410A", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-split--samsung-inverter.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "SAM-INV-18000"),
    name: "SAMSUNG Inverter Split Air Conditioner R410A - 18000 BTU - 2.5 Cv",
    brand: "SAMSUNG",
    category: "CLIMATISEUR",
    reference: "SAM-INV-18000",
    code: "SAM016",
    price: 429765,
    description: "White - 12 Months",
    features: ["18 000 BTU", "2,5 CV", "Inverter", "R410A", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-split-samsung-inverter---r410a---18000-btu_-2.5-cv.jpg",
    inStock: true
  },

  // SHARP Products
  {
    id: generateId("SHARP", "SJ-DC280N-HS2"),
    name: "Double-leaf refrigerator SHARP SJ-DC280N-HS2 - 212 Liters",
    brand: "SHARP",
    category: "FRIGO",
    reference: "SJ-DC280N-HS2",
    code: "SHA001",
    price: 226039,
    description: "A+ - Gray - 6 month warranty",
    features: ["212 Litres", "Classe A+", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_sharp_212_litres_-_g.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "BH320"),
    name: "Combined Refrigerator Sharp BH320 - 250 Liters",
    brand: "SHARP",
    category: "FRIGO",
    reference: "BH320",
    code: "SHA002",
    price: 330000,
    description: "Silver - 6 month warranty",
    features: ["250 Litres", "Combiné", "Silver", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_sharp_250_litres_-_b.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "BH400"),
    name: "Réfrigérateur Combine Sharp Bh400 - 332L",
    brand: "SHARP",
    category: "FRIGO",
    reference: "BH400",
    code: "SHA003",
    price: 325000,
    description: "Gris - Garantie 6 mois",
    features: ["332 Litres", "Combiné", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur-combine-sharp.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "BH180"),
    name: "Combine refrigerator Sharp Bh180 - 138L",
    brand: "SHARP",
    category: "FRIGO",
    reference: "BH180",
    code: "SHA004",
    price: 195000,
    description: "Grey - 6 months warranty",
    features: ["138 Litres", "Combiné", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_-combine_-_sharp.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "SJ-K155X-SL2"),
    name: "Réfrigérateur Mini Bar Sharp SJ-K155X-SL2 - 150L",
    brand: "SHARP",
    category: "FRIGO",
    reference: "SJ-K155X-SL2",
    code: "SHA005",
    price: 118689,
    description: "Classe A+ – R600A – Garantie 12 mois",
    features: ["150 Litres", "Mini Bar", "Classe A+", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_mini_bar_7_.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "SJ-K135X-SL3"),
    name: "Réfrigérateur Mini Bar Sharp SJ-K135X-SL3 - 90L",
    brand: "SHARP",
    category: "FRIGO",
    reference: "SJ-K135X-SL3",
    code: "SHA006",
    price: 95200,
    description: "Compresseur tropicalisé – Serrure avec clé – Garantie 06 mois",
    features: ["90 Litres", "Mini Bar", "Tropicalisé", "Serrure", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur-mini-bar-_-sharp-_-sj-k135x-sl3-_-90l.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "SJ-K75X-SL2"),
    name: "Mini réfrigérateur Sharp SJ-K75X-SL2 - 65 Litres",
    brand: "SHARP",
    category: "FRIGO",
    reference: "SJ-K75X-SL2",
    code: "SHA007",
    price: 100000,
    description: "A+ - Gris - 6 mois de garantie",
    features: ["65 Litres", "Mini", "Classe A+", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/i/mini_r_frig_rateur_sharp_65_litres_-_b.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "SJ-X655"),
    name: "Réfrigérateur American Sharp SJ-X655 - 521 Litres",
    brand: "SHARP",
    category: "FRIGO",
    reference: "SJ-X655",
    code: "SHA008",
    price: 632839,
    description: "Side By Side-NoFrost - A++ - Noir - Garantie 6 mois",
    features: ["521 Litres", "Side-by-Side", "No Frost", "A++", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_american_sharp_521_litres_-_d.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "GS-A48TCM"),
    name: "Cabinet air conditioner Sharp GS-A48TCM - 48000BTU - 6CV",
    brand: "SHARP",
    category: "CLIMATISEUR",
    reference: "GS-A48TCM",
    code: "SHA009",
    price: 1470900,
    description: "6 month warranty",
    features: ["48 000 BTU", "6 CV", "Armoire", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/r/prigsa48tcm.jpg",
    inStock: true
  },

  // WESTPOINT Extended Products
  {
    id: generateId("WESTPOINT", "WBL-2223ELS"),
    name: "WESTPOINT Chest Freezer WBL-2223ELS - 200 liters",
    brand: "WESTPOINT",
    category: "CONGELATEUR",
    reference: "WBL-2223ELS",
    code: "WES003",
    price: 187495,
    description: "Low noise - Standard Dark gray - 12 month warranty",
    features: ["200 Litres", "Silencieux", "Gris foncé", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/conge_lateur_coffre_westpoint_-_200_litres.jpg",
    inStock: true
  },
  {
    id: generateId("WESTPOINT", "WBL-2223-E"),
    name: "Chest freezer WESTPOINT WBL-2223,E - 200 Liters",
    brand: "WESTPOINT",
    category: "CONGELATEUR",
    reference: "WBL-2223-E",
    code: "WES004",
    price: 225000,
    description: "White - 6 month warranty",
    features: ["200 Litres", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/conge_lateur_coffre_westpoint_-_200_litres_.jpg",
    inStock: true
  },
  {
    id: generateId("WESTPOINT", "WSNL-5924"),
    name: "Westpoint French Door Refrigerator WSNL-5924 - 540 Litres",
    brand: "WESTPOINT",
    category: "FRIGO",
    reference: "WSNL-5924",
    code: "WES005",
    price: 687500,
    description: "With Water Dispenser - 6 Month Warranty",
    features: ["540 Litres", "French Door", "Distributeur d'eau", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_double_battant_540_litres_3_.jpg",
    inStock: true
  },
  {
    id: generateId("WESTPOINT", "WRMN-2223-EC"),
    name: "Réfrigérateur Double Battant WESTPOINT WRMN-2223.EC - 198 litres",
    brand: "WESTPOINT",
    category: "FRIGO",
    reference: "WRMN-2223-EC",
    code: "WES006",
    price: 189795,
    description: "R600a - Gris - 12 mois garantie",
    features: ["198 Litres", "Double battant", "R600a", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_westpoint_198_litres_1_.jpg",
    inStock: true
  },
  {
    id: generateId("WESTPOINT", "WCS-2723"),
    name: "Combined Refrigerator WESTPOINT WCS-2723 - 251 Liters",
    brand: "WESTPOINT",
    category: "FRIGO",
    reference: "WCS-2723",
    code: "WES007",
    price: 270000,
    description: "With 5 Drawers - Gray - 6 month warranty",
    features: ["251 Litres", "5 tiroirs", "Combiné", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/combined-refrigerator_3.jpg",
    inStock: true
  },
  {
    id: generateId("WESTPOINT", "WRHN37118"),
    name: "WESTPOINT WRHN37118 Refrigerator - 311L",
    brand: "WESTPOINT",
    category: "FRIGO",
    reference: "WRHN37118",
    code: "WES008",
    price: 280000,
    description: "Gray - 06 months warranty",
    features: ["311 Litres", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//f/r/frigo_combin_311l.jpg",
    inStock: true
  },
  {
    id: generateId("WESTPOINT", "WTF-9123-P"),
    name: "Semi-Automatic Washing Machine WESTPOINT WTF-9123.P - 9 kg",
    brand: "WESTPOINT",
    category: "MACHINE A LAVER",
    reference: "WTF-9123-P",
    code: "WES009",
    price: 150000,
    description: "White/Blue - 12 Month Warranty",
    features: ["9 Kg", "Semi-automatique", "Blanc/Bleu", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_semi-automatique_westpoint_-_9_kg.jpg",
    inStock: true
  },

  // OCEAN Extended Products
  {
    id: generateId("OCEAN", "WF0I12104WTMB"),
    name: "Automatic washing machine OCEAN WF0I12104WTMB - 10kg",
    brand: "OCEAN",
    category: "MACHINE A LAVER",
    reference: "WF0I12104WTMB",
    code: "OCE001",
    price: 322045,
    description: "A+++ - Dark silver - 06 Month Warranty",
    features: ["10 Kg", "A+++", "Automatique", "Dark silver", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_10kg.jpg",
    inStock: true
  },
  {
    id: generateId("OCEAN", "WFO1081-WLSFP"),
    name: "Automatic washing machine OCEAN WFO1081 WLSFP - 8kg",
    brand: "OCEAN",
    category: "MACHINE A LAVER",
    reference: "WFO1081-WLSFP",
    code: "OCE002",
    price: 230045,
    description: "A+++ - Gray - 06 Month Warranty",
    features: ["8 Kg", "A+++", "Automatique", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_ocean_8kg.jpg",
    inStock: true
  },
  {
    id: generateId("OCEAN", "OFETL-881MPS"),
    name: "Automatic Washing Machine OCEAN OFETL 881MPS - 8Kg",
    brand: "OCEAN",
    category: "MACHINE A LAVER",
    reference: "OFETL-881MPS",
    code: "OCE003",
    price: 195545,
    description: "Top Loading - 12 month warranty",
    features: ["8 Kg", "Top Loading", "Automatique", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_automatique_-_ocean_-_8kg_.jpg",
    inStock: true
  },
  {
    id: generateId("OCEAN", "ODDW350"),
    name: "OCEAN Refrigerator ODDW350 - 345 Liters",
    brand: "OCEAN",
    category: "FRIGO",
    reference: "ODDW350",
    code: "OCE004",
    price: 355000,
    description: "Energy class A+ - No Frost - 12 month warranty",
    features: ["345 Litres", "Classe A+", "No Frost", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_ocean_-_345_litres.jpg",
    inStock: true
  },
  {
    id: generateId("OCEAN", "ODDW450"),
    name: "OCEAN Refrigerator ODDW450 - 430 Litres",
    brand: "OCEAN",
    category: "FRIGO",
    reference: "ODDW450",
    code: "OCE005",
    price: 444000,
    description: "Energy class A++ - No Frost - 12 month warranty",
    features: ["430 Litres", "Classe A++", "No Frost", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_ocean_-_430_litres.jpg",
    inStock: true
  },
  {
    id: generateId("OCEAN", "ACSZS24OA"),
    name: "OCEAN ON And OFF Air Conditioner ACSZS24OA - 3 HP",
    brand: "OCEAN",
    category: "CLIMATISEUR",
    reference: "ACSZS24OA",
    code: "OCE006",
    price: 401395,
    description: "R410 - White - 6 Months Warranty",
    features: ["24 000 BTU", "3 CV", "R410", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_ocean_on.jpg",
    inStock: true
  },
  {
    id: generateId("OCEAN", "ACSO18A"),
    name: "OCEAN ON And OFF Air Conditioner ACSO18A - 2.5 HP",
    brand: "OCEAN",
    category: "CLIMATISEUR",
    reference: "ACSO18A",
    code: "OCE007",
    price: 270295,
    description: "R410 - White - 6 Months Warranty",
    features: ["18 000 BTU", "2,5 CV", "R410", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_ocean.jpg",
    inStock: true
  },
  {
    id: generateId("OCEAN", "ACSZS9OA"),
    name: "Air conditioner OCEAN ON And OFF ACSZS9OA - 1.25 HP",
    brand: "OCEAN",
    category: "CLIMATISEUR",
    reference: "ACSZS9OA",
    code: "OCE008",
    price: 173695,
    description: "R410 - White - 6 months warranty",
    features: ["9 000 BTU", "1,25 CV", "R410", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_ocean_on_and_off.jpg",
    inStock: true
  },

  // OSCAR Extended Products
  {
    id: generateId("OSCAR", "OSC-300MB"),
    name: "Double Door Refrigerator OSCAR OSC 300MB - 300 Litres",
    brand: "OSCAR",
    category: "FRIGO",
    reference: "OSC-300MB",
    code: "OSC019",
    price: 181500,
    description: "Climate class ST/T - Energy consumption A+ - Grey - 12 Month Warranty",
    features: ["300 Litres", "Double porte", "Classe A+", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_double_battant_-_oscar_-_300_litres.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-400SS"),
    name: "Double-leaf refrigerator OSCAR OSC 400SS - 400 Litres",
    brand: "OSCAR",
    category: "FRIGO",
    reference: "OSC-400SS",
    code: "OSC020",
    price: 264545,
    description: "Climate class ST/T - Grey - 12 Month Warranty",
    features: ["400 Litres", "Double battant", "ST/T", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_double_battant_-_oscar_-_400_litres.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-250SS"),
    name: "Double-leaf refrigerator OSCAR OSC 250SS - 250 Litres",
    brand: "OSCAR",
    category: "FRIGO",
    reference: "OSC-250SS",
    code: "OSC021",
    price: 209900,
    description: "Energy class A+ - Grey - 12-month warranty",
    features: ["250 Litres", "Double battant", "Classe A+", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_double_battant_-_oscar_-_250_litres.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "R115"),
    name: "Mini réfrigérateur Oscar R115 - 90 litres",
    brand: "OSCAR",
    category: "FRIGO",
    reference: "R115",
    code: "OSC022",
    price: 86295,
    description: "Gris - Garantie 6 mois",
    features: ["90 Litres", "Mini", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/i/mini_r_frig_rateur_oscar_90_litres_-_f.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "R115S"),
    name: "Oscar Mini Fridge R115S - 90 Liters",
    brand: "OSCAR",
    category: "FRIGO",
    reference: "R115S",
    code: "OSC023",
    price: 95000,
    description: "Gray - 6 Month Warranty",
    features: ["90 Litres", "Mini", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//b/i/bien_4.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-092C"),
    name: "OSCAR INVERTER Air Conditioner OSC-092C - 1.25 HP - Portable - 9000BTU",
    brand: "OSCAR",
    category: "CLIMATISEUR",
    reference: "OSC-092C",
    code: "OSC024",
    price: 175000,
    description: "12 month warranty",
    features: ["9 000 BTU", "1,25 CV", "Portable", "Inverter", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_oscar_inverter_-_1_25_cv_.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "FL-1070W"),
    name: "Automatic Washing Machine Oscar FL-1070W - 7Kg",
    brand: "OSCAR",
    category: "MACHINE A LAVER",
    reference: "FL-1070W",
    code: "OSC025",
    price: 222000,
    description: "White - 6 Months",
    features: ["7 Kg", "Automatique", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_oscar_7kg_sur_glotelho.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-5F-60X76"),
    name: "Oscar 5 burner stove - 60 × 76cm - Wood",
    brand: "OSCAR",
    category: "CUISINIERE",
    reference: "OSC-5F-60X76",
    code: "OSC026",
    price: 152250,
    description: "6 month warranty",
    features: ["5 Feux", "60x76 cm", "Bois", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re-oscar-5-feux---60-_-76cm---bois---12-mois-de-garantie.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-WD-167"),
    name: "Distributeur d'eau chaude et froide OSCAR OSC-WD-167 - 100 CM",
    brand: "OSCAR",
    category: "DISPENSEUR EAU",
    reference: "OSC-WD-167",
    code: "OSC027",
    price: 69045,
    description: "avec mini réfrigérateur intégré - Argent - Garantie 6 mois",
    features: ["100 cm", "Chaud/Froid", "Mini frigo", "Argent", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//d/i/distributeur_d_eau_chaude_et_froide_-_e.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-WD-168-WHITE"),
    name: "OSCAR Hot and Cold Water Dispenser OSC-WD-168 - 80 CM - White Marble",
    brand: "OSCAR",
    category: "DISPENSEUR EAU",
    reference: "OSC-WD-168-WHITE",
    code: "OSC028",
    price: 63295,
    description: "with Integrated Mini Fridge - White Marble - 3 Month Warranty",
    features: ["80 cm", "Chaud/Froid", "Mini frigo", "Marbre blanc", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//d/i/distributeur_d_eau_chaude_et_froide_oscar_marbre_blanc_-_a.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-WD-168-BLACK"),
    name: "OSCAR Hot and Cold Water Dispenser OSC-WD-168 - 80 CM - Black Marble",
    brand: "OSCAR",
    category: "DISPENSEUR EAU",
    reference: "OSC-WD-168-BLACK",
    code: "OSC029",
    price: 63295,
    description: "with Integrated Mini Fridge - Black Marble - 6 Month Warranty",
    features: ["80 cm", "Chaud/Froid", "Mini frigo", "Marbre noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//d/i/distributeur_d_eau_chaude_et_froide_oscar_-_c.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-2902"),
    name: "Removable water fan - Air cooler - OSCAR OSC-2902 - 5.5 liters",
    brand: "OSCAR",
    category: "AIR COOLER",
    reference: "OSC-2902",
    code: "OSC030",
    price: 73450,
    description: "White/Black - 3 month warranty",
    features: ["5.5 Litres", "Air Cooler", "Amovible", "Blanc/Noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_eau_amovible_oscar_5_5_litres_-_b.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-S-750"),
    name: "Ventilateur Oscar 30 Pouces - OSC-S-750 - 80W",
    brand: "OSCAR",
    category: "VENTILATEUR",
    reference: "OSC-S-750",
    code: "OSC031",
    price: 65000,
    description: "Noir - Garantie 3 mois",
    features: ["30 pouces", "80W", "Noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_mural_oscar_30_pouces_1_.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-S-650"),
    name: "Ventilateur Mural Oscar 26 Pouces - OSC-S-650 - 80W",
    brand: "OSCAR",
    category: "VENTILATEUR",
    reference: "OSC-S-650",
    code: "OSC032",
    price: 60000,
    description: "Noir - Garantie 3 mois",
    features: ["26 pouces", "80W", "Noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_mural_oscar_26_pouces_-_a.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-40-17"),
    name: "Ventilateur mural Oscar 16 pouces avec télécommande - OSC-40-17",
    brand: "OSCAR",
    category: "VENTILATEUR",
    reference: "OSC-40-17",
    code: "OSC033",
    price: 24000,
    description: "60 W - Noir - Garantie 3 mois",
    features: ["16 pouces", "60W", "Télécommande", "Noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_mural_oscar_16_pouces_avec_t_l_commande_2_.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-5W"),
    name: "Ventilateur Oscar 16 Pouces - OSC-5W - 45W",
    brand: "OSCAR",
    category: "VENTILATEUR",
    reference: "OSC-5W",
    code: "OSC034",
    price: 16500,
    description: "Blanc - Garantie 3 mois",
    features: ["16 pouces", "45W", "Blanc", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_oscar_45w_blanc_-_a.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-40-1602B"),
    name: "Ventilateur Oscar avec télécommande 16 pouces - OSC-40-1602B - 75W",
    brand: "OSCAR",
    category: "VENTILATEUR",
    reference: "OSC-40-1602B",
    code: "OSC035",
    price: 26550,
    description: "Noir - Garantie 3 mois",
    features: ["16 pouces", "75W", "Télécommande", "Noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_oscar_avec_t_l_commande_16_pouces_-_a.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-40-1601B"),
    name: "Ventilateur Oscar 16 pouces - OSC-40-1601B - 60W",
    brand: "OSCAR",
    category: "VENTILATEUR",
    reference: "OSC-40-1601B",
    code: "OSC036",
    price: 24500,
    description: "Noir - Garantie 3 mois",
    features: ["16 pouces", "60W", "Noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_oscar_16_pouces_-_1_.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-40-1601W"),
    name: "Oscar fan 16 inches - OSC-40-1601W - 55W",
    brand: "OSCAR",
    category: "VENTILATEUR",
    reference: "OSC-40-1601W",
    code: "OSC037",
    price: 20000,
    description: "Black - 3 month warranty",
    features: ["16 pouces", "55W", "Noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_oscar_16_pouces_-_a.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-201"),
    name: "Automatic Gas Hob OSCAR OSC-201 - 2 burners",
    brand: "OSCAR",
    category: "CUISINIERE",
    reference: "OSC-201",
    code: "OSC038",
    price: 26345,
    description: "White - 06 month warranty",
    features: ["2 Feux", "Automatique", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/l/plaque_de_cuisson_gaz_automatique_oscar_2_feux_-.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-200"),
    name: "Gas hob OSCAR OSC-200 - Aluminum - 2 burners",
    brand: "OSCAR",
    category: "CUISINIERE",
    reference: "OSC-200",
    code: "OSC039",
    price: 19500,
    description: "Gray - 06 month warranty",
    features: ["2 Feux", "Aluminium", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/l/plaque_de_cuisson_gaz_oscar_aluminium_2_feux.jpg",
    inStock: true
  },
  {
    id: generateId("OSCAR", "OSC-402"),
    name: "Automatic Gas Hob OSCAR OSC-402 - 2 burners - Tempered Glass",
    brand: "OSCAR",
    category: "CUISINIERE",
    reference: "OSC-402",
    code: "OSC040",
    price: 26000,
    description: "Black - 06 month warranty",
    features: ["2 Feux", "Verre trempé", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/l/plaque_gaz_automatique_oscar_2_feux_-_b.jpg",
    inStock: true
  },

  // HISENSE Extended Products
  {
    id: generateId("HISENSE", "WSRB113W"),
    name: "Hisense semi-automatic washing machine WSRB113W - 11KG",
    brand: "HISENSE",
    category: "MACHINE A LAVER",
    reference: "WSRB113W",
    code: "HIS010",
    price: 162000,
    description: "Gray - 06 months",
    features: ["11 Kg", "Semi-automatique", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine-a_-laver-semi---automatique-hisense---wsrb113w---11kg_1.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "HISENSE-1.25CV"),
    name: "Hisense 1.25 CV Air Conditioner",
    brand: "HISENSE",
    category: "CLIMATISEUR",
    reference: "HISENSE-1.25CV",
    code: "HIS011",
    price: 175000,
    description: "Energy-saving - White - R410 - 06 months",
    features: ["9 000 BTU", "1,25 CV", "Économique", "R410", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-hisense-1.25-cv.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "HISENSE-24000BTU"),
    name: "Split Air Conditioner Hisense - 24000 BTU - 3 HP",
    brand: "HISENSE",
    category: "CLIMATISEUR",
    reference: "HISENSE-24000BTU",
    code: "HIS012",
    price: 350000,
    description: "R410 - 6 Months",
    features: ["24 000 BTU", "3 CV", "R410", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//e/l/eleas24gl410ocm.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "AS-18TR4SMATG01D"),
    name: "Hisense Inverter Split Air Conditioner AS-18TR4SMATG01D - 18000 BTU - 2.5 HP",
    brand: "HISENSE",
    category: "CLIMATISEUR",
    reference: "AS-18TR4SMATG01D",
    code: "HIS013",
    price: 325000,
    description: "R410 - 6 Months",
    features: ["18 000 BTU", "2,5 CV", "Inverter", "R410", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//e/l/eleas18glocm.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "AS-12CR4SYRCA02"),
    name: "Hisense AS-12CR4SYRCA02 Split Air Conditioner - 12000 BTU - 1.5 HP",
    brand: "HISENSE",
    category: "CLIMATISEUR",
    reference: "AS-12CR4SYRCA02",
    code: "HIS014",
    price: 179200,
    description: "R410 - 6 Months",
    features: ["12 000 BTU", "1,5 CV", "R410", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-split-hisense-as-12cr4svdtg01---12000-btu.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "FC-590"),
    name: "Hisense Chest Freezer FC-590 - 420 liters",
    brand: "HISENSE",
    category: "CONGELATEUR",
    reference: "FC-590",
    code: "HIS015",
    price: 420000,
    description: "Gray - 12 Months",
    features: ["420 Litres", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/conge_lateur-coffre-hisense---fc-590---475litres---gris.jpg",
    inStock: true
  },
  {
    id: generateId("HISENSE", "RD-11"),
    name: "Mini Fridge Hisense RD-11 - 80 L",
    brand: "HISENSE",
    category: "FRIGO",
    reference: "RD-11",
    code: "HIS016",
    price: 110000,
    description: "6 Months Warranty",
    features: ["80 Litres", "Mini", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/i/mini-re_frige_rateur-de-chambre---hisense-rd-11--80-l-.jpg",
    inStock: true
  },

  // INNOVA Extended Products
  {
    id: generateId("INNOVA", "IN25"),
    name: "Removable water fan - Air cooler - INNOVA IN25 - 25 liters",
    brand: "INNOVA",
    category: "AIR COOLER",
    reference: "IN25",
    code: "INN002",
    price: 73000,
    description: "White/Black - 3 month warranty",
    features: ["25 Litres", "Air Cooler", "Amovible", "Blanc/Noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_eau_amovible.jpg",
    inStock: true
  },
  {
    id: generateId("INNOVA", "KFC825A"),
    name: "Water fan with remote control INNOVA KFC825A - 6L water tank",
    brand: "INNOVA",
    category: "VENTILATEUR",
    reference: "KFC825A",
    code: "INN003",
    price: 46045,
    description: "65W - 1-8hrs timer - 3 speeds - White - 3 month warranty",
    features: ["6L", "65W", "Télécommande", "Minuteur", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_eau_avec_t_l_commande_et_mouvement_oscillant_-_innova_-_kfc818a_3_.jpg",
    inStock: true
  },
  {
    id: generateId("INNOVA", "IN-159"),
    name: "Chest Freezer Innova In-159 - 100 Liters",
    brand: "INNOVA",
    category: "CONGELATEUR",
    reference: "IN-159",
    code: "INN004",
    price: 89600,
    description: "Dark Gray - 12 Month Warranty",
    features: ["100 Litres", "Compact", "Gris foncé", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_innova_prix_cameroun.jpg",
    inStock: true
  },
  {
    id: generateId("INNOVA", "IN-720"),
    name: "Chest Freezer Innova IN-720 - 590 Liters",
    brand: "INNOVA",
    category: "CONGELATEUR",
    reference: "IN-720",
    code: "INN005",
    price: 385000,
    description: "67 x 82 x 124 cm - Gray - 12 Month Warranty",
    features: ["590 Litres", "Grande capacité", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur-coffre---innova---in-720.jpg",
    inStock: true
  },
  {
    id: generateId("INNOVA", "IN-549"),
    name: "Chest Freezer Innova In-549 - 310L",
    brand: "INNOVA",
    category: "CONGELATEUR",
    reference: "IN-549",
    code: "INN006",
    price: 231650,
    description: "Dark Gray - 12 Month Warranty",
    features: ["310 Litres", "Gris foncé", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur-coffre---innova---in-549---360l.jpg",
    inStock: true
  },
  {
    id: generateId("INNOVA", "IN-399"),
    name: "Chest Freezer Innova IN-399 - 200 Liters",
    brand: "INNOVA",
    category: "CONGELATEUR",
    reference: "IN-399",
    code: "INN007",
    price: 171600,
    description: "Dark gray - 12 Month Warranty",
    features: ["200 Litres", "Gris foncé", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur-coffre---innova---in-399---200-litres.jpg",
    inStock: true
  },
  {
    id: generateId("INNOVA", "IN-249"),
    name: "Chest Freezer Innova IN-249 - 146 Liters",
    brand: "INNOVA",
    category: "CONGELATEUR",
    reference: "IN-249",
    code: "INN008",
    price: 139100,
    description: "Dark gray - 12 Month Warranty",
    features: ["146 Litres", "Gris foncé", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur-coffre---innova---in-249---146-litres.jpg",
    inStock: true
  },

  // BINATONE Extended Products
  {
    id: generateId("BINATONE", "CDF-230"),
    name: "binatone horizontal freezer CDF-230 - 210 liters",
    brand: "BINATONE",
    category: "CONGELATEUR",
    reference: "CDF-230",
    code: "BIN004",
    price: 215000,
    description: "12 months warranty",
    features: ["210 Litres", "Horizontal", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_horizontal_binatone_-_cdf-230_4_.jpg",
    inStock: true
  },
  {
    id: generateId("BINATONE", "CDF-330"),
    name: "freezer binatone CDF-330 - 327 L",
    brand: "BINATONE",
    category: "CONGELATEUR",
    reference: "CDF-330",
    code: "BIN005",
    price: 194400,
    description: "220-240v/50Hz - 12 months warranty",
    features: ["327 Litres", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_binatone_cdf-330_-_327_l_au_cameroun.jpg",
    inStock: true
  },
  {
    id: generateId("BINATONE", "CDF-550"),
    name: "Freezer binatone CDF-550 - 520L",
    brand: "BINATONE",
    category: "CONGELATEUR",
    reference: "CDF-550",
    code: "BIN006",
    price: 380000,
    description: "67 kg - 12 months warranty",
    features: ["520 Litres", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_binatone_cdf_-_550_moins_cher_1.jpg",
    inStock: true
  },
  {
    id: generateId("BINATONE", "FR205"),
    name: "BINATONE Combined Fridge FR205 - 176 liters",
    brand: "BINATONE",
    category: "FRIGO",
    reference: "FR205",
    code: "BIN007",
    price: 175420,
    description: "2 doors - 3 drawers - energy class T - Gray - 6 Months Warranty",
    features: ["176 Litres", "2 portes", "3 tiroirs", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/e/sec5.jpg",
    inStock: true
  },
  {
    id: generateId("BINATONE", "FR-110"),
    name: "Binatone mini fridge FR-110 - 92 litres",
    brand: "BINATONE",
    category: "FRIGO",
    reference: "FR-110",
    code: "BIN008",
    price: 100000,
    description: "one door - White - 06 months",
    features: ["92 Litres", "Mini", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/i/mini_r_frig_rateur_binatone_1.jpg",
    inStock: true
  },
  {
    id: generateId("BINATONE", "ACSTAV-18"),
    name: "Air conditioner INVENTER BINATONE ACSTAV-18 - 2.5CV - 18000 btu",
    brand: "BINATONE",
    category: "CLIMATISEUR",
    reference: "ACSTAV-18",
    code: "BIN009",
    price: 310000,
    description: "R410 - white - Warranty 12 Months",
    features: ["18 000 BTU", "2,5 CV", "Inverter", "R410", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_-_inventer_binatone_-_2.5cv_-_18000_btu.jpg",
    inStock: true
  },
  {
    id: generateId("BINATONE", "OBF-1650"),
    name: "Wall Fan Binatone 18 inch OBF-1650",
    brand: "BINATONE",
    category: "VENTILATEUR",
    reference: "OBF-1650",
    code: "BIN010",
    price: 24999,
    description: "Black",
    features: ["18 pouces", "Mural", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_mural_-_binatone_18_pouce_obf-1605.jpg",
    inStock: true
  },

  // DELTA Extended Products
  {
    id: generateId("DELTA", "DCF-300-INOX-WB"),
    name: "Delta 295 Litre Chest Freezer DCF-300-INOX-WB",
    brand: "DELTA",
    category: "CONGELATEUR",
    reference: "DCF-300-INOX-WB",
    code: "DEL005",
    price: 235100,
    description: "Energy Class A+ - Quiet & Eco-Friendly - 12 Month Warranty",
    features: ["295 Litres", "Classe A+", "Silencieux", "Écologique", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_delta_295_litres_2_.jpg",
    inStock: true
  },
  {
    id: generateId("DELTA", "DCF-440-XX"),
    name: "Congélateur coffre Delta DCF-440 XX - 400 Litres",
    brand: "DELTA",
    category: "CONGELATEUR",
    reference: "DCF-440-XX",
    code: "DEL006",
    price: 283100,
    description: "Classe énergétique A+ – Tropicalisé – R600a – Silencieux 42dB – Gris – Garantie 12 mois",
    features: ["400 Litres", "Classe A+", "Tropicalisé", "Silencieux", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/congelateur_delta_1_.jpg",
    inStock: true
  },
  {
    id: generateId("DELTA", "DRF450M"),
    name: "DELTA Combined Refrigerator DRF450M - 251 Litres",
    brand: "DELTA",
    category: "FRIGO",
    reference: "DRF450M",
    code: "DEL007",
    price: 252000,
    description: "A+ - 12 month warranty",
    features: ["251 Litres", "Combiné", "Classe A+", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_combine_delta_-_251_litres.jpg",
    inStock: true
  },
  {
    id: generateId("DELTA", "DRF-260"),
    name: "Réfrigérateur double battant Delta DRF-260 - 205 litres",
    brand: "DELTA",
    category: "FRIGO",
    reference: "DRF-260",
    code: "DEL008",
    price: 173600,
    description: "A+ - Gris - Garantie 12 mois",
    features: ["205 Litres", "Double battant", "Classe A+", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_double_battant_-_delta_-_205_litres.jpg",
    inStock: true
  },
  {
    id: generateId("DELTA", "DRF-190"),
    name: "Réfrigérateur double battant Delta DRF-190 - 138 litres",
    brand: "DELTA",
    category: "FRIGO",
    reference: "DRF-190",
    code: "DEL009",
    price: 140000,
    description: "A++ - Gris - Garantie 12 Mois",
    features: ["138 Litres", "Double battant", "Classe A++", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_double_battant_-_delta_-_138_litres.jpg",
    inStock: true
  },
  {
    id: generateId("DELTA", "DRF-251BM"),
    name: "Delta refrigerator DRF-251BM - 142 Liters",
    brand: "DELTA",
    category: "FRIGO",
    reference: "DRF-251BM",
    code: "DEL010",
    price: 205000,
    description: "A++ - 06 months warranty",
    features: ["142 Litres", "Classe A++", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur-delta---142-litres---drf-251bm---a_---06-mois-de-garantie.jpg",
    inStock: true
  },
  {
    id: generateId("DELTA", "DRF-651SS"),
    name: "Delta American Refrigerator DRF-651SS - 529 Liters",
    brand: "DELTA",
    category: "FRIGO",
    reference: "DRF-651SS",
    code: "DEL011",
    price: 647412,
    description: "A++ - NO FROST - 6 Month Warranty",
    features: ["529 Litres", "Américain", "No Frost", "A++", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//d/e/dee03932022cm.jpg",
    inStock: true
  },
  {
    id: generateId("DELTA", "DL-WM-1208-G-J"),
    name: "Delta Automatic Washing Machine DL-WM-1208-G-J - 8Kg",
    brand: "DELTA",
    category: "MACHINE A LAVER",
    reference: "DL-WM-1208-G-J",
    code: "DEL012",
    price: 178200,
    description: "06 month warranty",
    features: ["8 Kg", "Automatique", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine-_-laver-automatique-delta-8_kg-_-dl-wm-1208-g-j.jpg",
    inStock: true
  },

  // FIABTEC Extended Products
  {
    id: generateId("FIABTEC", "FTSBSS-590WE"),
    name: "American fridge with water dispenser FIABTEC FTSBSS-590WE - 520 litres",
    brand: "FIABTEC",
    category: "FRIGO",
    reference: "FTSBSS-590WE",
    code: "FIA014",
    price: 494545,
    description: "No Frost – 12-month warranty",
    features: ["520 Litres", "Distributeur d'eau", "No Frost", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur-am_ricain-avec-distributeur-d_eau.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTKG-CD-492W"),
    name: "Double French Door Refrigerator FIABTEC FTKG-CD-492W - 482 liters",
    brand: "FIABTEC",
    category: "FRIGO",
    reference: "FTKG-CD-492W",
    code: "FIA015",
    price: 675000,
    description: "No Frost A+++ - Stainless steel - 12 month warranty",
    features: ["482 Litres", "French Door", "No Frost", "A+++", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_porte_franc_aise_double_battant_-_482_litres.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTTMS-595NF"),
    name: "Réfrigérateur grand model FIABTEC FTTMS-595NF - 410 litres",
    brand: "FIABTEC",
    category: "FRIGO",
    reference: "FTTMS-595NF",
    code: "FIA016",
    price: 389999,
    description: "No frost - Garantie 6 mois",
    features: ["410 Litres", "No Frost", "Grand modèle", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_grand_model_fiabtec_fttms-595nf.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTBMS-458DF"),
    name: "FIABTEC refrigerator FTBMS-458DF - 273 liters",
    brand: "FIABTEC",
    category: "FRIGO",
    reference: "FTBMS-458DF",
    code: "FIA017",
    price: 224000,
    description: "6 month warranty",
    features: ["273 Litres", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur-fiabtec---ftbms--458df---273-litres---garantie-6-mois_1.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTTMS-430DF"),
    name: "Refrigerator FIABTEC FTTMS-430DF - 251L",
    brand: "FIABTEC",
    category: "FRIGO",
    reference: "FTTMS-430DF",
    code: "FIA018",
    price: 207900,
    description: "06 months warranty",
    features: ["251 Litres", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/h/shafttms430dfcm.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "CO55XX"),
    name: "Chest freezer with defrost FIABTEC Co55xx - 510 Liters",
    brand: "FIABTEC",
    category: "CONGELATEUR",
    reference: "CO55XX",
    code: "FIA019",
    price: 350000,
    description: "energy efficient - Gray - 6 Months Warranty",
    features: ["510 Litres", "Économique", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//t/e/templatefreeze6_1.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTWHY-D80L"),
    name: "Electric storage water heater FIABTEC FTWHY-D80L - 80 Liters",
    brand: "FIABTEC",
    category: "CHAUFFE-EAU",
    reference: "FTWHY-D80L",
    code: "FIA020",
    price: 89745,
    description: "1500W – 220V – IPX4 – Pressure 0.8MPa – 6 Month Warranty",
    features: ["80 Litres", "1500W", "IPX4", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/h/chauffe-eau_lectrique_accumulation_4_.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTWHY-D50L"),
    name: "Electric Storage Water Heater FIABTEC FTWHY-D50L - 50 Liters",
    brand: "FIABTEC",
    category: "CHAUFFE-EAU",
    reference: "FTWHY-D50L",
    code: "FIA021",
    price: 71345,
    description: "1500W – 220V – IPX4 – Pressure 0.8MPa – 6 Month Warranty",
    features: ["50 Litres", "1500W", "IPX4", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/h/chauffe-eau_lectrique_accumulation_2__1.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTWHY-D30L"),
    name: "Electric Storage Water Heater FIABTEC FTWHY-D30L - 30 Liters",
    brand: "FIABTEC",
    category: "CHAUFFE-EAU",
    reference: "FTWHY-D30L",
    code: "FIA022",
    price: 59845,
    description: "1500W – 220V / 50Hz – IPX4 – 6 Month Warranty",
    features: ["30 Litres", "1500W", "IPX4", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/h/chauffe-eau_lectrique_accumulation_2__2.jpg",
    inStock: true
  },
  {
    id: generateId("FIABTEC", "FTWHY-SF10L"),
    name: "Electric storage water heater FIABTEC FTWHY-SF10L - 10 Liters",
    brand: "FIABTEC",
    category: "CHAUFFE-EAU",
    reference: "FTWHY-SF10L",
    code: "FIA023",
    price: 48345,
    description: "1500W – 220V / 50Hz – IPX4 – Compact & Economical – 6 Month Warranty",
    features: ["10 Litres", "1500W", "Compact", "Économique", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/h/chauffe-eau_lectrique_accumulation_2__1_1.jpg",
    inStock: true
  },

  // MIDEA Extended Products
  {
    id: generateId("MIDEA", "FS40-11MG"),
    name: "Midea 16 inch fan FS40-11MG - 125 W",
    brand: "MIDEA",
    category: "VENTILATEUR",
    reference: "FS40-11MG",
    code: "MID004",
    price: 26000,
    description: "3 speeds - 3 Propellers - Black and Red - 3 month warranty",
    features: ["16 pouces", "125W", "3 vitesses", "Noir/Rouge", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_16_pouces.jpg",
    inStock: true
  },
  {
    id: generateId("MIDEA", "FS40-15GR"),
    name: "Midea 16 inch fan FS40-15GR - With Remote Control",
    brand: "MIDEA",
    category: "VENTILATEUR",
    reference: "FS40-15GR",
    code: "MID005",
    price: 30000,
    description: "Black - 3 month warranty",
    features: ["16 pouces", "Télécommande", "Noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//e/l/elege0404032024cm.jpg",
    inStock: true
  },
  {
    id: generateId("MIDEA", "FS40-21MR"),
    name: "Midea electric fan 16 inches - FS40-21MR - With remote control",
    brand: "MIDEA",
    category: "VENTILATEUR",
    reference: "FS40-21MR",
    code: "MID006",
    price: 25500,
    description: "Black - 3 month warranty",
    features: ["16 pouces", "Télécommande", "Noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_lectrique_midea_-_16pouces.jpg",
    inStock: true
  },
  {
    id: generateId("MIDEA", "MDRC277FZG43NGG"),
    name: "Congélateur coffre MIDEA MDRC277FZG43NGG - 198 Litres",
    brand: "MIDEA",
    category: "CONGELATEUR",
    reference: "MDRC277FZG43NGG",
    code: "MID007",
    price: 155000,
    description: "Economique - Gris - Garantie 6 mois",
    features: ["198 Litres", "Économique", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_-_midea_198_litres_-_a.jpg",
    inStock: true
  },
  {
    id: generateId("MIDEA", "MDRC207FZG43NGG"),
    name: "Congélateur coffre MIDEA MDRC207FZG43NGG - 142 Litres",
    brand: "MIDEA",
    category: "CONGELATEUR",
    reference: "MDRC207FZG43NGG",
    code: "MID008",
    price: 128900,
    description: "Economique - Gris - Garantie 6 mois",
    features: ["142 Litres", "Économique", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_-_midea_142_litres_-_b.jpg",
    inStock: true
  },
  {
    id: generateId("MIDEA", "D30-15F"),
    name: "midea water heater D30-15F - 30 litres",
    brand: "MIDEA",
    category: "CHAUFFE-EAU",
    reference: "D30-15F",
    code: "MID009",
    price: 80000,
    description: "White - 6 months warranty",
    features: ["30 Litres", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/h/chauffe_eau_midea.jpg",
    inStock: true
  },

  // SIGNATURE Extended Products
  {
    id: generateId("SIGNATURE", "SJ-24KT1-AC"),
    name: "Split Air Conditioner SIGNATURE SJ-24KT1-AC - 3 HP - 24000 BTU",
    brand: "SIGNATURE",
    category: "CLIMATISEUR",
    reference: "SJ-24KT1-AC",
    code: "SIG009",
    price: 429400,
    description: "R410 - With Wifi - 12-month warranty",
    features: ["24 000 BTU", "3 CV", "R410", "Wi-Fi", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_-_signature_-_3_cv_-_24000_btu.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SJ-18KT1-AC"),
    name: "Split Air Conditioner SIGNATURE SJ-18KT1-AC - 2.5HP - 18000 BTU",
    brand: "SIGNATURE",
    category: "CLIMATISEUR",
    reference: "SJ-18KT1-AC",
    code: "SIG010",
    price: 322000,
    description: "R410 - With Wifi - White - 12 months Warranty",
    features: ["18 000 BTU", "2,5 CV", "R410", "Wi-Fi", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_-_signature_-_2.5cv_-_18000_btu_.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SJ-09KT1-AC"),
    name: "SIGNATURE split air conditioner SJ-09KT1-AC - 1.25 HP - 9000 BTU",
    brand: "SIGNATURE",
    category: "CLIMATISEUR",
    reference: "SJ-09KT1-AC",
    code: "SIG011",
    price: 175000,
    description: "R410 - WIFI - White - 12 month warranty",
    features: ["9 000 BTU", "1,25 CV", "R410", "Wi-Fi", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_slipt_signature_-_1_25_cv_-_9000_btu_.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SVAC12KAC-WH"),
    name: "SIGNATURE Slip-on Air Conditioner SVAC12KAC-WH - 1.5 HP - 12000 BTU",
    brand: "SIGNATURE",
    category: "CLIMATISEUR",
    reference: "SVAC12KAC-WH",
    code: "SIG012",
    price: 207500,
    description: "R410 - With Integrated WIFI Option - White - 12 month warranty",
    features: ["12 000 BTU", "1,5 CV", "R410", "Wi-Fi", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-slipt_signature_-_1.5_cv_-_12000_btu.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "DSZF15-LJ-100Y6A2"),
    name: "Chauffe eau électrique SIGNATURE DSZF15-LJ/100Y6A2 - 100 Litres",
    brand: "SIGNATURE",
    category: "CHAUFFE-EAU",
    reference: "DSZF15-LJ-100Y6A2",
    code: "SIG013",
    price: 137796,
    description: "Blanc - 6 mois Garantie",
    features: ["100 Litres", "Électrique", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/h/chauffe-eau-_lectrique---signature---100-litres---dszf15-lj100y6a2---blanc---6-mois-garantie.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "DSZF12-LJ-80Y6A2"),
    name: "Chauffe Eau électrique SIGNATURE DSZF12-LJ/80Y6A2 - 80 Litres",
    brand: "SIGNATURE",
    category: "CHAUFFE-EAU",
    reference: "DSZF12-LJ-80Y6A2",
    code: "SIG014",
    price: 105316,
    description: "Blanc - 6 mois Garantie",
    features: ["80 Litres", "Électrique", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/h/chauffe-eau-_lectrique---signature---80-litres---dszf12-lj80y6a2--blanc---6-mois-garantie.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SGVR353DIX"),
    name: "Combined refrigerator Signature SGVR353DIX - 313 Litres",
    brand: "SIGNATURE",
    category: "FRIGO",
    reference: "SGVR353DIX",
    code: "SIG015",
    price: 412450,
    description: "NO FROST - With water dispenser - Energy class A++ - Dark stainless steel - 12 month warranty",
    features: ["313 Litres", "No Frost", "Distributeur d'eau", "A++", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_combine_-_signature_-_313_litres_.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SVWM1-2-T3-WHT"),
    name: "Automatic washing machine SIGNATURE SVWM1.2-T3.WHT - 7 Kg",
    brand: "SIGNATURE",
    category: "MACHINE A LAVER",
    reference: "SVWM1-2-T3-WHT",
    code: "SIG016",
    price: 241500,
    description: "Energy class A+++ - White - 6 Months Warranty",
    features: ["7 Kg", "A+++", "Automatique", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_blanc_signature_-_7_kg.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SGV-WDT3-1400-10KG-6KG"),
    name: "Automatic Machine Washing and Drying SIGNATURE - 10Kg/6Kg",
    brand: "SIGNATURE",
    category: "MACHINE A LAVER",
    reference: "SGV-WDT3-1400-10KG-6KG",
    code: "SIG017",
    price: 485000,
    description: "energy class A+++ - Gray - 6 Month Warranty",
    features: ["10/6 Kg", "Lavage+Séchage", "A+++", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_automatique_signature_avec_une_capacit_de_lavage_10kg_et_s_chage_6kg.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SGV-WMt3-1400-9kg"),
    name: "Automatic washing machine SIGNATURE SGV-WMt3-1400-9kg - 9Kg",
    brand: "SIGNATURE",
    category: "MACHINE A LAVER",
    reference: "SGV-WMt3-1400-9kg",
    code: "SIG018",
    price: 380000,
    description: "Energy class A+++ - Gray - 6 Months Warranty",
    features: ["9 Kg", "A+++", "Automatique", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//l/a/lave-linge_automatique_signature_-_9kg.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SGV-WMT3-1400-8KG"),
    name: "Automatic washing machine SIGNATURE SGV-WMT3-1400-8KG - 8Kg",
    brand: "SIGNATURE",
    category: "MACHINE A LAVER",
    reference: "SGV-WMT3-1400-8KG",
    code: "SIG019",
    price: 320000,
    description: "Energy class A+++ - Gray - 6 Months Warranty",
    features: ["8 Kg", "A+++", "Automatique", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//l/a/lave-linge_automatique_signature_-_8_kg.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SVWM1-2-T3SLV-7Kg"),
    name: "Automatic washing machine SIGNATURE SVWM1.2-T3SLV-7Kg - 7Kg",
    brand: "SIGNATURE",
    category: "MACHINE A LAVER",
    reference: "SVWM1-2-T3SLV-7Kg",
    code: "SIG020",
    price: 275000,
    description: "Energy class A+++ - GRAY - 6 Months Warranty",
    features: ["7 Kg", "A+++", "Automatique", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_signature_-_7kg.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SGV-WMT3-1400-12KG"),
    name: "Automatic washing machine SIGNATURE SGV-WMT3-1400-12KG - 12Kg",
    brand: "SIGNATURE",
    category: "MACHINE A LAVER",
    reference: "SGV-WMT3-1400-12KG",
    code: "SIG021",
    price: 402500,
    description: "A+++ - Dark Gray - 6 Months Warranty",
    features: ["12 Kg", "A+++", "Automatique", "Dark Gray", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_signature_-_12kg.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SIG-DRYER-10KG"),
    name: "Heat pump tumble dryer SIGNATURE - 10 kg",
    brand: "SIGNATURE",
    category: "SECHE-LINGE",
    reference: "SIG-DRYER-10KG",
    code: "SIG022",
    price: 420000,
    description: "A++ - Dark silver - 6 month warranty",
    features: ["10 Kg", "Pompe à chaleur", "A++", "Dark silver", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/_/s_che-linge_pompe_chaleur_-_signature_-_10_kg.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SIG-DRYER-7KG"),
    name: "Heat pump tumble dryer SIGNATURE - 7 kg",
    brand: "SIGNATURE",
    category: "SECHE-LINGE",
    reference: "SIG-DRYER-7KG",
    code: "SIG023",
    price: 310000,
    description: "A++ - Dark silver - 6 month warranty",
    features: ["7 Kg", "Pompe à chaleur", "A++", "Dark silver", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/_/s_che-linge_pompe_chaleur_signature_7_kg.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SOGO6090-IX-AVG"),
    name: "SIGNATURE Range SOGO6090-IX-AVG - 5 Burners 60 * 90",
    brand: "SIGNATURE",
    category: "CUISINIERE",
    reference: "SOGO6090-IX-AVG",
    code: "SIG024",
    price: 483000,
    description: "Large Oven - STAINLESS STEEL - 6 Months Warranty",
    features: ["5 Feux", "60x90 cm", "Grand four", "Inox", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_signature_-_5_feux.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SIG-RANGE-GAS-5F"),
    name: "SIGNATURE Range Cooker - 5 Burners 60*90 - With Gas Port",
    brand: "SIGNATURE",
    category: "CUISINIERE",
    reference: "SIG-RANGE-GAS-5F",
    code: "SIG025",
    price: 495000,
    description: "STAINLESS STEEL - 6 Months Warranty",
    features: ["5 Feux", "60x90 cm", "Porte gaz", "Inox", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re-signature_-5-foyers-60-60.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SIG-SEMIPRO-LED"),
    name: "SIGNATURE Semi Professional Range Cooker - LED - 5 Burners 60*90",
    brand: "SIGNATURE",
    category: "CUISINIERE",
    reference: "SIG-SEMIPRO-LED",
    code: "SIG026",
    price: 600920,
    description: "Large Oven - STAINLESS STEEL - 6 Months Warranty",
    features: ["5 Feux", "60x90 cm", "LED", "Semi-pro", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re-signature-semi-professionnel.jpg",
    inStock: true
  },
  {
    id: generateId("SIGNATURE", "SIG-SEMIPRO-RED"),
    name: "SIGNATURE Semi-Professional Range Cooker - 5 Burners 60*90 - Red",
    brand: "SIGNATURE",
    category: "CUISINIERE",
    reference: "SIG-SEMIPRO-RED",
    code: "SIG027",
    price: 600000,
    description: "Large Oven - STAINLESS STEEL - Red - 6 Months Warranty",
    features: ["5 Feux", "60x90 cm", "Rouge", "Semi-pro", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re-signature-semi_.jpg",
    inStock: true
  },

  // SOLSTAR Products
  {
    id: generateId("SOLSTAR", "WM1014K-FLSLV"),
    name: "Automatic washing machine SOLSTAR WM1014K-FLSLV SS - 10kg",
    brand: "SOLSTAR",
    category: "MACHINE A LAVER",
    reference: "WM1014K-FLSLV",
    code: "SOL001",
    price: 310545,
    description: "Gray - 6 month warranty",
    features: ["10 Kg", "Automatique", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//l/a/lave-linge_automatique_10_kg_prix_cameroun.jpg",
    inStock: true
  },
  {
    id: generateId("SOLSTAR", "FA2603USK"),
    name: "Ventilateur industrial solstar FA2603USK",
    brand: "SOLSTAR",
    category: "VENTILATEUR",
    reference: "FA2603USK",
    code: "SOL002",
    price: 45000,
    description: "Noir - Garantie 6 mois",
    features: ["Industriel", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_industrial_solstar_-_noir.jpg",
    inStock: true
  },

  // DAIKIN Extended Products
  {
    id: generateId("DAIKIN", "DAIKIN-1.25CV"),
    name: "DAIKIN 1.25 HP wall-mounted air conditioner – 9000 BTU",
    brand: "DAIKIN",
    category: "CLIMATISEUR",
    reference: "DAIKIN-1.25CV",
    code: "DAI004",
    price: 302044,
    description: "Cooling only inverter – Ultra-quiet 19 dB – Class A++ – 12-month warranty",
    features: ["9 000 BTU", "1,25 CV", "Inverter", "Ultra-silencieux", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_mural_daikin_1.25_cv_.jpg",
    inStock: true
  },

  // SPJ Extended Products
  {
    id: generateId("SPJ", "RF-270C"),
    name: "SPJ Combined Refrigerator RF-270C - 211 Litres",
    brand: "SPJ",
    category: "FRIGO",
    reference: "RF-270C",
    code: "SPJ003",
    price: 194000,
    description: "With Water Dispenser - Grey - 6 Month Warranty",
    features: ["211 Litres", "Distributeur d'eau", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_spj_211_litres_avec_distributeur_d_eau_2_.jpg",
    inStock: true
  },
  {
    id: generateId("SPJ", "RF-BINU399C"),
    name: "Combined refrigerator SPJ RF-BINU399C - 260L",
    brand: "SPJ",
    category: "FRIGO",
    reference: "RF-BINU399C",
    code: "SPJ004",
    price: 247500,
    description: "Consumption A+ - Grey - Warranty: 6 months",
    features: ["260 Litres", "Classe A+", "Combiné", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur-combin_-spj.jpg",
    inStock: true
  },
  {
    id: generateId("SPJ", "CN0003"),
    name: "Hot and Cold Water Dispenser SPJ CN0003 - 520 Watts",
    brand: "SPJ",
    category: "DISPENSEUR EAU",
    reference: "CN0003",
    code: "SPJ005",
    price: 95825,
    description: "Black - 3 months",
    features: ["520W", "Chaud/Froid", "Noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//d/i/distributeur-d_eau.jpg",
    inStock: true
  },
  {
    id: generateId("SPJ", "SPJ-WD-FRIDGE"),
    name: "Hot and Cold Water Dispenser SPJ with Integrated Mini Fridge",
    brand: "SPJ",
    category: "DISPENSEUR EAU",
    reference: "SPJ-WD-FRIDGE",
    code: "SPJ006",
    price: 106325,
    description: "520 Watts - Black and Grey - 3 Months",
    features: ["520W", "Mini frigo", "Chaud/Froid", "Noir/Gris", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//d/i/distributeur-d_eau-chaude.jpg",
    inStock: true
  },
  {
    id: generateId("SPJ", "SPJ-WD-WHITE"),
    name: "Hot and Cold Water Dispenser SPJ with Mini Fridge - White",
    brand: "SPJ",
    category: "DISPENSEUR EAU",
    reference: "SPJ-WD-WHITE",
    code: "SPJ007",
    price: 100075,
    description: "520 Watts - White - 6 Months",
    features: ["520W", "Mini frigo", "Chaud/Froid", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//d/i/distributeu-_d_eau_-chaude-et-froide.jpg",
    inStock: true
  },

  // MILLENIUM Extended Products
  {
    id: generateId("MILLENIUM", "ACS09K-ML"),
    name: "Split air conditioner Millennium ACS09K-ML - 1.25 HP - 9000BTU",
    brand: "MILLENIUM",
    category: "CLIMATISEUR",
    reference: "ACS09K-ML",
    code: "MIL002",
    price: 151200,
    description: "R410A - White - 6 months warranty",
    features: ["9 000 BTU", "1,25 CV", "R410A", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_millennium_-_9000btu.jpg",
    inStock: true
  },
  {
    id: generateId("MILLENIUM", "ACS12K-ML"),
    name: "Split Air Conditioner Millennium ACS12K-ML - 1.5 HP - 12000BTU",
    brand: "MILLENIUM",
    category: "CLIMATISEUR",
    reference: "ACS12K-ML",
    code: "MIL003",
    price: 168000,
    description: "R410A - White - 6 month warranty",
    features: ["12 000 BTU", "1,5 CV", "R410A", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_-_millennium_c.jpg",
    inStock: true
  },
  {
    id: generateId("MILLENIUM", "RF-5D366IN"),
    name: "MILLENNIUM combined refrigerator RF-5D366IN - 251Litres",
    brand: "MILLENIUM",
    category: "FRIGO",
    reference: "RF-5D366IN",
    code: "MIL004",
    price: 264000,
    description: "Stainless steel - 12 month warranty",
    features: ["251 Litres", "Inox", "Combiné", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_combine_-_251_litres_.jpg",
    inStock: true
  },
  {
    id: generateId("MILLENIUM", "RF-4D360IN"),
    name: "MILLENNIUM Combined Refrigerator RF-4D360IN - 258 Liters",
    brand: "MILLENIUM",
    category: "FRIGO",
    reference: "RF-4D360IN",
    code: "MIL005",
    price: 255000,
    description: "Stainless Steel - 12 Month Warranty",
    features: ["258 Litres", "Inox", "Combiné", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_combine_millennium_-_258_litres.jpg",
    inStock: true
  },

  // MEWE Extended Products
  {
    id: generateId("MEWE", "MWFAN-ACF1608-B"),
    name: "MEWE 16 inch fan MWFAN-ACF1608-B - 40W",
    brand: "MEWE",
    category: "VENTILATEUR",
    reference: "MWFAN-ACF1608-B",
    code: "MEW005",
    price: 11200,
    description: "Black/Yellow - 6 month warranty",
    features: ["16 pouces", "40W", "Noir/Jaune", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_mewe_16_pouces_40w_noir_jaune_1_.jpg",
    inStock: true
  },
  {
    id: generateId("MEWE", "MW-FAN-ACF1607-A"),
    name: "MEWE 16 inch fan MW FAN-ACF1607-A - 40W",
    brand: "MEWE",
    category: "VENTILATEUR",
    reference: "MW-FAN-ACF1607-A",
    code: "MEW006",
    price: 11880,
    description: "Black - 6 month warranty",
    features: ["16 pouces", "40W", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_mewe_16_pouces_2_.jpg",
    inStock: true
  },
  {
    id: generateId("MEWE", "MWACM-SAC1201"),
    name: "MEWE 1.5CV split air conditioner MWACM-SAC1201 - 12000 BTU",
    brand: "MEWE",
    category: "CLIMATISEUR",
    reference: "MWACM-SAC1201",
    code: "MEW007",
    price: 183600,
    description: "12 month warranty",
    features: ["12 000 BTU", "1,5 CV", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_mewe_1_3_.jpg",
    inStock: true
  },
  {
    id: generateId("MEWE", "MWACM-SAC-0901"),
    name: "MEWE 1.25 HP Split Air Conditioner MWACM-SAC 0901 - 9000 BTU",
    brand: "MEWE",
    category: "CLIMATISEUR",
    reference: "MWACM-SAC-0901",
    code: "MEW008",
    price: 162000,
    description: "12 month warranty",
    features: ["9 000 BTU", "1,25 CV", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_mewe_1_25_cv_8_.jpg",
    inStock: true
  },
  {
    id: generateId("MEWE", "MEWE-HOB-4F"),
    name: "Plaque de Cuisson Encastrable MeWe – 4 Foyers (3 Gaz + 1 Électrique)",
    brand: "MEWE",
    category: "CUISINIERE",
    reference: "MEWE-HOB-4F",
    code: "MEW009",
    price: 56000,
    description: "Verre Trempé Noir – Allumage Automatique – Garantie 6 Mois",
    features: ["4 Foyers", "3 Gaz + 1 Électrique", "Verre trempé", "Automatique", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/l/plaque_de_cuisson_encastrable_mewe_5_foyers_4_gaz_1_lectrique_1_.jpg",
    inStock: true
  },

  // SUPER FLAME Extended Products
  {
    id: generateId("SUPER FLAME", "SF-755GT"),
    name: "Plaque de cuisson encastrable SUPER FLAME SF-755GT - 5 feux",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SF-755GT",
    code: "SF007",
    price: 112745,
    description: "52x75Cm - Allumage automatique - Noir - Garantie 6 mois",
    features: ["5 Feux", "52x75 cm", "Automatique", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/l/plaque_de_cuisson_encastrable_super_flame_5_feux_-_b.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SF-604GT"),
    name: "Plaque de cuisson encastrable SUPERFLAME SF-604GT - 4 feux",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SF-604GT",
    code: "SF008",
    price: 90895,
    description: "50x60Cm - Allumage automatique - Noir - Garantie 6 mois",
    features: ["4 Feux", "50x60 cm", "Automatique", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/l/plaque_de_cuisson_encastrable_-_superflame_-_4_feux_-_a.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SF-DIONE6L4G"),
    name: "Built-in Hob SUPERFLAME SF-DIONE6L4G - 4 Burners",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SF-DIONE6L4G",
    code: "SF009",
    price: 86295,
    description: "Automatic Ignition - INOX - 6 month warranty",
    features: ["4 Feux", "Automatique", "Inox", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/l/plaque_de_cuisson_encastrable_4_feux_-_b.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SF-DIONE74GT"),
    name: "Built-in Hob SUPERFLAME SF-DIONE74GT - 5 Burners",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SF-DIONE74GT",
    code: "SF010",
    price: 113895,
    description: "Automatic Ignition - INOX - 6 month warranty",
    features: ["5 Feux", "Automatique", "Inox", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//t/a/table_de_cuisson_encastrable_-_c.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SFKI-B902MVS"),
    name: "Plaque de cuisson Encastrable SUPERFLAME SFKI-B902MVS – 5 Feux Inox",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SFKI-B902MVS",
    code: "SF011",
    price: 113895,
    description: "Allumage automatique – Brûleur droit - Garantie 6 mois",
    features: ["5 Feux", "Inox", "Automatique", "Brûleur droit", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/l/plaque_de_cuisson_encastrable_superflame_5_feux_inox_1_.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SF-FG9502GBZX"),
    name: "Gas cooker SUPER FLAME SF-FG9502GBZX - Full option - 5 Burners - 60 x 90 cm",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SF-FG9502GBZX",
    code: "SF012",
    price: 330000,
    description: "Large oven - With digital control panel - Red - 12 months warranty",
    features: ["5 Feux", "60x90 cm", "Full option", "Digital", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re-_-gaz---super-flame---full-option---5-feux---60-x-90-cm---sf-fg9502gbzx---grand-four---avec-panneau-de-commande-num_rique---rouge---garantie-12-mois.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SF-FF6402GBZG"),
    name: "Gas Cooker SUPER FLAME SF-FF6402GBZG - 4 Burners - 60 x 60 cm",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SF-FF6402GBZG",
    code: "SF013",
    price: 199999,
    description: "With digital control panel - Stainless steel - 12-months Warranty",
    features: ["4 Feux", "60x60 cm", "Digital", "Inox", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re-_-gaz---super-flame---toutes-options---4-feux---60-x-60-cm---sf-ff6402gbzg---avec-panneau-de-commande-num_rique---inox---garantie-12-mois.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SF-FF6402GBZX"),
    name: "Gas Cooker SUPER FLAME SF-FF6402GBZX - Full option - 4 Burners - 60 x 60 cm",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SF-FF6402GBZX",
    code: "SF014",
    price: 199999,
    description: "With digital control panel - Red - 12-months Warranty",
    features: ["4 Feux", "60x60 cm", "Full option", "Rouge", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re-_-gaz---super-flame---full-option---4-feux---60-x-60-cm---sf-ff6402gbzx---avec-panneau-de-contr_le-digital---rouge---12-mois-de-garantie.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SF-FF6402GBZA"),
    name: "Gas Cooker SUPER FLAME SF-FF6402GBZA - 4 Burners - 60 x 60 cm",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SF-FF6402GBZA",
    code: "SF015",
    price: 199999,
    description: "With Digital Control Panel - DARK GREY - 12 months Warranty",
    features: ["4 Feux", "60x60 cm", "Digital", "Gris foncé", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re-_-gaz---super-flame---toutes-options---4-feux---60-x-60-cm---sf-ff6402gbza---avec-panneau-de-commande-num_rique---gris-fonc_---garantie-12-mois.jpg",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SF-5F-60X90-DOOR"),
    name: "Cuisinière à Gaz 5 Feux Super Flame 60x90 cm - Avec Porte Gaz",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SF-5F-60X90-DOOR",
    code: "SF016",
    price: 235000,
    description: "Modèle Professionnel - Gris - Garantie 12 Mois + Bon d'achat de 10000 FCFA Offert",
    features: ["5 Feux", "60x90 cm", "Porte gaz", "Professionnel", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/r/crazydeals05111.png",
    inStock: true
  },
  {
    id: generateId("SUPER FLAME", "SF-5F-60X90-BLACK"),
    name: "5-burner gas cooker Super Flame 60*90 - With gas door - BLACK",
    brand: "SUPER FLAME",
    category: "CUISINIERE",
    reference: "SF-5F-60X90-BLACK",
    code: "SF017",
    price: 237000,
    description: "06 months + Voucher of 10000 FCFA Offered",
    features: ["5 Feux", "60x90 cm", "Porte gaz", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/r/crazydeals05112.png",
    inStock: true
  },

  // EUROLUX Extended Products
  {
    id: generateId("EUROLUX", "EUR-SIMPLE-60X60"),
    name: "Cuisinière à Gaz Eurolux EUR.Simple - 4 Feux – 60x60 cm",
    brand: "EUROLUX",
    category: "CUISINIERE",
    reference: "EUR-SIMPLE-60X60",
    code: "EUR003",
    price: 143795,
    description: "Four avec Grill & Tournebroche – Inox – Allumage Électrique – Crème – Garantie 6 Mois",
    features: ["4 Feux", "60x60 cm", "Four avec Grill", "Crème", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_gaz_eurolux_eur.simple_4_feux_60x60_cm_1_.jpg",
    inStock: true
  },
  {
    id: generateId("EUROLUX", "EUR-CLASSIC-INOX"),
    name: "EUROLUX Gas Cooker CLASSIC - 4 Burners - 50 x 55 cm - INOX",
    brand: "EUROLUX",
    category: "CUISINIERE",
    reference: "EUR-CLASSIC-INOX",
    code: "EUR004",
    price: 98000,
    description: "6 month warranty",
    features: ["4 Feux", "50x55 cm", "Inox", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7/no_selection",
    inStock: true
  },
  {
    id: generateId("EUROLUX", "EUR-CLASSIC-CREAM"),
    name: "EUROLUX Gas Cooker CLASSIC - 4 Burners - 50 x 55 cm - CREAM WHITE",
    brand: "EUROLUX",
    category: "CUISINIERE",
    reference: "EUR-CLASSIC-CREAM",
    code: "EUR005",
    price: 98000,
    description: "Automatic ignition - Top and bottom oven - 6 months warranty",
    features: ["4 Feux", "50x55 cm", "Blanc crème", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_gaz_eurolux_4_feux_-_blanc_cream_-_a.jpg",
    inStock: true
  },
  {
    id: generateId("EUROLUX", "EUR-CLASSIC-RED"),
    name: "EUROLUX Gas Cooker Classic - 4 Burners - 50 x 55 cm - Red",
    brand: "EUROLUX",
    category: "CUISINIERE",
    reference: "EUR-CLASSIC-RED",
    code: "EUR006",
    price: 98000,
    description: "Automatic ignition - 6 months warranty",
    features: ["4 Feux", "50x55 cm", "Rouge", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_gaz_eurolux_4_feux_-_rouge_-_b.jpg",
    inStock: true
  },
  {
    id: generateId("EUROLUX", "EUR-CLASSIC-BLUE"),
    name: "EUROLUX Gas Cooker CLASSIC - 4 Burners - 50 x 55 cm - BLUE",
    brand: "EUROLUX",
    category: "CUISINIERE",
    reference: "EUR-CLASSIC-BLUE",
    code: "EUR007",
    price: 98000,
    description: "Automatic ignition - Top and bottom oven - 6 months warranty",
    features: ["4 Feux", "50x55 cm", "Bleu", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_gaz_eurolux_4_feux_-_bleu.jpg",
    inStock: true
  },
  {
    id: generateId("EUROLUX", "EUR-SIMPLE-BORDEAUX"),
    name: "Cuisinière EUROLUX EUR.Simple - 4 Feux - 60 * 60 cm - Rouge Bordeaux",
    brand: "EUROLUX",
    category: "CUISINIERE",
    reference: "EUR-SIMPLE-BORDEAUX",
    code: "EUR008",
    price: 145000,
    description: "Garantie 6 Mois",
    features: ["4 Feux", "60x60 cm", "Rouge Bordeaux", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/r/prieroroucm.jpg",
    inStock: true
  },
  {
    id: generateId("EUROLUX", "EUR-SIMPLE-GREY"),
    name: "EUROLUX Cooker EUR.simple - 4 Burners 60 * 60 - Gray",
    brand: "EUROLUX",
    category: "CUISINIERE",
    reference: "EUR-SIMPLE-GREY",
    code: "EUR009",
    price: 159500,
    description: "6 Month Warranty",
    features: ["4 Feux", "60x60 cm", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//p/r/prierogricm_1_.jpg",
    inStock: true
  },

  // AUX Products
  {
    id: generateId("AUX", "AUX-48000BTU"),
    name: "Cabinet air conditioner AUX - 6 HP - 48000BTU",
    brand: "AUX",
    category: "CLIMATISEUR",
    reference: "AUX-48000BTU",
    code: "AUX001",
    price: 1118000,
    description: "R410 - 6 months warranty",
    features: ["48 000 BTU", "6 CV", "Armoire", "R410", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/o/sonar48glocm.jpg",
    inStock: true
  },
  {
    id: generateId("AUX", "AUX-36000BTU"),
    name: "Cabinet air conditioner AUX - 4.5 HP - 36000BTU",
    brand: "AUX",
    category: "CLIMATISEUR",
    reference: "AUX-36000BTU",
    code: "AUX002",
    price: 937500,
    description: "R410 - 6 months warranty",
    features: ["36 000 BTU", "4,5 CV", "Armoire", "R410", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_armoire_-_aux_-_4.5_cv.jpg",
    inStock: true
  },
  {
    id: generateId("AUX", "AUX-24000BTU"),
    name: "AUX Air Conditioner - 3 HP - 24000BTU - Wall mounted",
    brand: "AUX",
    category: "CLIMATISEUR",
    reference: "AUX-24000BTU",
    code: "AUX003",
    price: 385295,
    description: "6 months warranty",
    features: ["24 000 BTU", "3 CV", "Mural", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_aux_-_3_cv_-_24000btu.jpg",
    inStock: true
  },
  {
    id: generateId("AUX", "AUX-18000BTU"),
    name: "Wall mounted AUX air conditioner - 2.5 HP - 18000BTU",
    brand: "AUX",
    category: "CLIMATISEUR",
    reference: "AUX-18000BTU",
    code: "AUX004",
    price: 295000,
    description: "6 months warranty",
    features: ["18 000 BTU", "2,5 CV", "Mural", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_aux_mural_-_2.5_cv_-_18000btu.jpg",
    inStock: true
  },

  // Additional Products - VESTEL
  {
    id: generateId("VESTEL", "W6108T1DS"),
    name: "Machine à laver automatique VESTEL W6108T1DS - 6KG",
    brand: "VESTEL",
    category: "MACHINE A LAVER",
    reference: "W6108T1DS",
    code: "VEST001",
    price: 186000,
    description: "A+++ - Garantie 6 mois",
    features: ["6 Kg", "Automatique", "A+++", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_automatique_vestel_-_6kg_.jpg",
    inStock: true
  },
  {
    id: generateId("VESTEL", "WB8B14T3DS"),
    name: "Automatic Washing Machine VESTEL WB8B14T3DS - 8Kg",
    brand: "VESTEL",
    category: "MACHINE A LAVER",
    reference: "WB8B14T3DS",
    code: "VEST002",
    price: 235795,
    description: "Grey - Economy A+++ - 12 Months Warranty",
    features: ["8 Kg", "Automatique", "A+++", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_automatique_vestel_-_8kg.jpg",
    inStock: true
  },
  {
    id: generateId("VESTEL", "WB812T2T"),
    name: "Automatic washing machine VESTEL WB812T2T - 8Kg - White",
    brand: "VESTEL",
    category: "MACHINE A LAVER",
    reference: "WB812T2T",
    code: "VEST003",
    price: 229765,
    description: "Economy A++ - 12 months guarantee",
    features: ["8 Kg", "Automatique", "A++", "Blanc", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_automatique_vestel_-_8kg_-_blanc.jpg",
    inStock: true
  },
  {
    id: generateId("VESTEL", "WB9B14T3DS"),
    name: "Automatic Washing Machine VESTEL WB9B14T3DS - 9 Kg INVERTER",
    brand: "VESTEL",
    category: "MACHINE A LAVER",
    reference: "WB9B14T3DS",
    code: "VEST004",
    price: 315000,
    description: "A+++ - DARK SILVER - 12 Month Warranty",
    features: ["9 Kg", "Inverter", "A+++", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_automatique_vestel_-_9_kg.jpg",
    inStock: true
  },
  {
    id: generateId("VESTEL", "W810T2DSS"),
    name: "Automatic Washing Machine Vestel W810T2DSS - 8KG - 2100W",
    brand: "VESTEL",
    category: "MACHINE A LAVER",
    reference: "W810T2DSS",
    code: "VEST005",
    price: 247412,
    description: "Grey - 6 months warranty",
    features: ["8 Kg", "2100W", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_-_vestel_-_w810t2dss_neuf.jpg",
    inStock: true
  },
  {
    id: generateId("VESTEL", "WB712T2TDS"),
    name: "Machine à laver automatique VESTEL WB712T2TDS - 7KG",
    brand: "VESTEL",
    category: "MACHINE A LAVER",
    reference: "WB712T2TDS",
    code: "VEST006",
    price: 253000,
    description: "A+++ - Avec technologie inverter - Gris-Noir - Garantie 12 mois",
    features: ["7 Kg", "Inverter", "A+++", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_-_vestel_-_wb712t2tds_-_7kg_-_a.jpg",
    inStock: true
  },
  {
    id: generateId("VESTEL", "RM480BF"),
    name: "NoFrost Refrigerator Vestel RM480BF - 324L - Grey",
    brand: "VESTEL",
    category: "FRIGO",
    reference: "RM480BF",
    code: "VEST007",
    price: 343000,
    description: "6 months warranty",
    features: ["324 Litres", "No Frost", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_nofrost_-_vestel_-_rm480bf.jpg",
    inStock: true
  },
  {
    id: generateId("VESTEL", "RM680BF"),
    name: "NoFrost Refrigerator Vestel RM680BF - 453L - Grey",
    brand: "VESTEL",
    category: "FRIGO",
    reference: "RM680BF",
    code: "VEST008",
    price: 641529,
    description: "6 months warranty",
    features: ["453 Litres", "No Frost", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_nofrost_-_vestel_-_rm680bf.jpg",
    inStock: true
  },
  {
    id: generateId("VESTEL", "RM850BF"),
    name: "NoFrost Refrigerator Vestel RM850BF - Grey",
    brand: "VESTEL",
    category: "FRIGO",
    reference: "RM850BF",
    code: "VEST009",
    price: 735647,
    description: "6 months warranty",
    features: ["No Frost", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_nofrost-_vestel_-_rm850bf.jpg",
    inStock: true
  },
  {
    id: generateId("VESTEL", "W1012T2T"),
    name: "Automatic Washing Machine Vestel W1012T2T - 10Kg - White",
    brand: "VESTEL",
    category: "MACHINE A LAVER",
    reference: "W1012T2T",
    code: "VEST010",
    price: 388311,
    description: "6 months warranty",
    features: ["10 Kg", "Automatique", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_vestel_10_kg_a.jpg",
    inStock: true
  },
  {
    id: generateId("VESTEL", "W1012T2TDSS"),
    name: "Automatic Washing Machine Vestel W1012T2TDSS - 10Kg - Silver",
    brand: "VESTEL",
    category: "MACHINE A LAVER",
    reference: "W1012T2TDSS",
    code: "VEST011",
    price: 395232,
    description: "6 months warranty",
    features: ["10 Kg", "Automatique", "Argent", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_c.jpg",
    inStock: true
  },

  // Additional Products - SKYWORTH
  {
    id: generateId("SKYWORTH", "7KG-AUTO"),
    name: "Automatic Washing Machine SKYWORTH - 7 Kg",
    brand: "SKYWORTH",
    category: "MACHINE A LAVER",
    reference: "SKYWORTH-7KG",
    code: "SKY001",
    price: 235647,
    description: "6 Months warranty",
    features: ["7 Kg", "Automatique", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_1.jpg",
    inStock: true
  },

  // Additional Products - SKYWORLD
  {
    id: generateId("SKYWORLD", "SKW-285BMF"),
    name: "Réfrigérateur combiné SKYWORLD SKW-285BMF - 205 Litres",
    brand: "SKYWORLD",
    category: "FRIGO",
    reference: "SKW-285BMF",
    code: "SKYW001",
    price: 230045,
    description: "Classe énergétique A++ – Tropical – Éclairage LED – Garantie 12 mois",
    features: ["205 Litres", "Classe A++", "Tropical", "LED", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_skyworld_7_.jpg",
    inStock: true
  },
  {
    id: generateId("SKYWORLD", "SKW-1201DR"),
    name: "Mini Refrigerator SKYWORLD 90 Litres - SKW-1201DR",
    brand: "SKYWORLD",
    category: "FRIGO",
    reference: "SKW-1201DR",
    code: "SKYW002",
    price: 92045,
    description: "Energy Class A++ - LED Lighting - 12-Month Warranty",
    features: ["90 Litres", "Classe A++", "LED", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/i/mini_r_frig_rateur_-_skyworld_-_90_litres_4_.jpg",
    inStock: true
  },
  {
    id: generateId("SKYWORLD", "SKW-165BMF"),
    name: "Combined Refrigerator SKYWORLD 139 Litres - SKW-165BMF",
    brand: "SKYWORLD",
    category: "FRIGO",
    reference: "SKW-165BMF",
    code: "SKYW003",
    price: 166795,
    description: "Energy Class A++ - 12-Month Warranty",
    features: ["139 Litres", "Classe A++", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_-_skyworld_-_139_litres_1_.jpg",
    inStock: true
  },
  {
    id: generateId("SKYWORLD", "SKW-360DT"),
    name: "Réfrigérateur combiné SKYWORLD SKW-360DT - 251 Litres",
    brand: "SKYWORLD",
    category: "FRIGO",
    reference: "SKW-360DT",
    code: "SKYW004",
    price: 241545,
    description: "Double battant – Classe énergétique A+ – Tropical – Garantie 12 mois",
    features: ["251 Litres", "Double battant", "Classe A+", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_skyworld_19_.jpg",
    inStock: true
  },
  {
    id: generateId("SKYWORLD", "SKW-185REF"),
    name: "Double Door Refrigerator SKYWORLD 150 Litres - SKW-185REF",
    brand: "SKYWORLD",
    category: "FRIGO",
    reference: "SKW-185REF",
    code: "SKYW005",
    price: 172545,
    description: "Energy Rating A++ – 12-Month Warranty",
    features: ["150 Litres", "Double porte", "Classe A++", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_double_battant_skyworld_150_litres_6_.jpg",
    inStock: true
  },
  {
    id: generateId("SKYWORLD", "SKW-450DBD"),
    name: "Réfrigérateur combiné SKYWORLD SKW-450DBD - 283 Litres",
    brand: "SKYWORLD",
    category: "FRIGO",
    reference: "SKW-450DBD",
    code: "SKYW006",
    price: 316295,
    description: "Distributeur d'eau – Classe énergétique A+ – Tropical – Garantie 12 mois",
    features: ["283 Litres", "Distributeur d'eau", "Classe A+", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_skyworld_2_.jpg",
    inStock: true
  },
  {
    id: generateId("SKYWORLD", "SKW-460VC"),
    name: "Réfrigérateur vitré d'exposition SKYWORLD SKW-460VC - 460 Litres",
    brand: "SKYWORLD",
    category: "FRIGO",
    reference: "SKW-460VC",
    code: "SKYW007",
    price: 333545,
    description: "Refroidissement statique ventilé – Porte vitrée – Éclairage LED – Garantie 12 mois",
    features: ["460 Litres", "Vitrine", "LED", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_vitr_d_exposition_skyworld_14_.jpg",
    inStock: true
  },
  {
    id: generateId("SKYWORLD", "BF460VC"),
    name: "Réfrigérateur vitré d'exposition SKYWORLD BF460VC - 380 Litres",
    brand: "SKYWORLD",
    category: "FRIGO",
    reference: "BF460VC",
    code: "SKYW008",
    price: 391045,
    description: "Tropical – Porte vitrée – Réfrigérant R290 – Garantie 12 mois",
    features: ["380 Litres", "Vitrine", "R290", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_vitr_d_exposition_skyworld_8_.jpg",
    inStock: true
  },
  {
    id: generateId("SKYWORLD", "BF328VC"),
    name: "Réfrigérateur vitré d'exposition SKYWORLD BF328VC - 283L",
    brand: "SKYWORLD",
    category: "FRIGO",
    reference: "BF328VC",
    code: "SKYW009",
    price: 345045,
    description: "Porte vitrée – Éclairage LED – Thermostat réglable – Garantie 12 mois",
    features: ["283 Litres", "Vitrine", "LED", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_vitr_d_exposition_skyworld_2_.jpg",
    inStock: true
  },

  // Additional Products - MITSUMI
  {
    id: generateId("MITSUMI", "MT-410CBM"),
    name: "Refrigerator with Water Dispenser MITSUMI 242 Litres - MT-410CBM",
    brand: "MITSUMI",
    category: "FRIGO",
    reference: "MT-410CBM",
    code: "MIT001",
    price: 264545,
    description: "Class A+ - 12-month warranty",
    features: ["242 Litres", "Distributeur d'eau", "Classe A+", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_avec_distributeur_d_eau_-_mitsumi_-_242_litres_6_.jpg",
    inStock: true
  },
  {
    id: generateId("MITSUMI", "MTSBS55N"),
    name: "Side-by-Side Refrigerator MITSUMI 436 Litres – MTSBS55N",
    brand: "MITSUMI",
    category: "FRIGO",
    reference: "MTSBS55N",
    code: "MIT002",
    price: 494545,
    description: "Class A+ – 12-month warranty",
    features: ["436 Litres", "Side-by-Side", "Classe A+", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_side-by-side_-_mitsumi_-_436_litres_1_.jpg",
    inStock: true
  },
  {
    id: generateId("MITSUMI", "SK12AS"),
    name: "Climatiseur Split Mitsumi SK12AS - 12000BTU - 1.5CV",
    brand: "MITSUMI",
    category: "CLIMATISEUR",
    reference: "SK12AS",
    code: "MIT003",
    price: 178250,
    description: "Blanc - 6 mois garantie",
    features: ["12 000 BTU", "1,5 CV", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-split-mitsumi---mtl-12prmm.jpg",
    inStock: true
  },
  {
    id: generateId("MITSUMI", "MTL-09PRMM"),
    name: "Mitsumi Split Air Conditioner MTL-09PRMM - 9000BTU - 1.25CV",
    brand: "MITSUMI",
    category: "CLIMATISEUR",
    reference: "MTL-09PRMM",
    code: "MIT004",
    price: 161000,
    description: "White - 6 months warranty",
    features: ["9 000 BTU", "1,25 CV", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-split-mitsumi---mtl-09prmm---9000btu---1.25cv.jpg",
    inStock: true
  },

  // Additional Products - BELLE FRANCE
  {
    id: generateId("BELLE FRANCE", "5FEU-TRENDY"),
    name: "5-Burner Cooker Belle France 60x90 cm - Trendy - With Gas Bottle Holder",
    brand: "BELLE FRANCE",
    category: "CUISINIERE",
    reference: "BF-5FEU-TRENDY",
    code: "BF001",
    price: 299045,
    description: "Automatic Ignition – 12-Month Warranty",
    features: ["5 Feux", "60x90 cm", "Porte-bouteille", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_5_feux_belle_france_60x90_cm_avec_porte-bouteille_gaz_5_.jpg",
    inStock: true
  },
  {
    id: generateId("BELLE FRANCE", "5FEU-LARGE"),
    name: "5-burner cooker Belle France 60x90 cm - Large gas oven",
    brand: "BELLE FRANCE",
    category: "CUISINIERE",
    reference: "BF-5FEU-LARGE",
    code: "BF002",
    price: 270295,
    description: "Automatic ignition - 12-month warranty",
    features: ["5 Feux", "60x90 cm", "Grand four", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_5_feux_-_belle_france_-_60x90_cm_-_grand_four_gaz_1_.jpg",
    inStock: true
  },
  {
    id: generateId("BELLE FRANCE", "4FEU-CLASSIC"),
    name: "4 Burner Cooker Belle France 60 X 60 cm - Classic - INOX",
    brand: "BELLE FRANCE",
    category: "CUISINIERE",
    reference: "BF-4FEU-CLASSIC",
    code: "BF003",
    price: 118650,
    description: "6 month warranty",
    features: ["4 Feux", "60x60 cm", "Classic", "Inox", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re-4-feux---belle-france---60-x-60-cm---classique---inox---garantie-6-mois_1.jpg",
    inStock: true
  },
  {
    id: generateId("BELLE FRANCE", "4FEU-TRENDY"),
    name: "4-burner cooker Belle France 60 x 60 cm - Trendy - Automatic ignition",
    brand: "BELLE FRANCE",
    category: "CUISINIERE",
    reference: "BF-4FEU-TRENDY",
    code: "BF004",
    price: 158200,
    description: "INOX - 6 months warranty",
    features: ["4 Feux", "60x60 cm", "Trendy", "Inox", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_4_feux_belle_france_au_meilleur_prix_-_o.jpg",
    inStock: true
  },
  {
    id: generateId("BELLE FRANCE", "4FEU-ELEC"),
    name: "BELLE FRANCE cooker 4 burners + 1 electric zone 60 x 90",
    brand: "BELLE FRANCE",
    category: "CUISINIERE",
    reference: "BF-4FEU-ELEC",
    code: "BF005",
    price: 325000,
    description: "6 month warranty",
    features: ["4 Feux", "1 Plaque électrique", "60x90 cm", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//e/l/elt4bhpcm_1.jpg",
    inStock: true
  },
  {
    id: generateId("BELLE FRANCE", "5BFO"),
    name: "BELLE FRANCE 5BFO Cooker - Large Oven - 60 x 90 - Silver",
    brand: "BELLE FRANCE",
    category: "CUISINIERE",
    reference: "BF-5BFO",
    code: "BF006",
    price: 307200,
    description: "6 Month Warranty",
    features: ["5 Feux", "Grand four", "60x90 cm", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re-belle-france-5bfo-60-90.jpg",
    inStock: true
  },
  {
    id: generateId("BELLE FRANCE", "5BBC"),
    name: "BELLE FRANCE-5BBC Cooker - With Gas Door - 60 x 90 - Silver",
    brand: "BELLE FRANCE",
    category: "CUISINIERE",
    reference: "BF-5BBC",
    code: "BF007",
    price: 284500,
    description: "6 Month Warranty",
    features: ["5 Feux", "Porte-gaz", "60x90 cm", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re-belle-france-5bbc-60-90.jpg",
    inStock: true
  },

  // Additional Products - GOODWIN
  {
    id: generateId("GOODWIN", "5FEU-90"),
    name: "GOODWIN Cooker - 5 Burners - 60 x 90 Cm - With Gas Bottle Holder",
    brand: "GOODWIN",
    category: "CUISINIERE",
    reference: "GW-5FEU-90",
    code: "GW001",
    price: 289900,
    description: "Electric Ignition - European Origin - Stainless Steel and Light Wood Top - 12 Months Warranty",
    features: ["5 Feux", "60x90 cm", "Porte-bouteille", "Origine européenne", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re-goodwin---5-feux---60-x-90-cm---allumage-_lectrique---origine-europ_enne---avec-porte-bouteille-gaz---dessus-inox-et-bois-clair---garantie-12-mois_2.jpg",
    inStock: true
  },
  {
    id: generateId("GOODWIN", "4FEU-RED"),
    name: "GOODWIN Cooker - 4 Fireplaces 50 x 60 - Red",
    brand: "GOODWIN",
    category: "CUISINIERE",
    reference: "GW-4FEU-RED",
    code: "GW002",
    price: 151905,
    description: "6 Months Warranty",
    features: ["4 Feux", "50x60 cm", "Rouge", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re-goodwin.jpg",
    inStock: true
  },
  {
    id: generateId("GOODWIN", "4FEU-YELLOW"),
    name: "GOODWIN cooker - 4 burners - 50 x 55 cm - Black and yellow top",
    brand: "GOODWIN",
    category: "CUISINIERE",
    reference: "GW-4FEU-YELLOW",
    code: "GW003",
    price: 152995,
    description: "6 month warranty",
    features: ["4 Feux", "50x55 cm", "Noir et jaune", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/u/cuisini_re_goodwin_-_4_feux_-_50_x_55_cm_prix_cameroun_-_c.jpg",
    inStock: true
  },

  // Additional Products - PREMAX
  {
    id: generateId("PREMAX", "PMSAC09T1"),
    name: "PREMAX Split Air Conditioner - 1.25 HP - PMSAC09T1 - 9,000 BTU",
    brand: "PREMAX",
    category: "CLIMATISEUR",
    reference: "PMSAC09T1",
    code: "PRE001",
    price: 153999,
    description: "R410A - White - 12-Month Warranty",
    features: ["9 000 BTU", "1,25 CV", "R410A", "Blanc", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_premax_-_unit_int_rieure_-_1_25_cv_-_pmsac09t1_2_.jpg",
    inStock: true
  },

  // Additional Products - LIGHTWAVE
  {
    id: generateId("LIGHTWAVE", "LW-9000BTU"),
    name: "Split Air Conditioner LIGHTWAVE - 1.25 HP - R410 - 9000Btu",
    brand: "LIGHTWAVE",
    category: "CLIMATISEUR",
    reference: "LW-9000BTU",
    code: "LW001",
    price: 163850,
    description: "White - 12 month warranty",
    features: ["9 000 BTU", "1,25 CV", "R410", "Blanc", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_split_-_lightwave_-_1.25_cv_-_9000btu.jpg",
    inStock: true
  },

  // Additional Products - STARSAT
  {
    id: generateId("STARSAT", "SC-1200HC"),
    name: "STARSAT 1.5 HP air conditioner - SC-1200HC - R410 - 12000BTU",
    brand: "STARSAT",
    category: "CLIMATISEUR",
    reference: "SC-1200HC",
    code: "STAR001",
    price: 159000,
    description: "Wall mounted - 6 months warranty",
    features: ["12 000 BTU", "1,5 CV", "R410", "Mural", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_starsat_1.5_cv_-_sc-1200hc_-_r410.jpg",
    inStock: true
  },

  // Additional Products - KENWOOD
  {
    id: generateId("KENWOOD", "BCW55"),
    name: "Refroidisseur de vin Kenwood BCW55.000BK - 85W - 55 Bouteilles",
    brand: "KENWOOD",
    category: "CAVE A VIN",
    reference: "BCW55.000BK",
    code: "KEN001",
    price: 910000,
    description: "Noir - 12 mois garantie",
    features: ["55 Bouteilles", "85W", "Noir", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/refroidisseur-de-vin-kenwood---bcw55.000bk---85w---55-bouteill.jpg",
    inStock: true
  },
  {
    id: generateId("KENWOOD", "BCW43"),
    name: "Wine Cooler KENWOOD BCW43.000BK - 85W - 43 Bottles",
    brand: "KENWOOD",
    category: "CAVE A VIN",
    reference: "BCW43.000BK",
    code: "KEN002",
    price: 630000,
    description: "Black - 6 months warranty",
    features: ["43 Bouteilles", "85W", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/refroidisseur-de-vin---kenwood---bcw43.000bk---85w---43-bouteilles.jpg",
    inStock: true
  },
  {
    id: generateId("KENWOOD", "IF550"),
    name: "Ventilateur sur pied 16 pouces Kenwood IF550 - 55 W",
    brand: "KENWOOD",
    category: "VENTILATEUR",
    reference: "IF550",
    code: "KEN003",
    price: 61000,
    description: "Argent/noir - Garantie 3 mois",
    features: ["16 pouces", "55W", "Argent/noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur-sur-pied-16-pouces---kenwood---if550---55-w---argent-noir.jpg",
    inStock: true
  },

  // Additional Products - KEPAS
  {
    id: generateId("KEPAS", "K181"),
    name: "Ventilateur KEPAS 18 pouces - K181 - Double pales",
    brand: "KEPAS",
    category: "VENTILATEUR",
    reference: "K181",
    code: "KEP001",
    price: 22000,
    description: "Blanc / Bleu - Garantie 3 mois",
    features: ["18 pouces", "Double pales", "Blanc/Bleu", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_kepas_18_pouces_-_e.jpg",
    inStock: true
  },
  {
    id: generateId("KEPAS", "K525"),
    name: "Ventilateur KEPAS 16 pouces - K525 - 5 pales - 4 vitesses",
    brand: "KEPAS",
    category: "VENTILATEUR",
    reference: "K525",
    code: "KEP002",
    price: 17500,
    description: "Noir - Garantie 3 mois",
    features: ["16 pouces", "5 pales", "4 vitesses", "Noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_kepas_16_pouces_-_e.jpg",
    inStock: true
  },

  // Additional Products - UFESA
  {
    id: generateId("UFESA", "UF84105333"),
    name: "Ventilateur Ottawa UFESA UF84105333 - 70W - 3 vitesses",
    brand: "UFESA",
    category: "VENTILATEUR",
    reference: "UF84105333",
    code: "UFE001",
    price: 18000,
    description: "Diamètre 45 cm - Noir - Garantie 6 mois",
    features: ["45 cm", "70W", "3 vitesses", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_ottawa_70w_-_b.jpg",
    inStock: true
  },
  {
    id: generateId("UFESA", "TW1700"),
    name: "Ventilateur OsloWiFi UFESA TW1700 - 45W - 3 Vitesses",
    brand: "UFESA",
    category: "VENTILATEUR",
    reference: "TW1700",
    code: "UFE002",
    price: 30000,
    description: "Noir - Garantie 6 mois",
    features: ["45W", "3 vitesses", "WiFi", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_oslowifi_-_45w_-_d.jpg",
    inStock: true
  },
  {
    id: generateId("UFESA", "UF84105334"),
    name: "Ventilateur Ottawa 3 en 1 UFESA UF84105334 - 70W",
    brand: "UFESA",
    category: "VENTILATEUR",
    reference: "UF84105334",
    code: "UFE003",
    price: 30000,
    description: "Sur pied, Mural et de table - Diamètre 45 cm - Noir - Garantie 6 mois",
    features: ["3 en 1", "45 cm", "70W", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_ottawa_3_en_1_-_70w_-_d.jpg",
    inStock: true
  },

  // Additional Products - UBIT
  {
    id: generateId("UBIT", "UB-356RB"),
    name: "Ventilateur sur socle UBIT UB-356RB - 16 pouces - 45W - 3 Vitesses",
    brand: "UBIT",
    category: "VENTILATEUR",
    reference: "UB-356RB",
    code: "UBI001",
    price: 15000,
    description: "Oscillation - Noir - Garantie 3 Mois",
    features: ["16 pouces", "45W", "3 vitesses", "Noir", "Garantie 3 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur_sur_socle_prix_en_fcfa_-_3_vitesses_-_ubit_ub-35sb_-_16_pouces_-_45w.jpg",
    inStock: true
  },

  // Additional Products - BLACK & DECKER
  {
    id: generateId("BLACK DECKER", "FB1620-B5"),
    name: "Powerful and Easy to Carry 16'' Fan Black & Decker FB1620-B5",
    brand: "BLACK DECKER",
    category: "VENTILATEUR",
    reference: "FB1620-B5",
    code: "BD001",
    price: 31625,
    description: "55 watts - 3 Speeds - Black - 6 months warranty",
    features: ["16 pouces", "55W", "3 vitesses", "Noir", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//v/e/ventilateur-puissant-et-facile.jpg",
    inStock: true
  },

  // Additional Products - MR UK
  {
    id: generateId("MR UK", "FTUI-F102-18-2S"),
    name: "Double Door Fridge MR UK F102-18-2s - 170 litres - Grey",
    brand: "MR UK",
    category: "FRIGO",
    reference: "FTUI-F102-18-2S",
    code: "MRUK001",
    price: 162400,
    description: "6 month warranty",
    features: ["170 Litres", "Double porte", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_double_battant_170_litres_-_c.jpg",
    inStock: true
  },
  {
    id: generateId("MR UK", "FTUI-F91-15-8S"),
    name: "Réfrigérateur à double battant MR UK FTUI-F91-15-8s - 150 litres",
    brand: "MR UK",
    category: "FRIGO",
    reference: "FTUI-F91-15-8S",
    code: "MRUK002",
    price: 148000,
    description: "GRIS-MATT - Garantie 12 mois",
    features: ["150 Litres", "Double battant", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/refrigerateur_mr_uk_150l.jpg",
    inStock: true
  },
  {
    id: generateId("MR UK", "FTUI-F143-27"),
    name: "Fridge Freezer MR UK 280 Litres FTUI-F143-27 - With Water Dispenser",
    brand: "MR UK",
    category: "FRIGO",
    reference: "FTUI-F143-27",
    code: "MRUK003",
    price: 247500,
    description: "Dark Grey - 12 Month Warranty",
    features: ["280 Litres", "Distributeur d'eau", "Gris foncé", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur-combin_---mr-uk---240-litres---ftui-f143-27---avec-distributeur-d_eau---gris-fonc_.jpg",
    inStock: true
  },
  {
    id: generateId("MR UK", "FTUI-F94-16-6S"),
    name: "Réfrigérateur DOUBLE BATTANT MR UK FTUI-F94-16-6S - 183 litres",
    brand: "MR UK",
    category: "FRIGO",
    reference: "FTUI-F94-16-6S",
    code: "MRUK004",
    price: 172545,
    description: "Gris - 12 mois garantie",
    features: ["183 Litres", "Double battant", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_double_battant_-_183_litres.jpg",
    inStock: true
  },
  {
    id: generateId("MR UK", "FTUI-F91-15-143"),
    name: "Réfrigérateur Double battants MR UK FTUI-F91-15-143 - 145 litres",
    brand: "MR UK",
    category: "FRIGO",
    reference: "FTUI-F91-15-143",
    code: "MRUK005",
    price: 145000,
    description: "Gris - 12 Mois Garantie",
    features: ["145 Litres", "Double battant", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_double_battants_-_145_litres_.jpg",
    inStock: true
  },

  // Additional Products - HOME BASE
  {
    id: generateId("HOME BASE", "FTUI-HB3-95K"),
    name: "Réfrigérateur Double Battant HOME BASE FTUI-HB3-95K - 175 Litres",
    brand: "HOME BASE",
    category: "FRIGO",
    reference: "FTUI-HB3-95K",
    code: "HB001",
    price: 137500,
    description: "Gris - Garantie 12 mois",
    features: ["175 Litres", "Double battant", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_double_porte_175_litres_4_.jpg",
    inStock: true
  },

  // Additional Products - ASTECH
  {
    id: generateId("ASTECH", "FC-304VD"),
    name: "ASTECH Combined Refrigerator 269 Liters - FC-304VD - 4 Drawers",
    brand: "ASTECH",
    category: "FRIGO",
    reference: "FC-304VD",
    code: "AST001",
    price: 280000,
    description: "Energy Class A+ - Dark Stainless Steel - 12 Month Warranty",
    features: ["269 Litres", "4 tiroirs", "Classe A+", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_combin_astech_-_269_litres_3_.jpg",
    inStock: true
  },

  // Additional LG Products
  {
    id: generateId("LG", "GGL-B262PQGB"),
    name: "LG Double Door Refrigerator with Smart Inverter Compressor - 287 Liters - GGL-B262PQGB",
    brand: "LG",
    category: "FRIGO",
    reference: "GGL-B262PQGB",
    code: "LG011",
    price: 356545,
    description: "Energy Class A+++ - Intelligent Diagnostics™ - Silver - 12 Month Warranty",
    features: ["287 Litres", "Smart Inverter", "A+++", "Intelligent Diagnostics™", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_lg_double_battant_287_litres_8_.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GL-C322SLBB"),
    name: "LG 2-Door Top Freezer Refrigerator with Smart Inverter Compressor - 260 Litres - GL-C322SLBB",
    brand: "LG",
    category: "FRIGO",
    reference: "GL-C322SLBB",
    code: "LG012",
    price: 270000,
    description: "Energy Rating A+++ - Intelligent Diagnostics™ - Silver - 12 Month Warranty",
    features: ["260 Litres", "Smart Inverter", "A+++", "Intelligent Diagnostics™", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_lg_a_double_battant_-_260_litres_.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GN-Y331SLBB"),
    name: "LG Refrigerator - 199 Liters - GN-Y331SLBB - Inverter Compressor",
    brand: "LG",
    category: "FRIGO",
    reference: "GN-Y331SLBB",
    code: "LG013",
    price: 280000,
    description: "Single Door - Inverter Technology - Silver - 12 Month Warranty",
    features: ["199 Litres", "Inverter", "1 Porte", "Argent", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur-a_-une-porte-lg---199-litres---gn-y331slbb.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GL-131-SQQP"),
    name: "LG Mini Fridge - GL-131-SQQP - 92 litres - Inverter Technology",
    brand: "LG",
    category: "FRIGO",
    reference: "GL-131-SQQP",
    code: "LG014",
    price: 136800,
    description: "White - Compact - Energy Efficient - 12 Month Warranty",
    features: ["92 Litres", "Mini Frigo", "Inverter", "Blanc", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/i/mini-re_frige_rateur-lg---gl-131-sqqp---92-litres---blanc.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "GC-B399NLJM"),
    name: "Réfrigérateur combiné LG - GC-B399NLJM - 306 litres",
    brand: "LG",
    category: "FRIGO",
    reference: "GC-B399NLJM",
    code: "LG015",
    price: 390000,
    description: "Smart Inverter Compressor - No Frost - Argent - Garantie 12 mois",
    features: ["306 Litres", "Smart Inverter", "No Frost", "Argent", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur-combin_-lg_1.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "F2Y1TYP6J"),
    name: "Machine à laver Automatique LG - 8 kg - Classe énergétique A+++ - F2Y1TYP6J",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "F2Y1TYP6J",
    code: "LG016",
    price: 280800,
    description: "Front Load - Steam Technology - Argent - Garantie 12 mois",
    features: ["8 Kg", "Classe A+++", "Steam", "Argent", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_automatique_lg_-_8_kg_1.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "F2Y1HYP6J"),
    name: "LG Automatic Washing Machine - 7 kg - Energy Class A+++ - F2Y1HYP6J",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "F2Y1HYP6J",
    code: "LG017",
    price: 240000,
    description: "Silver - 12 month warranty",
    features: ["7 Kg", "Classe A+++", "Argent", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_automatique_lg_-_7_kg_-.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "F4R3VYG6P"),
    name: "Automatic Washing Machine - LG - F4R3VYG6P - 9KG - AI DD - Steam",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "F4R3VYG6P",
    code: "LG018",
    price: 480000,
    description: "Silver - 12 month warranty",
    features: ["9 Kg", "AI DD", "Steam", "Argent", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_-_lg_9kg_2_.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "P1401RONT"),
    name: "Semi-automatic washing machine - LG - 13,5KG - P1401RONT",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "P1401RONT",
    code: "LG019",
    price: 258795,
    description: "Black - 12 month warranty",
    features: ["13,5 Kg", "Semi-auto", "Double cuve", "Noir", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_semi-automatique_lg_13_5kg.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "P9611RONT"),
    name: "LG Semi-Automatic Washing Machine - 9KG - P9611RONT",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "P9611RONT",
    code: "LG020",
    price: 172545,
    description: "Black - 12 Month Warranty",
    features: ["9 Kg", "Semi-auto", "Double cuve", "Noir", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_semi-automatique_lg_-_9kg_11_.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "P861RONT"),
    name: "LG Semi-Automatic Washing Machine - 7KG - P861RONT",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "P861RONT",
    code: "LG021",
    price: 121000,
    description: "Black - 12 month warranty",
    features: ["7 Kg", "Semi-auto", "Double cuve", "Noir", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_semi-automatique_lg_-_7kg_9_.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "F0L9DYP2S"),
    name: "Machine à Laver automatique - LG - F0L9DYP2S - Lavage 15kg",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "F0L9DYP2S",
    code: "LG022",
    price: 762465,
    description: "Turbo Wash - Super économique (A+++) - Pierre Argent - 12 Mois",
    features: ["15 Kg", "Turbo Wash", "A+++", "ThinQ", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine-_-laver-automatique_2.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "F0L2CRV2T2C-20"),
    name: "Machine à Laver automatique (Lavage et Séchage) - LG - F0L2CRV2T2C - 20 Kg / 12Kg",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "F0L2CRV2T2C-20",
    code: "LG023",
    price: 1035045,
    description: "6 Motion Direct Drive - ThinQ App - A+++ - Argent - Garantie 12 Mois",
    features: ["20 Kg lavage", "12 Kg séchage", "ThinQ", "A+++", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine-_-laver-automatique-_-lavage-et-s_chage_.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "F0L2CRV2T2-17"),
    name: "Machine à Laver Automatique (Lavage et Séchage) LG - F0L2CRV2T2 - 17 Kg / 10Kg",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "F0L2CRV2T2-17",
    code: "LG024",
    price: 969000,
    description: "A+++ - ThinQ Option - Argent - Garantie 12 Mois",
    features: ["17 Kg lavage", "10 Kg séchage", "ThinQ", "A+++", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine-_-laver-automatique-_-lavage-et-s_chage_-lg.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "F0L9DGP2S"),
    name: "Machine à laver LG automatique - F0L9DGP2S - lavage 15kg et séchage 8kg",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "F0L9DGP2S",
    code: "LG025",
    price: 830745,
    description: "Super économe en énergie (A+++) - 12 mois garantie",
    features: ["15 Kg lavage", "8 Kg séchage", "A+++", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine-_-laver-lg-automatique.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "F4V5RGP0W"),
    name: "Washing machine LG - F4V5RGP0W - Washing 10.5Kg / Drying 7kg - 14 cycles - Steam",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "F4V5RGP0W",
    code: "LG026",
    price: 632545,
    description: "White - 12 months warranty",
    features: ["10,5 Kg lavage", "7 Kg séchage", "14 cycles", "Steam", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_lg_-_lavage_10.5kg_-_s_chage_7kg_-_a.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "WT1310RH"),
    name: "Machine à laver et sécher automatique LG - Lavage 13 kg / Séchage 10 kg - WT1310RH",
    brand: "LG",
    category: "MACHINE A LAVER",
    reference: "WT1310RH",
    code: "LG027",
    price: 1610045,
    description: "Économe en énergie - Anti-allergies - Noir - Garantie 12 mois",
    features: ["13 Kg lavage", "10 Kg séchage", "Anti-allergies", "Noir", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_et_se_cher_automatique_lg_-_j.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "S12ATC"),
    name: "Climatiseur - Split - JET COOL - LG - S12ATC - 1,5 CV - 12000 BTU",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "S12ATC",
    code: "LG028",
    price: 224250,
    description: "Blanc - 6 mois + Kit D'installation Offert",
    features: ["12 000 BTU", "1,5 CV", "JET COOL", "Blanc", "Kit installation offert"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_lg_1_5_cv_6__1.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "S09ATC"),
    name: "Climatiseur - Split JET COOL - LG - S09ATC - 1,25 CV - 9000 BTU",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "S09ATC",
    code: "LG029",
    price: 199900,
    description: "Blanc - 12 mois",
    features: ["9 000 BTU", "1,25 CV", "JET COOL", "Blanc", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur_lg_1_25_cv.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "S4-Q12JA3QJ"),
    name: "Climatiseur LG - DUALCOOL Inverter - 70% d'économie d'énergie - S4-Q12JA3QJ - 1.5CV",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "S4-Q12JA3QJ",
    code: "LG030",
    price: 345000,
    description: "Blanc - 12 Mois",
    features: ["12 000 BTU", "1,5 CV", "DUALCOOL Inverter", "70% économie", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-lg---dualcool-inverter.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "S4-Q09WAQAL"),
    name: "Climatiseur DUAL Inverter - LG - 70% d'économie d'énergie - 1.25CV - S4-Q09WAQAL",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "S4-Q09WAQAL",
    code: "LG031",
    price: 322000,
    description: "Blanc - 12 mois",
    features: ["9 000 BTU", "1,25 CV", "DUAL Inverter", "70% économie", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur1.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "S4-Q12JAQALC"),
    name: "Climatiseur INVENTER DUALCOOL - LG - S4-Q12JAQALC - 1.5CV",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "S4-Q12JAQALC",
    code: "LG032",
    price: 345000,
    description: "Blanc - 12 Mois",
    features: ["12 000 BTU", "1,5 CV", "DUALCOOL Inverter", "Blanc", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/l/climatiseur-inventer-dualcool.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "AP-Q48LT3S1"),
    name: "Climatiseur Armoir Inverter - LG - AP-Q48LT3S1 - 46000BTU - 5 CV",
    brand: "LG",
    category: "CLIMATISEUR",
    reference: "AP-Q48LT3S1",
    code: "LG033",
    price: 2000000,
    description: "13480W - Blanc - 6 mois garantie",
    features: ["46 000 BTU", "5 CV", "Armoire", "Inverter", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//n/o/nouveau-fond-telephone-r_cup_r__1.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "RH90V9PV8N"),
    name: "Sèche-linge LG - Type à condensation - 9 kg - LG-RH90V9PV8N - Diagnostic intelligent",
    brand: "LG",
    category: "SECHE-LINGE",
    reference: "RH90V9PV8N",
    code: "LG034",
    price: 625000,
    description: "GRIS - 12 mois",
    features: ["9 Kg", "Condensation", "Diagnostic intelligent", "Gris", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/e/seche_linge_lg_9kg_economique_sur_glotelho.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "DFB325HS"),
    name: "LG Dishwasher - 14 Place Settings - QuadWash™ Technology - Next Generation Cleaning",
    brand: "LG",
    category: "AUTRES",
    reference: "DFB325HS",
    code: "LG035",
    price: 629765,
    description: "12 Month Warranty",
    features: ["14 couverts", "QuadWash™", "Économique", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//l/a/lave-vaisselle_lg_-_14_couverts_technologie_quadwash_6_.jpg",
    inStock: true
  },
  {
    id: generateId("LG", "FA211RMA"),
    name: "LG Gas Cooker - FA211RMA - 4 Burners - 60 x 60 cm - STAINLESS STEEL",
    brand: "LG",
    category: "CUISINIERE",
    reference: "FA211RMA",
    code: "LG036",
    price: 380000,
    description: "Silver - 12 Month Warranty",
    features: ["4 Feux", "60x60 cm", "Inox", "Argent", "Garantie 12 mois"],
    imageUrl: "",
    inStock: true
  },

  // Additional SAMSUNG Products
  {
    id: generateId("SAMSUNG", "WW80FG3M05AWNQ"),
    name: "Samsung Lave-linge frontal 8 kg - WW80FG3M05AWNQ - 1400 tr/min",
    brand: "SAMSUNG",
    category: "MACHINE A LAVER",
    reference: "WW80FG3M05AWNQ",
    code: "SAM001",
    price: 250000,
    description: "Moteur Digital Inverter - Classe A - Affichage LED - Blanc - Garantie 6 mois",
    features: ["8 Kg", "1400 tr/min", "Digital Inverter", "Classe A", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/a/samsung_lave-linge_frontal_8_kg1.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "WW70FG3M05AW"),
    name: "Samsung Lave-linge frontal 7 kg – WW70FG3M05AW – 1400 tr/min",
    brand: "SAMSUNG",
    category: "MACHINE A LAVER",
    reference: "WW70FG3M05AW",
    code: "SAM002",
    price: 225000,
    description: "Moteur Digital Inverter – Classe A – Wi-Fi (SmartThings) – Blanc – Garantie 6 mois",
    features: ["7 Kg", "1400 tr/min", "Digital Inverter", "Wi-Fi SmartThings", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//s/a/samsung_lave-linge_frontal_7_kg_1.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "WD17T6300GP-21"),
    name: "Samsung Automatic Washing and Drying Machine - WD17T6300GP - 21/12kg",
    brand: "SAMSUNG",
    category: "MACHINE A LAVER",
    reference: "WD17T6300GP-21",
    code: "SAM003",
    price: 856795,
    description: "Silver - 6-month warranty",
    features: ["21 Kg lavage", "12 Kg séchage", "Digital Inverter", "Argent", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_lavante_et_s_chante_automatique_samsung_21_kg_12kg_1_.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "WD17T6300GP-17"),
    name: "Automatic Washing and Drying Machine - Samsung - WD17T6300GP - 17/10kg",
    brand: "SAMSUNG",
    category: "MACHINE A LAVER",
    reference: "WD17T6300GP-17",
    code: "SAM004",
    price: 816545,
    description: "Grey/Silver - 6-month warranty",
    features: ["17 Kg lavage", "10 Kg séchage", "Digital Inverter", "Gris/Argent", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_lavante_et_s_chante_automatique_samsung_17kg_10kg_5_.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "WD11DB7B85GB"),
    name: "Automatic washing and drying machine - Samsung - WD11DB7B85GB - 11/6kg",
    brand: "SAMSUNG",
    category: "MACHINE A LAVER",
    reference: "WD11DB7B85GB",
    code: "SAM005",
    price: 540545,
    description: "White - 6-month warranty",
    features: ["11 Kg lavage", "6 Kg séchage", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_lavante_et_s_chante_automatique_samsung_11kg_6kg_3_.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "WW11CG1604DABSG"),
    name: "Samsung Automatic Washing Machine - WW11CG1604DABSG - 11kg - Front Loading",
    brand: "SAMSUNG",
    category: "MACHINE A LAVER",
    reference: "WW11CG1604DABSG",
    code: "SAM006",
    price: 442795,
    description: "Black - 12 Month Warranty",
    features: ["11 Kg", "Front Loading", "Noir", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_a_laver_automatique_samsung_-_11kg_.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "RT25HAR4DSA"),
    name: "Samsung Refrigerator - 256 Liters - A+ - RT25HAR4DSA - Graphite Metal",
    brand: "SAMSUNG",
    category: "FRIGO",
    reference: "RT25HAR4DSA",
    code: "SAM007",
    price: 324800,
    description: "6 Month Warranty",
    features: ["256 Litres", "Classe A+", "Graphite Metal", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_samsung_-_256_litres_.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "RT20HAR2DSA"),
    name: "Samsung Refrigerator – 208 litres – A+ – RT20HAR2DSA – Graphite Metal",
    brand: "SAMSUNG",
    category: "FRIGO",
    reference: "RT20HAR2DSA",
    code: "SAM008",
    price: 250000,
    description: "12 month warranty",
    features: ["208 Litres", "Classe A+", "Graphite Metal", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur-samsung-_-203-litres-_-a_-_-rt20har2dsa.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "RT22HAR4DSA-236"),
    name: "Samsung Refrigerator - 236 Litres - RT22HAR4DSA - Energy A+ - 5 shelves",
    brand: "SAMSUNG",
    category: "FRIGO",
    reference: "RT22HAR4DSA-236",
    code: "SAM009",
    price: 291200,
    description: "12 month warranty",
    features: ["236 Litres", "Classe A+", "5 étagères", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_samsung_-_236_litres.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "RS57DG4100B4GH-WD"),
    name: "SAMSUNG American Fridge - RS57DG4100B4GH - 560 Litres - With Water Dispenser",
    brand: "SAMSUNG",
    category: "FRIGO",
    reference: "RS57DG4100B4GH-WD",
    code: "SAM010",
    price: 950000,
    description: "NO FROST - Digital Inverter Compressor - Matt Black - 12 Month Warranty",
    features: ["560 Litres", "Distributeur eau", "No Frost", "Digital Inverter", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_ame_ricain_samsung_-_560_litres_avec_distributeur_d_eau_-1.jpg",
    inStock: true
  },
  {
    id: generateId("SAMSUNG", "RS57DG4000B4GH"),
    name: "SAMSUNG American Fridge - 560 liters - RS57DG4000B4GH - NO FROST - WiFi",
    brand: "SAMSUNG",
    category: "FRIGO",
    reference: "RS57DG4000B4GH",
    code: "SAM011",
    price: 790000,
    description: "Digital inverter compressor - Matt black - 12 month warranty",
    features: ["560 Litres", "WiFi", "No Frost", "Digital Inverter", "Garantie 12 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/e/re_frige_rateur_samsung_560_litres.jpg",
    inStock: true
  },

  // Additional SHARP Products
  {
    id: generateId("SHARP", "SJ-HM440-HS2"),
    name: "Réfrigerateur double battant - Sharp - SJ-HM440-HS2 - No frost - A+ - 330L",
    brand: "SHARP",
    category: "FRIGO",
    reference: "SJ-HM440-HS2",
    code: "SHP001",
    price: 367500,
    description: "Gris - 06 Mois garantie",
    features: ["330 Litres", "No Frost", "Classe A+", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frigerateur-double-battant.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "SJ-HM320-HS2"),
    name: "Réfrigérateur Double Battant - Sharp - SJ-HM320-HS2 - No frost - A+ - 250L",
    brand: "SHARP",
    category: "FRIGO",
    reference: "SJ-HM320-HS2",
    code: "SHP002",
    price: 328000,
    description: "Gris - 6 Mois garantie",
    features: ["250 Litres", "No Frost", "Classe A+", "Gris", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//r/_/r_frig_rateur_double_battants_-_sharp_250_litres.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "SCF-K490X-SL2"),
    name: "Chest Freezer - Sharp - SCF-K490X-SL2 - 354 L",
    brand: "SHARP",
    category: "CONGELATEUR",
    reference: "SCF-K490X-SL2",
    code: "SHP003",
    price: 357000,
    description: "White - 6 months warranty",
    features: ["354 Litres", "Coffre", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_-_sharp_-_scf-k490x-sl2_-_354_l_-_a.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "SCF-K580X-WH2"),
    name: "Chest freezer - Sharp - SCF-K580X-WH2 - 446 L",
    brand: "SHARP",
    category: "CONGELATEUR",
    reference: "SCF-K580X-WH2",
    code: "SHP004",
    price: 414995,
    description: "White - 6 months warranty",
    features: ["446 Litres", "Coffre", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_-_sharp_-_scf-k580x-wh2_-_446_l_-_a.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "SCF-K660X-WH2"),
    name: "Chest Freezer - Sharp - SCF-K660X-WH2 - 503 L",
    brand: "SHARP",
    category: "CONGELATEUR",
    reference: "SCF-K660X-WH2",
    code: "SHP005",
    price: 461545,
    description: "White - 6 months warranty",
    features: ["503 Litres", "Coffre", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_-_sharp_-_scf-k660x-wh2_-_503_l_-_a.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "SCF-K250X-SL3"),
    name: "Chest Freezer - Sharp - SCF-K250X-SL3 - 200L",
    brand: "SHARP",
    category: "CONGELATEUR",
    reference: "SCF-K250X-SL3",
    code: "SHP006",
    price: 200000,
    description: "White - 6 Months",
    features: ["200 Litres", "Coffre", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//c/o/cong_lateur_coffre_-_sharp_-_scf-k250x-sl3.jpg",
    inStock: true
  },
  {
    id: generateId("SHARP", "ES-FE710CZL-W"),
    name: "Machine à laver automatique - Sharp ES-FE710CZL-W - 7Kg",
    brand: "SHARP",
    category: "MACHINE A LAVER",
    reference: "ES-FE710CZL-W",
    code: "SHP007",
    price: 212800,
    description: "Blanc - Garantie 06 mois",
    features: ["7 Kg", "Automatique", "Front Load", "Blanc", "Garantie 6 mois"],
    imageUrl: "https://site.glotelho.cm/media/catalog/product/cache/a58e2aabece67ef1697e83a3a038bdf7//m/a/machine_laver_automatique_-_sharp_es-fl77ms_-_7kg_-_1.jpg",
    inStock: true
  },
];

// Helper function to get products by category
export const getProductsByCategory = (category: Category): Product[] => {
  return products.filter(p => p.category === category);
};

// Helper function to get products by brand
export const getProductsByBrand = (brand: string): Product[] => {
  return products.filter(p => p.brand.toUpperCase() === brand.toUpperCase());
};

// Helper function to get a single product by ID
export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

// Helper function to format price in XAF
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-CM', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' FCFA';
};

// Helper function to search products
export const searchProducts = (query: string): Product[] => {
  const lowerQuery = query.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.brand.toLowerCase().includes(lowerQuery) ||
    p.category.toLowerCase().includes(lowerQuery) ||
    p.reference.toLowerCase().includes(lowerQuery) ||
    (p.description && p.description.toLowerCase().includes(lowerQuery))
  );
};
