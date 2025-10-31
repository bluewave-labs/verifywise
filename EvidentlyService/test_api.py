"""
Quick test script to verify Evidently Cloud API connection
"""
import asyncio
from app.evidently_client import EvidentlyClient

# Credentials from EVIDENTLY_INTEGRATION_STATUS.md
EVIDENTLY_URL = "https://app.evidently.cloud"
API_TOKEN = "dG9rbgE8agsf6w1Gn5VAGkGlpA3eo5moRs6t+h676aNqsjVHYABQgTuz/gIHsY/hau2+Xn9ZHTqwcuSPD5HE/p/ensAonRN3PDhcJnIF7Ki5adqVMjXiQmewhdEqAkMznzGE14QZtDLdw/hKQIHUgdiCuMQ+6nmaUYYN"

async def main():
    print("Testing Evidently Cloud API connection...")
    print(f"URL: {EVIDENTLY_URL}")
    print(f"Token: {API_TOKEN[:20]}...")

    client = EvidentlyClient(EVIDENTLY_URL, API_TOKEN)

    # Test 1: Connection test
    print("\n[Test 1] Testing connection...")
    try:
        is_connected = await client.test_connection()
        if is_connected:
            print("✓ Connection successful!")
        else:
            print("✗ Connection failed")
            return
    except Exception as e:
        print(f"✗ Connection error: {str(e)}")
        return

    # Test 2: List projects
    print("\n[Test 2] Listing projects...")
    try:
        projects = await client.list_projects()
        print(f"✓ Found {len(projects)} projects")
        for project in projects[:3]:  # Show first 3
            print(f"  - {project.get('name', 'N/A')} (ID: {project.get('id', 'N/A')})")
    except Exception as e:
        print(f"✗ Error listing projects: {str(e)}")

    print("\nAll tests completed!")

if __name__ == "__main__":
    asyncio.run(main())
