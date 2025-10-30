// PostHog API connectivity test
export const testPostHogConnectivity = async () => {
  const API_KEY = import.meta.env.VITE_POSTHOG_API_KEY
  const HOST = import.meta.env.VITE_POSTHOG_HOST

  console.log('PostHog: Testing connectivity...')
  console.log('PostHog: API Key (first 10 chars):', API_KEY?.substring(0, 10))
  console.log('PostHog: Host:', HOST)

  try {
    // Test a simple POST request to the PostHog API
    const response = await fetch(`${HOST}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: API_KEY,
        event: 'connectivity_test',
        properties: {
          timestamp: new Date().toISOString(),
          test: true,
        },
        distinct_id: 'connectivity_test_user',
      }),
    })

    console.log('PostHog: Direct API test response status:', response.status)
    console.log('PostHog: Direct API test response headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const result = await response.text()
      console.log('PostHog: Direct API test response body:', result)
      console.log('PostHog: ✅ Direct API connectivity successful!')
    } else {
      console.error('PostHog: ❌ Direct API test failed:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('PostHog: Error response body:', errorText)
    }
  } catch (error) {
    console.error('PostHog: ❌ Direct API test error:', error)
  }
}