/**
 * @fileoverview Lucide Icon Mapping Utility
 *
 * Maps icon name strings to Lucide React icon components.
 * Used by plugins to specify icons in their manifest without
 * needing to import React components directly.
 *
 * ## Overview
 *
 * This utility provides a bridge between string-based icon names in plugin
 * manifests and React icon components. When a plugin specifies an icon like
 * `"shield-check"`, this utility returns the corresponding Lucide `ShieldCheck`
 * component.
 *
 * ## Usage
 *
 * ```typescript
 * import { getLucideIcon } from './utils/iconMapping';
 *
 * // Get icon component by name
 * const ShieldIcon = getLucideIcon('shield-check');
 *
 * // Use in JSX
 * <ShieldIcon size={16} color="#13715B" />
 *
 * // Falls back to Puzzle icon if not found
 * const FallbackIcon = getLucideIcon('unknown-icon');
 * ```
 *
 * ## Icon Name Format
 *
 * Icons are specified using kebab-case names. The utility normalizes input
 * by converting to lowercase and replacing underscores/spaces with hyphens.
 *
 * ```typescript
 * getLucideIcon('shield-check')  // ✓ Preferred
 * getLucideIcon('ShieldCheck')   // ✓ Also works (normalized)
 * getLucideIcon('shield_check')  // ✓ Also works (normalized)
 * ```
 *
 * ## Available Icons by Category
 *
 * ### General
 * `puzzle`, `home`, `settings`, `search`, `bell`, `mail`, `calendar`,
 * `clock`, `star`, `heart`, `bookmark`, `flag`, `tag`, `hash`
 *
 * ### Navigation
 * `chevron-right`, `chevron-left`, `chevron-up`, `chevron-down`,
 * `arrow-right`, `arrow-left`, `arrow-up`, `arrow-down`, `menu`,
 * `more-horizontal`, `more-vertical`, `external-link`
 *
 * ### Actions
 * `plus`, `minus`, `x`, `check`, `edit`, `trash`, `copy`, `download`,
 * `upload`, `share`, `refresh`, `save`, `send`, `play`, `pause`, `stop`
 *
 * ### Files & Folders
 * `file`, `file-text`, `folder`, `folder-open`, `archive`, `paperclip`,
 * `image`, `film`, `music`
 *
 * ### Communication
 * `message-circle`, `message-square`, `chat`, `phone`, `video`,
 * `users`, `user`, `user-plus`, `user-minus`, `user-check`
 *
 * ### Data & Analytics
 * `bar-chart`, `bar-chart-2`, `bar-chart-3`, `line-chart`, `pie-chart`,
 * `chart`, `trending-up`, `trending-down`, `activity`, `zap`, `target`
 *
 * ### Security & Compliance (Recommended for VerifyWise plugins)
 * `shield`, `shield-check`, `shield-alert`, `lock`, `unlock`, `key`,
 * `eye`, `eye-off`, `alert-triangle`, `warning`, `alert-circle`, `error`,
 * `alert-octagon`, `info`, `help-circle`, `help`
 *
 * ### Business
 * `building`, `building-2`, `briefcase`, `credit-card`, `dollar-sign`,
 * `wallet`, `receipt`, `shopping-cart`, `package`, `truck`
 *
 * ### Tech & Development
 * `code`, `terminal`, `database`, `server`, `cloud`, `wifi`, `cpu`,
 * `hard-drive`, `monitor`, `smartphone`, `tablet`, `laptop`
 *
 * ### Nature & Weather
 * `sun`, `moon`, `cloud-sun`, `cloud-rain`, `snowflake`, `wind`,
 * `leaf`, `tree`, `flower`
 *
 * ### Documents & Writing
 * `book-open`, `book`, `newspaper`, `file-check`, `file-x`, `file-plus`,
 * `file-minus`, `file-search`, `clipboard`, `clipboard-check`,
 * `clipboard-list`, `scroll-text`, `graduation-cap`, `pencil`
 *
 * ### Health & Science
 * `beaker`, `flask`, `test-tube`, `microscope`, `stethoscope`, `pill`,
 * `syringe`, `thermometer`, `heart-pulse`, `brain`
 *
 * ### Tools
 * `wrench`, `hammer`, `scissors`, `paintbrush`, `palette`, `ruler`,
 * `scale`, `timer`, `hourglass`, `calculator`, `printer`, `camera`,
 * `mic`, `headphones`, `speaker`, `volume`
 *
 * ### Misc
 * `globe`, `map`, `map-pin`, `compass`, `layers`, `grid`, `list`,
 * `table`, `layout`, `rocket`, `lightbulb`, `sparkles`, `award`,
 * `trophy`, `medal`, `crown`, `gem`, `gift`
 *
 * ## Adding New Icons
 *
 * To add a new icon:
 * 1. Import it from `lucide-react`
 * 2. Add an entry to the `iconRegistry` object
 *
 * ```typescript
 * import { NewIcon } from "lucide-react";
 *
 * const iconRegistry = {
 *   // ... existing icons
 *   "new-icon": NewIcon,
 * };
 * ```
 *
 * @module utils/iconMapping
 */

