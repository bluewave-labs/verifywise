/**
 * Inventory Engine - Maintains the AI tool inventory by processing
 * normalized events and updating tool discovery records.
 */

import { ShadowAIEvent } from "../types/shadow-ai-event";
import {
  ShadowAIInventoryItem,
  AIToolCategory,
  ToolRiskClassification,
} from "../types/inventory";
import { AIToolEntry } from "../normalization/ai-tool.registry";

export interface InventoryUpdateResult {
  tool_name: string;
  is_new_discovery: boolean;
  updated_fields: string[];
}

export class InventoryEngine {
  /**
   * Process an event and return the inventory update that should be applied.
   * The actual DB write is handled by the backend controller/utils.
   */
  processEvent(
    event: ShadowAIEvent,
    toolEntry: AIToolEntry | null,
    existingItem: ShadowAIInventoryItem | null
  ): {
    inventoryUpdate: Partial<ShadowAIInventoryItem>;
    isNew: boolean;
  } {
    if (existingItem) {
      // Update existing inventory item
      const departments = new Set(existingItem.departments || []);
      if (event.department) {
        departments.add(event.department);
      }

      return {
        inventoryUpdate: {
          last_seen: event.timestamp,
          total_events: (existingItem.total_events || 0) + 1,
          departments: Array.from(departments),
          // unique_users needs to be computed at the DB level
        },
        isNew: false,
      };
    }

    // Create new inventory item
    const domain = this.extractDomain(event.destination_url || "");
    return {
      inventoryUpdate: {
        tool_name: event.ai_tool_name,
        tool_domain: domain,
        category: (toolEntry?.category || event.ai_tool_category || "other") as AIToolCategory,
        first_seen: event.timestamp,
        last_seen: event.timestamp,
        total_events: 1,
        unique_users: event.user_identifier ? 1 : 0,
        departments: event.department ? [event.department] : [],
        risk_classification: (toolEntry?.default_risk || "unclassified") as ToolRiskClassification,
        approval_status: "discovered",
      },
      isNew: true,
    };
  }

  /**
   * Process a batch of events and return inventory updates.
   */
  processBatch(
    events: ShadowAIEvent[],
    toolEntries: Map<string, AIToolEntry>,
    existingItems: Map<string, ShadowAIInventoryItem>
  ): Map<string, { inventoryUpdate: Partial<ShadowAIInventoryItem>; isNew: boolean }> {
    const updates = new Map<string, { inventoryUpdate: Partial<ShadowAIInventoryItem>; isNew: boolean }>();

    for (const event of events) {
      const toolEntry = toolEntries.get(event.ai_tool_name) || null;
      const existing = existingItems.get(event.ai_tool_name) || null;

      const result = this.processEvent(event, toolEntry, existing);
      const currentUpdate = updates.get(event.ai_tool_name);

      if (currentUpdate) {
        // Merge with existing batch update
        const mergedDepts = new Set([
          ...(currentUpdate.inventoryUpdate.departments || []),
          ...(result.inventoryUpdate.departments || []),
        ]);
        currentUpdate.inventoryUpdate = {
          ...currentUpdate.inventoryUpdate,
          ...result.inventoryUpdate,
          total_events: (currentUpdate.inventoryUpdate.total_events || 0) + 1,
          departments: Array.from(mergedDepts),
        };
      } else {
        updates.set(event.ai_tool_name, result);
      }
    }

    return updates;
  }

  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return parsed.hostname;
    } catch {
      return url;
    }
  }
}
