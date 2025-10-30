# VerifyWise Localization Implementation Guide

## 📋 Overview
This document outlines the complete localization (i18n) implementation strategy for VerifyWise, including technical approach, implementation patterns, and rollback instructions.

## 🎯 Implementation Approach

### Technology Stack
- **Library**: react-i18next (v15.7.3)
- **Language Detection**: i18next-browser-languagedetector (v8.2.0)
- **Core**: i18next (v25.5.2)
- **Languages**: English (en), German (de) - expandable to more

### Architecture Decision
We chose **react-i18next** over other solutions because:
1. **React Integration**: Seamless hooks and component support
2. **Browser Detection**: Automatic language detection from browser settings
3. **Lazy Loading**: Can load translations on-demand (future optimization)
4. **Interpolation**: Supports variables in translations
5. **Pluralization**: Built-in plural forms support
6. **TypeScript**: Full type safety support

## 📁 File Structure

```
src/
├── i18n/
│   ├── i18n.ts                    # Main configuration file
│   ├── locales/
│   │   ├── en.json                # English translations
│   │   └── de.json                # German translations
│   └── utils/
│       └── statusTranslations.ts  # Dynamic translation utilities
├── presentation/
│   └── components/
│       ├── LanguageSwitcher/      # Language selector component
│       ├── StatusBadge/           # Example localized component
│       └── LocalizationTest/      # Test component (removable)
```

## 🔧 Implementation Patterns

### 1. Basic Component Localization
```typescript
// Import
import { useTranslation } from "react-i18next";

// In component
const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('pageTitle')}</h1>
      <Button>{t('buttons.save')}</Button>
    </div>
  );
};
```

### 2. Dynamic Status/Value Translation
```typescript
// For dynamic values like status, risk levels
import { useStatusTranslation } from "../../../i18n/utils/statusTranslations";

const Component = () => {
  const { translateStatus, translateRiskLevel } = useStatusTranslation();

  return (
    <span>{translateStatus("In Progress")}</span> // → "In Bearbeitung" in German
  );
};
```

### 3. Translation File Structure
```json
// en.json
{
  "sidebar": {
    "dashboard": "Dashboard",
    "riskManagement": "Risk Management"
  },
  "status": {
    "inprogress": "In Progress",
    "completed": "Completed"
  },
  "riskLevel": {
    "high": "High Risk",
    "medium": "Medium Risk"
  }
}
```

### 4. Passing Translation to Non-Hook Functions
```typescript
// When you can't use hooks (e.g., in utility functions)
const getMenuItems = (t: any) => [
  { name: t('sidebar.dashboard') }
];

// In component
const { t } = useTranslation();
const menu = getMenuItems(t);
```

## 📊 Translation Coverage Analysis

### Current Status (What Was Implemented)
| Component | Strings | Status |
|-----------|---------|--------|
| Sidebar Menu | ~20 | ✅ Complete |
| Risk Management Page | ~15 | ✅ Complete |
| Status Values | 9 | ✅ Complete |
| Risk Levels | 7 | ✅ Complete |
| **Total Completed** | **51** | **3.9% of total** |

### Remaining Work
| Page | Estimated Strings | Priority |
|------|-------------------|----------|
| Framework | ~180 | High |
| Tasks | ~150 | High |
| Vendors | ~120 | Medium |
| Model Inventory | ~110 | Medium |
| Dashboard/Home | ~80 | High |
| Others | ~614 | Low-Medium |
| **Total Remaining** | **~1,254** | - |

### Time Estimates
- **Translation**: 20-25 hours (2-3 min/string for German)
- **Implementation**: 40-50 hours (adding t() calls)
- **Testing**: 10-15 hours
- **Total**: ~75-90 hours

## 🚀 Implementation Strategy

### Phase 1: Core Pages (High Priority)
1. Dashboard/Home
2. Framework (ISO compliance)
3. Tasks
4. Project View

### Phase 2: Data Management (Medium Priority)
1. Vendors
2. Model Inventory
3. Policy Dashboard
4. Training Registry
5. File Manager

### Phase 3: Analytics & Settings (Low Priority)
1. AI Trust Center
2. Reporting
3. Fairness Dashboard
4. Event Tracker
5. Settings

## 🔄 Rollback Instructions

