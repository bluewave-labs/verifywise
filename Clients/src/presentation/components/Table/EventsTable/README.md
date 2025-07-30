# EventsTable Component

A reusable table component for displaying system events with pagination, following the same design patterns as other table components in the project.

## Features

- **Pagination**: Built-in pagination with configurable rows per page
- **Event Type Badges**: Color-coded badges for different event types (Create, Read, Update, Delete, Error)
- **Timestamp Formatting**: Displays date and time (hours, minutes, seconds) in a readable format
- **Loading States**: Shows loading indicator while fetching data
- **Empty States**: Displays placeholder when no data is available
- **Responsive Design**: Adapts to different screen sizes
- **Consistent Styling**: Follows the project's design system

## Usage

```tsx
import EventsTable from "../../../components/Table/EventsTable";
import { Event } from "../../../../domain/types/Event";

const MyComponent = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return <EventsTable data={events} isLoading={isLoading} paginated={true} />;
};
```

## Props

- `data: Event[]` - Array of event objects to display
- `isLoading?: boolean` - Shows loading state when true
- `paginated?: boolean` - Enables/disables pagination (default: true)

## Event Type Structure

```typescript
interface Event {
  id: number;
  event_type: "Create" | "Read" | "Update" | "Delete" | "Error";
  description: string;
  user_id: number;
  timestamp: string; // ISO date string (e.g., "2025-01-30T14:30:25.000Z")
}
```

## Timestamp Format

Timestamps are displayed in the format: `"1 November 2024, 14:30:25"` (day month year, hours:minutes:seconds)

## Event Type Colors

- **Create**: Green (#c8e6c9, #388e3c)
- **Read**: Blue (#bbdefb, #1976d2)
- **Update**: Yellow (#fff9c4, #fbc02d)
- **Delete**: Red (#ffcdd2, #d32f2f)
- **Error**: Orange (#ffccbc, #e64a19)
