# Time Series Analytics Implementation Plan for VerifyWise

## 📋 Executive Summary

This document outlines a simplified time series analytics implementation for VerifyWise to enable historical tracking and trend visualization of risks and vendor risks. The approach prioritizes simplicity and maintainability over complex time series optimizations, given the manageable scale of the system.

## 🎯 Business Requirements & Scope

### Initial Focus
- **Primary Entities**: Project Risks and Vendor Risks
- **Secondary Phase**: Compliance progress tracking
- **Business Value**: Enable customers to visualize risk trends, status changes, and mitigation progress over time

### Scale Analysis
- **Target Scale**: 300 customers (SaaS) + on-premise deployments
- **Per Customer**: ~100 project risks + ~100 vendor risks + ~30 projects
- **Total Scale**: ~60,000 risk entities across all customers
- **Change Frequency**: Estimated 1-5 status changes per risk per month
- **Data Volume**: ~5-25K events per month system-wide

### Visualizations Required (V1)
1. **Risk Status Distribution Over Time** - Pie/bar charts showing status breakdowns
2. **Individual Risk Trend Lines** - Line charts for specific risks
3. **Vendor Risk Heat Maps** - Color-coded grids showing risk severity trends
4. **Compliance Progress Curves** (V2) - Progress tracking over time

## 🔍 Current Database Structure Analysis

### Project Risks (`project_risks` table)
**Key trackable fields:**
- `mitigation_status`: "Not Started" | "In Progress" | "Completed" | "On Hold" | "Deferred" | "Canceled" | "Requires review"
- `current_risk_level`: "Very Low risk" | "Low risk" | "Medium risk" | "High risk" | "Very high risk"
- `risk_level_autocalculated`: "No risk" | "Very low risk" | "Low risk" | "Medium risk" | "High risk" | "Very high risk"
- `severity`: "Negligible" | "Minor" | "Moderate" | "Major" | "Catastrophic"
- `likelihood`: "Rare" | "Unlikely" | "Possible" | "Likely" | "Almost Certain"

**Additional context fields:**
- `project_id`: For filtering by project
- `risk_owner`: For filtering by user
- `ai_lifecycle_phase`: For categorical analysis

### Vendor Risks (`vendor_risks` table)
**Key trackable fields:**
- `risk_severity`: "Negligible" | "Minor" | "Moderate" | "Major" | "Catastrophic"
- `risk_level`: String (various risk levels)
- `impact`: "Negligible" | "Minor" | "Moderate" | "Major" | "Critical"
- `likelihood`: "Rare" | "Unlikely" | "Possible" | "Likely" | "Almost certain"

**Additional context fields:**
- `vendor_id`: For filtering by vendor
- `action_owner`: For filtering by user

### Multi-tenancy Considerations
- Both tables are organization-scoped via relationships
- Time series data must respect organization boundaries
- No cross-tenant data leakage in analytics

## 🏗️ Recommended Technical Architecture

### 1. Simplified Event-Based Tracking

**Core Philosophy**: Instead of complex time series databases or partitioning, use a simple event log approach suitable for the scale.

#### Event Log Table Structure
```sql
CREATE TABLE risk_events (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('project_risk', 'vendor_risk')),
  entity_id INTEGER NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by INTEGER, -- user_id
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key constraints
  CONSTRAINT fk_risk_events_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE,

  -- Indexes for common queries
  INDEX idx_risk_events_org_time (organization_id, timestamp),
  INDEX idx_risk_events_entity (entity_type, entity_id, timestamp),
  INDEX idx_risk_events_field (field_name, timestamp)
);
```

#### Tracking Strategy
- **Event-only approach**: Capture every field change as it happens
- **Targeted fields**: Only track business-critical status fields
- **Database triggers**: Automatic change capture without application-level complexity

### 2. Change Capture Implementation

