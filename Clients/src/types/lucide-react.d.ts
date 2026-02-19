/**
 * Type declaration for lucide-react.
 * Ensures TypeScript can resolve the module when the package's own types fail to load.
 */
declare module "lucide-react" {
  import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
  }

  export type LucideIcon = ForwardRefExoticComponent<
    LucideProps & RefAttributes<SVGSVGElement>
  >;

  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const CirclePlus: LucideIcon;
  export const FileText: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Save: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const Trash2: LucideIcon;
  export const Info: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Settings: LucideIcon;
  export const Check: LucideIcon;
  export const Database: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Upload: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Plus: LucideIcon;
  export const Layers: LucideIcon;
  export const FileSearch: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Bot: LucideIcon;
  export const Clock: LucideIcon;
  export const Play: LucideIcon;
  export const Beaker: LucideIcon;
  export const Activity: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const Star: LucideIcon;
  export const Coins: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const Minus: LucideIcon;
  export const X: LucideIcon;
  export const Pencil: LucideIcon;
  export const Shield: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Download: LucideIcon;
  export const Copy: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const XCircle: LucideIcon;
  export const Users: LucideIcon;
  export const UserCheck: LucideIcon;
  export const Percent: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const ChevronsUpDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const MoreVertical: LucideIcon;
  export const Loader2: LucideIcon;
  export const Link: LucideIcon;
  export const Unlink: LucideIcon;
  export const BookOpen: LucideIcon;
  export const Maximize2: LucideIcon;
  export const Minimize2: LucideIcon;
  export const Send: LucideIcon;
  export const FolderPlus: LucideIcon;
  export const List: LucideIcon;
  export const GitCommitVertical: LucideIcon;
  export const Search: LucideIcon;
  export const Key: LucideIcon;
  export const FileSpreadsheet: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const User: LucideIcon;
  export const GitBranch: LucideIcon;
  export const Edit3: LucideIcon;
  export const FlaskConical: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Award: LucideIcon;
  export const Workflow: LucideIcon;
  export const KeyRound: LucideIcon;
  export const Swords: LucideIcon;
  export const Home: LucideIcon;
  export const Puzzle: LucideIcon;
  export const CircleDashed: LucideIcon;
  export const CircleDot: LucideIcon;
  export const CircleDotDashed: LucideIcon;
  export const CircleCheck: LucideIcon;
  export const Image: LucideIcon;
  export const FileType: LucideIcon;
  export const History: LucideIcon;
  export const Ban: LucideIcon;
  export const ShieldX: LucideIcon;
  export const Mail: LucideIcon;
  export const Building2: LucideIcon;
  export const Rows3: LucideIcon;
  export const Filter: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Timer: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const SaveIcon: LucideIcon;
  export const DeleteIcon: LucideIcon;
}
