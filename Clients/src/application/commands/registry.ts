import { Command, CommandGroup, CommandContext, CommandRegistry } from './types'
import allowedRoles from '../constants/permissions'
import {
  HomeOutlined,
  WarningAmberOutlined,
  BusinessOutlined,
  AccountTreeOutlined,
  SchoolOutlined,
  FolderOutlined,
  TimelineOutlined,
  AccountBalanceOutlined,
  BalanceOutlined,
  SettingsOutlined,
  AssignmentOutlined,
  PolicyOutlined,
  VerifiedUserOutlined,
  AddCircleOutlineOutlined,
  FileDownloadOutlined,
  FilterAltOutlined,
  GroupOutlined,
  AssessmentOutlined
} from '@mui/icons-material'

// Define command groups
export const COMMAND_GROUPS: CommandGroup[] = [
  { id: 'navigation', label: 'Navigation', priority: 1 },
  { id: 'actions', label: 'Actions', priority: 2 },
  { id: 'search', label: 'Search', priority: 3 },
  { id: 'filters', label: 'Filters', priority: 4 },
  { id: 'admin', label: 'Administration', priority: 5 },
  { id: 'help', label: 'Help', priority: 6 }
]

// Core navigation commands
const NAVIGATION_COMMANDS: Command[] = [
  {
    id: 'nav-dashboard',
    label: 'Dashboard',
    description: 'Go to main dashboard',
    keywords: ['home', 'overview', 'main'],
    group: COMMAND_GROUPS[0],
    icon: HomeOutlined,
    action: { type: 'navigate', payload: '/' }
  },
  {
    id: 'nav-risk-management',
    label: 'Risk Management',
    description: 'Manage and monitor risks',
    keywords: ['risks', 'threats', 'vulnerabilities'],
    group: COMMAND_GROUPS[0],
    icon: WarningAmberOutlined,
    action: { type: 'navigate', payload: '/risk-management' }
  },
  {
    id: 'nav-vendors',
    label: 'Vendors',
    description: 'Manage vendor relationships',
    keywords: ['suppliers', 'partners', 'third-party'],
    group: COMMAND_GROUPS[0],
    icon: BusinessOutlined,
    action: { type: 'navigate', payload: '/vendors' }
  },
  {
    id: 'nav-model-inventory',
    label: 'Model Inventory',
    description: 'AI/ML model management',
    keywords: ['models', 'ai', 'ml', 'machine learning'],
    group: COMMAND_GROUPS[0],
    icon: AccountTreeOutlined,
    action: { type: 'navigate', payload: '/model-inventory' }
  },
  {
    id: 'nav-training',
    label: 'Training Registry',
    description: 'AI training programs',
    keywords: ['training', 'education', 'courses'],
    group: COMMAND_GROUPS[0],
    icon: SchoolOutlined,
    action: { type: 'navigate', payload: '/training' }
  },
  {
    id: 'nav-file-manager',
    label: 'File Manager',
    description: 'Evidence and documents',
    keywords: ['files', 'documents', 'evidence'],
    group: COMMAND_GROUPS[0],
    icon: FolderOutlined,
    action: { type: 'navigate', payload: '/file-manager' }
  },
  {
    id: 'nav-event-tracker',
    label: 'Event Tracker',
    description: 'Event tracking and audit logs',
    keywords: ['logs', 'events', 'audit', 'monitoring', 'watch', 'tower'],
    group: COMMAND_GROUPS[0],
    icon: TimelineOutlined,
    action: { type: 'navigate', payload: '/event-tracker' }
  },
  {
    id: 'nav-framework',
    label: 'Framework',
    description: 'Organizational framework view',
    keywords: ['compliance', 'frameworks', 'iso', 'eu ai act', 'organizational'],
    group: COMMAND_GROUPS[0],
    icon: AccountBalanceOutlined,
    action: { type: 'navigate', payload: '/framework' }
  },
  {
    id: 'nav-fairness',
    label: 'Bias & Fairness',
    description: 'AI bias and fairness dashboard',
    keywords: ['bias', 'fairness', 'ml', 'evaluation', 'ethics'],
    group: COMMAND_GROUPS[0],
    icon: BalanceOutlined,
    action: { type: 'navigate', payload: '/fairness-dashboard' }
  },
  {
    id: 'nav-settings',
    label: 'Settings',
    description: 'System configuration',
    keywords: ['settings', 'config', 'preferences'],
    group: COMMAND_GROUPS[0],
    icon: SettingsOutlined,
    action: { type: 'navigate', payload: '/setting' }
  },
  {
    id: 'nav-tasks',
    label: 'Tasks',
    description: 'Task management',
    keywords: ['tasks', 'todo', 'assignments'],
    group: COMMAND_GROUPS[0],
    icon: AssignmentOutlined,
    action: { type: 'navigate', payload: '/tasks' }
  },
  {
    id: 'nav-policies',
    label: 'Policy Manager',
    description: 'Manage organizational policies',
    keywords: ['policies', 'policy', 'governance'],
    group: COMMAND_GROUPS[0],
    icon: PolicyOutlined,
    action: { type: 'navigate', payload: '/policies' }
  },
  {
    id: 'nav-ai-trust',
    label: 'AI Trust Center',
    description: 'AI transparency and trust',
    keywords: ['trust', 'transparency', 'ai'],
    group: COMMAND_GROUPS[0],
    icon: VerifiedUserOutlined,
    action: { type: 'navigate', payload: '/ai-trust-center' }
  }
]

