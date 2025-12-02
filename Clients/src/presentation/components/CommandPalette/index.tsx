import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { Command } from 'cmdk'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Typography, CircularProgress, Button } from '@mui/material'
import * as Dialog from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import {
  Search,
  FolderTree,
  Flag,
  Building2,
  GitBranch,
  AlertTriangle,
  GraduationCap,
  FileText,
  Brain,
  Shield,
  AlertCircle,
  Clock,
  X,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  ChevronRight,
  LucideIcon
} from 'lucide-react'
import { useAuth } from '../../../application/hooks/useAuth'
import commandRegistry from '../../../application/commands/registry'
import CommandActionHandler, { CommandActionHandlers } from '../../../application/commands/actionHandler'
import { Command as CommandType, CommandContext } from '../../../application/commands/types'
import { useWiseSearch, getEntityDisplayName } from '../../../application/hooks/useWiseSearch'
import { SearchResult } from '../../../infrastructure/api/searchService'
import './styles.css'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// localStorage key for tracking if user has dismissed the welcome banner
const WISE_SEARCH_WELCOME_DISMISSED_KEY = 'verifywise_wise_search_welcome_dismissed'

// Map entity types to icons
const ENTITY_ICONS: Record<string, LucideIcon> = {
  projects: FolderTree,
  tasks: Flag,
  vendors: Building2,
  vendor_risks: AlertTriangle,
  model_inventories: GitBranch,
  evidence_hub: FileText,
  project_risks: AlertTriangle,
  file_manager: FileText,
  policy_manager: Shield,
  policy_templates: FileText,
  ai_trust_center_resources: Brain,
  ai_trust_center_subprocessors: Building2,
  training_registar: GraduationCap,
  incident_management: AlertCircle,
}

