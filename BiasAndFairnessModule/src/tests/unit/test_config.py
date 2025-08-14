#!/usr/bin/env python3
"""
Comprehensive unit tests for the configuration system.
"""

import unittest
import tempfile
import os
import yaml
from unittest.mock import patch, MagicMock, mock_open
from pathlib import Path

from src.core.config import ConfigManager, MetricsConfig, FairnessConfig, ModelConfig


class TestConfigManager(unittest.TestCase):
    """Test cases for the ConfigManager class."""
    
    def setUp(self):
        """Set up test configuration."""
        self.temp_dir = tempfile.mkdtemp()
        self.config_dir = os.path.join(self.temp_dir, 'configs')
        os.makedirs(self.config_dir, exist_ok=True)
        
        # Create test config file
        self.test_config = {
            'metrics': {
                'fairness': {
                    'enabled': True,
                    'metrics': ['demographic_parity', 'equalized_odds', 'predictive_parity']
                }
            },
            'model': {
                'type': 'huggingface',
                'name': 'test-model',
                'device': 'cpu'
            },
            'data': {
                'path': 'test_data.csv',
                'protected_attributes': ['sex', 'race']
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
            
            self.assertIsInstance(config_manager.config, dict)
            self.assertIn('metrics', config_manager.config)
            self.assertIn('model', config_manager.config)
            self.assertIn('data', config_manager.config)
    
    def test_config_manager_loads_yaml(self):
        """Test that ConfigManager loads YAML configuration."""
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            config_manager = ConfigManager()
            
            # Check that YAML was loaded correctly
            self.assertEqual(config_manager.config['metrics']['fairness']['enabled'], True)
            self.assertEqual(config_manager.config['model']['type'], 'huggingface')
            self.assertEqual(config_manager.config['data']['protected_attributes'], ['sex', 'race'])
    
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
            
            # Should raise YAMLError
            with self.assertRaises(Exception):  # Could be YAMLError or other parsing error
                ConfigManager()
    
    def test_get_metrics_config(self):
        """Test getting metrics configuration."""
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            config_manager = ConfigManager()
            metrics_config = config_manager.get_metrics_config()
            
            self.assertIsInstance(metrics_config, MetricsConfig)
            self.assertTrue(metrics_config.fairness.enabled)
            self.assertEqual(metrics_config.fairness.metrics, ['demographic_parity', 'equalized_odds', 'predictive_parity'])
    
    def test_get_model_config(self):
        """Test getting model configuration."""
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            config_manager = ConfigManager()
            model_config = config_manager.get_model_config()
            
            self.assertIsInstance(model_config, ModelConfig)
            self.assertEqual(model_config.type, 'huggingface')
            self.assertEqual(model_config.name, 'test-model')
            self.assertEqual(model_config.device, 'cpu')
    
    def test_config_manager_singleton_behavior(self):
        """Test that ConfigManager behaves like a singleton."""
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            config_manager1 = ConfigManager()
            config_manager2 = ConfigManager()
            
            # Both should reference the same instance
            self.assertIs(config_manager1, config_manager2)
    
    def test_config_manager_reload(self):
        """Test reloading configuration."""
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            config_manager = ConfigManager()
            original_config = config_manager.config.copy()
            
            # Modify config file
            self.test_config['model']['name'] = 'modified-model'
            with open(self.config_path, 'w') as f:
                yaml.dump(self.test_config, f)
            
            # Reload config
            config_manager.reload_config()
            
            # Check that config was updated
            self.assertEqual(config_manager.config['model']['name'], 'modified-model')
            self.assertNotEqual(config_manager.config, original_config)


class TestMetricsConfig(unittest.TestCase):
    """Test cases for the MetricsConfig class."""
    
    def test_metrics_config_creation(self):
        """Test MetricsConfig creation."""
        config = MetricsConfig(
            fairness=FairnessConfig(
                enabled=True,
                metrics=['demographic_parity', 'equalized_odds']
            )
        )
        
        self.assertTrue(config.fairness.enabled)
        self.assertEqual(config.fairness.metrics, ['demographic_parity', 'equalized_odds'])
    
    def test_metrics_config_defaults(self):
        """Test MetricsConfig default values."""
        config = MetricsConfig()
        
        # Should have default fairness config
        self.assertIsInstance(config.fairness, FairnessConfig)
        self.assertFalse(config.fairness.enabled)  # Default should be False
        self.assertEqual(config.fairness.metrics, [])  # Default should be empty list
    
    def test_metrics_config_validation(self):
        """Test MetricsConfig validation."""
        # Test with valid data
        config = MetricsConfig(
            fairness=FairnessConfig(
                enabled=True,
                metrics=['demographic_parity']
            )
        )
        
        # Should not raise any errors
        self.assertTrue(config.fairness.enabled)
        self.assertEqual(config.fairness.metrics, ['demographic_parity'])
    
    def test_metrics_config_from_dict(self):
        """Test creating MetricsConfig from dictionary."""
        config_dict = {
            'fairness': {
                'enabled': True,
                'metrics': ['demographic_parity', 'equalized_odds', 'predictive_parity']
            }
        }
        
        config = MetricsConfig(**config_dict)
        
        self.assertTrue(config.fairness.enabled)
        self.assertEqual(len(config.fairness.metrics), 3)
        self.assertIn('demographic_parity', config.fairness.metrics)
        self.assertIn('equalized_odds', config.fairness.metrics)
        self.assertIn('predictive_parity', config.fairness.metrics)


class TestFairnessConfig(unittest.TestCase):
    """Test cases for the FairnessConfig class."""
    
    def test_fairness_config_creation(self):
        """Test FairnessConfig creation."""
        config = FairnessConfig(
            enabled=True,
            metrics=['demographic_parity', 'equalized_odds']
        )
        
        self.assertTrue(config.enabled)
        self.assertEqual(config.metrics, ['demographic_parity', 'equalized_odds'])
    
    def test_fairness_config_defaults(self):
        """Test FairnessConfig default values."""
        config = FairnessConfig()
        
        self.assertFalse(config.enabled)  # Default should be False
        self.assertEqual(config.metrics, [])  # Default should be empty list
    
    def test_fairness_config_validation(self):
        """Test FairnessConfig validation."""
        # Test with empty metrics list
        config = FairnessConfig(enabled=True, metrics=[])
        
        self.assertTrue(config.enabled)
        self.assertEqual(config.metrics, [])
        
        # Test with single metric
        config = FairnessConfig(enabled=True, metrics=['demographic_parity'])
        
        self.assertTrue(config.enabled)
        self.assertEqual(config.metrics, ['demographic_parity'])
    
    def test_fairness_config_from_dict(self):
        """Test creating FairnessConfig from dictionary."""
        config_dict = {
            'enabled': True,
            'metrics': ['demographic_parity', 'equalized_odds']
        }
        
        config = FairnessConfig(**config_dict)
        
        self.assertTrue(config.enabled)
        self.assertEqual(config.metrics, ['demographic_parity', 'equalized_odds'])


class TestModelConfig(unittest.TestCase):
    """Test cases for the ModelConfig class."""
    
    def test_model_config_creation(self):
        """Test ModelConfig creation."""
        config = ModelConfig(
            type='huggingface',
            name='test-model',
            device='cpu'
        )
        
        self.assertEqual(config.type, 'huggingface')
        self.assertEqual(config.name, 'test-model')
        self.assertEqual(config.device, 'cpu')
    
    def test_model_config_defaults(self):
        """Test ModelConfig default values."""
        config = ModelConfig()
        
        # Check default values
        self.assertEqual(config.type, 'huggingface')  # Default type
        self.assertEqual(config.name, '')  # Default empty name
        self.assertEqual(config.device, 'cpu')  # Default device
    
    def test_model_config_validation(self):
        """Test ModelConfig validation."""
        # Test with valid data
        config = ModelConfig(
            type='sklearn',
            name='random-forest',
            device='cpu'
        )
        
        self.assertEqual(config.type, 'sklearn')
        self.assertEqual(config.name, 'random-forest')
        self.assertEqual(config.device, 'cpu')
    
    def test_model_config_from_dict(self):
        """Test creating ModelConfig from dictionary."""
        config_dict = {
            'type': 'custom',
            'name': 'my-model',
            'device': 'gpu'
        }
        
        config = ModelConfig(**config_dict)
        
        self.assertEqual(config.type, 'custom')
        self.assertEqual(config.name, 'my-model')
        self.assertEqual(config.device, 'gpu')


class TestConfigIntegration(unittest.TestCase):
    """Test cases for configuration integration."""
    
    def setUp(self):
        """Set up test configuration."""
        self.temp_dir = tempfile.mkdtemp()
        self.config_dir = os.path.join(self.temp_dir, 'configs')
        os.makedirs(self.config_dir, exist_ok=True)
        
        # Create comprehensive test config
        self.comprehensive_config = {
            'metrics': {
                'fairness': {
                    'enabled': True,
                    'metrics': [
                        'demographic_parity',
                        'equalized_odds',
                        'predictive_parity',
                        'equalized_opportunities',
                        'predictive_equality'
                    ]
                }
            },
            'model': {
                'type': 'huggingface',
                'name': 'bert-base-uncased',
                'device': 'cuda',
                'batch_size': 32,
                'max_length': 512
            },
            'data': {
                'path': 'data/income_data.csv',
                'protected_attributes': ['sex', 'race', 'age'],
                'target_column': 'income',
                'test_size': 0.2,
                'random_state': 42
            },
            'evaluation': {
                'output_dir': 'results/',
                'save_intermediate': True,
                'verbose': True
            }
        }
        
        self.config_path = os.path.join(self.config_dir, 'config.yaml')
        with open(self.config_path, 'w') as f:
            yaml.dump(self.comprehensive_config, f)
    
    def tearDown(self):
        """Clean up test files."""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_comprehensive_config_loading(self):
        """Test loading comprehensive configuration."""
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            config_manager = ConfigManager()
            
            # Test metrics config
            metrics_config = config_manager.get_metrics_config()
            self.assertTrue(metrics_config.fairness.enabled)
            self.assertEqual(len(metrics_config.fairness.metrics), 5)
            
            # Test model config
            model_config = config_manager.get_model_config()
            self.assertEqual(model_config.type, 'huggingface')
            self.assertEqual(model_config.name, 'bert-base-uncased')
            self.assertEqual(model_config.device, 'cuda')
            
            # Test data config
            data_config = config_manager.config['data']
            self.assertEqual(data_config['path'], 'data/income_data.csv')
            self.assertEqual(data_config['protected_attributes'], ['sex', 'race', 'age'])
            self.assertEqual(data_config['target_column'], 'income')
            
            # Test evaluation config
            eval_config = config_manager.config['evaluation']
            self.assertEqual(eval_config['output_dir'], 'results/')
            self.assertTrue(eval_config['save_intermediate'])
            self.assertTrue(eval_config['verbose'])
    
    def test_config_serialization(self):
        """Test configuration serialization and deserialization."""
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            config_manager = ConfigManager()
            
            # Convert to dict
            config_dict = config_manager.config
            
            # Convert back to YAML
            config_yaml = yaml.dump(config_dict)
            
            # Parse back to dict
            parsed_config = yaml.safe_load(config_yaml)
            
            # Should be equivalent
            self.assertEqual(config_dict, parsed_config)
    
    def test_config_validation_edge_cases(self):
        """Test configuration validation with edge cases."""
        with patch('src.core.config.Path') as mock_path:
            mock_path.return_value.parent.parent.parent = Path(self.temp_dir)
            
            # Test with minimal config
            minimal_config = {'metrics': {'fairness': {'enabled': False}}}
            
            with open(self.config_path, 'w') as f:
                yaml.dump(minimal_config, f)
            
            config_manager = ConfigManager()
            
            # Should load without errors
            self.assertIsInstance(config_manager.config, dict)
            self.assertIn('metrics', config_manager.config)
            
            # Test metrics config
            metrics_config = config_manager.get_metrics_config()
            self.assertFalse(metrics_config.fairness.enabled)
            self.assertEqual(metrics_config.fairness.metrics, [])


if __name__ == '__main__':
    unittest.main()