// Quick action commands
const ACTION_COMMANDS: Command[] = [
  {
    id: 'action-create-risk',
    label: 'Create New Risk',
    description: 'Add a new risk to the system',
    keywords: ['new', 'add', 'create', 'risk'],
    group: COMMAND_GROUPS[1],
    icon: AddCircleOutlineOutlined,
    action: { type: 'modal', payload: 'create-risk' },
    requiredRole: ['Admin', 'Editor'],
    scope: 'projectRisks.create'
  },
  {
    id: 'action-create-vendor',
    label: 'Create New Vendor',
    description: 'Add a new vendor',
    keywords: ['new', 'add', 'create', 'vendor'],
    group: COMMAND_GROUPS[1],
    icon: AddCircleOutlineOutlined,
    action: { type: 'modal', payload: 'create-vendor' },
    requiredRole: ['Admin', 'Editor'],
    scope: 'vendors.create'
  },
  {
    id: 'action-create-project',
    label: 'Create New Project',
    description: 'Start a new project',
    keywords: ['new', 'add', 'create', 'project'],
    group: COMMAND_GROUPS[1],
    icon: AddCircleOutlineOutlined,
    action: { type: 'modal', payload: 'create-project' },
    requiredRole: ['Admin', 'Editor'],
    scope: 'projects.create'
  },
  {
    id: 'action-ai-risks',
    label: 'Import from AI Risk Database',
    description: 'Add risks from MIT AI database',
    keywords: ['import', 'ai', 'database', 'mit'],
    group: COMMAND_GROUPS[1],
    icon: FileDownloadOutlined,
    action: { type: 'modal', payload: 'ai-risk-import' },
    requiredRole: ['Admin', 'Editor'],
    scope: 'projectRisks.create'
  }
]

// Filter commands
const FILTER_COMMANDS: Command[] = [
  {
    id: 'filter-high-risks',
    label: 'Show High Priority Risks',
    description: 'Filter risks by high priority',
    keywords: ['filter', 'high', 'priority', 'critical'],
    group: COMMAND_GROUPS[3],
    icon: FilterAltOutlined,
    action: { type: 'filter', payload: { type: 'risk-level', value: 'high' } }
  },
  {
    id: 'filter-pending-vendors',
    label: 'Show Pending Vendors',
    description: 'Filter vendors pending review',
    keywords: ['filter', 'pending', 'review'],
    group: COMMAND_GROUPS[3],
    icon: FilterAltOutlined,
    action: { type: 'filter', payload: { type: 'vendor-status', value: 'pending' } }
  }
]

// Admin commands
const ADMIN_COMMANDS: Command[] = [
  {
    id: 'admin-team',
    label: 'Manage Team',
    description: 'User and team management',
    keywords: ['team', 'users', 'members'],
    group: COMMAND_GROUPS[4],
    icon: GroupOutlined,
    action: { type: 'function', payload: { name: 'navigateToSettingsTab', params: 'team' } },
    requiredRole: ['Admin'],
    scope: 'projects.editTeamMembers'
  },
  {
    id: 'admin-export-data',
    label: 'Export System Data',
    description: 'Generate system report',
    keywords: ['export', 'data', 'report'],
    group: COMMAND_GROUPS[4],
    icon: AssessmentOutlined,
    action: { type: 'export', payload: 'system-report' },
    requiredRole: ['Admin']
  }
]

class CommandRegistryImpl implements CommandRegistry {
  private _commands: Command[] = []
  private _groups: CommandGroup[] = COMMAND_GROUPS

  constructor() {
    // Register default commands
    this._commands = [
      ...NAVIGATION_COMMANDS,
      ...ACTION_COMMANDS,
      ...FILTER_COMMANDS,
      ...ADMIN_COMMANDS
    ]
  }

  get commands(): Command[] {
    return this._commands
  }

  get groups(): CommandGroup[] {
    return this._groups
  }

  getCommands(context: CommandContext): Command[] {
    return this._commands.filter(command => {
      // Check permissions
      if (command.requiredRole && !command.requiredRole.includes(context.userRole)) {
        return false
      }

      // Check specific scope permissions
      if (command.scope) {
        const [resource, action] = command.scope.split('.')
        const resourcePermissions = (allowedRoles as any)[resource]
        if (resourcePermissions && resourcePermissions[action]) {
          const hasPermission = resourcePermissions[action].includes(context.userRole)
          if (!hasPermission) return false
        }
      }

      // Filter by search term if provided
      if (context.searchTerm) {
        const searchLower = context.searchTerm.toLowerCase()
        const matchesLabel = command.label.toLowerCase().includes(searchLower)
        const matchesDescription = command.description?.toLowerCase().includes(searchLower)
        const matchesKeywords = command.keywords?.some(keyword =>
          keyword.toLowerCase().includes(searchLower)
        )

        return matchesLabel || matchesDescription || matchesKeywords
      }

      return true
    }).sort((a, b) => a.group.priority - b.group.priority)
  }

  registerCommand(command: Command): void {
    const existingIndex = this._commands.findIndex(c => c.id === command.id)
    if (existingIndex >= 0) {
      this._commands[existingIndex] = command
    } else {
      this._commands.push(command)
    }
  }

  unregisterCommand(commandId: string): void {
    this._commands = this._commands.filter(c => c.id !== commandId)
  }
}

export const commandRegistry = new CommandRegistryImpl()
export default commandRegistry