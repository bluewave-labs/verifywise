import type { ArticleContent } from '../../contentTypes';

export const analyticsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The Analytics page shows LLM usage, costs, and guardrail activity across your organization. Every request through the AI Gateway is tracked with cost, token count, latency, and model.',
    },
    {
      type: 'heading',
      id: 'summary-cards',
      level: 2,
      text: 'Summary cards',
    },
    {
      type: 'paragraph',
      text: '4 stat cards at the top show metrics for the selected time period:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Total cost', text: 'Combined spend across all endpoints and providers' },
        { bold: 'Total requests', text: 'Number of completion and embedding requests processed' },
        { bold: 'Total tokens', text: 'Combined prompt and completion tokens across all requests' },
        { bold: 'Avg latency', text: 'Average round-trip time from request to complete response' },
      ],
    },
    {
      type: 'heading',
      id: 'time-period',
      level: 2,
      text: 'Time period selector',
    },
    {
      type: 'paragraph',
      text: 'Use the dropdown in the top right to switch between Today, 7 days, 30 days, and 90 days. Your selection is saved and persists across sessions. When "Today" is selected, the cost chart shows hourly bars instead of a daily trend line.',
    },
    {
      type: 'heading',
      id: 'cost-chart',
      level: 2,
      text: 'Cost over time',
    },
    {
      type: 'paragraph',
      text: 'For "Today", a bar chart shows cost per hour across all 24 hours of the day. For longer periods (7d, 30d, 90d), a line chart shows the daily cost trend. Hover over any data point to see the exact cost.',
    },
    {
      type: 'heading',
      id: 'cost-by-model',
      level: 2,
      text: 'Cost by model',
    },
    {
      type: 'paragraph',
      text: 'A horizontal bar chart showing spend per LLM model. If you run multiple models for different tasks, check whether a lighter model for simpler tasks could cut costs.',
    },
    {
      type: 'heading',
      id: 'cost-by-endpoint',
      level: 2,
      text: 'Cost by endpoint',
    },
    {
      type: 'paragraph',
      text: 'A ranked list showing spend and request volume per endpoint. Each entry shows the endpoint name, request count, and total cost.',
    },
    {
      type: 'heading',
      id: 'top-users',
      level: 2,
      text: 'Top users',
    },
    {
      type: 'paragraph',
      text: 'The top 10 users ranked by spend, with request count, token usage, and cost per user.',
    },
    {
      type: 'heading',
      id: 'guardrails-activity',
      level: 2,
      text: 'Guardrails activity',
    },
    {
      type: 'paragraph',
      text: 'This section appears when guardrail rules are active and have triggered during the selected period. It shows:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Blocked', text: 'Number of requests rejected by guardrail rules' },
        { bold: 'Masked', text: 'Number of requests where content was redacted before reaching the LLM' },
        { text: 'A breakdown by guardrail type (PII detection vs content filter) and action taken' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Compliance evidence',
      text: 'Analytics data can be used as compliance evidence for EU AI Act Article 12 (record-keeping) and ISO 42001 Clause 9 (performance evaluation). Every request is logged with timestamps, model, cost, and guardrail results.',
    },
  ],
};
