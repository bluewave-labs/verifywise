import { CommandAction } from './types'
import { logEngine } from '../tools/log.engine'

export interface CommandActionHandlers {
  navigate: (path: string) => void
  modal: (modalType: string) => void
  function: (funcName: string, params?: any) => void
  filter: (filterConfig: any) => void
  export: (exportType: string) => void
}

export class CommandActionHandler {
  private handlers: CommandActionHandlers

  constructor(handlers: CommandActionHandlers) {
    this.handlers = handlers
  }

  execute(action: CommandAction): void {
    try {
      switch (action.type) {
        case 'navigate':
          this.handlers.navigate(action.payload)
          break
        case 'modal':
          this.handlers.modal(action.payload)
          break
        case 'function':
          this.handlers.function(action.payload.name, action.payload.params)
          break
        case 'filter':
          this.handlers.filter(action.payload)
          break
        case 'export':
          this.handlers.export(action.payload)
          break
        default:
          console.warn('Unknown command action type:', action.type)
      }

      // Log command execution
      logEngine({
        type: 'info',
        message: `Command executed: ${action.type} - payload: ${JSON.stringify(action.payload)}`
      })
    } catch (error) {
      console.error('Error executing command:', error)
      logEngine({
        type: 'error',
        message: `Command execution failed: ${action.type} - error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }
}

export default CommandActionHandler