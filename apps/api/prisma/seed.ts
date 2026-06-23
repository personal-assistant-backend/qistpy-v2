import { PrismaClient, ProductStatus, UserRole, VendorStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CITIES = [
  { name: 'Lahore',     slug: 'lahore'     },
  { name: 'Karachi',    slug: 'karachi'    },
  { name: 'Islamabad',  slug: 'islamabad'  },
  { name: 'Rawalpindi', slug: 'rawalpindi' },
  { name: 'Faisalabad', slug: 'faisalabad' },
  { name: 'Multan',     slug: 'multan'     },
  { name: 'Peshawar',   slug: 'peshawar'   },
  { name: 'Quetta',     slug: 'quetta'     },
  { name: 'Gujranwala', slug: 'gujranwala' },
  { name: 'Sialkot',    slug: 'sialkot'    },
];

const CATEGORIES = [
  { name: 'Mobiles',          slug: 'mobiles',          orderIndex: 1 },
  { name: 'Laptops',          slug: 'laptops',          orderIndex: 2 },
  { name: 'LEDs',             slug: 'leds',             orderIndex: 3 },
  { name: 'Refrigerators',    slug: 'refrigerators',    orderIndex: 4 },
  { name: 'ACs',              slug: 'acs',              orderIndex: 5 },
  { name: 'Washing Machines', slug: 'washing-machines', orderIndex: 6 },
  { name: 'Microwaves',       slug: 'microwaves',       orderIndex: 7 },
  { name: 'Bikes',            slug: 'bikes',            orderIndex: 8 },
];

const BRANDS = [
  { name: 'Samsung',  slug: 'samsung'  },
  { name: 'Apple',    slug: 'apple'    },
  { name: 'Xiaomi',   slug: 'xiaomi'   },
  { name: 'Infinix',  slug: 'infinix'  },
  { name: 'Tecno',    slug: 'tecno'    },
  { name: 'Vivo',     slug: 'vivo'     },
  { name: 'OPPO',     slug: 'oppo'     },
  { name: 'HP',       slug: 'hp'       },
  { name: 'Dell',     slug: 'dell'     },
  { name: 'Lenovo',   slug: 'lenovo'   },
  { name: 'Haier',    slug: 'haier'    },
  { name: 'Dawlance', slug: 'dawlance' },
  { name: 'Honda',    slug: 'honda'    },
];

// Category SVG images (inline, always work)
function makeCatSvg(emoji: string, label: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="${bg}"/><text x="100" y="95" font-size="72" text-anchor="middle" dominant-baseline="middle">${emoji}</text><text x="100" y="158" font-family="Arial,sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">${label}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const CAT_IMAGES: Record<string, string> = {
  'mobiles':           makeCatSvg('📱', 'Mobiles',           '#1428A0'),
  'laptops':           makeCatSvg('💻', 'Laptops',           '#1a1a2e'),
  'leds':              makeCatSvg('📺', 'LED TVs',           '#0f3460'),
  'refrigerators':     makeCatSvg('🧊', 'Fridges',           '#164e63'),
  'acs':               makeCatSvg('❄️', 'ACs',               '#0369a1'),
  'washing-machines':  makeCatSvg('🫧', 'Washing',           '#1e40af'),
  'microwaves':        makeCatSvg('♨️', 'Microwaves',        '#92400e'),
  'bikes':             makeCatSvg('🏍️', 'Bikes',             '#991b1b'),
};

// Real Pakistani market products with multiple images
// Format: [name, catSlug, brandSlug, cashPrice, shortDesc, description, images[]]
type ProductData = [string, string, string, number, string, string, string[]];

const PRODUCTS: ProductData[] = [
  // ── MOBILES ──────────────────────────────────────────────────────
  [
    'Samsung Galaxy A06 4/128GB', 'mobiles', 'samsung', 34000,
    '6.7" FHD+ display, 50MP camera, 5000mAh battery',
    '• Display: 6.7-inch PLS LCD, 90Hz\n• Processor: Helio G85\n• RAM: 4GB | Storage: 128GB\n• Camera: 50MP + 2MP rear, 8MP front\n• Battery: 5000mAh, 25W charging\n• OS: Android 14\n• Colors: Black, Light Blue, Light Green',
    [
      'https://images.samsung.com/is/image/samsung/p6pim/levant/sm-a065flbdmid/gallery/levant-galaxy-a06-sm-a065flbdmid-thumb-543072652',
    ],
  ],
  [
    'Samsung Galaxy A16 6/128GB', 'mobiles', 'samsung', 59000,
    '6.7" Super AMOLED, 50MP triple camera, 5000mAh',
    '• Display: 6.7-inch Super AMOLED, 90Hz\n• Processor: Helio G99\n• RAM: 6GB | Storage: 128GB\n• Camera: 50MP + 5MP + 2MP, 13MP front\n• Battery: 5000mAh\n• OS: Android 14, One UI 6.1',
    [
      'https://images.samsung.com/is/image/samsung/p6pim/levant/sm-a165flbgmid/gallery/levant-galaxy-a16-sm-a165flbgmid-thumb-543072646',
    ],
  ],
  [
    'Samsung Galaxy A55 5G 8/256GB', 'mobiles', 'samsung', 89000,
    'Awesome Iceblue, 50MP OIS camera, IP67 rating',
    '• Display: 6.6-inch Super AMOLED, 120Hz\n• Processor: Exynos 1480\n• RAM: 8GB | Storage: 256GB\n• Camera: 50MP (OIS) + 12MP + 5MP, 32MP front\n• Battery: 5000mAh, 45W\n• IP67 water resistant',
    [
      'https://images.samsung.com/is/image/samsung/p6pim/levant/sm-a556ezaemid/gallery/levant-galaxy-a55-5g-sm-a556ezaemid-thumb-539247025',
    ],
  ],
  [
    'Vivo Y29 5G 8/256GB', 'mobiles', 'vivo', 54000,
    '6.77" LCD, 50MP camera, 6500mAh massive battery',
    '• Display: 6.77-inch LCD, 90Hz\n• Processor: MediaTek Dimensity 6300\n• RAM: 8GB | Storage: 256GB\n• Camera: 50MP + 2MP rear, 8MP front\n• Battery: 6500mAh, 44W fast charging\n• 5G connectivity',
    [
      'https://www.vivo.com/content/dam/vivo/in/product-listing/Y29-5G.png',
    ],
  ],
  [
    'Vivo Y18s 4/128GB', 'mobiles', 'vivo', 39000,
    'Stylish design, 50MP camera, 5000mAh',
    '• Display: 6.56-inch IPS LCD\n• Processor: MediaTek Helio G85\n• RAM: 4GB | Storage: 128GB\n• Camera: 50MP rear, 8MP front\n• Battery: 5000mAh, 15W charging',
    [
      'https://www.vivo.com/content/dam/vivo/in/product-listing/Y18s.png',
    ],
  ],
  [
    'OPPO A3 Pro 8/256GB', 'mobiles', 'oppo', 69000,
    'IP65 rating, 50MP Sony IMX890, 5000mAh',
    '• Display: 6.67-inch AMOLED, 120Hz\n• Processor: Dimensity 7050\n• RAM: 8GB | Storage: 256GB\n• Camera: 50MP Sony IMX890 + 2MP\n• Battery: 5000mAh, 67W SUPERVOOC\n• IP65 dust & water resistant',
    [
      'https://image.oppo.com/content/dam/oppo/product-asset-library/a3-pro/a3-pro-v2/assets/pc/specifications-img.png',
    ],
  ],
  [
    'Infinix Hot 50 Pro+ 8/256GB', 'mobiles', 'infinix', 41000,
    '6.78" AMOLED 120Hz, 108MP camera, 5000mAh',
    '• Display: 6.78-inch AMOLED, 120Hz\n• Processor: Helio G100 Ultra\n• RAM: 8GB | Storage: 256GB\n• Camera: 108MP + 2MP + AI lens, 32MP front\n• Battery: 5000mAh, 45W charging\n• Side fingerprint sensor',
    [
      'https://fdn2.gsmarena.com/vv/pics/infinix/infinix-hot-50-pro-plus-1.jpg',
    ],
  ],
  [
    'Tecno Spark 30C 4/128GB', 'mobiles', 'tecno', 26000,
    'Budget king, 6.67" display, 5000mAh, Face ID',
    '• Display: 6.67-inch IPS LCD, 90Hz\n• Processor: Helio G81 Ultra\n• RAM: 4GB | Storage: 128GB\n• Camera: 48MP rear, 8MP front\n• Battery: 5000mAh, 18W\n• Face unlock + fingerprint',
    [
      'https://www.tecno-mobile.com/uploads/spark30c/spark30c_01.png',
    ],
  ],
  [
    'iPhone 15 128GB', 'mobiles', 'apple', 229000,
    'USB-C, 48MP camera, A16 Bionic chip',
    '• Display: 6.1-inch Super Retina XDR, 60Hz\n• Chip: A16 Bionic\n• Camera: 48MP main + 12MP ultra-wide, 12MP TrueDepth\n• Storage: 128GB\n• Battery: Up to 20 hrs video\n• USB-C connector\n• Dynamic Island',
    [
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-black?wid=5120&hei=2880&fmt=p-jpg&qlt=80',
    ],
  ],
  [
    'Xiaomi Redmi Note 14 8/256GB', 'mobiles', 'xiaomi', 64000,
    '6.67" AMOLED 120Hz, 200MP camera, 5500mAh',
    '• Display: 6.67-inch AMOLED, 120Hz\n• Processor: Snapdragon 7s Gen 2\n• RAM: 8GB | Storage: 256GB\n• Camera: 200MP main + 8MP + 2MP, 20MP front\n• Battery: 5500mAh, 45W fast charging\n• IP54 splash resistant',
    [
      'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1726225044.41539668.png',
    ],
  ],

  // ── LAPTOPS ──────────────────────────────────────────────────────
  [
    'HP Pavilion 15 Core i5 13th Gen', 'laptops', 'hp', 119000,
    '15.6" FHD IPS, 8GB RAM, 512GB SSD, Intel Iris Xe',
    '• Display: 15.6-inch FHD IPS Anti-glare\n• Processor: Intel Core i5-1335U (13th Gen)\n• RAM: 8GB DDR4 | Storage: 512GB NVMe SSD\n• Graphics: Intel Iris Xe\n• Battery: 41Wh, fast charge\n• OS: Windows 11 Home\n• Weight: 1.75 kg',
    [
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/knowledgebase/c08499404.png',
    ],
  ],
  [
    'Dell Inspiron 15 Core i3 12th Gen', 'laptops', 'dell', 79000,
    'Affordable workhorse, 8GB RAM, 256GB SSD',
    '• Display: 15.6-inch FHD Anti-glare\n• Processor: Intel Core i3-1215U (12th Gen)\n• RAM: 8GB DDR4 | Storage: 256GB SSD\n• Graphics: Intel UHD\n• Battery: 41Wh\n• OS: Windows 11 Home',
    [
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/inspiron-notebooks/inspiron-15-3520/media-gallery/black/notebook-inspiron-15-3520-black-gallery-4.psd?fmt=pjpg&pscan=auto&scl=1',
    ],
  ],

  // ── LEDs ──────────────────────────────────────────────────────────
  [
    'Samsung 43" Crystal UHD 4K Smart TV', 'leds', 'samsung', 89000,
    'Crystal 4K processor, PurColor, Tizen OS',
    '• Screen: 43-inch Crystal UHD 4K\n• Resolution: 3840 x 2160\n• Processor: Crystal 4K\n• OS: Tizen with Samsung Smart TV\n• HDR: HDR10+\n• Connectivity: 3 HDMI, 2 USB\n• WiFi + Bluetooth built-in',
    [
      'https://images.samsung.com/is/image/samsung/p6pim/levant/ua43au7000uxzn/gallery/levant-uhd-au7000-ua43au7000uxzn-thumb-368249397',
    ],
  ],
  [
    'Haier 55" 4K Android TV', 'leds', 'haier', 119000,
    'Google TV, Dolby Vision, Voice Remote',
    '• Screen: 55-inch 4K UHD\n• OS: Android 11 / Google TV\n• HDR: Dolby Vision + HDR10\n• Audio: Dolby Atmos\n• Google Assistant + Chromecast built-in\n• Connectivity: 3 HDMI, 2 USB',
    [
      'https://haier.com/content/dam/haier-ng/middleeast/en/catalog/televisions/le55k800gtua/le55k800gtua-front.png',
    ],
  ],

  // ── REFRIGERATORS ─────────────────────────────────────────────────
  [
    'Dawlance 9191 WB Chrome 16 CuFt', 'refrigerators', 'dawlance', 109000,
    'Chrome glass door, inverter compressor, large capacity',
    '• Capacity: 16 Cu. Ft\n• Type: Double Door\n• Compressor: Inverter\n• Glass door finish\n• Auto defrost\n• Energy efficient: A+\n• Warranty: 10 years compressor',
    [
      'https://dawlance.com/wp-content/uploads/2024/01/9191-WB-Chrome.png',
    ],
  ],
  [
    'Haier HRF-336 13 CuFt', 'refrigerators', 'haier', 85000,
    'Double door, cool pack technology, low voltage',
    '• Capacity: 13 Cu. Ft\n• Type: Double Door\n• Technology: Cool Pack (stays cool 12 hrs)\n• Low voltage operation: 130V\n• Auto defrost\n• Toughened glass shelves',
    [
      'https://haier.com/content/dam/haier-ng/middleeast/en/catalog/refrigerators/hrf-336tss/hrf-336tss-front.png',
    ],
  ],

  // ── ACs ────────────────────────────────────────────────────────────
  [
    'Haier 1 Ton Turbo Cool HSU-12HT DC', 'acs', 'haier', 89000,
    '1 Ton DC inverter, turbo cool, 75% energy saving',
    '• Capacity: 1 Ton (12,000 BTU)\n• Type: DC Inverter\n• Energy Saving: Up to 75%\n• Turbo Cool function\n• Auto restart\n• WiFi optional\n• Self-cleaning\n• Warranty: 1 year PCB, 10 years compressor',
    [
      'https://haier.com/content/dam/haier-ng/middleeast/en/catalog/air-conditioners/hsu-12ht-dc/hsu-12ht-dc-front.png',
    ],
  ],
  [
    'Dawlance 1.5 Ton Elegance 30 Inverter', 'acs', 'dawlance', 129000,
    '1.5 Ton inverter, T3 technology, 5-star energy',
    '• Capacity: 1.5 Ton\n• Type: Inverter\n• Technology: T3 Compressor\n• Energy Star: 5 Star\n• Auto clean filter\n• Wireless remote\n• Heating & cooling\n• Warranty: 1+5 years',
    [
      'https://dawlance.com/wp-content/uploads/2023/03/Elegance-30-Inverter.png',
    ],
  ],

  // ── WASHING MACHINES ──────────────────────────────────────────────
  [
    'Haier 8KG Front Load HW80-BP14878S', 'washing-machines', 'haier', 89000,
    'Inverter motor, steam wash, 1400 RPM',
    '• Capacity: 8 KG\n• Type: Front Load Automatic\n• Motor: Inverter Direct Drive\n• RPM: 1400\n• Programs: 15 wash programs\n• Steam wash function\n• Child lock\n• Energy Class: A+++',
    [
      'https://haier.com/content/dam/haier-ng/middleeast/en/catalog/washing-machines/hw80-bp14878s/hw80-bp14878s-front.png',
    ],
  ],
  [
    'Dawlance DW-7500 Twin Tub 10KG', 'washing-machines', 'dawlance', 39000,
    'Semi-automatic, twin tub, 10KG wash capacity',
    '• Capacity: 10 KG wash, 7 KG spin\n• Type: Semi-Automatic Twin Tub\n• Motor: Copper motor\n• Lint filter\n• Soft close lid\n• Power: 720W\n• Colors: White/Silver',
    [
      'https://dawlance.com/wp-content/uploads/2020/10/DW-7500-Twin.png',
    ],
  ],

  // ── MICROWAVES ─────────────────────────────────────────────────────
  [
    'Haier 25L Digital Microwave HMN-25100EGS', 'microwaves', 'haier', 22000,
    '25L, 900W, 10 power levels, auto cook menus',
    '• Capacity: 25 Litres\n• Power: 900W\n• Power Levels: 10\n• Auto Cook: 8 menus\n• Timer: 30 minutes\n• Child lock safety\n• Digital display\n• Silver finish',
    [
      'https://haier.com/content/dam/haier-ng/middleeast/en/catalog/microwaves/hmn-25100egs/hmn-25100egs-front.png',
    ],
  ],
  [
    'Dawlance Cooking Series MWO-MD7', 'microwaves', 'dawlance', 18000,
    '20L solo microwave, 700W, easy dial control',
    '• Capacity: 20 Litres\n• Power: 700W\n• Type: Solo\n• Control: Mechanical dial\n• Timer: Up to 30 min\n• Interior light\n• White finish\n• 5 power levels',
    [
      'https://dawlance.com/wp-content/uploads/2020/06/MD-7.png',
    ],
  ],

  // ── BIKES ─────────────────────────────────────────────────────────
  [
    'Honda CD 70 2024', 'bikes', 'honda', 169000,
    'Pakistan\'s most popular bike, 70cc, 65km/L mileage',
    '• Engine: 72cc, 4-stroke OHC\n• Max Power: 4.8 bhp @ 7500 RPM\n• Fuel: Petrol, 4.3L tank\n• Mileage: ~65 km/L\n• Brakes: Drum front & rear\n• Weight: 97 kg\n• Colors: Black, Red, Blue\n• Warranty: 2 years',
    [
      'https://www.atlashonda.com.pk/wp-content/uploads/2023/09/CD-70-RED.png',
    ],
  ],
  [
    'Honda CG 125 2024', 'bikes', 'honda', 239000,
    'Classic 125cc, 4-stroke, electric start, 50km/L',
    '• Engine: 124.7cc, 4-stroke OHC\n• Max Power: 9.0 bhp @ 7500 RPM\n• Fuel: Petrol, 12L tank\n• Mileage: ~50 km/L\n• Electric & kick start\n• Front disc brake option\n• Weight: 111 kg\n• Colors: Black, Red, Blue\n• Warranty: 2 years',
    [
      'https://www.atlashonda.com.pk/wp-content/uploads/2023/09/CG125-RED.png',
    ],
  ],
];

function makeProductSvg(name: string, brandSlug: string, catSlug: string): string {
  const colors: Record<string, string> = {
    samsung: '#1428A0', apple: '#1d1d1f', xiaomi: '#FF6900',
    infinix: '#0a7c3e', tecno: '#e65c00', vivo: '#415fff',
    oppo: '#1d4ed8', hp: '#0096D6', dell: '#007DB8', lenovo: '#E2231A',
    haier: '#003087', dawlance: '#00529B', honda: '#CC0000', default: '#2346A0',
  };
  const catEmoji: Record<string, string> = {
    mobiles: '📱', laptops: '💻', leds: '📺', refrigerators: '🧊',
    acs: '❄️', 'washing-machines': '🫧', microwaves: '♨️', bikes: '🏍️',
  };
  const bg   = colors[brandSlug] ?? colors.default;
  const icon = catEmoji[catSlug] ?? '📦';
  const line1 = name.split(' ').slice(0, 3).join(' ');
  const line2 = name.split(' ').slice(3, 6).join(' ');
  const brand = brandSlug.charAt(0).toUpperCase() + brandSlug.slice(1);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${bg}"/><rect x="0" y="0" width="400" height="6" fill="rgba(255,255,255,0.3)"/><text x="200" y="145" font-size="85" text-anchor="middle" dominant-baseline="middle">${icon}</text><text x="200" y="220" font-family="Arial,sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">${line1}</text>${line2 ? `<text x="200" y="252" font-family="Arial,sans-serif" font-size="18" text-anchor="middle" fill="rgba(255,255,255,0.8)">${line2}</text>` : ''}<rect x="150" y="285" width="100" height="2" fill="rgba(255,255,255,0.2)"/><text x="200" y="315" font-family="Arial,sans-serif" font-size="13" text-anchor="middle" fill="rgba(255,255,255,0.7)" letter-spacing="2">${brand.toUpperCase()}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function generatePlans(cashPrice: number) {
  return [
    { durationMonths: 3,  markupPct: 5,  advancePct: 0.30 },
    { durationMonths: 6,  markupPct: 10, advancePct: 0.25 },
    { durationMonths: 12, markupPct: 18, advancePct: 0.20 },
  ].map(({ durationMonths, markupPct, advancePct }) => {
    const markupAmount  = Math.round(cashPrice * markupPct / 100);
    const totalPayable  = cashPrice + markupAmount;
    const advanceAmount = Math.round(totalPayable * advancePct);
    const remaining     = totalPayable - advanceAmount;
    const monthlyAmount = Math.round(remaining / durationMonths);
    return {
      durationMonths,
      markupPercentage: markupPct.toFixed(2),
      markupAmount:     markupAmount.toFixed(2),
      totalPayable:     totalPayable.toFixed(2),
      advanceAmount:    advanceAmount.toFixed(2),
      monthlyAmount:    monthlyAmount.toFixed(2),
      isActive: true,
    };
  });
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main(): Promise<void> {
  console.log('🌱 Starting seed...\n');

  for (const city of CITIES) {
    await prisma.city.upsert({ where: { slug: city.slug }, update: {}, create: { ...city, isActive: true } });
  }
  console.log(`✓ ${CITIES.length} cities`);

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { imageUrl: CAT_IMAGES[cat.slug] ?? null },
      create: { ...cat, isActive: true, imageUrl: CAT_IMAGES[cat.slug] ?? null },
    });
  }
  console.log(`✓ ${CATEGORIES.length} categories`);

  // Faisalabad city-landing pages (longtail local SEO — target Faisalabad first).
  const faisalabad = await prisma.city.findUnique({ where: { slug: 'faisalabad' } });
  const mobilesCat = await prisma.category.findUnique({ where: { slug: 'mobiles' } });
  const laptopsCat = await prisma.category.findUnique({ where: { slug: 'laptops' } });

  if (faisalabad && mobilesCat) {
    await prisma.seoPage.upsert({
      where: { categoryId_cityId: { categoryId: mobilesCat.id, cityId: faisalabad.id } },
      update: {},
      create: {
        path: '/mobile-on-installment-in-faisalabad',
        categoryId: mobilesCat.id,
        cityId: faisalabad.id,
        title: 'Mobile on Installment in Faisalabad — QistPY',
        metaDescription:
          'Buy mobile phones on easy monthly installments in Faisalabad. No credit card needed, our agent calls to confirm, free delivery across Faisalabad and Pakistan.',
        introHtml:
          '<p>Looking to buy a mobile on installment in Faisalabad without a credit card? QistPY is an installment marketplace based right here in Faisalabad, offering easy monthly plans on the latest Samsung, Apple, Xiaomi, Infinix, and Tecno phones. Just pick your phone, choose a 3, 6, or 12 month plan, and our agent calls to confirm your order, no bank account or credit card required.</p>',
        isPublished: true,
      },
    });
  }

  if (faisalabad && laptopsCat) {
    await prisma.seoPage.upsert({
      where: { categoryId_cityId: { categoryId: laptopsCat.id, cityId: faisalabad.id } },
      update: {},
      create: {
        path: '/laptop-on-installment-in-faisalabad',
        categoryId: laptopsCat.id,
        cityId: faisalabad.id,
        title: 'Laptop on Installment in Faisalabad — QistPY',
        metaDescription:
          'Buy laptops on easy monthly installments in Faisalabad. No credit card needed, HP, Dell, and Lenovo laptops with flexible monthly plans, free delivery nationwide.',
        introHtml:
          '<p>Need a laptop on installment in Faisalabad without a credit card? QistPY, based in Faisalabad, offers easy monthly installment plans on HP, Dell, and Lenovo laptops for students and professionals. Choose your plan, submit your CNIC, and our agent confirms your order by phone, no bank credit card required.</p>',
        isPublished: true,
      },
    });
  }
  console.log('✓ Faisalabad SEO landing pages');

  // ---------- Blog ----------
  const blogCatGuides = await prisma.blogCategory.upsert({
    where: { slug: 'buying-guides' },
    update: {},
    create: { name: 'Buying Guides', slug: 'buying-guides' },
  });
  const blogCatTips = await prisma.blogCategory.upsert({
    where: { slug: 'installment-tips' },
    update: {},
    create: { name: 'Installment Tips', slug: 'installment-tips' },
  });
  const blogCatCity = await prisma.blogCategory.upsert({
    where: { slug: 'city-guides' },
    update: {},
    create: { name: 'City Guides', slug: 'city-guides' },
  });

  const BLOG_POSTS: Array<{
    title: string; slug: string; excerpt: string; content: string;
    categoryId: string; metaTitle: string; metaDescription: string;
  }> = [
    {
      title: 'How to Buy a Mobile on Installment in Pakistan Without a Credit Card',
      slug: 'buy-mobile-on-installment-pakistan-without-credit-card',
      excerpt: 'Most installment apps in Pakistan still ask for a bank credit card. Here is how QistPY lets you buy a phone on monthly installments using just your CNIC.',
      categoryId: blogCatGuides.id,
      metaTitle: 'Buy Mobile on Installment in Pakistan Without Credit Card',
      metaDescription: 'A step-by-step guide to buying a mobile phone on easy monthly installments in Pakistan without a credit card, using CNIC verification only.',
      content: `If you have ever tried to buy a phone on installment in Pakistan through a bank, you already know the problem. Most banks want a credit card, a salary slip, sometimes even a guarantor. For a huge number of people in Pakistan, especially anyone running a small shop, working freelance, or just starting their first job, that paperwork is the reason they end up paying full cash instead.

QistPY skips the bank entirely. You do not need a credit card, and you do not need a bank account either. The only document required is your CNIC.

Here is what the process actually looks like.

First, you pick a phone from the catalog and choose a plan, 3, 6, or 12 months. Every plan shows the advance amount and the monthly amount upfront, so there is no surprise markup added later at checkout.

Second, you submit your order along with your CNIC details. This is a one-time verification step. Once it is done, it stays on your account for future orders too.

Third, an agent calls you directly to confirm the order. This call matters more than people expect. It is also QistPY's way of preventing fraudulent orders, since a phone call confirms a real person placed the order, not a bot or a fake account.

Fourth, once the advance is paid through JazzCash, EasyPaisa, bank transfer, or Raast, the phone is delivered to your address, and your monthly installment schedule starts from there.

A few things worth knowing before you order. Late payments add a flat Rs 500 fee plus 1% of the installment amount, so it pays to set a reminder a day or two before each due date. You will also get an SMS and an in-app notification three days before anything is due.

If you are comparing this to other "credit card free" installment platforms in Pakistan, the agent-confirmation step is really the difference. It is slightly slower than an instant approval, but it also means there is a real person checking the order before it ships, which keeps the whole system honest for both buyers and vendors.`,
    },
    {
      title: 'Buy Now Pay Later in Pakistan: How It Actually Works',
      slug: 'buy-now-pay-later-pakistan-how-it-works',
      excerpt: 'Buy now pay later has become a common phrase in Pakistan, but most people are not sure how it is different from a regular bank loan. Here is the breakdown.',
      categoryId: blogCatTips.id,
      metaTitle: 'Buy Now Pay Later Pakistan — Complete Guide',
      metaDescription: 'Understand how buy now pay later works in Pakistan, how it differs from a bank loan or credit card, and what to check before signing up for a plan.',
      content: `Buy now pay later, often shortened to BNPL, is not a new idea, it is just newly popular in Pakistan. The concept is simple: you get the product today, and you pay for it over a set number of months instead of all at once.

Where it gets confusing is when people assume BNPL works exactly like a credit card. It does not, and the difference matters.

A credit card gives you a revolving credit limit you can spend against anything, anywhere, and it usually charges interest if you carry a balance past the due date. A BNPL plan on a platform like QistPY is tied to one specific purchase. You choose the product first, then the plan, and the total amount you will pay is fixed and shown to you before you confirm the order. There is no separate interest rate to calculate, the markup is already built into the monthly amount you see on the product page.

The other big difference is approval. A credit card application can take days or weeks and involves a credit history check most people in Pakistan simply do not have on file. A BNPL order on QistPY is approved much faster, usually within 24 hours, because the only requirement is CNIC verification, not a credit score.

So how do you actually use it? You browse the product, pick a duration, usually 3, 6, 9, or 12 months, and pay a smaller advance upfront. The rest is split evenly across the remaining months. An agent calls to confirm the order before anything ships, then you pay monthly through JazzCash, EasyPaisa, bank transfer, or Raast.

One thing worth being careful about with any BNPL platform, not just QistPY: always check the total amount payable, not just the monthly figure. A low monthly number can look attractive, but if you stretch a plan out to 12 months, the total cost is naturally higher than a 3 month plan for the same product. There is nothing wrong with that, it is the trade-off for smaller monthly payments, just go in knowing the full number.`,
    },
    {
      title: 'Mobile and Laptop on Installment in Faisalabad: A Local Buyer\'s Guide',
      slug: 'mobile-laptop-installment-faisalabad-buyer-guide',
      excerpt: 'QistPY is based in Faisalabad, and that matters for delivery speed and local support. Here is what buyers in the city should know before ordering.',
      categoryId: blogCatCity.id,
      metaTitle: 'Mobile & Laptop on Installment in Faisalabad — Buyer Guide',
      metaDescription: 'A local guide for Faisalabad residents buying mobiles or laptops on easy monthly installments, covering delivery, plans, and what to check before ordering.',
      content: `Most installment platforms running in Pakistan today are based in Lahore or Karachi and treat every other city the same way, as just another delivery zone. QistPY is different in one specific way: it is based in Faisalabad.

That sounds like a small detail, but it changes a few things for buyers in the city.

Delivery within Faisalabad and nearby areas tends to be faster simply because the operational base is local. Support queries, especially the WhatsApp line, are handled by a team that understands the city's neighborhoods and landmarks, which helps when giving delivery instructions for areas that are not always easy to pin on a map app.

If you are in Faisalabad and looking at a mobile on installment, the process is the same as anywhere else in Pakistan, pick the phone, choose a plan, submit CNIC, get a confirmation call. What is worth doing locally is comparing the advance amount across a couple of phone models before deciding. A mid-range Android phone usually has a lower advance than a flagship, which makes the monthly commitment easier to plan around if you are budgeting carefully.

For laptops on installment in Faisalabad, the buyers tend to fall into two groups: students at the local universities needing something for coursework, and small business owners needing a reliable machine for invoicing, design work, or just running a shop's books. For students, a 6 or 9 month plan on a budget HP or Lenovo model usually keeps the monthly amount manageable alongside tuition costs. For business use, it is worth checking the specs a bit more carefully since the laptop will likely run longer hours daily.

One practical tip for anyone in Faisalabad ordering for the first time: have your CNIC and your current address ready before you start checkout, since the agent confirmation call usually happens within the same day, sometimes within a couple of hours. Having your details ready speeds that part up considerably.

You can browse the current mobile and laptop listings for Faisalabad directly through QistPY's Faisalabad-specific pages, which show live stock and pricing rather than a general national catalog.`,
    },
    {
      title: '3, 6, or 12 Month Installment Plan: Which One Should You Pick',
      slug: '3-6-12-month-installment-plan-pakistan-which-to-pick',
      excerpt: 'Every product on QistPY shows multiple plan durations. Picking the wrong one is the most common mistake first-time installment buyers make.',
      categoryId: blogCatTips.id,
      metaTitle: '3 Month vs 6 Month vs 12 Month Installment Plan Pakistan',
      metaDescription: 'How to choose between a 3, 6, or 12 month installment plan in Pakistan based on your monthly budget, total cost, and how long you plan to keep the product.',
      content: `Every product page on QistPY shows a duration selector, usually 3, 6, or 12 months, sometimes 9 as well. New buyers often pick whichever number feels familiar without really comparing what changes between them. There is actually a simple way to think about this decision.

The shorter the plan, the higher your monthly payment, but the lower your total cost. A 3 month plan on a mid-range phone might mean a noticeably bigger monthly amount than the same phone spread across 12 months, but you will pay less overall because the markup is calculated per plan, and shorter plans carry less of it.

The longer the plan, the smaller your monthly payment, but the higher your total cost. A 12 month plan makes a product feel more affordable month to month, which is exactly why it is the most commonly picked option, but it is worth being honest with yourself about whether the smaller monthly number is worth the extra total you will end up paying across the year.

So how do you actually decide? Start with your monthly budget, not the product price. If you know you can comfortably set aside, say, Rs 8,000 a month without it being a stretch, look at which plan duration keeps the monthly amount at or below that number. That is a more reliable method than picking a duration first and hoping the monthly number fits.

Second, think about how long you will realistically keep the product. A phone you will likely upgrade within a year does not need to be stretched across a 12 month plan if you can manage a 6 month one instead, since you will be paying it off closer to when you would naturally want to replace it anyway.

Third, check the total payable amount on the plan details card before confirming, not just the monthly figure. QistPY shows this clearly on every product page: advance amount, monthly amount times duration, and the total. Comparing the total across two or three durations for the same product takes thirty seconds and tells you exactly what the shorter plan is saving you, or what the longer plan is costing you in exchange for lower monthly payments.

There is no universally correct answer here, it depends entirely on your monthly cash flow. The only mistake worth avoiding is picking the longest plan automatically because the monthly number looks smallest, without checking what that convenience actually costs over the full term.`,
    },
  ];

  for (const post of BLOG_POSTS) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        categoryId: post.categoryId,
        language: 'en',
        isPublished: true,
        publishedAt: new Date(),
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
      },
    });
  }
  console.log(`✓ ${BLOG_POSTS.length} blog posts`);

  for (const brand of BRANDS) {
    await prisma.brand.upsert({ where: { slug: brand.slug }, update: {}, create: brand });
  }
  console.log(`✓ ${BRANDS.length} brands`);

  // Admin
  const adminPhone = process.env['SEED_ADMIN_PHONE'] ?? '+923000000001';
  const adminPass  = process.env['SEED_ADMIN_PASSWORD'] ?? 'ChangeMe_123!';
  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: { role: UserRole.ADMIN, passwordHash: await bcrypt.hash(adminPass, 12) },
    create: { phone: adminPhone, name: 'QistPY Admin', passwordHash: await bcrypt.hash(adminPass, 12), role: UserRole.ADMIN, cnic: '0000000000001' },
  });

  // Vendor
  const vendorPhone = '+923001112233';
  const vendorUser  = await prisma.user.upsert({
    where: { phone: vendorPhone },
    update: { role: UserRole.VENDOR },
    create: { phone: vendorPhone, name: 'Ali Traders', passwordHash: await bcrypt.hash('VendorTest123', 12), role: UserRole.VENDOR, cnic: '3520212345679' },
  });
  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: { status: VendorStatus.APPROVED },
    create: { userId: vendorUser.id, businessName: 'Ali Traders Electronics', slug: 'ali-traders-electronics', phone: vendorPhone, status: VendorStatus.APPROVED, platformFeePercent: 5 },
  });
  await prisma.vendorWallet.upsert({
    where: { vendorId: vendor.id },
    update: {},
    create: { vendorId: vendor.id, pendingBalance: 0, clearedBalance: 0, withdrawableBalance: 0 },
  });

  // Customer
  await prisma.user.upsert({
    where: { phone: '+923001234567' },
    update: {},
    create: { phone: '+923001234567', name: 'Test Customer', passwordHash: await bcrypt.hash('TestUser123', 12), role: UserRole.CUSTOMER, cnic: '3540112345678' },
  });

  // Categories lookup
  const allCats   = await prisma.category.findMany();
  const allBrands = await prisma.brand.findMany();
  const catMap    = new Map(allCats.map(c => [c.slug, c.id]));
  const brandMap  = new Map(allBrands.map(b => [b.slug, b.id]));

  let created = 0; let updated = 0;

  for (const [name, catSlug, brandSlug, cashPrice, shortDesc, description, imgUrls] of PRODUCTS) {
    const categoryId = catMap.get(catSlug);
    const brandId    = brandMap.get(brandSlug);
    if (!categoryId) continue;

    const slug     = toSlug(name);
    const fallback = makeProductSvg(name, brandSlug, catSlug);
    const plans    = generatePlans(cashPrice);
    const minAdv   = Math.min(...plans.map(p => Number(p.advanceAmount)));
    const minMo    = Math.min(...plans.map(p => Number(p.monthlyAmount)));

    const existing = await prisma.product.findUnique({ where: { slug }, include: { images: true } });

    if (existing) {
      // Update primary image if needed
      const img = existing.images.find(i => i.isPrimary);
      if (img) {
        await prisma.productImage.update({
          where: { id: img.id },
          data: { url: imgUrls[0] || fallback, publicId: `products/${slug}` },
        });
      }
      updated++;
      continue;
    }

    // Create product with ALL images
    const imageData = imgUrls.length > 0
      ? imgUrls.map((url, idx) => ({
          publicId:  `products/${slug}-${idx}`,
          url,
          alt:       name,
          orderIndex: idx,
          isPrimary:  idx === 0,
        }))
      : [{ publicId: `products/${slug}`, url: fallback, alt: name, orderIndex: 0, isPrimary: true }];

    await prisma.product.create({
      data: {
        vendorId: vendor.id, categoryId, brandId: brandId ?? null,
        name, slug, description, shortDescription: shortDesc,
        cashPrice, stock: 50,
        status: ProductStatus.PUBLISHED,
        lowestAdvance: minAdv.toFixed(2),
        lowestMonthly: minMo.toFixed(2),
        images: { create: imageData },
        plans:  { create: plans },
      },
    });
    created++;
  }

  const total = await prisma.product.count();
  console.log(`✓ Products: ${created} created, ${updated} updated (total: ${total})`);
  console.log('\n✅ Seed complete!');
  console.log(`Admin: ${adminPhone} / ${adminPass}`);
  console.log('Vendor: +923001112233 / VendorTest123');
  console.log('Customer: +923001234567 / TestUser123');
}

main().catch(e => { console.error('❌ Seed failed:', e); process.exit(1); }).finally(() => prisma.$disconnect());