// Welcome banner component
const WiseSearchWelcomeBanner: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <Box
    sx={{
      background: 'linear-gradient(135deg, #1a1a1f 0%, #252530 100%)',
      borderRadius: '8px',
      padding: '16px 20px',
      margin: '8px',
      marginBottom: '12px',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Decorative gradient blob */}
    <Box
      sx={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(19, 113, 91, 0.3) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}
    />

    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#ffffff',
            letterSpacing: '-0.01em',
            mb: 2,
          }}
        >
          Wise Search
        </Typography>

        <Typography
          sx={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1.5,
            mb: 3,
          }}
        >
          Search across all projects, tasks, vendors, policies, and more in your workspace. Start typing to find anything instantly.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={onDismiss}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 16px',
              borderRadius: '4px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
              },
            }}
          >
            Got it
          </Button>
        </Box>
      </Box>

      <Box
        component="button"
        onClick={onDismiss}
        sx={{
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          color: 'rgba(255, 255, 255, 0.5)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
          },
        }}
        aria-label="Dismiss welcome message"
      >
        <X size={16} />
      </Box>
    </Box>
  </Box>
)

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userRoleName } = useAuth()

  // Detect if user is on Mac for keyboard shortcuts
  const isMac = useMemo(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.platform?.toLowerCase().includes('mac') ||
             navigator.userAgent?.toLowerCase().includes('mac')
    }
    return false
  }, [])

  // Track if welcome banner should be shown
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false)

  // Check localStorage on mount to see if user has dismissed the banner
  useEffect(() => {
    const dismissed = localStorage.getItem(WISE_SEARCH_WELCOME_DISMISSED_KEY)
    if (!dismissed) {
      setShowWelcomeBanner(true)
    }
  }, [])

  // Handler to dismiss the welcome banner
  const handleDismissWelcome = useCallback(() => {
    setShowWelcomeBanner(false)
    localStorage.setItem(WISE_SEARCH_WELCOME_DISMISSED_KEY, 'true')
  }, [])

  // Wise Search integration
  const {
    query: search,
    setQuery: setSearch,
    results: searchResults,
    flatResults,
    isLoading: isSearching,
    totalCount,
    recentSearches,
    addToRecent,
    removeFromRecent,
    isSearchMode
  } = useWiseSearch()

  // Create command context
  const commandContext: CommandContext = useMemo(() => ({
    currentPath: location.pathname,
    userRole: userRoleName || 'Viewer',
    permissions: [],
    searchTerm: isSearchMode ? '' : search // Only filter commands when not in search mode
  }), [location.pathname, userRoleName, search, isSearchMode])

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

  // Group search results by entity type with deduplication
  const groupedSearchResults = useMemo(() => {
    return Object.entries(searchResults).map(([entityType, data]) => {
      // Deduplicate results by id within each entity type
      const seenIds = new Set<number>()
      const uniqueResults = data.results.filter((result) => {
        if (seenIds.has(result.id)) {
          return false
        }
        seenIds.add(result.id)
        return true
      })
      return {
        entityType,
        displayName: getEntityDisplayName(entityType),
        results: uniqueResults,
        count: uniqueResults.length
      }
    })
  }, [searchResults])

  // Command action handlers
  const actionHandlers: CommandActionHandlers = useMemo(() => ({
    navigate: (path: string) => {
      navigate(path)
      onOpenChange(false)
    },

    modal: (modalType: string) => {
      console.log('Open modal:', modalType)
      onOpenChange(false)
    },

    function: (funcName: string, params?: unknown) => {
      switch (funcName) {
        case 'navigateToSettingsTab':
          navigate('/settings', { state: { activeTab: params } })
          break
        default:
          console.log('Execute function:', funcName, params)
      }
      onOpenChange(false)
    },

    filter: (filterConfig: unknown) => {
      console.log('Apply filter:', filterConfig)
      onOpenChange(false)
    },

    export: (exportType: string) => {
      console.log('Export:', exportType)
      onOpenChange(false)
    }
  }), [navigate, onOpenChange])

  const actionHandler = useMemo(() => new CommandActionHandler(actionHandlers), [actionHandlers])

  const handleCommandSelect = useCallback((command: CommandType) => {
    actionHandler.execute(command.action)
  }, [actionHandler])

  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    // Add to recent searches
    addToRecent(search)
    // Navigate to the result
    navigate(result.route)
    onOpenChange(false)
  }, [navigate, onOpenChange, addToRecent, search])

  const handleRecentSearchClick = useCallback((query: string) => {
    setSearch(query)
  }, [setSearch])

  const handleRemoveRecentSearch = useCallback((e: React.MouseEvent, timestamp: number) => {
    e.stopPropagation()
    removeFromRecent(timestamp)
  }, [removeFromRecent])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }, [onOpenChange])

  // Reset search when closing
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setSearch('')
    }
    onOpenChange(newOpen)
  }, [onOpenChange, setSearch])

  if (!open) return null

  return (
    <Command.Dialog
      open={open}
      onOpenChange={handleOpenChange}
      className="command-dialog"
      onKeyDown={handleKeyDown}
      aria-describedby="command-palette-description"
      value=""
      onValueChange={() => {}}
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
          placeholder="Search for everything, everywhere..."
          className="command-input"
          aria-label="Search commands"
          aria-describedby="command-palette-help"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />

        <div id="command-palette-help" className="sr-only">
          {isSearchMode
            ? `${totalCount} results found. Type to search across all data.`
            : `${commands.length} commands available. Type to filter commands.`
          }
        </div>

        <Command.List className="command-list">
          {/* Welcome Banner - shown only for first-time users */}
          {showWelcomeBanner && !search && (
            <WiseSearchWelcomeBanner onDismiss={handleDismissWelcome} />
          )}

          {/* Loading state for search */}
          {isSearching && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3 }}>
              <CircularProgress size={20} sx={{ color: '#13715B' }} />
              <Typography sx={{ ml: 2, color: '#666' }}>Searching...</Typography>
            </Box>
          )}

          {/* Empty state */}
          {!isSearching && isSearchMode && flatResults.length === 0 && (
            <Command.Empty className="command-empty">
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Search size={24} color="#999" />
                <Typography color="text.secondary">
                  No results found for "{search}"
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Try different keywords or check spelling
                </Typography>
              </Box>
            </Command.Empty>
          )}

          {/* Search Results */}
          {isSearchMode && !isSearching && flatResults.length > 0 && (
            <>
              <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#999', fontWeight: 400 }}>
                  {totalCount} result{totalCount !== 1 ? 's' : ''} found
                </Typography>
              </Box>

              {groupedSearchResults.map(({ entityType, displayName, results }) => (
                <Command.Group key={entityType} heading={displayName} className="command-group">
                  {results.map((result) => {
                    const IconComponent = ENTITY_ICONS[entityType] || FileText
                    return (
                      <Command.Item
                        key={`${entityType}-${result.id}`}
                        value={`${entityType}-${result.id}-${result.title} ${result.subtitle || ''}`}
                        onSelect={() => handleSearchResultSelect(result)}
                        className="command-item"
                        role="option"
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                          <Box
                            sx={{
                              color: '#7B9A7A',
                              opacity: 0.8,
                              display: 'flex',
                              alignItems: 'center',
                              marginRight: '4px'
                            }}
                            aria-hidden="true"
                          >
                            <IconComponent size={16} />
                          </Box>
                          <Box sx={{ flex: 1, overflow: 'hidden' }}>
                            <Typography variant="body2" className="command-item-title" noWrap>
                              {result.title}
                            </Typography>
                          </Box>
                          <Box
                            className="command-item-chevron"
                            sx={{
                              color: '#999',
                              display: 'flex',
                              alignItems: 'center',
                              opacity: 0,
                              transition: 'opacity 0.15s ease-in-out',
                            }}
                            aria-hidden="true"
                          >
                            <ChevronRight size={14} />
                          </Box>
                        </Box>
                      </Command.Item>
                    )
                  })}
                </Command.Group>
              ))}
            </>
          )}

          {/* Commands (show when not in search mode) */}
          {!isSearchMode && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && !search && (
                <Command.Group heading="Recent searches" className="command-group">
                  {recentSearches.map((recent) => (
                    <Command.Item
                      key={recent.timestamp}
                      value={`recent ${recent.query}`}
                      onSelect={() => handleRecentSearchClick(recent.query)}
                      className="command-item"
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                        <Clock size={16} color="#7B9A7A" opacity={0.8} style={{ marginRight: '4px' }} />
                        <Typography variant="body2" sx={{ flex: 1 }}>{recent.query}</Typography>
                        <Box
                          component="button"
                          onClick={(e: React.MouseEvent) => handleRemoveRecentSearch(e, recent.timestamp)}
                          sx={{
                            background: 'none',
                            border: 'none',
                            padding: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            color: '#999',
                            '&:hover': {
                              background: 'rgba(0, 0, 0, 0.05)',
                              color: '#666',
                            },
                          }}
                          aria-label={`Remove "${recent.query}" from recent searches`}
                        >
                          <X size={14} />
                        </Box>
                      </Box>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Empty className="command-empty">
                <Typography color="text.secondary">
                  No commands found for "{search}"
                </Typography>
              </Command.Empty>

              {groupedCommands.map(({ group, commands: groupCommands }: { group: { id: string; label: string; priority: number }, commands: CommandType[] }) => (
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
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
                        <Typography variant="body2" className="command-item-title" sx={{ flex: 0, whiteSpace: 'nowrap' }}>
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
                        <Box
                          className="command-item-chevron"
                          sx={{
                            color: '#999',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0,
                            transition: 'opacity 0.15s ease-in-out',
                            marginLeft: command.shortcut || command.description ? '8px' : 'auto',
                          }}
                          aria-hidden="true"
                        >
                          <ChevronRight size={14} />
                        </Box>
                      </Box>
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </>
          )}
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
            <Box className="command-footer-key" sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <ArrowUp size={10} />
              <ArrowDown size={10} />
            </Box>
            <Typography sx={{ fontSize: '10px', color: '#666' }}>Navigate</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box className="command-footer-key" sx={{ display: 'flex', alignItems: 'center' }}>
              <CornerDownLeft size={10} />
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
            <Typography sx={{ fontSize: '10px', color: '#666' }}>You can use</Typography>
            <Box className="command-footer-key">
              {isMac ? '⌘' : 'Ctrl'}
            </Box>
            <Box className="command-footer-key">
              K
            </Box>
            <Typography sx={{ fontSize: '10px', color: '#666' }}>to easily open Wise Search</Typography>
          </Box>
        </Box>
      </div>
    </Command.Dialog>
  )
}

export default CommandPalette
