#!/usr/bin/env python3
"""
Unit test runner for the Bias and Fairness Module.

This script discovers and runs all unit tests in the tests/unit/ directory.
"""

import unittest
import sys
import os
from pathlib import Path

# Add the src directory to the path
src_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(src_path))

def run_unit_tests():
    """Discover and run all unit tests."""
    print("🧪 Running Unit Tests")
    print("=" * 50)
    
    # Discover tests in the unit directory
    unit_tests_dir = Path(__file__).parent / "unit"
    
    if not unit_tests_dir.exists():
        print("❌ Unit tests directory not found!")
        return False
    
    # Create test loader
    loader = unittest.TestLoader()
    
    # Discover tests
    suite = loader.discover(str(unit_tests_dir), pattern="test_*.py")
    
    # Create test runner
    runner = unittest.TextTestRunner(verbosity=2)
    
    # Run tests
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 UNIT TEST SUMMARY")
    print("=" * 50)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.failures:
        print("\n❌ FAILURES:")
        for test, traceback in result.failures:
            print(f"   {test}: {traceback}")
    
    if result.errors:
        print("\n💥 ERRORS:")
        for test, traceback in result.errors:
            print(f"   {test}: {traceback}")
    
    if result.wasSuccessful():
        print("\n🎉 All unit tests passed!")
        return True
    else:
        print("\n💥 Some unit tests failed!")
        return False


def run_specific_test(test_name):
    """Run a specific test by name."""
    print(f"🧪 Running specific test: {test_name}")
    print("=" * 50)
    
    # Create test loader
    loader = unittest.TestLoader()
    
    # Try to load the specific test
    try:
        suite = loader.loadTestsFromName(test_name)
    except Exception as e:
        print(f"❌ Could not load test '{test_name}': {e}")
        return False
    
    # Create test runner
    runner = unittest.TextTestRunner(verbosity=2)
    
    # Run tests
    result = runner.run(suite)
    
    return result.wasSuccessful()


def main():
    """Main function to run tests."""
    if len(sys.argv) > 1:
        # Run specific test
        test_name = sys.argv[1]
        success = run_specific_test(test_name)
    else:
        # Run all unit tests
        success = run_unit_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
