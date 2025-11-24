'use strict';

/**
 * Migration: Add performance indexes for comment queries
 *
 * Adds composite indexes to optimize the unread count query in getTableCounts()
 * which uses LEFT JOIN between comments and comment_read_status tables.
 *
 * Performance Impact:
 * - Without index: Full table scan on comments table
 * - With index: Index scan using composite key
 * - Expected improvement: 5-10x faster queries on large datasets
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add composite index on comments table for unread count query
    // This index covers the WHERE clause and JOIN conditions
    // Note: An index on (table_id, row_id, organization_id) already exists,
    // but we need created_at included for optimal query performance
    await queryInterface.addIndex('comments',
      ['table_id', 'row_id', 'organization_id', 'created_at'],
      {
        name: 'comments_unread_query_idx'
      }
    );

    // Add composite index on comment_read_status for JOIN performance
    // This optimizes the LEFT JOIN condition
    await queryInterface.addIndex('comment_read_status',
      ['user_id', 'table_id', 'row_id', 'organization_id'],
      {
        name: 'comment_read_status_lookup_idx'
      }
    );

    console.log('✅ Added performance indexes for comment queries');
  },

  async down(queryInterface, Sequelize) {
    // Check if indexes exist before dropping them
    const commentIndexes = await queryInterface.showIndex('comments');
    const readStatusIndexes = await queryInterface.showIndex('comment_read_status');

    if (commentIndexes.some(idx => idx.name === 'comments_unread_query_idx')) {
      await queryInterface.removeIndex('comments', 'comments_unread_query_idx');
    }

    if (readStatusIndexes.some(idx => idx.name === 'comment_read_status_lookup_idx')) {
      await queryInterface.removeIndex('comment_read_status', 'comment_read_status_lookup_idx');
    }

    console.log('✅ Removed performance indexes for comment queries');
  }
};
