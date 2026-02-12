/**
 * Identity Enricher - Maps user identifiers and IP addresses
 * to organizational identities (names, departments, etc.).
 *
 * This module provides optional identity enrichment. Organizations
 * can provide user directory mappings to enhance event data.
 */

import { ShadowAIEvent } from "../types/shadow-ai-event";

export interface IdentityMapping {
  identifier: string; // email, username, or IP
  full_name?: string;
  department?: string;
  title?: string;
  location?: string;
  manager?: string;
}

export class IdentityEnricher {
  private mappings: Map<string, IdentityMapping>;

  constructor(initialMappings?: IdentityMapping[]) {
    this.mappings = new Map();
    if (initialMappings) {
      this.loadMappings(initialMappings);
    }
  }

  /**
   * Load identity mappings from an array (e.g., from LDAP/AD export or CSV).
   */
  loadMappings(mappings: IdentityMapping[]): void {
    for (const mapping of mappings) {
      this.mappings.set(mapping.identifier.toLowerCase(), mapping);
    }
  }

  /**
   * Clear all loaded mappings.
   */
  clearMappings(): void {
    this.mappings.clear();
  }

  /**
   * Enrich a single event with identity information.
   */
  enrich(event: ShadowAIEvent): ShadowAIEvent {
    if (!event.user_identifier) return event;

    const mapping = this.mappings.get(event.user_identifier.toLowerCase());
    if (!mapping) return event;

    return {
      ...event,
      department: event.department || mapping.department,
      metadata: {
        ...event.metadata,
        enriched_name: mapping.full_name,
        enriched_title: mapping.title,
        enriched_location: mapping.location,
        enriched_manager: mapping.manager,
      },
    };
  }

  /**
   * Enrich a batch of events.
   */
  enrichBatch(events: ShadowAIEvent[]): ShadowAIEvent[] {
    return events.map((e) => this.enrich(e));
  }

  /**
   * Get the number of loaded mappings.
   */
  getMappingCount(): number {
    return this.mappings.size;
  }

  /**
   * Look up a specific identity.
   */
  lookup(identifier: string): IdentityMapping | undefined {
    return this.mappings.get(identifier.toLowerCase());
  }
}
