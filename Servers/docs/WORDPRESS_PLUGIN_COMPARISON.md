# WordPress vs VerifyWise Plugin System Comparison

> A detailed comparison of WordPress's mature plugin ecosystem with the proposed VerifyWise plugin system.

## Overview

| Aspect | WordPress | VerifyWise (Proposed) |
|--------|-----------|----------------------|
| **Language** | PHP | TypeScript |
| **Age** | 20+ years | New |
| **Plugin Count** | 60,000+ | ~10 initially |
| **Architecture** | Hook-based (actions/filters) | Event-based + interfaces |
| **Marketplace** | wordpress.org | GitHub-based |
| **Runtime** | Dynamic loading | Startup loading |

---

## Feature Comparison

### 1. Hook System

#### WordPress
```php
// Actions - do something
add_action('save_post', 'my_save_function', 10, 2);
function my_save_function($post_id, $post) {
    // Do something when post is saved
}

// Filters - modify data
add_filter('the_content', 'my_content_filter', 10, 1);
function my_content_filter($content) {
    return $content . '<p>Added by plugin</p>';
}
```

**WordPress has TWO hook types:**
- **Actions**: "Something happened, react to it"
- **Filters**: "Here's some data, modify and return it"

#### VerifyWise (Proposed)
```typescript
// Events only - similar to Actions
plugins.register(PluginEvent.PROJECT_CREATED, async (payload, context) => {
    // React to project creation
});

// No built-in filter mechanism
```

#### Gap: VerifyWise Missing Filters

| WordPress Can | VerifyWise Cannot (Currently) |
|---------------|-------------------------------|
| Modify report HTML before render | ❌ |
| Transform API response data | ❌ |
| Alter email content before send | ❌ |
| Change menu items dynamically | ❌ |

**Solution**: Add filter system to VerifyWise:

```typescript
// Proposed addition
export enum PluginFilter {
  REPORT_HTML = "filter:report:html",
  API_RESPONSE = "filter:api:response",
  EMAIL_CONTENT = "filter:email:content",
  MENU_ITEMS = "filter:menu:items",
}

// Usage
const html = await plugins.applyFilters(
  PluginFilter.REPORT_HTML,
  originalHtml,
  { projectId, frameworkId }
);
```

---

### 2. Admin UI Integration

#### WordPress
```php
// Add admin menu
add_action('admin_menu', function() {
    add_menu_page(
        'My Plugin',           // Page title
        'My Plugin',           // Menu title
        'manage_options',      // Capability
        'my-plugin',           // Menu slug
        'my_plugin_page',      // Callback
        'dashicons-admin-generic', // Icon
        30                     // Position
    );
});

// Add settings page
add_action('admin_init', function() {
    register_setting('my_plugin_options', 'my_option');
    add_settings_section('my_section', 'Settings', null, 'my-plugin');
    add_settings_field('my_field', 'Field Label', 'render_field', 'my-plugin', 'my_section');
});

// Add dashboard widget
add_action('wp_dashboard_setup', function() {
    wp_add_dashboard_widget('my_widget', 'My Widget', 'render_widget');
});

// Add meta boxes to edit screens
add_action('add_meta_boxes', function() {
    add_meta_box('my_metabox', 'My Box', 'render_metabox', 'post');
});
```

#### VerifyWise (Proposed)
```typescript
// Only backend routes
routes(router) {
    router.get("/my-plugin/settings", settingsController);
}

// No frontend component system
```

#### Gap: VerifyWise Missing UI Extensions

| WordPress Can | VerifyWise Cannot (Currently) |
|---------------|-------------------------------|
| Add admin menu items | ❌ |
| Create settings pages | ❌ |
| Add dashboard widgets | ❌ |
| Inject UI into existing pages | ❌ |
| Add columns to list tables | ❌ |

**Solution**: Add UI extension points:

```typescript
// Proposed manifest.json addition
{
  "ui": {
    "adminMenu": [
      {
        "title": "EU AI Act Settings",
        "path": "/admin/plugins/eu-ai-act",
        "icon": "eu-flag",
        "position": 30
      }
    ],
    "dashboardWidgets": [
      {
        "id": "compliance-score",
        "title": "Compliance Score",
        "component": "ComplianceScoreWidget"
      }
    ],
    "settingsTab": {
      "title": "EU AI Act",
      "component": "EUAIActSettings"
    }
  }
}

// Plugin exports React components
export const components = {
  ComplianceScoreWidget: () => <div>Score: 85%</div>,
  EUAIActSettings: () => <SettingsForm />,
};
```

