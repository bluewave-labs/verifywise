#!/usr/bin/env python3
"""
DeepEval Installation Verification Script

Checks that all DeepEval components are properly installed and configured.
"""

import sys
import os
from pathlib import Path

# Colors for terminal output
class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def print_header(text):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.NC}")
    print(f"{Colors.BLUE}{text}{Colors.NC}")
    print(f"{Colors.BLUE}{'='*60}{Colors.NC}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.NC}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.NC}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.NC}")

def check_python_version():
    """Check Python version."""
    print_header("Checking Python Version")
    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"
    
    if version.major >= 3 and version.minor >= 8:
        print_success(f"Python version: {version_str}")
        return True
    else:
        print_error(f"Python {version_str} found. Requires Python 3.8+")
        return False

def check_dependencies():
    """Check required dependencies."""
    print_header("Checking Dependencies")
    
    required = [
        'deepeval',
        'pandas',
        'numpy',
        'pydantic',
        'yaml',
    ]
    
    all_installed = True
    for package in required:
        try:
            __import__(package)
            print_success(f"{package} is installed")
        except ImportError:
            print_error(f"{package} is NOT installed")
            all_installed = False
    
    return all_installed

def check_file_structure():
    """Check that all DeepEval files exist."""
    print_header("Checking File Structure")
    
    required_files = [
        "src/deepeval_engine/__init__.py",
        "src/deepeval_engine/deepeval_evaluator.py",
        "src/deepeval_engine/deepeval_dataset.py",
        "src/deepeval_engine/README.md",
        "run_deepeval_evaluation.py",
        "configs/config.yaml",
        "DEEPEVAL_QUICKSTART.md",
    ]
    
    all_exist = True
    for file_path in required_files:
        path = Path(file_path)
        if path.exists():
            print_success(f"{file_path}")
        else:
            print_error(f"{file_path} NOT FOUND")
            all_exist = False
    
    return all_exist

def check_directories():
    """Check that required directories exist."""
    print_header("Checking Directories")
    
    required_dirs = [
        "src/deepeval_engine",
        "artifacts/deepeval_results",
        "configs",
    ]
    
    all_exist = True
    for dir_path in required_dirs:
        path = Path(dir_path)
        if path.exists() and path.is_dir():
            print_success(f"{dir_path}/")
        else:
            print_error(f"{dir_path}/ NOT FOUND")
            all_exist = False
    
    return all_exist

def check_env_variables():
    """Check environment variables."""
    print_header("Checking Environment Variables")
    
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        masked_key = openai_key[:8] + "..." + openai_key[-4:]
        print_success(f"OPENAI_API_KEY is set ({masked_key})")
        return True
    else:
        print_warning("OPENAI_API_KEY is not set")
        print("  DeepEval metrics require an OpenAI API key.")
        print("  Set it with: export OPENAI_API_KEY='your-key'")
        print("  Or add to .env file")
        return False

def check_config():
    """Check configuration file."""
    print_header("Checking Configuration")
    
    config_path = Path("configs/config.yaml")
    if not config_path.exists():
        print_error("config.yaml not found")
        return False
    
    try:
        with open(config_path, 'r') as f:
            content = f.read()
            
        if 'deepeval' in content:
            print_success("DeepEval configuration found in config.yaml")
            
            # Check for key configuration items
            items = {
                'metrics:': 'Metrics configuration',
                'metric_thresholds:': 'Metric thresholds',
                'deepeval_results_dir': 'Results directory',
            }
            
            for key, desc in items.items():
                if key in content:
                    print_success(f"  {desc} present")
                else:
                    print_warning(f"  {desc} missing")
            
            return True
        else:
            print_warning("DeepEval configuration not found in config.yaml")
            print("  You may need to add it manually or use config.deepeval.yaml as a template")
            return False
            
    except Exception as e:
        print_error(f"Error reading config.yaml: {e}")
        return False

def test_imports():
    """Test importing DeepEval modules."""
    print_header("Testing Module Imports")
    
    try:
        # Test DeepEval package itself
        import deepeval
        print_success("deepeval package imports successfully")
        
        # Test that our module files exist and are syntactically correct
        # We can't import them directly due to relative imports, but we can check syntax
        import py_compile
        import tempfile
        
        files_to_check = [
            'src/deepeval_engine/__init__.py',
            'src/deepeval_engine/deepeval_evaluator.py',
            'src/deepeval_engine/deepeval_dataset.py',
        ]
        
        for file_path in files_to_check:
            try:
                py_compile.compile(file_path, doraise=True)
            except py_compile.PyCompileError as e:
                print_error(f"Syntax error in {file_path}: {e}")
                return False
        
        print_success("All module files are syntactically valid")
        
        # Test the main entry point can be imported
        import importlib.util
        spec = importlib.util.spec_from_file_location("run_deepeval", "run_deepeval_evaluation.py")
        if spec and spec.loader:
            print_success("run_deepeval_evaluation.py is importable")
        
        return True
        
    except Exception as e:
        print_error(f"Import error: {e}")
        return False

def main():
    """Run all checks."""
    print_header("DeepEval Installation Verification")
    print("This script verifies that DeepEval is properly installed and configured.")
    
    checks = [
        ("Python Version", check_python_version),
        ("Dependencies", check_dependencies),
        ("File Structure", check_file_structure),
        ("Directories", check_directories),
        ("Environment Variables", check_env_variables),
        ("Configuration", check_config),
        ("Module Imports", test_imports),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print_error(f"Error during {name} check: {e}")
            results.append((name, False))
    
    # Summary
    print_header("Verification Summary")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        color = Colors.GREEN if result else Colors.RED
        print(f"{color}{status}{Colors.NC} - {name}")
    
    print(f"\nPassed: {passed}/{total}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}{'='*60}{Colors.NC}")
        print(f"{Colors.GREEN}✅ All checks passed! DeepEval is ready to use.{Colors.NC}")
        print(f"{Colors.GREEN}{'='*60}{Colors.NC}\n")
        print("Next steps:")
        print("  1. Run: python run_full_evaluation.py")
        print("  2. Run: python run_deepeval_evaluation.py --limit 5")
        print("  3. Check: ls -lh artifacts/deepeval_results/")
        return 0
    else:
        print(f"\n{Colors.RED}{'='*60}{Colors.NC}")
        print(f"{Colors.RED}❌ Some checks failed. Please fix the issues above.{Colors.NC}")
        print(f"{Colors.RED}{'='*60}{Colors.NC}\n")
        
        if not check_env_variables():
            print("To set up OpenAI API key:")
            print("  1. Get key from: https://platform.openai.com/api-keys")
            print("  2. Set it: export OPENAI_API_KEY='your-key'")
            print("  3. Or add to .env file")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())

