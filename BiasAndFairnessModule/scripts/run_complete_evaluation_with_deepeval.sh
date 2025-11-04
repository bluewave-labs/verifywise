#!/bin/bash

################################################################################
# Complete Evaluation Script with DeepEval
# 
# This script runs the complete evaluation pipeline:
# 1. Standard fairness evaluation (inference + metrics)
# 2. DeepEval comprehensive LLM evaluation
# 3. Results summary
#
# Usage:
#   ./scripts/run_complete_evaluation_with_deepeval.sh
#   ./scripts/run_complete_evaluation_with_deepeval.sh --limit 10
#   ./scripts/run_complete_evaluation_with_deepeval.sh --use-all-metrics
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
print_header "Checking Prerequisites"

# Check Python
if ! command -v python &> /dev/null; then
    print_error "Python not found. Please install Python 3.8+."
    exit 1
fi
print_success "Python found: $(python --version)"

# Check virtual environment
if [[ "$VIRTUAL_ENV" == "" ]]; then
    print_warning "Virtual environment not activated."
    echo "Attempting to activate..."
    if [ -d "venv" ]; then
        source venv/bin/activate
        print_success "Virtual environment activated"
    else
        print_error "Virtual environment not found. Run: python -m venv venv"
        exit 1
    fi
else
    print_success "Virtual environment active: $VIRTUAL_ENV"
fi

# Check OpenAI API key
if [ -z "$OPENAI_API_KEY" ]; then
    print_warning "OPENAI_API_KEY not set in environment"
    echo "Checking .env file..."
    if [ -f ".env" ]; then
        source .env
        if [ -z "$OPENAI_API_KEY" ]; then
            print_error "OPENAI_API_KEY not found in .env file"
            echo "DeepEval metrics will not work without an API key."
            echo "Get your key from: https://platform.openai.com/api-keys"
            exit 1
        else
            print_success "OPENAI_API_KEY loaded from .env"
        fi
    else
        print_error ".env file not found"
        echo "Create one from the template: cp .env.example .env"
        exit 1
    fi
else
    print_success "OPENAI_API_KEY found in environment"
fi

# Parse arguments
LIMIT=""
DEEPEVAL_ARGS=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --limit)
            LIMIT="$2"
            DEEPEVAL_ARGS="$DEEPEVAL_ARGS --limit $2"
            shift 2
            ;;
        --use-all-metrics)
            DEEPEVAL_ARGS="$DEEPEVAL_ARGS --use-all-metrics"
            shift
            ;;
        --use-bias)
            DEEPEVAL_ARGS="$DEEPEVAL_ARGS --use-bias"
            shift
            ;;
        --use-toxicity)
            DEEPEVAL_ARGS="$DEEPEVAL_ARGS --use-toxicity"
            shift
            ;;
        --use-answer-relevancy)
            DEEPEVAL_ARGS="$DEEPEVAL_ARGS --use-answer-relevancy"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--limit N] [--use-all-metrics] [--use-bias] [--use-toxicity] [--use-answer-relevancy]"
            exit 1
            ;;
    esac
done

# Step 1: Run standard fairness evaluation
print_header "Step 1: Running Standard Fairness Evaluation"

echo "This will:"
echo "  • Load the Adult Census Income dataset"
echo "  • Run model inference"
echo "  • Calculate fairness metrics (demographic parity, equalized odds, etc.)"
echo ""

if python run_full_evaluation.py; then
    print_success "Standard fairness evaluation completed"
else
    print_error "Standard fairness evaluation failed"
    exit 1
fi

# Check if inference results exist
if [ ! -f "artifacts/cleaned_inference_results.csv" ]; then
    print_error "Inference results not found at artifacts/cleaned_inference_results.csv"
    exit 1
fi

TOTAL_SAMPLES=$(wc -l < artifacts/cleaned_inference_results.csv)
print_success "Generated inference results: $TOTAL_SAMPLES samples"

# Step 2: Run DeepEval evaluation
print_header "Step 2: Running DeepEval Comprehensive Evaluation"

echo "This will:"
echo "  • Load inference results"
echo "  • Evaluate with DeepEval metrics"
echo "  • Generate comprehensive reports"
echo ""

if [ -n "$LIMIT" ]; then
    echo "Limiting evaluation to $LIMIT samples for testing..."
fi

if python run_deepeval_evaluation.py $DEEPEVAL_ARGS; then
    print_success "DeepEval evaluation completed"
else
    print_error "DeepEval evaluation failed"
    exit 1
fi

# Step 3: Display summary
print_header "Step 3: Evaluation Summary"

echo "Standard Fairness Results:"
echo "  Location: artifacts/clean_results.json"
if [ -f "artifacts/clean_results.json" ]; then
    print_success "Standard results available"
else
    print_warning "Standard results not found"
fi

echo ""
echo "DeepEval Results:"
echo "  Location: artifacts/deepeval_results/"

if [ -d "artifacts/deepeval_results" ]; then
    RESULT_FILES=$(ls -1 artifacts/deepeval_results/ 2>/dev/null | wc -l)
    if [ "$RESULT_FILES" -gt 0 ]; then
        print_success "DeepEval results available ($RESULT_FILES files)"
        echo ""
        echo "Latest results:"
        ls -lht artifacts/deepeval_results/ | head -n 5
    else
        print_warning "No DeepEval result files found"
    fi
else
    print_warning "DeepEval results directory not found"
fi

# Final summary
print_header "Evaluation Complete!"

echo "✅ Standard Fairness Metrics:"
echo "   • Demographic Parity"
echo "   • Equalized Odds"
echo "   • Predictive Equality"
echo "   • And more..."
echo ""

echo "✅ DeepEval LLM Metrics:"
echo "   • Answer Relevancy"
echo "   • Bias Detection"
echo "   • Toxicity Detection"
echo "   • And more..."
echo ""

echo "📊 Next Steps:"
echo "   1. Review results: ls -lh artifacts/deepeval_results/"
echo "   2. Read summary: cat artifacts/deepeval_results/deepeval_summary_*.json"
echo "   3. Open CSV: open artifacts/deepeval_results/deepeval_results_*.csv"
echo "   4. Read report: less artifacts/deepeval_results/deepeval_report_*.txt"
echo ""

print_success "All evaluations completed successfully!"

