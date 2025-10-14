import React, { useState, useCallback, useMemo } from 'react'
import { Command } from 'cmdk'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import * as Dialog from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useAuth } from '../../../application/hooks/useAuth'
import commandRegistry from '../../../application/commands/registry'
import CommandActionHandler, { CommandActionHandlers } from '../../../application/commands/actionHandler'
import { Command as CommandType, CommandContext } from '../../../application/commands/types'
import './styles.css'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { userRoleName } = useAuth()

  // Create command context
  const commandContext: CommandContext = useMemo(() => ({
    currentPath: location.pathname,
    userRole: userRoleName || 'Viewer',
    permissions: [], // This could be expanded based on your permission system
    searchTerm: search
  }), [location.pathname, userRoleName, search])


  // Get filtered commands
  const commands = useMemo(() => {
    return commandRegistry.getCommands(commandContext)
  }, [commandContext])

  // Group commands by their group
  const groupedCommands = useMemo(() => {
    const groups = new Map()

    commands.forEach(command => {
      const groupId = command.group.id
      if (!groups.has(groupId)) {
        groups.set(groupId, {
          group: command.group,
          commands: []
        })
      }
      groups.get(groupId).commands.push(command)
    })

    return Array.from(groups.values()).sort((a, b) => a.group.priority - b.group.priority)
  }, [commands])

  // Command action handlers - memoized to prevent unnecessary re-renders
  const actionHandlers: CommandActionHandlers = useMemo(() => ({
    navigate: (path: string) => {
      navigate(path)
      onOpenChange(false)
    },

    modal: (modalType: string) => {
      // This will be implemented to trigger modals
      console.log('Open modal:', modalType)
      onOpenChange(false)
      // TODO: Implement modal triggers based on your modal system
    },

    function: (funcName: string, params?: unknown) => {
      switch (funcName) {
        case 'navigateToSettingsTab':
          // Navigate to settings page with specific tab
          navigate('/setting', { state: { activeTab: params } })
          break
        default:
          console.log('Execute function:', funcName, params)
      }
      onOpenChange(false)
    },

    filter: (filterConfig: unknown) => {
      // This will be implemented for filtering
      console.log('Apply filter:', filterConfig)
      onOpenChange(false)
    },

    export: (exportType: string) => {
      // This will be implemented for exports
      console.log('Export:', exportType)
      onOpenChange(false)
    }
  }), [navigate, onOpenChange])

  const actionHandler = useMemo(() => new CommandActionHandler(actionHandlers), [actionHandlers])

  const handleCommandSelect = useCallback((command: CommandType) => {
    actionHandler.execute(command.action)
  }, [actionHandler])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }, [onOpenChange])

  if (!open) return null

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="command-dialog"
      onKeyDown={handleKeyDown}
      aria-describedby="command-palette-description"
    >
      <Dialog.Title asChild>
        <VisuallyHidden>Command Palette</VisuallyHidden>
      </Dialog.Title>
      <div className="command-dialog-content">
        <div id="command-palette-description" className="sr-only">
          Search for commands, navigate to pages, or perform actions using keyboard shortcuts.
          Use arrow keys to navigate, Enter to select, and Escape to close.
        </div>

        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Search for commands, pages, or actions..."
          className="command-input"
          aria-label="Search commands"
          aria-describedby="command-palette-help"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />

        <div id="command-palette-help" className="sr-only">
          {commands.length} commands available. Type to filter commands.
        </div>

        <Command.List className="command-list">
          <Command.Empty className="command-empty">
            <Typography color="text.secondary">
              No commands found for "{search}"
            </Typography>
          </Command.Empty>


          {groupedCommands.map(({ group, commands: groupCommands }: { group: any, commands: CommandType[] }) => (
            <Command.Group key={group.id} heading={group.label} className="command-group">
              {groupCommands.map((command) => (
                <Command.Item
                  key={command.id}
                  value={`${command.label} ${command.description} ${command.keywords?.join(' ')}`}
                  onSelect={() => handleCommandSelect(command)}
                  className="command-item"
                  role="option"
                  aria-describedby={command.description ? `desc-${command.id}` : undefined}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                    {command.icon && (
                      <Box
                        sx={{
                          color: '#7B9A7A',
                          opacity: 0.8,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        aria-hidden="true"
                      >
                        <command.icon size={16} strokeWidth={1.5} />
                      </Box>
                    )}
                    <Typography variant="body2" fontWeight={500} sx={{ flex: 0, whiteSpace: 'nowrap' }}>
                      {command.label}
                    </Typography>
                    {command.description && (
                      <Typography
                        id={`desc-${command.id}`}
                        variant="caption"
                        sx={{
                          marginLeft: 'auto',
                          color: '#999',
                          opacity: 0.8
                        }}
                        aria-label={`Description: ${command.description}`}
                      >
                        {command.description}
                      </Typography>
                    )}
                    {command.shortcut && (
                      <Box sx={{ display: 'flex', gap: 0.5 }} aria-label={`Keyboard shortcut: ${command.shortcut.join(' ')}`}>
                        {command.shortcut.map((key: string, index: number) => (
                          <Typography
                            key={index}
                            variant="caption"
                            sx={{
                              backgroundColor: 'rgba(0, 0, 0, 0.1)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px'
                            }}
                            aria-hidden="true"
                          >
                            {key}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>

        {/* Navigation hints footer */}
        <Box className="command-footer" sx={{
          padding: '4px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: '10px',
          minHeight: '24px'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box className="command-footer-key">
              ↑↓
            </Box>
            <Typography sx={{ fontSize: '10px', color: '#666' }}>Navigate</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box className="command-footer-key">
              ↵
            </Box>
            <Typography sx={{ fontSize: '10px', color: '#666' }}>Select</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box className="command-footer-key">
              esc
            </Box>
            <Typography sx={{ fontSize: '10px', color: '#666' }}>Close</Typography>
          </Box>

          <Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box className="command-footer-key">
              ⌘K
            </Box>
          </Box>
        </Box>
      </div>
    </Command.Dialog>
  )
}

export default CommandPalette