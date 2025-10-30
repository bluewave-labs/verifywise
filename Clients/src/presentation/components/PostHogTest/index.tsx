import React from 'react';
import Button from '../Button';
import { usePostHog } from '../../../application/hooks/usePostHog';
import {
  trackJavaScriptError,
  trackNetworkError,
  trackValidationError,
  trackAuthError,
  trackCustomError,
  ErrorSeverity,
} from '../../../application/utils/error-tracking';
import { testPostHogConnectivity } from '../../../application/utils/posthog-test';

const PostHogTest: React.FC = () => {
  const {
    track,
    trackFeature,
    trackModalInteraction,
    trackJourney,
    trackFunnel,
    trackConversionEvent,
    trackPerformanceMetric,
    trackAIModel,
    trackAssessment,
    trackReport,
    setUserProps,
  } = usePostHog();

  const handleTestEvent = () => {
    track('test_button_clicked', {
      component: 'PostHogTest',
      timestamp: new Date().toISOString(),
    });
    console.log('PostHog: Test event tracked');
  };

  const handleFeatureTest = () => {
    trackFeature('test_feature', 'used', {
      test_property: 'demo_value',
    });
    console.log('PostHog: Feature test event tracked');
  };

  const handleModalTest = () => {
    trackModalInteraction('test_modal', 'open', {
      trigger: 'test_button',
    });
    console.log('PostHog: Modal test event tracked');
  };

  // Advanced test handlers
  const handleJourneyTest = () => {
    trackJourney('user_onboarding', 'step_1_profile_completion', {
      step_number: 1,
      completion_percentage: 25,
    });
    console.log('PostHog: Journey test event tracked');
  };

  const handleFunnelTest = () => {
    trackFunnel('project_creation', 'select_template', {
      template_type: 'ai_assessment',
      time_spent: 45,
    });
    console.log('PostHog: Funnel test event tracked');
  };

  const handlePerformanceTest = () => {
    trackPerformanceMetric('page_load_time', 1200, {
      page: '/dashboard',
      browser: 'Chrome',
    });
    console.log('PostHog: Performance test event tracked');
  };

  const handleAIModelTest = () => {
    trackAIModel('gpt-4', 'risk_analysis', {
      input_tokens: 1500,
      output_tokens: 800,
      response_time: 3.2,
    });
    console.log('PostHog: AI model test event tracked');
  };

  const handleAssessmentTest = () => {
    trackAssessment('data_collection', 'fairness_bias', {
      risk_level: 'medium',
      compliance_score: 85,
    });
    console.log('PostHog: Assessment test event tracked');
  };

  const handleReportTest = () => {
    trackReport('compliance_summary', 'pdf', {
      pages: 12,
      file_size: '2.4MB',
      generation_time: 8.5,
    });
    console.log('PostHog: Report test event tracked');
  };

  const handleConversionTest = () => {
    trackConversionEvent('trial_to_paid', 'trial_user', 'paid_subscription', {
      trial_days: 14,
      plan_type: 'enterprise',
      conversion_value: 299,
    });
    console.log('PostHog: Conversion test event tracked');
  };

  const handleUserPropertiesTest = () => {
    setUserProps({
      subscription_tier: 'enterprise',
      company_size: '100-500',
      industry: 'technology',
      role: 'compliance_officer',
      join_date: '2024-01-15',
    });
    console.log('PostHog: User properties set');
  };

  // Error tracking test handlers
  const handleJavaScriptErrorTest = () => {
    try {
      // Simulate a JavaScript error
      const error = new Error('Test JavaScript error - this is intentional');
      error.name = 'TestError';
      trackJavaScriptError(error, {
        test: true,
        trigger: 'manual_test_button',
      });
      console.log('PostHog: JavaScript error tracked (simulated)');
    } catch (err) {
      console.error('Error in test:', err);
    }
  };

  const handleNetworkErrorTest = () => {
    trackNetworkError(
      'https://api.example.com/test-endpoint',
      'GET',
      500,
      new Error('Test network error - this is intentional'),
      {
        test: true,
        trigger: 'manual_test_button',
      }
    );
    console.log('PostHog: Network error tracked (simulated)');
  };

  const handleValidationErrorTest = () => {
    trackValidationError(
      'test_form',
      {
        email: 'Invalid email format',
        password: 'Password too short',
      },
      {
        test: true,
        trigger: 'manual_test_button',
      }
    );
    console.log('PostHog: Validation error tracked (simulated)');
  };

  const handleAuthErrorTest = () => {
    trackAuthError(
      'authentication_failed',
      'Test authentication error - this is intentional',
      {
        test: true,
        trigger: 'manual_test_button',
      }
    );
    console.log('PostHog: Auth error tracked (simulated)');
  };

  const handleCustomErrorTest = () => {
    trackCustomError(
      'test_custom_error',
      'This is a test custom error - intentional',
      ErrorSeverity.LOW,
      {
        test: true,
        trigger: 'manual_test_button',
      }
    );
    console.log('PostHog: Custom error tracked (simulated)');
  };

  const handleRealErrorTest = () => {
    // This will throw a real error that should be caught by the Error Boundary
    throw new Error('Test Error Boundary - this error should be caught by React Error Boundary');
  };

  const handleDiagnosticTest = async () => {
    console.log('=== PostHog Diagnostics ===');
    console.log('1. Environment Check:');
    console.log('   VITE_POSTHOG_API_KEY:', import.meta.env.VITE_POSTHOG_API_KEY?.substring(0, 15) + '...');
    console.log('   VITE_POSTHOG_HOST:', import.meta.env.VITE_POSTHOG_HOST);
    console.log('   VITE_REAL_POSTHOG:', import.meta.env.VITE_REAL_POSTHOG);

    console.log('\n2. PostHog Client on Window:');
    const windowPostHog = (window as any).posthog;
    if (windowPostHog) {
      console.log('   ✅ PostHog found on window.posthog');
      console.log('   Config:', windowPostHog.config);
      console.log('   __loaded:', windowPostHog.__loaded);
      console.log('   API Host:', windowPostHog.config?.api_host);
      console.log('   Token:', windowPostHog.config?.token?.substring(0, 15) + '...');
    } else {
      console.log('   ❌ PostHog NOT found on window.posthog');
      console.log('   This means PostHog SDK did not initialize properly');
    }

    console.log('\n3. Sending Test Event via SDK:');
    try {
      track('diagnostic_connectivity_test', {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'diagnostic_button',
      });
      console.log('   ✅ Test event sent via SDK (check Network tab for request)');
    } catch (error) {
      console.error('   ❌ Failed to send test event:', error);
    }

    console.log('\n4. Network Tab Instructions:');
    console.log('   📍 Open Network tab in DevTools');
    console.log('   📍 Filter by:', import.meta.env.VITE_POSTHOG_HOST);
    console.log('   📍 Look for: /batch/ or /e/ or /decide/ endpoints');
    console.log('   📍 Check status: 200 = success, 4xx/5xx = error');

    console.log('\n5. Running Direct API Test (expected to fail due to CORS):');
    try {
      await testPostHogConnectivity();
    } catch (error) {
      console.log('   ⚠️  Direct API test failed (this is normal due to CORS)');
      console.log('   The PostHog SDK handles CORS differently and should work');
    }

    console.log('\n=== End Diagnostics ===');
    console.log('📊 IMPORTANT: Check Network tab now for requests to us.i.posthog.com');
    console.log('⏱️  If you see requests with status 200, PostHog is working!');
    console.log('⏱️  Events appear in dashboard after 1-2 minutes (batching delay)');
  };


  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#13715B',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '200px',
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>PostHog Test</div>

      {/* Diagnostic Button */}
      <div style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '8px' }}>
        <Button
          onClick={handleDiagnosticTest}
          sx={{ fontSize: '11px', padding: '6px 12px', margin: '2px', backgroundColor: '#ff6b6b', fontWeight: 'bold' }}
        >
          🔍 Run Diagnostics
        </Button>
        <div style={{ fontSize: '8px', opacity: 0.7, marginTop: '4px' }}>
          Check console for results
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <Button
          onClick={handleTestEvent}
          sx={{ fontSize: '10px', padding: '4px 8px', margin: '2px' }}
        >
          Test Event
        </Button>
      </div>
      <div style={{ marginBottom: '8px' }}>
        <Button
          onClick={handleFeatureTest}
          sx={{ fontSize: '10px', padding: '4px 8px', margin: '2px' }}
        >
          Test Feature
        </Button>
      </div>
      <div style={{ marginBottom: '8px' }}>
        <Button
          onClick={handleModalTest}
          sx={{ fontSize: '10px', padding: '4px 8px', margin: '2px' }}
        >
          Test Modal
        </Button>
      </div>

      {/* Advanced Analytics Tests */}
      <div style={{ fontWeight: 'bold', margin: '8px 0', borderTop: '1px solid #fff', paddingTop: '8px' }}>
        Advanced Analytics
      </div>

      <div style={{ marginBottom: '4px' }}>
        <Button
          onClick={handleJourneyTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#28a745' }}
        >
          Journey
        </Button>
        <Button
          onClick={handleFunnelTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#28a745' }}
        >
          Funnel
        </Button>
        <Button
          onClick={handleConversionTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#ffc107' }}
        >
          Conversion
        </Button>
      </div>

      <div style={{ marginBottom: '4px' }}>
        <Button
          onClick={handleAIModelTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#17a2b8' }}
        >
          AI Model
        </Button>
        <Button
          onClick={handleAssessmentTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#17a2b8' }}
        >
          Assessment
        </Button>
        <Button
          onClick={handleReportTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#17a2b8' }}
        >
          Report
        </Button>
      </div>

      <div style={{ marginBottom: '4px' }}>
        <Button
          onClick={handlePerformanceTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#6f42c1' }}
        >
          Performance
        </Button>
        <Button
          onClick={handleUserPropertiesTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#e83e8c' }}
        >
          User Props
        </Button>
      </div>

      <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '8px' }}>
        Advanced analytics enabled 🚀
      </div>

      <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '4px' }}>
        Real tracking added to:
        • Project creation forms
        • Assessment workflows
        • AI model inventory
        • Filter interactions
        • Form submissions
      </div>

      {/* Error Tracking Tests */}
      <div style={{ fontWeight: 'bold', margin: '8px 0', borderTop: '1px solid #fff', paddingTop: '8px' }}>
        Error Tracking Tests
      </div>

      <div style={{ marginBottom: '4px' }}>
        <Button
          onClick={handleJavaScriptErrorTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#dc3545' }}
        >
          JS Error
        </Button>
        <Button
          onClick={handleNetworkErrorTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#dc3545' }}
        >
          Network
        </Button>
        <Button
          onClick={handleValidationErrorTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#ffc107' }}
        >
          Validation
        </Button>
      </div>

      <div style={{ marginBottom: '4px' }}>
        <Button
          onClick={handleAuthErrorTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#dc3545' }}
        >
          Auth Error
        </Button>
        <Button
          onClick={handleCustomErrorTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#6c757d' }}
        >
          Custom
        </Button>
        <Button
          onClick={handleRealErrorTest}
          sx={{ fontSize: '9px', padding: '3px 6px', margin: '1px', backgroundColor: '#ff0000' }}
        >
          Boundary
        </Button>
      </div>

      <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '4px' }}>
        Error tracking initialized ⚠️
      </div>
    </div>
  );
};

export default PostHogTest;