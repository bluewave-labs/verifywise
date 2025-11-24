# VerifyWise Sidebar Chat - Table Integration Guide

## Overview

The VerifyWise Sidebar Chat system provides a comments/chat interface that can be integrated with any table in the application. Each table row can have its own independent chat thread and file attachments.

**Two integration methods available:**
- **Easy Method** (Recommended): Use the `TableWithComments` component for automatic integration
- **Manual Method**: Use individual components for maximum customization

## Architecture

The system consists of several key components:

### 1. **SidebarChatContext** (`src/presentation/contexts/SidebarChatContext.tsx`)
Global React context that manages:
- Sidebar open/closed state
- Current row context (tableId, rowId, rowLabel)
- Methods to open, close, and toggle the sidebar

### 2. **ChatIconColumn** (`src/presentation/components/ChatIconColumn/`)
Reusable component that renders the chat icon in the first column of tables.
- Shows a message count badge
- Highlights when active
- Handles click to open/close sidebar

### 3. **VerifyWiseSidebarChat** (`src/presentation/components/VerifyWiseSidebarChat/`)
The core sidebar UI component with:
- Chat and Files tabs
- Message display with emoji reactions
- File upload/download capabilities
- Row context display in header

### 4. **ConnectedSidebarChat** (`src/presentation/components/ConnectedSidebarChat/`)
Wrapper component that:
- Connects to SidebarChatContext
- Loads messages/files when row changes
- Only renders when sidebar is open
- Manages data fetching and state

### 5. **TableWithComments** (`src/presentation/components/TableWithComments/`)
Automated wrapper component (Easy Method) that:
- Automatically adds chat icon column as first column
- Handles all ChatIconColumn rendering
- Takes column configuration and data
- Reduces integration to a single component

---

## Easy Method: TableWithComments Component (Recommended)

This is the simplest way to add comments to any table. Just 2 steps:

### Step 1: Wrap Your Application

At the root level of your application or page:

```tsx
import { SidebarChatProvider } from '../../contexts/SidebarChatContext';
import ConnectedSidebarChat from '../../components/ConnectedSidebarChat';

function YourPage() {
  return (
    <SidebarChatProvider>
      <Box sx={{ padding: 3 }}>
        {/* Your page content */}
      </Box>

      {/* Global sidebar */}
      <ConnectedSidebarChat
        onLoadMessages={handleLoadMessages}
        onLoadFiles={handleLoadFiles}
        onSendMessage={handleSendMessage}
        onUploadFile={handleUploadFile}
        onDownloadFile={handleDownloadFile}
        onRemoveFile={handleRemoveFile}
        onAddReaction={handleAddReaction}
        onRemoveReaction={handleRemoveReaction}
      />
    </SidebarChatProvider>
  );
}
```

### Step 2: Use TableWithComments Component

Replace your table with the TableWithComments component:

```tsx
import TableWithComments from '../../components/TableWithComments';

<TableWithComments
  tableId="risk-management"
  columns={[
    {
      id: 'title',
      label: 'Risk Title',
      render: (row) => <Typography>{row.title}</Typography>,
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <Chip label={row.status} />,
    },
    // ... more columns
  ]}
  data={risks}
  getRowId={(row) => row.id}
  getRowLabel={(row) => row.title}
  getRowMetadata={(row) => ({ owner: row.owner })}
  getMessageCount={(row) => row.commentCount}
  getFileCount={(row) => row.fileCount}
  hasUnreadMessages={(row) => row.hasComments}
/>
```

**That's it!** The chat column is automatically added with full functionality.

### TableWithComments Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tableId` | string | Yes | Unique identifier for the table |
| `columns` | TableColumn[] | Yes | Array of column definitions |
| `data` | any[] | Yes | Array of row data |
| `getRowId` | (row) => string\|number | Yes | Function to extract row ID |
| `getRowLabel` | (row) => string | Yes | Function to extract row label for sidebar header |
| `getRowMetadata` | (row) => object | No | Function to extract metadata |
| `getMessageCount` | (row) => number | No | Function to get message count |
| `getFileCount` | (row) => number | No | Function to get file count |
| `hasUnreadMessages` | (row) => boolean | No | Function to check for unread messages |
| `onRowClick` | (row) => void | No | Handler for row clicks |
| `containerProps` | TableContainerProps | No | Props for MUI TableContainer |