To completely remove all localization changes made during this session:

### 1. Remove npm packages
```bash
npm uninstall react-i18next i18next i18next-browser-languagedetector
```

### 2. Delete created files
```bash
rm -rf src/i18n/
rm -rf src/presentation/components/LanguageSwitcher/
rm -rf src/presentation/components/StatusBadge/
rm -rf src/presentation/components/LocalizationTest/
```

### 3. Revert file changes

#### src/App.tsx
- Remove line 28: `import "./i18n/i18n";`

#### src/presentation/components/Sidebar/index.tsx
- Remove line 22: `import { useTranslation } from "react-i18next";`
- Remove line 61: `import LanguageSwitcher from "../LanguageSwitcher";`
- Remove line 198: `const { t } = useTranslation();`
- Change line 74: `const getMenuItems = (openTasksCount: number, t: any): MenuItem[]`
  back to: `const getMenuItems = (openTasksCount: number): MenuItem[]`
- Change all `t('sidebar.xxx')` back to hardcoded strings:
  - `t('sidebar.dashboard')` → `"Dashboard"`
  - `t('sidebar.riskManagement')` → `"Risk Management"`
  - `t('sidebar.tasks')` → `"Tasks"`
  - etc. for all menu items
- Change line 161-180: Revert `getOtherMenuItems` function to `const other: MenuItem[]` array
- Remove lines 234-235 translation passing, change to:
  - `const menu = getMenuItems(openTasksCount);`
  - Remove `const other = getOtherMenuItems(t);` and use hardcoded array
- Remove line 828: `<LanguageSwitcher />`
- Change tooltips back to hardcoded strings

#### src/presentation/pages/RiskManagement/index.tsx
- Remove line 2: `import { useTranslation } from "react-i18next";`
- Remove line 58: `const { t } = useTranslation();`
- Change all `t('riskManagement.xxx')` back to hardcoded strings

### 4. Git commands to revert (if committed)
```bash
git diff HEAD~1 -- package.json package-lock.json
git checkout HEAD~1 -- src/App.tsx
git checkout HEAD~1 -- src/presentation/components/Sidebar/index.tsx
git checkout HEAD~1 -- src/presentation/pages/RiskManagement/index.tsx
```

## 💡 Best Practices for Future Implementation

### 1. Translation Keys Naming
- Use nested structure: `page.section.element`
- Example: `vendors.table.headers.name`
- Keep keys lowercase with dots as separators

### 2. Shared Translations
- Common actions: `common.save`, `common.cancel`
- Status values: `status.pending`, `status.completed`
- Error messages: `errors.required`, `errors.invalid`

### 3. Dynamic Content
- Use interpolation: `t('welcome', { name: userName })`
- Translation: `"welcome": "Welcome, {{name}}!"`

### 4. Pluralization
```typescript
t('items', { count: 5 }) // "5 items"
t('items', { count: 1 }) // "1 item"
```

### 5. Missing Translations
- Always provide fallback text
- Use: `t('key', 'Fallback Text')`

### 6. Performance
- Lazy load translations for large apps
- Use namespaces to split translations
- Cache translations in localStorage

## 🧪 Testing Approach

### 1. Manual Testing
- Change browser language settings
- Use language switcher component
- Verify all visible text changes

### 2. Automated Testing
```typescript
// Example test
it('should display German text when language is de', () => {
  i18n.changeLanguage('de');
  render(<Component />);
  expect(screen.getByText('Risikomanagement')).toBeInTheDocument();
});
```

### 3. Translation Validation
- Check for missing keys
- Verify all languages have same keys
- Validate interpolation variables

## 📝 Notes for Developers

### Starting Fresh
When implementing localization from scratch:
1. Start with high-traffic pages
2. Create translation files incrementally
3. Use extraction tools to find all strings
4. Implement language switcher last
5. Test with at least 2 languages

### Common Pitfalls to Avoid
- Don't hardcode language codes
- Don't mix translation keys with display text
- Don't forget to translate error messages
- Don't ignore date/number formatting
- Don't assume text length (German is ~30% longer)

## 🔗 Resources
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Language Codes (ISO 639-1)](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

---
*Document created: 2025-09-21*
*Last updated: 2025-09-21*
*Status: Implementation POC completed, ready for rollback and fresh start*