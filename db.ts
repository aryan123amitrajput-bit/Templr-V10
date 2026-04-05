
export interface Template {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string; // Added field for real profile pics
  authorBanner?: string; // Added field for real profile banners
  imageUrl: string; // Used for iframe preview if data-uri
  bannerUrl: string; 
  likes: number;
  views: number;
  isLiked: boolean;
  category: string;
  tags?: string[];
  description: string;
  price: string; 
  sourceCode: string; // The actual code
  
  fileUrl?: string; // External Link (or DL link if zip)
  fileName?: string; 
  fileType?: string; // 'link' | 'code' | 'zip' | 'image'
  fileSize?: number;
  status: 'approved' | 'pending_review' | 'rejected' | 'draft';
  sales: number;
  earnings: number;

  galleryImages?: string[];
  videoUrl?: string;
  createdAt?: number;
}

// Helper for iframe previews
const codePreviewColor = (color: string) => `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="%23000"/><rect width="100%" height="100%" fill="${color}" opacity="0.5"/></svg>`;

// --- IMAGES ---
// Using reliable Picsum and other stable sources
const imgCyber = "https://picsum.photos/seed/cyber/800/600";
const imgSaaS = "https://picsum.photos/seed/saas/800/600";
const imgMobile = "https://picsum.photos/seed/mobile/800/600";
const imgArt = "https://picsum.photos/seed/art/800/600";
const imgDash = "https://picsum.photos/seed/dash/800/600";
const imgCrypto = "https://picsum.photos/seed/crypto/800/600";
const imgDark = "https://picsum.photos/seed/dark/800/600";
const imgMinimal = "https://picsum.photos/seed/minimal/800/600";

