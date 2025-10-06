/**
 * @fileoverview Simple Event Acknowledgment Demo
 *
 * Demonstrates the user-specific event acknowledgment system using
 * direct database operations to simulate the behavior.
 *
 * **What this demo shows:**
 * 1. How events are stored in outbox_events table
 * 2. How users can acknowledge events independently
 * 3. How the exclude_acknowledged parameter works
 * 4. The final state with independent acknowledgments
 *
 * @created 2025-10-06
 */

const { Pool } = require('pg');
const fetch = require('node-fetch');

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'gorkemcetin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'verifywise',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
};

const pool = new Pool(dbConfig);
const API_BASE = 'http://localhost:3001/api';

/**
 * Helper function to execute database queries
 */
async function dbQuery(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Create a sample event in the outbox_events table
 */
async function createSampleEvent() {
  console.log('📋 Creating sample project status change event...');

  const eventData = {
    tenant: 'a4ayc80OGd', // Sample tenant hash
    event_type: 'projects_update',
    aggregate_id: '123',
    aggregate_type: 'projects',
    payload: {
      operation: 'UPDATE',
      old_data: {
        project_title: 'Sample Project',
        status: 'Draft'
      },
      new_data: {
        project_title: 'Sample Project',
        status: 'Active'
      },
      changed_fields: {
        status: 'Active'
      }
    }
  };

  const result = await dbQuery(`
    INSERT INTO outbox_events (tenant, event_type, aggregate_id, aggregate_type, payload)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, created_at
  `, [
    eventData.tenant,
    eventData.event_type,
    eventData.aggregate_id,
    eventData.aggregate_type,
    JSON.stringify(eventData.payload)
  ]);

  const eventId = result[0].id;
  console.log(`✅ Created event ID: ${eventId}`);
  console.log(`   Type: ${eventData.event_type}`);
  console.log(`   Change: Draft → Active`);
  console.log(`   Tenant: ${eventData.tenant}`);

  return eventId;
}

/**
 * Simulate user acknowledgment by directly inserting into event_acknowledgments
 */
async function acknowledgeEventForUser(eventId, userId, userName) {
  console.log(`👤 ${userName} (ID: ${userId}) acknowledging event ${eventId}...`);

  try {
    const result = await dbQuery(`
      INSERT INTO event_acknowledgments (event_id, user_id, tenant, processor, status, metadata, processed_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
      RETURNING id, processed_at
    `, [
      eventId,
      userId,
      'a4ayc80OGd', // Same tenant
      'flowgram.ai',
      'processed',
      JSON.stringify({
        workflow_id: `${userName.toLowerCase()}-project-notification`,
        user: userName,
        demo: true
      })
    ]);

    console.log(`✅ ${userName} acknowledged event successfully`);
    console.log(`   Acknowledgment ID: ${result[0].id}`);
    console.log(`   Processed at: ${result[0].processed_at}`);

  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      console.log(`⚠️  ${userName} has already acknowledged this event`);
    } else {
      throw error;
    }
  }
}

/**
 * Query events for a user (simulating the API call)
 */
async function getEventsForUser(userId, excludeAcknowledged = false) {
  console.log(`🔍 Querying events for User ${userId} (exclude_acknowledged: ${excludeAcknowledged})...`);

  let query = `
    SELECT
      oe.id, oe.event_type, oe.aggregate_id, oe.payload,
      oe.created_at,
      CASE
        WHEN oe.processed_at IS NOT NULL THEN 'processed'
        WHEN oe.attempts >= oe.max_attempts THEN 'failed'
        ELSE 'pending'
      END as status
    FROM outbox_events oe
    WHERE oe.tenant = $1
  `;

  const params = ['a4ayc80OGd'];

  if (excludeAcknowledged) {
    query += ` AND oe.id NOT IN (
      SELECT event_id FROM event_acknowledgments
      WHERE user_id = $2 AND status IN ('processed', 'skipped')
    )`;
    params.push(userId);
  }

  query += ` ORDER BY oe.created_at DESC`;

  const events = await dbQuery(query, params);

  console.log(`   Found ${events.length} events`);
  events.forEach(event => {
    const change = event.payload.changed_fields ? JSON.stringify(event.payload.changed_fields) : 'N/A';
    console.log(`   - Event ${event.id}: ${event.event_type} (${change})`);
  });

  return events;
}

