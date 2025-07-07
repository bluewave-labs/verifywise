from pathlib import Path
from typing import Dict, Optional

from .common import read_yaml


class ConfigManager:
    """Configuration manager for the Bias and Fairness Module.

    This class handles reading and accessing the YAML configuration file.
    It provides methods to access different sections of the configuration.
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the configuration manager.

        Args:
            config_path (str, optional): Path to the config.yaml file.
                If not provided, defaults to 'configs/config.yaml'
                relative to the module root.
        """
        if config_path is None:
            # Get the module root directory (two levels up from this file)
            module_root = Path(__file__).parent.parent
            config_path = str(module_root / "configs" / "config.yaml")

        self.config_path = config_path
        self._config = self._load_config()

    def _load_config(self) -> Dict:
        """Load the configuration from the YAML file.

        Returns:
            Dict: The loaded configuration dictionary.

        Raises:
            FileNotFoundError: If the config file doesn't exist.
            yaml.YAMLError: If the config file is invalid YAML.
            TypeError: If the YAML content is not a dictionary.
        """
        return read_yaml(self.config_path)


# Create a default instance for easy access
default_config = ConfigManager()