---

### 3. Database & Schema

#### WordPress
```php
// Custom tables
global $wpdb;
$table_name = $wpdb->prefix . 'my_plugin_data';

// Create on activation
register_activation_hook(__FILE__, function() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE {$wpdb->prefix}my_data (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        data text NOT NULL,
        PRIMARY KEY (id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
});

// Or use post meta (no schema needed)
update_post_meta($post_id, 'my_plugin_key', $value);
get_post_meta($post_id, 'my_plugin_key', true);
```

#### VerifyWise (Proposed)
```typescript
// migrations/001_initial.ts
export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('plugin_eu_ai_act_data', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        project_id: { type: Sequelize.INTEGER, references: { model: 'projects', key: 'id' } },
        data: { type: Sequelize.JSONB },
    });
}

export async function down(queryInterface) {
    await queryInterface.dropTable('plugin_eu_ai_act_data');
}
```

#### Gap: VerifyWise Missing Schemaless Storage

| WordPress Can | VerifyWise Cannot (Currently) |
|---------------|-------------------------------|
| Store arbitrary key-value data (post_meta) | ❌ |
| No migration needed for simple data | ❌ |
| Query by meta value | ❌ |

**Solution**: Add plugin metadata API:

```typescript
// Proposed addition
interface PluginDataAPI {
  // Store arbitrary data for any entity
  setMeta(entityType: string, entityId: number, key: string, value: any): Promise<void>;
  getMeta(entityType: string, entityId: number, key: string): Promise<any>;
  deleteMeta(entityType: string, entityId: number, key: string): Promise<void>;

  // Query by meta
  findByMeta(entityType: string, key: string, value: any): Promise<number[]>;
}

// Usage
await context.data.setMeta('project', projectId, 'eu_ai_act_score', 85);
const score = await context.data.getMeta('project', projectId, 'eu_ai_act_score');
```

---

### 4. Shortcodes / Embeds

#### WordPress
```php
// Register shortcode
add_shortcode('compliance_badge', function($atts) {
    $atts = shortcode_atts(['project' => 0], $atts);
    return '<div class="badge">Compliant: Project ' . $atts['project'] . '</div>';
});

// Usage in content: [compliance_badge project="123"]
```

#### VerifyWise
Not applicable - VerifyWise is not a CMS. However, similar concept for:
- Embeddable compliance badges
- Public compliance status pages
- Widget embeds for external sites

**Solution** (if needed):
```typescript
// Embed code generation
routes(router) {
    // Generate embeddable badge
    router.get("/embed/badge/:projectId", async (req, res) => {
        const { projectId } = req.params;
        const score = await getComplianceScore(projectId);
        res.type('image/svg+xml').send(generateBadgeSVG(score));
    });

    // Widget JS
    router.get("/embed/widget.js", (req, res) => {
        res.type('application/javascript').send(widgetScript);
    });
}
```

---

### 5. REST API Extensions

#### WordPress
```php
// Register custom endpoint
add_action('rest_api_init', function() {
    register_rest_route('my-plugin/v1', '/data/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'get_my_data',
        'permission_callback' => function() {
            return current_user_can('read');
        }
    ]);
});

// Extend existing endpoints
add_filter('rest_prepare_post', function($response, $post, $request) {
    $response->data['my_field'] = get_post_meta($post->ID, 'my_field', true);
    return $response;
}, 10, 3);
```

#### VerifyWise (Proposed)
```typescript
routes(router) {
    router.get("/eu-ai-act/data/:id", dataController);
}

// No way to extend existing endpoints
```

#### Gap: Cannot Extend Core Endpoints

| WordPress Can | VerifyWise Cannot (Currently) |
|---------------|-------------------------------|
| Add fields to core API responses | ❌ |
| Modify core endpoint behavior | ❌ |
| Add custom authentication | ❌ |

**Solution**: Add API filters:

```typescript
// Core applies filters before sending response
const response = await plugins.applyFilters(
  PluginFilter.API_RESPONSE,
  originalResponse,
  { endpoint: '/api/projects/:id', method: 'GET' }
);

// Plugin modifies
eventHandlers() {
  return {
    [PluginFilter.API_RESPONSE]: async (response, context) => {
      if (context.endpoint === '/api/projects/:id') {
        response.euAiActScore = await getScore(response.id);
      }
      return response;
    }
  };
}
```

---

### 6. Cron / Scheduled Tasks