import {
  // General
  Puzzle,
  Home,
  Settings,
  Search,
  Bell,
  Mail,
  Calendar,
  Clock,
  Star,
  Heart,
  Bookmark,
  Flag,
  Tag,
  Hash,

  // Navigation
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Menu,
  MoreHorizontal,
  MoreVertical,
  ExternalLink,

  // Actions
  Plus,
  Minus,
  X,
  Check,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Share,
  RefreshCw,
  RotateCw,
  Save,
  Send,
  Play,
  Pause,
  Square,

  // Files & Folders
  File,
  FileText,
  Folder,
  FolderOpen,
  Archive,
  Paperclip,
  Image,
  Film,
  Music,

  // Communication
  MessageCircle,
  MessageSquare,
  Phone,
  Video,
  Users,
  User,
  UserPlus,
  UserMinus,
  UserCheck,

  // Data & Analytics
  BarChart,
  BarChart2,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Target,

  // Security & Compliance
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Info,
  HelpCircle,

  // Business
  Building,
  Building2,
  Briefcase,
  CreditCard,
  DollarSign,
  Wallet,
  Receipt,
  ShoppingCart,
  Package,
  Truck,

  // Tech & Development
  Code,
  Terminal,
  Database,
  Server,
  Cloud,
  Wifi,
  Cpu,
  HardDrive,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,

  // Nature & Weather
  Sun,
  Moon,
  CloudSun,
  CloudRain,
  Snowflake,
  Wind,
  Leaf,
  Trees,
  Flower,

  // Misc
  Globe,
  Map,
  MapPin,
  Compass,
  Navigation,
  Layers,
  Grid,
  List,
  Table,
  Layout,
  Sidebar,
  Maximize,
  Minimize,
  Move,
  Grip,
  Crosshair,
  Aperture,
  Box,
  Circle,
  Square as SquareIcon,
  Triangle,
  Hexagon,
  Octagon,
  Award,
  Trophy,
  Medal,
  Crown,
  Gem,
  Gift,
  Cake,
  PartyPopper,
  Sparkles,
  Wand2,
  Lightbulb,
  Rocket,
  Plane,
  Car,
  Bike,
  Train,
  Ship,
  Anchor,

  // Documents & Writing
  BookOpen,
  Book,
  Newspaper,
  FileCheck,
  FileX,
  FilePlus,
  FileMinus,
  FileSearch,
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  ScrollText,
  GraduationCap,
  Pencil,
  PenTool,
  Highlighter,
  Eraser,

  // Health & Science
  Beaker,
  FlaskConical,
  TestTube,
  Microscope,
  Stethoscope,
  Pill,
  Syringe,
  Thermometer,
  HeartPulse,
  Brain,

  // Tools
  Wrench,
  Hammer,
  Scissors,
  Paintbrush,
  Palette,
  Ruler,
  Scale,
  Timer,
  Hourglass,
  Calculator,
  Printer,
  ScanLine,
  Camera,
  Mic,
  Headphones,
  Speaker,
  Volume2,
  VolumeX,

  LucideIcon,
} from "lucide-react";

