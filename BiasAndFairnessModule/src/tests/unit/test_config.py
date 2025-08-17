#!/usr/bin/env python3
"""
Simple unit tests for the configuration system.
Tests only what actually exists and works.
"""

import unittest
import tempfile
import os
import yaml
from unittest.mock import patch
from pathlib import Path

from src.core.config import ConfigManager, MetricsConfig, ModelConfig, MetricConfig, HuggingFaceModelConfig


class TestConfigManager(unittest.TestCase):
    """Test cases for the ConfigManager class."""
    
    def setUp(self):
        """Set up test configuration."""
        self.temp_dir = tempfile.mkdtemp()
        self.config_dir = os.path.join(self.temp_dir, 'configs')
        os.makedirs(self.config_dir, exist_ok=True)
        
        # Create a minimal working config file
        self.test_config = {
            'dataset': {
                'name': 'test_dataset',
                'source': 'test_source',
                'target_column': 'target',
                'protected_attributes': ['sex', 'race']
            },
            'model': {
                'huggingface': {
                    'enabled': True,
                    'model_id': 'test-model',
                    'device': 'cpu'
                }
            },
            'metrics': {
                'fairness': {
                    'enabled': True,
                    'metrics': ['demographic_parity', 'equalized_odds']
                },
                'performance': {
                    'enabled': True,
                    'metrics': ['accuracy', 'precision']
                }
            },
            'post_processing': {
                'binary_mapping': {
                    'favorable_outcome': '1',
                    'unfavorable_outcome': '0'
                },
                'attribute_groups': {
                    'sex': {
                        'privileged': ['1'],
                        'unprivileged': ['0']
                    }
                }
            },
            'artifacts': {
                'inference_results_path': 'artifacts/inference.csv',
                'postprocessed_results_path': 'artifacts/postprocessed.csv'
            }
        }
        
        self.config_path = os.path.join(self.config_dir, 'config.yaml')
        with open(self.config_path, 'w') as f:
            yaml.dump(self.test_config, f)
    
    def tearDown(self):
        """Clean up test files."""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_config_manager_initialization(self):
        """Test ConfigManager initialization."""
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            config_manager = ConfigManager()
            
            # Should have loaded config
            self.assertIsInstance(config_manager.config, object)
            self.assertTrue(hasattr(config_manager.config, "dataset"))
            self.assertTrue(hasattr(config_manager.config, "model"))
            self.assertTrue(hasattr(config_manager.config, "metrics"))
    
    def test_config_manager_loads_yaml(self):
        """Test that ConfigManager loads YAML configuration."""
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            config_manager = ConfigManager()
            
            # Check that YAML was loaded correctly
            self.assertEqual(config_manager.config.dataset.name, 'test_dataset')
            self.assertEqual(config_manager.config.model.huggingface.model_id, 'test-model')
            self.assertEqual(config_manager.config.metrics.fairness.enabled, True)
    
    def test_config_manager_missing_file(self):
        """Test ConfigManager behavior with missing config file."""
        # Remove config file
        os.remove(self.config_path)
        
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            # Should raise FileNotFoundError
            with self.assertRaises(FileNotFoundError):
                ConfigManager()
    
    def test_config_manager_invalid_yaml(self):
        """Test ConfigManager behavior with invalid YAML."""
        # Create invalid YAML
        with open(self.config_path, 'w') as f:
            f.write("invalid: yaml: content: [")
        
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            # Should raise YAMLError or other parsing error
            with self.assertRaises(Exception):
                ConfigManager()


if __name__ == "__main__":
    unittest.main()
