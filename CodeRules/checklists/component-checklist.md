# React Component Checklist

Checklist for creating and reviewing React components in VerifyWise.

## Component Structure

### File Organization

- [ ] Component uses function declaration (not arrow function export)
- [ ] Imports are organized (external → internal → types)
- [ ] Props interface is defined
- [ ] Component is exported as named export
- [ ] File name matches component name (PascalCase)

### Hooks Order

- [ ] `useState` declarations first
- [ ] `useContext` after useState
- [ ] `useRef` after context
- [ ] Custom hooks next
- [ ] `useMemo` for derived values
- [ ] `useCallback` for event handlers
- [ ] `useEffect` last

## Props

### Definition

- [ ] Props interface is properly typed
- [ ] Required props don't have `?`
- [ ] Optional props have `?` and defaults
- [ ] Callback props use `onAction` naming (onClick, onChange)
- [ ] Boolean props use `is/has/can/should` prefix

### Defaults

- [ ] Default values provided for optional props
- [ ] Defaults are defined in destructuring or defaultProps

## State Management

### Local State

- [ ] State is minimal (no duplicate state)
- [ ] State is colocated (close to where it's used)
- [ ] Derived state uses `useMemo`, not separate state

### Side Effects

- [ ] `useEffect` has proper dependencies
- [ ] Cleanup functions provided where needed
- [ ] Async operations handle component unmount

## Rendering

### Conditional Rendering

- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled
- [ ] Early returns for invalid props

### Lists

- [ ] Unique `key` prop for list items
- [ ] Keys are stable (not index unless list is static)
- [ ] Empty list has fallback UI

## Styling

### Theme Usage

- [ ] Colors from theme palette (`color="primary"`)
- [ ] Spacing from theme (`p={2}`, `m={3}`)
- [ ] Typography uses variants (`variant="body1"`)
- [ ] No hardcoded pixel values for spacing
- [ ] No hardcoded colors

### Responsive

- [ ] Component works on mobile
- [ ] Uses responsive sx values or useMediaQuery
- [ ] Touch targets are adequate size (44px min)

## Accessibility

### Basic Requirements

- [ ] Interactive elements have accessible names
- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] Color is not sole means of conveying info

### Keyboard

- [ ] All interactive elements are focusable
- [ ] Focus order is logical
- [ ] Custom controls have keyboard support

### Screen Readers

- [ ] ARIA labels where needed
- [ ] Live regions for dynamic content
- [ ] Headings have proper hierarchy

## Performance

### Optimization

- [ ] `memo()` used for expensive components
- [ ] `useMemo` for expensive calculations
- [ ] `useCallback` for callbacks passed to children
- [ ] No inline objects/arrays in render (cause re-renders)

### Data Fetching

- [ ] Uses React Query for server state
- [ ] Loading states prevent redundant fetches
- [ ] Pagination for large lists

## Testing

### Coverage

- [ ] Renders without crashing
- [ ] User interactions work
- [ ] Loading states render
- [ ] Error states render
- [ ] Accessibility tested

### Test Quality

- [ ] Uses accessible queries (getByRole)
- [ ] Tests behavior, not implementation
- [ ] Edge cases covered

## Example Checklist for Review

```
ComponentName: UserCard

✅ Structure
  ✅ Function declaration
  ✅ Imports organized
  ✅ Props typed
  ✅ Named export

✅ Props
  ✅ Interface defined
  ✅ Defaults provided

✅ State
  ✅ Minimal state
  ✅ Effects have cleanup

✅ Rendering
  ✅ Loading handled
  ✅ Error handled
  ✅ Empty handled

✅ Styling
  ✅ Theme colors
  ✅ Theme spacing
  ✅ Responsive

✅ Accessibility
  ✅ Labels present
  ✅ Keyboard works

✅ Performance
  ✅ Memoized appropriately

✅ Tests
  ✅ Tests exist
  ✅ Key behaviors covered
```

## Quick Reference

### Props Interface
```tsx
interface ComponentProps {
  // Required
  id: string;
  // Optional with default
  variant?: 'primary' | 'secondary';
  // Callback
  onClick?: () => void;
  // Children
  children?: React.ReactNode;
}
```

### Component Template
```tsx
export function Component({
  id,
  variant = 'primary',
  onClick,
  children,
}: ComponentProps) {
  // hooks

  // early returns

  return (
    // JSX
  );
}
```

## Related Documents

- [Component Guidelines](../03-react/component-guidelines.md)
- [React Patterns](../03-react/react-patterns.md)
- [Frontend Testing](../07-testing/frontend-testing.md)