### TableColumn Interface

```typescript
interface TableColumn {
  id: string;
  label: string;
  render: (row: any) => React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
}
```

**Demo:** Visit `/simplified-table-demo` to see this in action.

---

## Manual Method: Individual Components

For advanced use cases requiring custom table structures, you can use the individual components.

## Integration Steps

### Step 1: Wrap Your Application with SidebarChatProvider

At the root level of your application or page:

```tsx
import { SidebarChatProvider } from '../../contexts/SidebarChatContext';

function YourPage() {
  return (
    <SidebarChatProvider>
      {/* Your page content */}
    </SidebarChatProvider>
  );
}
```

### Step 2: Add ConnectedSidebarChat Component

Add the global sidebar component at the root level (it will only show when a row is selected):

```tsx
import ConnectedSidebarChat from '../../components/ConnectedSidebarChat';

function YourPage() {
  return (
    <SidebarChatProvider>
      <Box sx={{ padding: 3 }}>
        {/* Your page content */}
      </Box>

      {/* Global sidebar */}
      <ConnectedSidebarChat
        onLoadMessages={handleLoadMessages}
        onLoadFiles={handleLoadFiles}
        onSendMessage={handleSendMessage}
        onUploadFile={handleUploadFile}
        onDownloadFile={handleDownloadFile}
        onRemoveFile={handleRemoveFile}
        onAddReaction={handleAddReaction}
        onRemoveReaction={handleRemoveReaction}
      />
    </SidebarChatProvider>
  );
}
```

### Step 3: Add Chat Icon Column to Your Table

Add a first column to your table with no header:

```tsx
import ChatIconColumn from '../../components/ChatIconColumn';

<Table>
  <TableHead>
    <TableRow>
      <TableCell sx={{ width: 48 }} /> {/* No header for chat column */}
      <TableCell>Title</TableCell>
      {/* ... other columns */}
    </TableRow>
  </TableHead>
  <TableBody>
    {rows.map((row) => (
      <TableRow key={row.id}>
        <TableCell sx={{ padding: 0 }}>
          <ChatIconColumn
            tableId="your-table-name"
            rowId={row.id}
            rowLabel={row.title}  // This shows in sidebar header
            metadata={{ owner: row.owner }}  // Optional extra data
            hasUnreadMessages={row.hasComments}
            messageCount={row.commentCount}
            fileCount={row.fileCount}
          />
        </TableCell>
        <TableCell>{row.title}</TableCell>
        {/* ... other cells */}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Step 4: Implement Data Handler Functions

Implement the callback functions for data operations:

```tsx
const handleLoadMessages = async (tableId: string, rowId: string | number) => {
  // Fetch messages from your API
  const response = await fetch(`/api/comments/${tableId}/${rowId}`);
  return response.json();
};

const handleLoadFiles = async (tableId: string, rowId: string | number) => {
  // Fetch files from your API
  const response = await fetch(`/api/files/${tableId}/${rowId}`);
  return response.json();
};

const handleSendMessage = (
  tableId: string,
  rowId: string | number,
  message: string,
  attachment?: File
) => {
  // Post message to your API
  const formData = new FormData();
  formData.append('message', message);
  formData.append('tableId', tableId);
  formData.append('rowId', String(rowId));
  if (attachment) {
    formData.append('attachment', attachment);
  }

  fetch('/api/comments', {
    method: 'POST',
    body: formData,
  });
};

