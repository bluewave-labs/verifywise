"""
Test script to verify Evidently Cloud connection and understand data structure
"""
import asyncio
from app.evidently_client import EvidentlyClient
import json

# Evidently Cloud configuration
EVIDENTLY_URL = "https://app.evidently.cloud"
API_TOKEN = "dG9rbgE8agsf6w1Gn5VAGkGlpA3eo5moRs6t+h676aNqsjVHYABQgTuz/gIHsY/hau2+Xn9ZHTqwcuSPD5HE/p/ensAonRN3PDhcJnIF7Ki5adqVMjXiQmewhdEqAkMznzGE14QZtDLdw/hKQIHUgdiCuMQ+6nmaUYYN"

async def main():
    """Test Evidently connection and fetch data"""
    print("=" * 60)
    print("Testing Evidently Cloud Connection")
    print("=" * 60)

    client = EvidentlyClient(EVIDENTLY_URL, API_TOKEN)

    # Test 1: Connection
    print("\n[1] Testing connection...")
    is_connected = await client.test_connection()
    print(f"Connection status: {'✓ SUCCESS' if is_connected else '✗ FAILED'}")

    if not is_connected:
        print("\nConnection failed. Please check your API token and URL.")
        return

    # Test 2: List projects
    print("\n[2] Listing projects...")
    try:
        projects = await client.list_projects()
        print(f"Found {len(projects)} projects")

        if projects:
            print("\nProjects:")
            for i, project in enumerate(projects[:5], 1):  # Show first 5
                print(f"  {i}. {project['name']} (ID: {project['id']})")

            # Test 3: Get metrics for first project
            if len(projects) > 0:
                first_project = projects[0]
                project_id = first_project['id']
                print(f"\n[3] Fetching metrics for project: {first_project['name']}")

                # Drift metrics
                print("\n  → Fetching drift metrics...")
                drift_metrics = await client.get_drift_metrics(project_id)
                print(f"     Found {len(drift_metrics.get('metrics', []))} drift metrics")
                if drift_metrics.get('metrics'):
                    print(f"     Sample: {json.dumps(drift_metrics['metrics'][0], indent=4)}")

                # Performance metrics
                print("\n  → Fetching performance metrics...")
                performance_metrics = await client.get_performance_metrics(project_id)
                print(f"     Found {len(performance_metrics.get('metrics', []))} performance metrics")
                if performance_metrics.get('metrics'):
                    print(f"     Sample: {json.dumps(performance_metrics['metrics'][0], indent=4)}")

                # Fairness metrics
                print("\n  → Fetching fairness metrics...")
                fairness_metrics = await client.get_fairness_metrics(project_id)
                print(f"     Found {len(fairness_metrics.get('metrics', []))} fairness metrics")
                if fairness_metrics.get('metrics'):
                    print(f"     Sample: {json.dumps(fairness_metrics['metrics'][0], indent=4)}")

                # Save full structure for reference
                full_data = {
                    "drift": drift_metrics,
                    "performance": performance_metrics,
                    "fairness": fairness_metrics
                }
                with open('evidently_data_structure.json', 'w') as f:
                    json.dump(full_data, f, indent=2)
                print("\n✓ Full data structure saved to evidently_data_structure.json")

        else:
            print("\n✗ No projects found in the workspace.")
            print("Please create a project and add some reports/snapshots first.")

    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