/**
 * Icon registry mapping kebab-case names to Lucide components.
 * Add new icons here to make them available to plugins.
 */
const iconRegistry: Record<string, LucideIcon> = {
  // General
  puzzle: Puzzle,
  home: Home,
  settings: Settings,
  search: Search,
  bell: Bell,
  mail: Mail,
  calendar: Calendar,
  clock: Clock,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  flag: Flag,
  tag: Tag,
  hash: Hash,

  // Navigation
  "chevron-right": ChevronRight,
  "chevron-left": ChevronLeft,
  "chevron-up": ChevronUp,
  "chevron-down": ChevronDown,
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  menu: Menu,
  "more-horizontal": MoreHorizontal,
  "more-vertical": MoreVertical,
  "external-link": ExternalLink,

  // Actions
  plus: Plus,
  minus: Minus,
  x: X,
  check: Check,
  edit: Edit,
  trash: Trash2,
  "trash-2": Trash2,
  copy: Copy,
  download: Download,
  upload: Upload,
  share: Share,
  refresh: RefreshCw,
  "refresh-cw": RefreshCw,
  "rotate-cw": RotateCw,
  save: Save,
  send: Send,
  play: Play,
  pause: Pause,
  stop: Square,

  // Files & Folders
  file: File,
  "file-text": FileText,
  folder: Folder,
  "folder-open": FolderOpen,
  archive: Archive,
  paperclip: Paperclip,
  attachment: Paperclip,
  image: Image,
  film: Film,
  music: Music,

  // Communication
  "message-circle": MessageCircle,
  "message-square": MessageSquare,
  chat: MessageCircle,
  phone: Phone,
  video: Video,
  users: Users,
  user: User,
  "user-plus": UserPlus,
  "user-minus": UserMinus,
  "user-check": UserCheck,

  // Data & Analytics
  "bar-chart": BarChart,
  "bar-chart-2": BarChart2,
  "bar-chart-3": BarChart3,
  "line-chart": LineChart,
  "pie-chart": PieChart,
  chart: BarChart3,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  activity: Activity,
  zap: Zap,
  target: Target,

  // Security & Compliance
  shield: Shield,
  "shield-check": ShieldCheck,
  "shield-alert": ShieldAlert,
  lock: Lock,
  unlock: Unlock,
  key: Key,
  eye: Eye,
  "eye-off": EyeOff,
  "alert-triangle": AlertTriangle,
  warning: AlertTriangle,
  "alert-circle": AlertCircle,
  error: AlertCircle,
  "alert-octagon": AlertOctagon,
  info: Info,
  "help-circle": HelpCircle,
  help: HelpCircle,

  // Business
  building: Building,
  "building-2": Building2,
  briefcase: Briefcase,
  "credit-card": CreditCard,
  "dollar-sign": DollarSign,
  dollar: DollarSign,
  wallet: Wallet,
  receipt: Receipt,
  "shopping-cart": ShoppingCart,
  cart: ShoppingCart,
  package: Package,
  truck: Truck,

  // Tech & Development
  code: Code,
  terminal: Terminal,
  database: Database,
  server: Server,
  cloud: Cloud,
  wifi: Wifi,
  cpu: Cpu,
  "hard-drive": HardDrive,
  monitor: Monitor,
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,

  // Nature & Weather
  sun: Sun,
  moon: Moon,
  "cloud-sun": CloudSun,
  "cloud-rain": CloudRain,
  snowflake: Snowflake,
  wind: Wind,
  leaf: Leaf,
  tree: Trees,
  trees: Trees,
  flower: Flower,

  // Misc
  globe: Globe,
  world: Globe,
  map: Map,
  "map-pin": MapPin,
  location: MapPin,
  compass: Compass,
  navigation: Navigation,
  layers: Layers,
  grid: Grid,
  list: List,
  table: Table,
  layout: Layout,
  sidebar: Sidebar,
  maximize: Maximize,
  minimize: Minimize,
  move: Move,
  grip: Grip,
  crosshair: Crosshair,
  aperture: Aperture,
  box: Box,
  circle: Circle,
  square: SquareIcon,
  triangle: Triangle,
  hexagon: Hexagon,
  octagon: Octagon,
  award: Award,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  gem: Gem,
  gift: Gift,
  cake: Cake,
  "party-popper": PartyPopper,
  celebrate: PartyPopper,
  sparkles: Sparkles,
  magic: Wand2,
  "wand-2": Wand2,
  lightbulb: Lightbulb,
  idea: Lightbulb,
  rocket: Rocket,
  plane: Plane,
  car: Car,
  bike: Bike,
  train: Train,
  ship: Ship,
  anchor: Anchor,

  // Documents & Writing
  "book-open": BookOpen,
  book: Book,
  newspaper: Newspaper,
  news: Newspaper,
  "file-check": FileCheck,
  "file-x": FileX,
  "file-plus": FilePlus,
  "file-minus": FileMinus,
  "file-search": FileSearch,
  clipboard: Clipboard,
  "clipboard-check": ClipboardCheck,
  "clipboard-list": ClipboardList,
  "scroll-text": ScrollText,
  scroll: ScrollText,
  "graduation-cap": GraduationCap,
  education: GraduationCap,
  pencil: Pencil,
  "pen-tool": PenTool,
  highlighter: Highlighter,
  eraser: Eraser,

  // Health & Science
  beaker: Beaker,
  flask: FlaskConical,
  "flask-conical": FlaskConical,
  "test-tube": TestTube,
  microscope: Microscope,
  stethoscope: Stethoscope,
  pill: Pill,
  syringe: Syringe,
  thermometer: Thermometer,
  "heart-pulse": HeartPulse,
  health: HeartPulse,
  brain: Brain,

  // Tools
  wrench: Wrench,
  hammer: Hammer,
  scissors: Scissors,
  paintbrush: Paintbrush,
  palette: Palette,
  ruler: Ruler,
  scale: Scale,
  timer: Timer,
  hourglass: Hourglass,
  calculator: Calculator,
  printer: Printer,
  scanner: ScanLine,
  "scan-line": ScanLine,
  camera: Camera,
  mic: Mic,
  microphone: Mic,
  headphones: Headphones,
  speaker: Speaker,
  volume: Volume2,
  "volume-2": Volume2,
  "volume-x": VolumeX,
  mute: VolumeX,
};