#### PostgreSQL Triggers (Recommended)
```sql
-- Example trigger function
CREATE OR REPLACE FUNCTION capture_risk_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Track mitigation_status changes
  IF OLD.mitigation_status IS DISTINCT FROM NEW.mitigation_status THEN
    INSERT INTO risk_events (organization_id, entity_type, entity_id, field_name, old_value, new_value)
    VALUES (NEW.organization_id, 'project_risk', NEW.id, 'mitigation_status', OLD.mitigation_status, NEW.mitigation_status);
  END IF;

  -- Track current_risk_level changes
  IF OLD.current_risk_level IS DISTINCT FROM NEW.current_risk_level THEN
    INSERT INTO risk_events (organization_id, entity_type, entity_id, field_name, old_value, new_value)
    VALUES (NEW.organization_id, 'project_risk', NEW.id, 'current_risk_level', OLD.current_risk_level, NEW.current_risk_level);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Advantages:**
- Automatic capture without application changes
- Guaranteed consistency
- Minimal performance impact
- No risk of missing changes

**Alternative: Application-level tracking**
- More control but requires updating all risk update endpoints
- Higher risk of missed changes
- More complex testing

### 3. Data Aggregation Strategy

#### Real-time vs Pre-computed
**Recommendation**: Real-time aggregation on demand

**Reasoning:**
- Scale (60K entities) is manageable for real-time queries
- Avoids complexity of materialized views or background jobs
- PostgreSQL window functions handle time-series aggregations efficiently
- Simpler debugging and maintenance

#### Sample Aggregation Queries
```sql
-- Risk status distribution over time (daily buckets)
SELECT
  DATE_TRUNC('day', timestamp) as date,
  new_value as status,
  COUNT(*) as count
FROM risk_events
WHERE organization_id = ?
  AND entity_type = 'project_risk'
  AND field_name = 'mitigation_status'
  AND timestamp >= ?
GROUP BY DATE_TRUNC('day', timestamp), new_value
ORDER BY date;

-- Individual risk trend
SELECT
  timestamp,
  field_name,
  new_value
FROM risk_events
WHERE entity_type = 'project_risk'
  AND entity_id = ?
  AND field_name IN ('mitigation_status', 'current_risk_level')
