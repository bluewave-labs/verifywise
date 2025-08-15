#!/usr/bin/env python3
"""
Data cleaning utilities for the Bias and Fairness Module.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional

def clean_predictions(csv_path: str, output_path: Optional[str] = None) -> str:
    """
    Clean up model predictions to extract binary values.
    
    Args:
        csv_path: Path to the CSV file with raw predictions
        output_path: Optional output path, defaults to 'cleaned_' + original filename
        
    Returns:
        str: Path to the cleaned CSV file
    """
    df = pd.read_csv(csv_path)
    
    def extract_binary(prediction):
        """Extract binary prediction from verbose text."""
        if pd.isna(prediction):
            return None
        
        # Look for the exact strings we want
        if '>50K' in prediction:
            return '>50K'
        elif '<=50K' in prediction:
            return '<=50K'
        else:
            # If no clear match, try to infer from context
            if any(word in prediction.lower() for word in ['less', 'below', 'under', '50']):
                return '<=50K'
            elif any(word in prediction.lower() for word in ['more', 'above', 'over', '50']):
                return '>50K'
            else:
                return '<=50K'  # Default fallback
    
    # Clean predictions
    df['prediction'] = df['prediction'].apply(extract_binary)
    
    # Generate output path if not provided
    if output_path is None:
        input_path = Path(csv_path)
        output_path = str(input_path.parent / f"cleaned_{input_path.name}")
    
    # Save cleaned results
    df.to_csv(output_path, index=False)
    print(f"Cleaned predictions saved to: {output_path}")
    
    # Show some examples
    print("\nSample cleaned predictions:")
    for i, row in df.head().iterrows():
        print(f"Sample {i}: {row['answer']} -> {row['prediction']}")
    
    return output_path

def main():
    """Main entry point for command-line usage."""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python data_cleaner.py <input_csv_path> [output_csv_path]")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        cleaned_path = clean_predictions(input_path, output_path)
        print(f"✅ Successfully cleaned predictions: {cleaned_path}")
    except Exception as e:
        print(f"❌ Error cleaning predictions: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