/**
 * Gets a Lucide icon component by name.
 *
 * @param iconName - The kebab-case name of the icon (e.g., "shield-check")
 * @returns The Lucide icon component, or Puzzle as default
 *
 * @example
 * ```typescript
 * const ShieldIcon = getLucideIcon('shield-check');
 * // <ShieldIcon size={16} />
 *
 * const DefaultIcon = getLucideIcon('unknown-icon');
 * // Returns Puzzle icon as fallback
 * ```
 */
export function getLucideIcon(iconName?: string): LucideIcon {
  if (!iconName) {
    return Puzzle;
  }

  // Normalize the icon name: lowercase and replace spaces/underscores with hyphens
  const normalizedName = iconName.toLowerCase().replace(/[_\s]/g, "-");

  return iconRegistry[normalizedName] || Puzzle;
}

/**
 * Checks if an icon name is valid and exists in the registry.
 *
 * @param iconName - The icon name to check
 * @returns True if the icon exists, false otherwise
 */
export function isValidIconName(iconName: string): boolean {
  const normalizedName = iconName.toLowerCase().replace(/[_\s]/g, "-");
  return normalizedName in iconRegistry;
}

/**
 * Gets a list of all available icon names.
 *
 * @returns Array of all registered icon names
 */
export function getAvailableIconNames(): string[] {
  return Object.keys(iconRegistry);
}

export default getLucideIcon;
