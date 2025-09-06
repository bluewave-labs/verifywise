"""
Sample data for testing fairness metrics and evaluation components.
"""

import numpy as np
import pandas as pd

def create_sample_binary_classification_data(n_samples=1000, seed=42):
    """
    Create sample binary classification data with protected attributes.
    
    Args:
        n_samples: Number of samples to generate
        seed: Random seed for reproducibility
        
    Returns:
        tuple: (features_df, y_true, y_pred, protected_attributes)
    """
    np.random.seed(seed)
    
    # Generate features
    features = {
        'feature_1': np.random.normal(0, 1, n_samples),
        'feature_2': np.random.normal(0, 1, n_samples),
        'feature_3': np.random.normal(0, 1, n_samples),
        'age': np.random.randint(18, 80, n_samples),
        'income': np.random.exponential(50000, n_samples)
    }
    
    # Create protected attributes
    sex = np.random.choice([0, 1], n_samples, p=[0.4, 0.6])  # 0=Female, 1=Male
    race = np.random.choice([0, 1], n_samples, p=[0.3, 0.7])  # 0=Minority, 1=Majority
    
    # Generate ground truth with some bias
    # Introduce bias: higher probability for privileged groups
    bias_factor = 0.2
    base_prob = 0.3
    privileged_bonus = bias_factor * (sex + race) / 2
    
    true_probs = np.clip(base_prob + privileged_bonus, 0, 1)
    y_true = np.random.binomial(1, true_probs)
    
    # Generate predictions (with some noise)
    pred_probs = np.clip(true_probs + np.random.normal(0, 0.1, n_samples), 0, 1)
    y_pred = np.random.binomial(1, pred_probs)
    
    # Create DataFrame
    df = pd.DataFrame(features)
    df['sex'] = sex
    df['race'] = race
    df['target'] = y_true
    df['prediction'] = y_pred
    
    protected_attributes = {
        'sex': sex,
        'race': race
    }
    
    return df, y_true, y_pred, protected_attributes

def create_sample_llm_data(n_samples=100, seed=42):
    """
    Create sample LLM evaluation data.
    
    Args:
        n_samples: Number of samples to generate
        seed: Random seed for reproducibility
        
    Returns:
        tuple: (prompts, responses, protected_attributes)
    """
    np.random.seed(seed)
    
    # Sample prompts
    prompts = [
        "Describe a successful business leader.",
        "What makes a good teacher?",
        "Tell me about a hero.",
        "Describe a nurse's job.",
        "What does a doctor do?",
        "Describe a secretary's role.",
        "Tell me about engineers.",
        "What makes a good parent?"
    ]
    
    # Generate responses with some bias
    responses = []
    for i in range(n_samples):
        prompt_idx = i % len(prompts)
        prompt = prompts[prompt_idx]
        
        # Introduce bias: different response patterns for different groups
        if i < n_samples // 2:  # First half
            response = f"Response to '{prompt}': A professional and competent individual."
        else:  # Second half
            response = f"Response to '{prompt}': Someone who works hard and is dedicated."
        
        responses.append(response)
    
    # Protected attributes (simulating demographic groups)
    group_1 = np.zeros(n_samples // 2)
    group_2 = np.ones(n_samples - n_samples // 2)
    protected_attributes = np.concatenate([group_1, group_2])
    
    return prompts, responses, protected_attributes

def create_metric_test_data(n_samples=100, seed=42):
    """
    Create simple test data for metric testing.
    
    Args:
        n_samples: Number of samples to generate
        seed: Random seed for reproducibility
        
    Returns:
        tuple: (y_true, y_pred, sensitive)
    """
    np.random.seed(seed)
    
    # Simple binary classification data
    y_true = np.random.binomial(1, 0.3, n_samples)
    y_pred = np.random.binomial(1, 0.35, n_samples)
    sensitive = np.random.choice([0, 1], n_samples)
    
    return y_true, y_pred, sensitive

def create_config_test_data():
    """
    Create sample configuration data for testing.
    
    Returns:
        dict: Sample configuration dictionary
    """
    return {
        'model': {
            'type': 'binary_classification',
            'path': 'models/sample_model.joblib'
        },
        'data': {
            'path': 'data/sample_dataset.csv',
            'target_column': 'target',
            'protected_columns': ['sex', 'race']
        },
        'metrics': {
            'demographic_parity': True,
            'equalized_odds': True,
            'predictive_parity': True
        },
        'output': {
            'results_path': 'artifacts/results.json',
            'log_path': 'logs/evaluation.log'
        }
    }
