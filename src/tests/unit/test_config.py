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
        """Test ConfigManager initialization.
        
        Verifies that ConfigManager can be created and loads configuration
        from a valid YAML file.
        """
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            config_manager = ConfigManager()
            
            # Should have loaded config
            self.assertIsInstance(config_manager.config, object)
            self.assertTrue(hasattr(config_manager.config, 'dataset'))
            self.assertTrue(hasattr(config_manager.config, 'model'))
            self.assertTrue(hasattr(config_manager.config, 'metrics'))
    
    def test_config_manager_loads_yaml(self):
        """Test that ConfigManager loads YAML configuration.
        
        Verifies that the configuration is correctly parsed from YAML
        and contains the expected values.
        """
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            config_manager = ConfigManager()
            
            # Check that YAML was loaded correctly
            self.assertEqual(config_manager.config.dataset.name, 'test_dataset')
            self.assertEqual(config_manager.config.model.huggingface.model_id, 'test-model')
            self.assertEqual(config_manager.config.metrics.fairness.enabled, True)
    
    def test_config_manager_missing_file(self):
        """Test ConfigManager behavior with missing config file.
        
        Verifies that ConfigManager raises an appropriate error when
        the configuration file doesn't exist.
        """
        # Remove config file
        os.remove(self.config_path)
        
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            # Should raise FileNotFoundError
            with self.assertRaises(FileNotFoundError):
                ConfigManager()
    
    def test_config_manager_invalid_yaml(self):
        """Test ConfigManager behavior with invalid YAML.
        
        Verifies that ConfigManager handles malformed YAML gracefully
        and provides meaningful error messages.
        """
        # Create invalid YAML
        with open(self.config_path, 'w') as f:
            f.write("invalid: yaml: content: [")
        
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            # Should raise YAMLError or other parsing error
            with self.assertRaises(Exception):
                ConfigManager()
    
    def test_get_dataset_config(self):
        """Test getting dataset configuration.
        
        Verifies that the get_dataset_config method returns the correct
        dataset configuration object.
        """
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            config_manager = ConfigManager()
            dataset_config = config_manager.get_dataset_config()
            
            # Should return dataset config
            self.assertEqual(dataset_config.name, 'test_dataset')
            self.assertEqual(dataset_config.source, 'test_source')
            self.assertEqual(dataset_config.target_column, 'target')
    
    def test_get_model_config(self):
        """Test getting model configuration.
        
        Verifies that the get_model_config method returns the correct
        model configuration object.
        """
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            config_manager = ConfigManager()
            model_config = config_manager.get_model_config()
            
            # Should return model config
            self.assertTrue(model_config.huggingface.enabled)
            self.assertEqual(model_config.huggingface.model_id, 'test-model')
            self.assertEqual(model_config.huggingface.device, 'cpu')


class TestMetricsConfig(unittest.TestCase):
    """Test cases for MetricsConfig class."""
    
    def test_metrics_config_creation(self):
        """Test MetricsConfig creation.
        
        Verifies that MetricsConfig can be created with valid parameters
        and has the expected structure.
        """
        config = MetricsConfig(
            fairness=MetricConfig(metrics=['demographic_parity'], enabled=True),
            performance=MetricConfig(metrics=['accuracy'], enabled=True)
        )
        
        # Should have the expected structure
        self.assertTrue(config.fairness.enabled)
        self.assertIn('demographic_parity', config.fairness.metrics)
        self.assertTrue(config.performance.enabled)
        self.assertIn('accuracy', config.performance.metrics)
    
    def test_metrics_config_defaults(self):
        """Test MetricsConfig default values.
        
        Verifies that MetricsConfig has sensible defaults when created
        without parameters.
        """
        config = MetricsConfig()
        
        # Should have default values
        self.assertIsInstance(config.fairness, MetricConfig)
        self.assertIsInstance(config.performance, MetricConfig)
    
    def test_metrics_config_from_dict(self):
        """Test creating MetricsConfig from dictionary.
        
        Verifies that MetricsConfig can be created from a dictionary
        representation.
        """
        config_dict = {
            'fairness': {
                'metrics': ['equalized_odds'],
                'enabled': True
            },
            'performance': {
                'metrics': ['precision'],
                'enabled': False
            }
        }
        
        config = MetricsConfig(**config_dict)
        
        # Should have the expected values
        self.assertTrue(config.fairness.enabled)
        self.assertIn('equalized_odds', config.fairness.metrics)
        self.assertFalse(config.performance.enabled)
        self.assertIn('precision', config.performance.metrics)


class TestModelConfig(unittest.TestCase):
    """Test cases for ModelConfig class."""
    
    def test_model_config_creation(self):
        """Test ModelConfig creation.
        
        Verifies that ModelConfig can be created with valid parameters
        and has the expected structure.
        """
        config = ModelConfig(
            huggingface=HuggingFaceModelConfig(
                enabled=True,
                model_id='test-model',
                device='cpu'
            )
        )
        
        # Should have the expected structure
        self.assertTrue(config.huggingface.enabled)
        self.assertEqual(config.huggingface.model_id, 'test-model')
        self.assertEqual(config.huggingface.device, 'cpu')
    
    def test_model_config_defaults(self):
        """Test ModelConfig default values.
        
        Verifies that ModelConfig has sensible defaults when created
        without parameters.
        """
        config = ModelConfig()
        
        # Should have default values
        self.assertIsInstance(config.huggingface, HuggingFaceModelConfig)
        self.assertTrue(config.huggingface.enabled)


if __name__ == "__main__":
    unittest.main()