const handleUploadFile = (
  tableId: string,
  rowId: string | number,
  file: File
) => {
  // Upload file to your API
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tableId', tableId);
  formData.append('rowId', String(rowId));

  fetch('/api/files', {
    method: 'POST',
    body: formData,
  });
};
```

## Key Props

### ChatIconColumn Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tableId` | string | Yes | Unique identifier for the table (e.g., "risk-management") |
| `rowId` | string \| number | Yes | Unique identifier for the row |
| `rowLabel` | string | Yes | Displayed in sidebar header (e.g., row title) |
| `metadata` | Record<string, any> | No | Additional data about the row |
| `hasUnreadMessages` | boolean | No | Shows unread indicator |
| `messageCount` | number | No | Number of comments (shown in tooltip and badge) |
| `fileCount` | number | No | Number of files (shown in tooltip) |

### ConnectedSidebarChat Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentUserId` | string | No | ID of current user (default: 'current-user') |
| `onLoadMessages` | Function | No | Async function to load messages for a row |
| `onLoadFiles` | Function | No | Async function to load files for a row |
| `onSendMessage` | Function | No | Function to send a new message |
| `onUploadFile` | Function | No | Function to upload a file |
| `onDownloadFile` | Function | No | Function to download a file |
| `onRemoveFile` | Function | No | Function to remove a file |
| `onAddReaction` | Function | No | Function to add emoji reaction |
| `onRemoveReaction` | Function | No | Function to remove emoji reaction |

## Data Structures

### Message Interface

```typescript
interface Message {
  id: string;
  senderName: string;
  fromMe: boolean;
  text: string;
  time: string;
  attachment?: {
    fileName: string;
    fileSize: string;
  };
  reactions?: {
    emoji: string;
    userIds: string[];
  }[];
}
```

### FileItem Interface

```typescript
interface FileItem {
  id: string;
  name: string;
  type: string;
  updatedAt: string;
}
```

### RowContext Interface

```typescript
interface RowContext {
  tableId: string;
  rowId: string | number;
  rowLabel: string;
  metadata?: Record<string, any>;
}
```

## Demos

- **Easy Method**: Visit `/simplified-table-demo` to see the TableWithComments component in action
- **Manual Method**: Visit `/table-integration-demo` to see the individual components approach
- **Standalone**: Visit `/sidebar-chat-demo` to see the sidebar component standalone

## Features

- **Per-row isolation**: Each table row has its own independent chat thread
- **Emoji reactions**: Quick reactions bar + full emoji picker
- **File attachments**: Upload, view, and download files
- **Message history**: Scrollable message feed with timestamps
- **Row context**: Sidebar header shows which row you're commenting on
- **Active highlighting**: Chat icon highlights when its sidebar is open
- **Message counts**: Badge shows number of comments per row
- **Enhanced tooltip**: Hover on chat icon shows comment and file counts in VerifyWise green style
- **Smooth animations**: Slide-in/out transitions for sidebar
- **Responsive design**: Works on different screen sizes

## Best Practices

1. **TableId**: Use consistent, descriptive table IDs (e.g., "risk-management", "model-inventory")
2. **RowLabel**: Make it descriptive so users know what they're commenting on
3. **Metadata**: Store relevant context that might be useful (owner, status, etc.)
4. **Error Handling**: Implement proper error handling in your data handler functions
5. **Loading States**: Consider adding loading indicators during data fetching
6. **Permissions**: Check user permissions before allowing comments/file uploads

## Common Use Cases

- Risk Management: Comment on individual risks
- Model Inventory: Discuss specific ML models
- Incident Management: Track conversation about incidents
- Tasks: Collaborate on specific tasks
- Vendor Management: Notes about vendor relationships
- Compliance: Discuss compliance items

## Troubleshooting

**Sidebar not opening:**
- Ensure SidebarChatProvider wraps your component
- Check that ChatIconColumn props are correct
- Verify ConnectedSidebarChat is rendered

**Messages not loading:**
- Check that onLoadMessages returns proper Promise
- Verify API endpoint returns correct data structure
- Check browser console for errors

**Context errors:**
- Make sure useSidebarChat is only used within SidebarChatProvider
- Verify you're not accidentally nesting multiple providers
