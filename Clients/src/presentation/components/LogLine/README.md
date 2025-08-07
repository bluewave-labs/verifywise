# LogLine Component

A reusable component for displaying individual log lines with automatic log level detection and styling.

## Features

- **Log Level Detection**: Automatically detects and styles different log levels (error, warn, info, debug)
- **Line Numbers**: Displays line numbers for easy reference
- **Syntax Highlighting**: Color-coded styling based on log level
- **Monospace Font**: Uses monospace font for better log readability
- **Hover Effects**: Subtle hover effects for better UX
- **Responsive Design**: Adapts to different screen sizes

## Usage

```tsx
import LogLine from "../../../components/LogLine";

const MyComponent = () => {
  const logLines = [
    "2025-01-30 10:30:15 INFO Server started on port 3000",
    "2025-01-30 10:30:16 ERROR Database connection failed",
    "2025-01-30 10:30:17 WARN High memory usage detected",
  ];

  return (
    <div>
      {logLines.map((line, index) => (
        <LogLine key={index} line={line} index={index} />
      ))}
    </div>
  );
};
```

## Props

- `line: string` - The log line text to display
- `index: number` - The line number (0-based index)

## Log Level Styling

The component automatically detects log levels and applies appropriate styling:

- **ERROR**: Red text with light red background
- **WARN**: Orange text with light orange background
- **SUCCESS/SUCCESSFUL**: Green text with light green background
- **INFO**: Blue text with light blue background
- **DEBUG**: Purple text with light purple background
- **Default**: Standard text color with transparent background

## Styling Features

- **Line Numbers**: Right-aligned, non-selectable line numbers
- **Monospace Font**: Uses monospace font for consistent character spacing
- **Word Wrapping**: Handles long lines with proper word breaking
- **Hover Effects**: Subtle background color change on hover
- **Border Separators**: Light borders between log lines
