/**
 * @fileoverview Wise Search Hook
 *
 * Custom React hook for managing Wise Search state and functionality.
 * Handles debouncing, caching, recent searches, and API integration.
 *
 * @module application/hooks/useWiseSearch
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  performWiseSearch,
  GroupedSearchResults,
  SearchResult,
  getEntityDisplayName,
} from "../repository/search.repository";
import PolicyTemplates from "../data/PolicyTemplates.json";

/**
 * Recent search entry
 */
export interface RecentSearch {
  query: string;
  timestamp: number;
}

/**
 * Hook return type
 */
export interface UseWiseSearchReturn {
  /** Current search query */
  query: string;
  /** Set search query */
  setQuery: (query: string) => void;
  /** Search results grouped by entity */
  results: GroupedSearchResults;
  /** Flattened results array */
  flatResults: SearchResult[];
  /** Whether search is in progress */
  isLoading: boolean;
  /** Error message if search failed */
  error: string | null;
  /** Total number of results */
  totalCount: number;
  /** Recent searches (last 5) */
  recentSearches: RecentSearch[];
  /** Clear recent searches */
  clearRecentSearches: () => void;
  /** Add a search to recent */
  addToRecent: (query: string) => void;
  /** Remove a specific search from recent */
  removeFromRecent: (timestamp: number) => void;
  /** Whether search mode is active (query >= 3 chars) */
  isSearchMode: boolean;
}

const RECENT_SEARCHES_KEY = "verifywise_recent_searches";
const MAX_RECENT_SEARCHES = 5;
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

/**
 * Search policy templates locally (from JSON file)
 */
function searchPolicyTemplates(query: string): SearchResult[] {
  const lowerQuery = query.toLowerCase();

  return (PolicyTemplates as { id: number; title: string; description: string }[])
    .filter(
      (template) =>
        template.title.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 20)
    .map((template) => {
      const titleMatch = template.title.toLowerCase().includes(lowerQuery);
      return {
        id: template.id,
        entityType: "policy_templates",
        title: template.title,
        matchedField: titleMatch ? "title" : "description",
        matchedValue: titleMatch ? template.title : template.description,
        route: `/policies/templates?templateId=${template.id}`,
        icon: "FileText",
      };
    });
}

/**
 * Load recent searches from localStorage
 */
function loadRecentSearches(): RecentSearch[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Filter out old searches (older than 7 days)
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return parsed.filter((s: RecentSearch) => s.timestamp > weekAgo).slice(0, MAX_RECENT_SEARCHES);
    }
  } catch (e) {
    console.error("Failed to load recent searches:", e);
  }
  return [];
}

/**
 * Save recent searches to localStorage
 */
function saveRecentSearches(searches: RecentSearch[]): void {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_RECENT_SEARCHES)));
  } catch (e) {
    console.error("Failed to save recent searches:", e);
  }
}

/**
 * Custom hook for Wise Search functionality
 *
 * @returns Search state and controls
 */
export function useWiseSearch(): UseWiseSearchReturn {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedSearchResults>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => loadRecentSearches());

  // AbortController for canceling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);
  // Debounce timer
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Whether we're in search mode (query has enough characters)
  const isSearchMode = query.trim().length >= MIN_QUERY_LENGTH;

  // Flatten results for easier iteration
  const flatResults: SearchResult[] = Object.values(results).flatMap((group) => group.results);

  // Perform the actual search
  const performSearch = useCallback(async (searchQuery: string) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't search if query is too short
    if (searchQuery.trim().length < MIN_QUERY_LENGTH) {
      setResults({});
      setTotalCount(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    try {
      // Perform API search and local policy templates search in parallel
      const [apiResponse, policyTemplateResults] = await Promise.all([
        performWiseSearch({ q: searchQuery, limit: 20, signal: abortControllerRef.current?.signal }),
        Promise.resolve(searchPolicyTemplates(searchQuery)),
      ]);

      // Check if this request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Merge results
      const mergedResults = { ...apiResponse.data.results };

      // Add policy templates if there are matches
      if (policyTemplateResults.length > 0) {
        mergedResults.policy_templates = {
          results: policyTemplateResults,
          count: policyTemplateResults.length,
          icon: "FileText",
        };
      }

      setResults(mergedResults);
      setTotalCount(apiResponse.data.totalCount + policyTemplateResults.length);
    } catch (err: unknown) {
      // Ignore abort/cancel errors (axios uses CanceledError, native fetch uses AbortError)
      if (
        err instanceof Error &&
        (err.name === "AbortError" || err.name === "CanceledError" || (err as { code?: string }).code === "ERR_CANCELED")
      ) {
        return;
      }

      console.error("Wise Search error:", err);
      setError(err instanceof Error ? err.message : "Search failed");
      setResults({});
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounced search
    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, performSearch]);

  // Add to recent searches
  const addToRecent = useCallback((searchQuery: string) => {
    if (searchQuery.trim().length < MIN_QUERY_LENGTH) return;

    setRecentSearches((prev) => {
      // Remove duplicates
      const filtered = prev.filter((s) => s.query.toLowerCase() !== searchQuery.toLowerCase());
      // Add new search at the beginning
      const updated = [{ query: searchQuery, timestamp: Date.now() }, ...filtered].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      // Save to localStorage
      saveRecentSearches(updated);
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  // Remove a specific recent search by timestamp
  const removeFromRecent = useCallback((timestamp: number) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s.timestamp !== timestamp);
      saveRecentSearches(updated);
      return updated;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    flatResults,
    isLoading,
    error,
    totalCount,
    recentSearches,
    clearRecentSearches,
    addToRecent,
    removeFromRecent,
    isSearchMode,
  };
}

export { getEntityDisplayName };
