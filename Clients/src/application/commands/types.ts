export interface Command {
  id: string
  label: string
  description?: string
  keywords?: string[]
  group: CommandGroup
  action: CommandAction
  icon?: React.ComponentType<any>
  shortcut?: string[]
  requiredRole?: string[]
  scope?: string
}

export interface CommandGroup {
  id: string
  label: string
  priority: number
}

export interface CommandAction {
  type: 'navigate' | 'modal' | 'function' | 'filter' | 'export'
  payload?: any
}

export interface CommandContext {
  currentPath: string
  userRole: string
  permissions: string[]
  searchTerm?: string
}

export interface CommandRegistry {
  commands: Command[]
  groups: CommandGroup[]
  getCommands: (context: CommandContext) => Command[]
  registerCommand: (command: Command) => void
  unregisterCommand: (commandId: string) => void
}