#### WordPress
```php
// Register cron event
register_activation_hook(__FILE__, function() {
    if (!wp_next_scheduled('my_plugin_cron')) {
        wp_schedule_event(time(), 'hourly', 'my_plugin_cron');
    }
});

// Handle cron event
add_action('my_plugin_cron', function() {
    // Run hourly task
});

// Custom intervals
add_filter('cron_schedules', function($schedules) {
    $schedules['five_minutes'] = [
        'interval' => 300,
        'display' => 'Every 5 Minutes'
    ];
    return $schedules;
});
```

#### VerifyWise (Proposed)
```typescript
// In manifest.json
{
  "jobs": [
    {
      "name": "sync-compliance",
      "schedule": "0 * * * *",  // Every hour
      "handler": "syncCompliance"
    }
  ]
}

// In plugin
export async function syncCompliance(context: PluginContext) {
    // Hourly sync
}
```

**Gap**: None - both support scheduled tasks.

---

### 7. Internationalization (i18n)

#### WordPress
```php
// Load text domain
load_plugin_textdomain('my-plugin', false, dirname(plugin_basename(__FILE__)) . '/languages');

// Translate strings
__('Hello World', 'my-plugin');
_e('Hello World', 'my-plugin');
_n('One item', '%d items', $count, 'my-plugin');

// .po/.mo files for translations
```

#### VerifyWise (Proposed)
```typescript
// Not yet designed
```

#### Gap: VerifyWise Missing i18n

| WordPress Can | VerifyWise Cannot (Currently) |
|---------------|-------------------------------|
| Plugin translations | ❌ |
| Multiple language packs | ❌ |
| Community translation platform | ❌ |

**Solution**:
```typescript
// Proposed manifest.json addition
{
  "i18n": {
    "textDomain": "eu-ai-act",
    "languages": ["en", "de", "fr", "es"]
  }
}

// Plugin structure
eu-ai-act/
├── locales/
│   ├── en.json
│   ├── de.json
│   └── fr.json

// Usage
context.t('compliance.score.label')  // "Compliance Score" or "Konformitätsbewertung"
```

---

### 8. Plugin Conflicts & Compatibility

#### WordPress
```php
// Check if another plugin exists
if (class_exists('WooCommerce')) {
    // WooCommerce is active
}

// Deactivation on conflict
register_activation_hook(__FILE__, function() {
    if (is_plugin_active('conflicting-plugin/plugin.php')) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die('Cannot activate: conflicts with Conflicting Plugin');
    }
});
```

#### VerifyWise (Proposed)
```json
{
  "dependencies": {
    "core": ">=1.0.0"
  },
  "conflicts": [
    "old-eu-ai-act"
  ]
}
```

**Gap**: None - both handle conflicts, though WordPress is more ad-hoc.

---

### 9. Update System

#### WordPress
```php
// Check for updates automatically via wordpress.org
// Or custom update server:
add_filter('pre_set_site_transient_update_plugins', function($transient) {
    $response = wp_remote_get('https://my-server.com/update-check');
    // Add update info to transient
    return $transient;
});

// One-click updates from admin UI
```

#### VerifyWise (Proposed)
```bash
# CLI only currently
npx vw-plugins update eu-ai-act
```

#### Gap: VerifyWise Missing UI Updates

| WordPress Can | VerifyWise Cannot (Currently) |
|---------------|-------------------------------|
| One-click updates in admin | ❌ |
| Update notifications in UI | ❌ |
| Automatic background updates | ❌ |
| Rollback on failure | ❌ |

**Solution**: Add UI update flow:
```typescript
// API endpoint
router.post("/api/plugins/:id/update", async (req, res) => {
    const { id } = req.params;
    await marketplace.updatePlugin(id);
    res.json({ success: true });
});

// Frontend component with progress indicator
// Rollback mechanism if update fails
```

---

### 10. Activation / Deactivation Hooks

#### WordPress
```php
// Activation - runs once when plugin is activated
register_activation_hook(__FILE__, function() {
    // Create tables, set defaults, flush rewrite rules
});

// Deactivation - runs when plugin is deactivated
register_deactivation_hook(__FILE__, function() {
    // Cleanup transients, unschedule cron
});

// Uninstall - runs when plugin is deleted
// uninstall.php or:
register_uninstall_hook(__FILE__, 'my_uninstall_function');
```

#### VerifyWise (Proposed)
```typescript
const plugin: Plugin = {
    onLoad(context) { /* On server start */ },
    onUnload(context) { /* On server stop */ },
    onEnable(context) { /* When enabled */ },
    onDisable(context) { /* When disabled */ },
    // Missing: onInstall, onUninstall
};
```

