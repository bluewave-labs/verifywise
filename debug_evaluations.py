#!/usr/bin/env python3
"""
Debug script to check the bias and fairness evaluations in the database.
"""

import asyncio
import sys
from pathlib import Path

# Add the BiasAndFairnessServers src to path
sys.path.insert(0, str(Path(__file__).parent / "BiasAndFairnessServers" / "src"))

from database.db import get_db
from crud.bias_and_fairness import get_all_bias_fairness_evaluations

async def check_evaluations():
    """Check all evaluations in the database."""
    try:
        tenant = "default"  # or whatever tenant you're using
        
        async with get_db() as db:
            evaluations = await get_all_bias_fairness_evaluations(db, tenant)
            
            print(f"Found {len(evaluations)} evaluations:")
            print("=" * 80)
            
            for i, evaluation in enumerate(evaluations, 1):
                print(f"\n{i}. Evaluation ID: {evaluation.eval_id}")
                print(f"   Model: {evaluation.model_name}")
                print(f"   Dataset: {evaluation.dataset_name}")
                print(f"   Status: {evaluation.status}")
                print(f"   Created: {evaluation.created_at}")
                print(f"   Updated: {evaluation.updated_at}")
                
                if evaluation.results:
                    print(f"   Results: Available ({type(evaluation.results)})")
                else:
                    print(f"   Results: None")
                
                # Print config data if available
                if evaluation.config_data:
                    try:
                        import json
                        config = json.loads(evaluation.config_data)
                        print(f"   Config: Dataset={config.get('dataset', {}).get('name', 'N/A')}")
                    except:
                        print(f"   Config: Available (raw)")
                
                print("-" * 40)
        
    except Exception as e:
        print(f"❌ Error checking evaluations: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_evaluations())
