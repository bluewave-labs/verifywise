-- Seed demo automation execution logs
-- Run with: psql -U gorkemcetin -d verifywise -f seed-demo-logs.sql

-- Insert logs for "Vendor change automation" (ID: 8)
INSERT INTO "a4ayc80OGd".automation_execution_logs
  (automation_id, triggered_at, trigger_data, action_results, status, error_message, execution_time_ms, created_at)
VALUES
  -- Successful executions
  (8, NOW() - INTERVAL '5 days', '{"trigger_type":"vendor_updated","vendor_id":12,"vendor_name":"CloudTech Solutions","triggered_by":"system"}'::jsonb, '[{"action_type":"send_email","status":"success","result_data":{"recipients":["compliance@verifywise.ai"],"subject":"Vendor Profile Updated","sent_at":"2025-10-30T10:23:45Z"},"executed_at":"2025-10-30T10:23:45.500Z"},{"action_type":"create_task","status":"success","result_data":{"task_id":156,"title":"Review vendor changes","priority":"medium"},"executed_at":"2025-10-30T10:23:46.200Z"}]'::jsonb, 'success', NULL, 2100, NOW() - INTERVAL '5 days'),

  (8, NOW() - INTERVAL '3 days', '{"trigger_type":"vendor_updated","vendor_id":25,"vendor_name":"DataGuard Inc","triggered_by":"system"}'::jsonb, '[{"action_type":"send_email","status":"success","result_data":{"recipients":["security@verifywise.ai"],"subject":"Vendor Profile Updated","sent_at":"2025-11-01T14:12:30Z"},"executed_at":"2025-11-01T14:12:30.400Z"}]'::jsonb, 'success', NULL, 1550, NOW() - INTERVAL '3 days'),

  -- Partial success
  (8, NOW() - INTERVAL '2 days', '{"trigger_type":"vendor_updated","vendor_id":18,"vendor_name":"SecureVendor LLC","triggered_by":"user"}'::jsonb, '[{"action_type":"send_email","status":"success","result_data":{"recipients":["admin@verifywise.ai"],"subject":"Vendor Profile Updated"},"executed_at":"2025-11-02T09:45:12.300Z"},{"action_type":"send_slack_notification","status":"failure","error_message":"Slack API rate limit exceeded","executed_at":"2025-11-02T09:45:13.100Z"}]'::jsonb, 'partial_success', 'Some actions failed', 1820, NOW() - INTERVAL '2 days'),

  -- Recent successful execution
  (8, NOW() - INTERVAL '1 hour', '{"trigger_type":"vendor_updated","vendor_id":31,"vendor_name":"AI Analytics Corp","triggered_by":"system"}'::jsonb, '[{"action_type":"send_email","status":"success","result_data":{"recipients":["compliance@verifywise.ai","security@verifywise.ai"],"subject":"Critical Vendor Update","sent_at":"2025-11-04T12:15:20Z"},"executed_at":"2025-11-04T12:15:20.600Z"},{"action_type":"create_task","status":"success","result_data":{"task_id":287,"title":"Urgent: Review vendor security changes","priority":"high"},"executed_at":"2025-11-04T12:15:21.400Z"}]'::jsonb, 'success', NULL, 2450, NOW() - INTERVAL '1 hour');

-- Insert logs for "Model change automation" (ID: 9)
INSERT INTO "a4ayc80OGd".automation_execution_logs
  (automation_id, triggered_at, trigger_data, action_results, status, error_message, execution_time_ms, created_at)
VALUES
  -- Successful executions
  (9, NOW() - INTERVAL '7 days', '{"trigger_type":"model_deployed","model_id":42,"model_name":"Fraud Detection v2.1","triggered_by":"system"}'::jsonb, '[{"action_type":"send_email","status":"success","result_data":{"recipients":["ml-team@verifywise.ai","security@verifywise.ai"],"subject":"Model Deployed to Production","sent_at":"2025-10-28T16:45:30Z"},"executed_at":"2025-10-28T16:45:30.700Z"},{"action_type":"create_task","status":"success","result_data":{"task_id":201,"title":"Monitor new model performance","priority":"high"},"executed_at":"2025-10-28T16:45:31.500Z"},{"action_type":"send_slack_notification","status":"success","result_data":{"channel":"#ml-deployments","message":"Fraud Detection v2.1 is now live"},"executed_at":"2025-10-28T16:45:32.100Z"}]'::jsonb, 'success', NULL, 3250, NOW() - INTERVAL '7 days'),

  (9, NOW() - INTERVAL '4 days', '{"trigger_type":"model_updated","model_id":38,"model_name":"Risk Scorer v1.5","triggered_by":"user"}'::jsonb, '[{"action_type":"send_email","status":"success","result_data":{"recipients":["ml-team@verifywise.ai"],"subject":"Model Configuration Updated"},"executed_at":"2025-10-31T11:20:15.400Z"}]'::jsonb, 'success', NULL, 1280, NOW() - INTERVAL '4 days'),

  -- Failure
  (9, NOW() - INTERVAL '3 days', '{"trigger_type":"model_deployed","model_id":51,"model_name":"Sentiment Analyzer v3.0","triggered_by":"system"}'::jsonb, '[{"action_type":"send_email","status":"failure","error_message":"SMTP connection refused","executed_at":"2025-11-01T08:30:45.200Z"}]'::jsonb, 'failure', 'Failed to send deployment notification', 780, NOW() - INTERVAL '3 days'),

  -- Partial success
  (9, NOW() - INTERVAL '1 day', '{"trigger_type":"model_updated","model_id":45,"model_name":"Customer Churn Predictor v2.3","triggered_by":"system"}'::jsonb, '[{"action_type":"send_email","status":"success","result_data":{"recipients":["ml-team@verifywise.ai"],"subject":"Model Update Alert"},"executed_at":"2025-11-03T14:52:30.500Z"},{"action_type":"create_task","status":"success","result_data":{"task_id":312,"title":"Review model changes","priority":"medium"},"executed_at":"2025-11-03T14:52:31.200Z"},{"action_type":"send_slack_notification","status":"failure","error_message":"Channel not found","executed_at":"2025-11-03T14:52:31.800Z"}]'::jsonb, 'partial_success', 'Slack notification failed', 2150, NOW() - INTERVAL '1 day'),

  -- Recent successful
  (9, NOW() - INTERVAL '2 hours', '{"trigger_type":"model_deployed","model_id":56,"model_name":"Text Classifier v4.0","triggered_by":"system"}'::jsonb, '[{"action_type":"send_email","status":"success","result_data":{"recipients":["ml-team@verifywise.ai","ops@verifywise.ai"],"subject":"New Model Deployed","sent_at":"2025-11-04T11:30:22Z"},"executed_at":"2025-11-04T11:30:22.400Z"},{"action_type":"send_slack_notification","status":"success","result_data":{"channel":"#ml-deployments","message":"Text Classifier v4.0 deployed successfully"},"executed_at":"2025-11-04T11:30:23.100Z"}]'::jsonb, 'success', NULL, 1950, NOW() - INTERVAL '2 hours');

-- Show summary
SELECT
  automation_id,
  status,
  COUNT(*) as count
FROM "a4ayc80OGd".automation_execution_logs
GROUP BY automation_id, status
ORDER BY automation_id, status;