#### Gap: Missing Install/Uninstall Hooks

| WordPress Can | VerifyWise Cannot (Currently) |
|---------------|-------------------------------|
| Run code on first install | ❌ (migrations only) |
| Clean up on uninstall | ❌ |
| Distinguish install vs enable | ❌ |

**Solution**:
```typescript
interface Plugin {
    // Existing
    onLoad?(context: PluginContext): Promise<void>;
    onUnload?(context: PluginContext): Promise<void>;
    onEnable?(context: PluginContext): Promise<void>;
    onDisable?(context: PluginContext): Promise<void>;

    // Add these
    onInstall?(context: PluginContext): Promise<void>;  // First time only
    onUninstall?(context: PluginContext): Promise<void>;  // Permanent removal
    onUpgrade?(context: PluginContext, fromVersion: string): Promise<void>;  // Version change
}
```

---

## Summary: What WordPress Can Do That VerifyWise Cannot

### Critical Gaps (Should Add)

| Feature | Priority | Effort |
|---------|----------|--------|
| **Filter system** (modify data in pipeline) | High | Medium |
| **UI extension points** (menus, widgets, settings) | High | High |
| **Schemaless metadata API** | Medium | Low |
| **API response filters** | Medium | Low |
| **One-click UI updates** | Medium | Medium |
| **i18n support** | Medium | Medium |
| **Install/Uninstall hooks** | Medium | Low |

### Nice to Have (Future)

| Feature | Priority | Effort |
|---------|----------|--------|
| Embeddable widgets/badges | Low | Medium |
| Automatic updates | Low | Medium |
| Plugin conflict detection UI | Low | Low |
| Plugin health checks | Low | Low |

### Not Needed (Different Context)

| WordPress Feature | Why Not Needed |
|-------------------|----------------|
| Shortcodes | Not a CMS |
| Widget areas | Fixed UI structure |
| Theme compatibility | Single app, not themes |
| Multisite | Already multi-tenant |

---

## Recommendations

### 1. Add Filter System (High Priority)

```typescript
// In PluginManager
async applyFilters<T>(filter: PluginFilter, value: T, context?: any): Promise<T> {
    const handlers = this.filterHandlers.get(filter) || [];

    for (const handler of handlers) {
        value = await handler(value, context);
    }

    return value;
}

// Usage in core
const reportHtml = await pluginManager.applyFilters(
    PluginFilter.REPORT_HTML,
    originalHtml,
    { projectId, frameworkId }
);
```

### 2. Add UI Extension Manifest (High Priority)

```json
{
  "ui": {
    "settingsPage": {
      "title": "EU AI Act Settings",
      "sections": [
        {
          "title": "General",
          "fields": [
            {
              "key": "defaultRiskLevel",
              "type": "select",
              "label": "Default Risk Level",
              "options": ["low", "medium", "high"]
            }
          ]
        }
      ]
    },
    "projectTabs": [
      {
        "id": "eu-ai-act-details",
        "title": "EU AI Act",
        "icon": "eu-flag"
      }
    ]
  }
}
```

### 3. Add Metadata API (Medium Priority)

```typescript
// Simple key-value store for plugin data
interface PluginDataStore {
    set(key: string, value: any): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    delete(key: string): Promise<void>;

    // Scoped to entity
    setForEntity(entity: string, id: number, key: string, value: any): Promise<void>;
    getForEntity<T>(entity: string, id: number, key: string): Promise<T | null>;
}
```

### 4. Add i18n Support (Medium Priority)

```typescript
// Plugin context includes translator
interface PluginContext {
    t(key: string, params?: Record<string, string>): string;
    locale: string;
}

// Plugin provides translations
// locales/en.json
{
    "settings.title": "EU AI Act Settings",
    "score.label": "Compliance Score: {{score}}%"
}
```

---

## Conclusion

WordPress has 20+ years of evolution and a massive ecosystem. The proposed VerifyWise plugin system covers the essentials but is missing some powerful features that WordPress has:

**Must Add:**
1. Filter system for data transformation
2. UI extension points
3. Schemaless metadata storage

**Should Add:**
1. i18n support
2. Install/Uninstall lifecycle hooks
3. One-click updates in UI

**The good news**: These gaps are addressable with relatively modest effort, and the TypeScript-first approach gives VerifyWise advantages WordPress doesn't have (type safety, better IDE support, compile-time error catching).