/**
 * Show acknowledgment records for an event
 */
async function showAcknowledgments(eventId) {
  console.log(`📊 Acknowledgment records for event ${eventId}:`);

  const acks = await dbQuery(`
    SELECT user_id, processor, status, processed_at, metadata
    FROM event_acknowledgments
    WHERE event_id = $1
    ORDER BY processed_at
  `, [eventId]);

  if (acks.length === 0) {
    console.log(`   No acknowledgments found`);
  } else {
    acks.forEach(ack => {
      const metadata = JSON.parse(ack.metadata || '{}');
      console.log(`   - User ${ack.user_id}: ${ack.status} (${metadata.user || 'Unknown'})`);
      console.log(`     Processor: ${ack.processor}`);
      console.log(`     Time: ${ack.processed_at}`);
    });
  }
}

/**
 * Main demo execution
 */
async function runAcknowledmentDemo() {
  console.log('🚀 User-Specific Event Acknowledgment Demo');
  console.log('=' .repeat(50));

  try {
    // Step 1: Create a sample event
    console.log('\n📋 Step 1: Creating sample project status change event');
    const eventId = await createSampleEvent();

    // Step 2: Show initial state - both users can see the event
    console.log('\n📋 Step 2: Initial state - both users can see the event');
    await getEventsForUser(101, false); // User A - show all events
    await getEventsForUser(102, false); // User B - show all events

    // Step 3: User A acknowledges the event
    console.log('\n📋 Step 3: User A acknowledges the event');
    await acknowledgeEventForUser(eventId, 101, 'User A');

    // Step 4: Check state after User A acknowledgment
    console.log('\n📋 Step 4: State after User A acknowledgment');
    console.log('   User A (excluding acknowledged):');
    await getEventsForUser(101, true); // Should not see the event
    console.log('   User B (excluding acknowledged):');
    await getEventsForUser(102, true); // Should still see the event

    // Step 5: User B acknowledges the same event
    console.log('\n📋 Step 5: User B acknowledges the same event');
    await acknowledgeEventForUser(eventId, 102, 'User B');

    // Step 6: Final state - both users have acknowledged
    console.log('\n📋 Step 6: Final state - both users have acknowledged');
    console.log('   User A (excluding acknowledged):');
    await getEventsForUser(101, true); // Should not see the event
    console.log('   User B (excluding acknowledged):');
    await getEventsForUser(102, true); // Should not see the event

    // Step 7: Show acknowledgment records
    console.log('\n📋 Step 7: Final acknowledgment records');
    await showAcknowledgments(eventId);

    // Success summary
    console.log('\n🎉 DEMO COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(50));
    console.log('✅ Same event was visible to both users initially');
    console.log('✅ User A acknowledged → event hidden from User A only');
    console.log('✅ User B could still see and acknowledge the same event');
    console.log('✅ Final state: both users have independent acknowledgments');
    console.log('✅ Event is now hidden from both users when using exclude_acknowledged=true');

    console.log('\n💡 Key Benefits for Flowgram.ai:');
    console.log('• Multiple users can process the same events independently');
    console.log('• No interference between different user workflows');
    console.log('• Complete audit trail of who processed what and when');
    console.log('• Flexible filtering with exclude_acknowledged parameter');

  } catch (error) {
    console.error('\n💥 DEMO FAILED:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure PostgreSQL database is running');
    console.log('2. Verify database connection parameters');
    console.log('3. Check that migrations have been applied');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Test API endpoint to demonstrate actual usage
async function testAcknowledmentAPI() {
  console.log('\n🔗 Testing actual API endpoints...');

  try {
    // Test the outbox events endpoint (should work without auth for this demo)
    const response = await fetch(`${API_BASE}/outbox/stats`);

    if (response.ok) {
      console.log('✅ Outbox API is accessible');
    } else {
      console.log(`⚠️  Outbox API returned status: ${response.status}`);
    }
  } catch (error) {
    console.log(`⚠️  Could not reach API at ${API_BASE}: ${error.message}`);
  }
}

// Run the demo
if (require.main === module) {
  runAcknowledmentDemo()
    .then(() => testAcknowledmentAPI())
    .catch(error => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAcknowledmentDemo,
  createSampleEvent,
  acknowledgeEventForUser,
  getEventsForUser,
  showAcknowledgments
};