export const templates: Template[] = [
  // 1. STATE: BOTH (Link + Code)
  { 
    id: '1', 
    title: 'Neon Cyber Portfolio', 
    author: 'NexusDesigns', 
    imageUrl: imgCyber, 
    bannerUrl: imgCyber, 
    videoUrl: '', 
    likes: 1340, 
    views: 25000, 
    isLiked: false, 
    category: 'Portfolio', 
    tags: ['dark', 'cyberpunk', 'portfolio', 'neon'], 
    description: 'A dark, futuristic portfolio template with neon accents. Includes full source code and a live demo link.', 
    price: 'Free', 
    status: 'approved', 
    sales: 120, 
    earnings: 5880, 
    fileUrl: 'https://example.com', 
    sourceCode: '// Full React Source Code Included\nexport default function App() {\n  return <div>Welcome to CyberSpace</div>\n}',
    fileType: 'code',
    createdAt: Date.now()
  },
  
  // 2. STATE: LINK ONLY
  { 
    id: '2', 
    title: 'Modern SaaS Landing', 
    author: 'PixelPerfect', 
    imageUrl: imgSaaS, 
    bannerUrl: imgSaaS, 
    likes: 2100, 
    views: 42000, 
    isLiked: false, 
    category: 'SaaS', 
    tags: ['landing', 'saas', 'clean'], 
    description: 'Clean and modern landing page for startups. Live link provided for inspiration, source code is private.', 
    price: 'Free', 
    status: 'approved', 
    sales: 0, 
    earnings: 0, 
    fileUrl: 'https://ui.shadcn.com', 
    sourceCode: '', // Empty code triggers Link Only mode
    fileType: 'link',
    createdAt: Date.now() - 100000 
  },
  
  // 3. STATE: VISUALS ONLY
  { 
    id: '3', 
    title: 'Abstract Concept UI', 
    author: 'ArtStationPro', 
    imageUrl: imgArt, 
    bannerUrl: imgArt, 
    likes: 980, 
    views: 18000, 
    isLiked: false, 
    category: 'Concept', 
    tags: ['art', 'concept', 'visual'], 
    description: 'Just a visual exploration of a futuristic HUD. No source code or live link included. Purely for visual inspiration.', 
    price: 'Free', 
    status: 'approved', 
    sales: 45, 
    earnings: 0, 
    fileUrl: '', // Empty URL
    sourceCode: '', // Empty Code
    fileType: 'image',
    createdAt: Date.now() - 200000 
  },
  
  // 4. STATE: CODE ONLY
  { 
    id: '4', 
    title: 'Glassmorphism Admin', 
    author: 'DevMaster', 
    imageUrl: imgDash, 
    bannerUrl: imgDash, 
    likes: 3420, 
    views: 15600, 
    isLiked: true, 
    category: 'Dashboard', 
    tags: ['glass', 'admin', 'dashboard'], 
    description: 'A stunning high-fidelity dashboard. No live preview available, but full React code is ready to download.', 
    price: 'Free', 
    status: 'approved', 
    sales: 85, 
    earnings: 5015, 
    fileUrl: '', // Empty URL
    sourceCode: '<div class="glass-panel">Dashboard</div>', // Has Code
    fileType: 'code',
    createdAt: Date.now() - 300000 
  },

  // 5. BOTH (Mobile App)
  { 
    id: '5', 
    title: 'Fintech Mobile App', 
    author: 'MobileKing', 
    imageUrl: imgMobile, 
    bannerUrl: imgMobile, 
    likes: 850, 
    views: 12000, 
    isLiked: false, 
    category: 'Mobile', 
    tags: ['finance', 'mobile', 'ios'], 
    description: 'Complete React Native layout for a finance app. Includes Expo link and source code.', 
    price: 'Free', 
    status: 'approved', 
    sales: 200, 
    earnings: 5800, 
    fileUrl: 'https://expo.dev', 
    sourceCode: 'const App = () => <View>...</View>', 
    fileType: 'code',
    createdAt: Date.now() - 400000 
  },

  // 6. LINK ONLY (Crypto)
  { 
    id: '6', 
    title: 'DeFi Exchange', 
    author: 'CryptoWhale', 
    imageUrl: imgCrypto, 
    bannerUrl: imgCrypto, 
    likes: 3000, 
    views: 60000, 
    isLiked: false, 
    category: 'Crypto', 
    tags: ['web3', 'crypto', 'dark'], 
    description: 'A live decentralized exchange interface. Code is proprietary, but check the live link for layout ideas.', 
    price: 'Free', 
    status: 'approved', 
    sales: 0, 
    earnings: 0, 
    fileUrl: 'https://uniswap.org', 
    sourceCode: '', 
    fileType: 'link',
    createdAt: Date.now() - 500000 
  },

  // 7. VISUALS ONLY (Dark Mode Concept)
  { 
    id: '7', 
    title: 'Obsidian Dashboard', 
    author: 'DarkMatter', 
    imageUrl: imgDark, 
    bannerUrl: imgDark, 
    likes: 450, 
    views: 5000, 
    isLiked: false, 
    category: 'Concept', 
    tags: ['dark', 'minimal', 'concept'], 
    description: 'High contrast dark mode concept. Image only.', 
    price: 'Free', 
    status: 'approved', 
    sales: 0, 
    earnings: 0, 
    fileUrl: '', 
    sourceCode: '', 
    fileType: 'image',
    createdAt: Date.now() - 600000 
  },

  // 8. CODE ONLY (Utils)
  { 
    id: '8', 
    title: 'React Hooks Library', 
    author: 'HookMaster', 
    imageUrl: imgMinimal, 
    bannerUrl: imgMinimal, 
    likes: 5000, 
    views: 10000, 
    isLiked: false, 
    category: 'Blog', 
    tags: ['hooks', 'utils', 'react'], 
    description: 'A collection of essential custom hooks. Download to use in your project.', 
    price: 'Free', 
    status: 'approved', 
    sales: 0, 
    earnings: 0, 
    fileUrl: '', 
    sourceCode: 'export const useWindowSize = () => { ... }', 
    fileType: 'code',
    createdAt: Date.now() - 700000 
  },

  // 9. BOTH (E-commerce)
  { 
    id: '9', 
    title: 'Luxe Fashion Store', 
    author: 'TrendSetter', 
    imageUrl: imgArt, 
    bannerUrl: imgArt, 
    likes: 1200, 
    views: 22000, 
    isLiked: false, 
    category: 'E-commerce', 
    tags: ['fashion', 'store', 'shop'], 
    description: 'Fully responsive e-commerce template with cart logic.', 
    price: 'Free', 
    status: 'approved', 
    sales: 50, 
    earnings: 1950, 
    fileUrl: 'https://shopify.com', 
    sourceCode: 'const Cart = () => ...', 
    fileType: 'code',
    createdAt: Date.now() - 800000 
  },

  // 10. VISUALS ONLY (3D Render)
  { 
    id: '10', 
    title: 'Isometric City', 
    author: 'PolyPush', 
    imageUrl: imgCyber, 
    bannerUrl: imgCyber, 
    likes: 670, 
    views: 8900, 
    isLiked: false, 
    category: 'Concept', 
    tags: ['3d', 'blender', 'render'], 
    description: '3D render of a cyber city. Visual reference.', 
    price: 'Free', 
    status: 'approved', 
    sales: 0, 
    earnings: 0, 
    fileUrl: '', 
    sourceCode: '', 
    fileType: 'image',
    createdAt: Date.now() - 900000 
  },

  // 11. LINK ONLY (Blog)
  { 
    id: '11', 
    title: 'Minimalist Ghost Theme', 
    author: 'WriteSpace', 
    imageUrl: imgMinimal, 
    bannerUrl: imgMinimal, 
    likes: 890, 
    views: 14500, 
    isLiked: false, 
    category: 'Blog', 
    tags: ['blog', 'writing', 'minimal'], 
    description: 'Distraction-free reading experience. Live demo available.', 
    price: 'Free', 
    status: 'approved', 
    sales: 30, 
    earnings: 570, 
    fileUrl: 'https://ghost.org', 
    sourceCode: '', 
    fileType: 'link',
    createdAt: Date.now() - 1000000 
  },

  // 12. CODE ONLY (Algorithms)
  { 
    id: '12', 
    title: 'Sorting Visualizer', 
    author: 'AlgoExpert', 
    imageUrl: imgDash, 
    bannerUrl: imgDash, 
    likes: 4100, 
    views: 32000, 
    isLiked: false, 
    category: 'Dashboard', 
    tags: ['algo', 'cs', 'learning'], 
    description: 'React components for visualizing sorting algorithms.', 
    price: 'Free', 
    status: 'approved', 
    sales: 0, 
    earnings: 0, 
    fileUrl: '', 
    sourceCode: 'function bubbleSort(arr) { ... }', 
    fileType: 'code',
    createdAt: Date.now() - 1100000 
  },
];