ORDER BY timestamp;
```

### 4. API Design

#### RESTful Endpoints
```
GET /api/analytics/risk-trends?type=project_risk&field=mitigation_status&period=30d
GET /api/analytics/risk-trends/{riskId}?fields=status,level
GET /api/analytics/vendor-risk-heatmap?period=90d
GET /api/analytics/compliance-progress/{projectId}?period=1y
```

#### Response Format
```json
{
  "data": [
    {
      "timestamp": "2024-01-15T00:00:00Z",
      "field": "mitigation_status",
      "value": "In Progress",
      "count": 15
    }
  ],
  "metadata": {
    "period": "30d",
    "total_events": 234,
    "entity_type": "project_risk"
  }
}
```

### 5. Frontend Integration

#### Chart Library
**Recommendation**: Use existing chart library (likely Chart.js or similar)
- Leverage existing dependencies
- Consistent UI patterns
- Simpler maintenance

#### Integration Points
- **Risk Management Page**: Add trend charts to existing risk list/detail views
- **Vendor Management Page**: Add risk heatmaps and trend analysis
- **Dashboard**: Summary charts for executive overview
- **Project Details**: Project-specific risk trends

#### Performance Considerations
- **Polling**: 30-60 second intervals for chart updates
- **Caching**: Simple browser caching for static time periods
- **Lazy Loading**: Load charts on tab/section expand

## 📊 Data Retention & Storage

### Retention Policy
- **Keep indefinitely**: Per business requirements
- **Disk Usage**: ~50MB per year per 1000 entities (very manageable)
- **Archival**: Not needed at this scale

### Storage Optimization
- **Indexes**: Time-based and entity-based indexes for common queries
- **Vacuum**: Regular PostgreSQL maintenance
- **Compression**: Not needed at this scale

## 🔐 Security & Access Control

### Organization-Level Isolation
- All queries filtered by `organization_id`
- No cross-tenant data access
- Existing authentication/authorization patterns

### Role-Based Access
- All 4 user types can view analytics (per requirements)
- Project-specific filtering respects existing project permissions
- No separate analytics permissions needed

## 📈 Performance Expectations

### Query Performance
- **Trend queries**: <500ms for 30-day periods
- **Aggregation queries**: <1s for 90-day periods
- **Real-time updates**: <100ms for single entity changes

### Scalability Thresholds
- **Current scale**: Excellent performance expected
- **10x scale** (600K entities): Still manageable with current design
- **100x scale**: Would require materialized views or time-series database

## 🚀 Implementation Phases

### Phase 1: Foundation (2-3 weeks)
1. **Database Migration**: Create `risk_events` table
2. **Trigger Implementation**: Capture project risk changes
3. **Basic API**: Single endpoint for trend data
4. **Simple Chart**: One chart type (status distribution)
5. **Integration**: Add chart to Risk Management page

### Phase 2: Expansion (2-3 weeks)
1. **Vendor Risk Tracking**: Add vendor risk triggers and tracking
2. **Additional Charts**: Individual trend lines, heatmaps
3. **API Enhancement**: Multiple endpoints and filtering options
4. **Frontend Polish**: Better UX, loading states, error handling

### Phase 3: Polish & Analytics (1-2 weeks)
1. **Export Functionality**: CSV export of historical data
2. **Advanced Filtering**: Date ranges, user filters, project filters
3. **Performance Optimization**: Caching, query optimization
4. **Documentation**: API docs and user guides

### Phase 4: Future Enhancements
1. **Compliance Progress**: Add compliance entity tracking
2. **Advanced Analytics**: Trend analysis, anomaly detection
3. **Alerts**: Optional threshold-based notifications
4. **Mobile Optimization**: Responsive chart designs

## ⚖️ Alternative Approaches Considered

### Time Series Database (Rejected)
- **Options**: InfluxDB, TimescaleDB
- **Pros**: Optimized for time series data
- **Cons**: Additional infrastructure, complexity, overkill for scale
- **Decision**: PostgreSQL is sufficient for current needs

### Materialized Views (Rejected for V1)
- **Pros**: Faster query performance
- **Cons**: Added complexity, refresh management, not needed at current scale
- **Decision**: Implement only if performance issues arise

### Snapshot-Based Tracking (Rejected)
- **Pros**: Point-in-time state reconstruction
- **Cons**: Storage overhead, complex queries, less precise than events
- **Decision**: Event-based provides better granularity and accuracy

### Application-Level Tracking (Alternative)
- **Pros**: More control, custom logic possible
- **Cons**: Must update all update endpoints, risk of missed changes
- **Decision**: Database triggers preferred for reliability

## 🧪 Testing Strategy

### Data Integrity Tests
- Verify all tracked field changes generate events
- Test organization isolation
- Validate trigger performance under load

### API Tests
- Performance tests for various time ranges
- Accuracy tests comparing event data to actual changes
- Error handling for invalid parameters

### Frontend Tests
- Chart rendering with various data shapes
- Loading states and error conditions
- Real-time update functionality

## 📋 Assumptions & Dependencies

### Assumptions
1. **Change Frequency**: Average 1-5 status changes per risk per month
2. **User Behavior**: Users will primarily view recent trends (30-90 days)
3. **Performance Requirements**: Sub-second response times acceptable
4. **Scale Growth**: Linear growth, not exponential spikes

### Dependencies
- **Existing Chart Library**: Leverage current frontend chart solution
- **PostgreSQL Version**: Supports required trigger functionality
- **Browser Support**: Modern browsers with JavaScript chart support

### Risks & Mitigations
1. **Risk**: Database trigger performance impact
   - **Mitigation**: Lightweight triggers, minimal logic, monitoring
2. **Risk**: Storage growth faster than expected
   - **Mitigation**: Monitoring, compression options available
3. **Risk**: Complex queries impact main database performance
   - **Mitigation**: Proper indexing, query optimization, read replicas if needed

## 💰 Resource Requirements

### Development Time
- **Backend**: 3-4 weeks (triggers, API, testing)
- **Frontend**: 2-3 weeks (charts, integration, UX)
- **Testing & Polish**: 1-2 weeks
- **Total**: 6-9 weeks for full implementation

### Infrastructure
- **Additional Storage**: Minimal (5-10% increase)
- **Database Load**: <5% increase in database load
- **No Additional Services**: Uses existing PostgreSQL infrastructure

## 🎯 Success Metrics

### Technical Metrics
- Query response times <500ms for standard operations
- <1% impact on main application performance
- 99.9% event capture accuracy

### Business Metrics
- Customer usage of analytics features
- Improved risk management decision-making
- Reduced time to identify risk trends

## 📝 Next Steps

1. **Team Review**: Review this document with development team
2. **Technical Validation**: Validate PostgreSQL trigger approach in development
3. **UI/UX Design**: Design chart integration mockups
4. **Implementation Planning**: Break down into specific development tasks
5. **Testing Strategy**: Define detailed test plans for each phase

---

**Document Version**: 1.0
**Date**: September 21, 2025
**Author**: Development Team
**Status**: Proposal for Review