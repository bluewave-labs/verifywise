/**
 * @fileoverview AI Detection Patterns Configuration
 *
 * Defines patterns for detecting AI/ML libraries and frameworks in codebases.
 * Used by the AI Detection scanner to identify technologies in repositories.
 *
 * Pattern Types:
 * - imports: Regex patterns for import statements in code files
 * - dependencies: Regex patterns for dependency file entries
 *
 * Confidence Levels:
 * - high: Definitive AI/ML library with no false positive risk
 * - medium: Likely AI/ML related but could have other uses
 * - low: Possibly AI/ML related, requires context
 *
 * @module config/aiDetectionPatterns
 */

// ============================================================================
// Types
// ============================================================================

export interface DetectionPattern {
  /** Display name of the library */
  name: string;
  /** Provider/company that created the library */
  provider: string;
  /** Description of what the library does */
  description: string;
  /** Link to official documentation */
  documentationUrl: string;
  /** Confidence level for detection */
  confidence: "high" | "medium" | "low";
  /** Pattern definitions */
  patterns: {
    /** Regex patterns for import statements */
    imports?: RegExp[];
    /** Regex patterns for dependency files */
    dependencies?: RegExp[];
  };
}

export interface PatternCategory {
  /** Category name */
  name: string;
  /** Type of finding (library, dependency) */
  findingType: string;
  /** Patterns in this category */
  patterns: DetectionPattern[];
}

// ============================================================================
// File Extensions to Scan
// ============================================================================

/**
 * Code file extensions that will be scanned for import statements
 */
export const CODE_EXTENSIONS = [
  ".py", // Python
  ".js",
  ".mjs",
  ".cjs", // JavaScript
  ".ts",
  ".tsx", // TypeScript
  ".jsx", // React
  ".java", // Java
  ".go", // Go
  ".rb", // Ruby
  ".rs", // Rust
  ".cpp",
  ".cc",
  ".c",
  ".h",
  ".hpp", // C/C++
  ".cs", // C#
  ".scala", // Scala
  ".kt", // Kotlin
  ".swift", // Swift
  ".r",
  ".R", // R
  ".jl", // Julia
];

/**
 * Dependency file names that will be scanned for package declarations
 * Note: Lock files are excluded in Phase 1 (complex format requiring dedicated parsers)
 */
export const DEPENDENCY_FILES = [
  "requirements.txt",
  "setup.py",
  "pyproject.toml",
  "Pipfile",
  "environment.yml",
  "conda.yml",
  "package.json",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "Gemfile",
  "mix.exs",
  "deps.edn",
  "Project.toml", // Julia
];

/**
 * Directories to skip during scanning
 */
export const SKIP_DIRECTORIES = [
  "node_modules",
  ".git",
  ".svn",
  ".hg",
  "venv",
  ".venv",
  "env",
  ".env",
  "__pycache__",
  ".pytest_cache",
  ".mypy_cache",
  "dist",
  "build",
  "target",
  ".next",
  ".nuxt",
  "vendor",
  "bower_components",
  ".tox",
  "eggs",
  "*.egg-info",
  ".idea",
  ".vscode",
];

// ============================================================================
// Detection Patterns - Phase 1 Technologies/Libraries
// ============================================================================

export const AI_DETECTION_PATTERNS: PatternCategory[] = [
  {
    name: "Technologies",
    findingType: "library",
    patterns: [
      // ========================
      // OpenAI
      // ========================
      {
        name: "openai",
        provider: "OpenAI",
        description: "Official OpenAI Python/Node.js library for GPT models",
        documentationUrl: "https://platform.openai.com/docs",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+openai/m,
            /^from\s+openai\s+import/m,
            /require\s*\(\s*['"]openai['"]\s*\)/,
            /from\s+['"]openai['"]/,
            /import\s+.*\s+from\s+['"]openai['"]/,
          ],
          dependencies: [
            /^openai[=<>~!\s]/m,
            /"openai"\s*:/,
            /'openai'\s*:/,
          ],
        },
      },

      // ========================
      // Anthropic
      // ========================
      {
        name: "anthropic",
        provider: "Anthropic",
        description: "Official Anthropic Python/Node.js library for Claude models",
        documentationUrl: "https://docs.anthropic.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+anthropic/m,
            /^from\s+anthropic\s+import/m,
            /require\s*\(\s*['"]@anthropic-ai\/sdk['"]\s*\)/,
            /from\s+['"]@anthropic-ai\/sdk['"]/,
            /import\s+.*\s+from\s+['"]@anthropic-ai\/sdk['"]/,
          ],
          dependencies: [
            /^anthropic[=<>~!\s]/m,
            /"@anthropic-ai\/sdk"\s*:/,
            /'@anthropic-ai\/sdk'\s*:/,
          ],
        },
      },

      // ========================
      // Google AI
      // ========================
      {
        name: "tensorflow",
        provider: "Google",
        description: "TensorFlow machine learning framework",
        documentationUrl: "https://www.tensorflow.org/api_docs",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+tensorflow/m,
            /^from\s+tensorflow\s+import/m,
            /import\s+tensorflow\s+as\s+tf/m,
          ],
          dependencies: [
            /^tensorflow[=<>~!\s]/m,
            /^tensorflow-gpu[=<>~!\s]/m,
          ],
        },
      },
      {
        name: "keras",
        provider: "Google",
        description: "Keras deep learning API",
        documentationUrl: "https://keras.io/api/",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+keras/m,
            /^from\s+keras\s+import/m,
            /^from\s+tensorflow\.keras\s+import/m,
            /^from\s+tensorflow\s+import\s+keras/m,
          ],
          dependencies: [/^keras[=<>~!\s]/m],
        },
      },
      {
        name: "google-generativeai",
        provider: "Google",
        description: "Google Generative AI (Gemini) SDK",
        documentationUrl: "https://ai.google.dev/gemini-api/docs",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+google\.generativeai/m,
            /^from\s+google\.generativeai\s+import/m,
            /^from\s+google\s+import\s+generativeai/m,
          ],
          dependencies: [/^google-generativeai[=<>~!\s]/m],
        },
      },

      // ========================
      // Meta / PyTorch
      // ========================
      {
        name: "pytorch",
        provider: "Meta",
        description: "PyTorch deep learning framework",
        documentationUrl: "https://pytorch.org/docs/stable/index.html",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+torch/m,
            /^from\s+torch\s+import/m,
            /^import\s+pytorch/m,
          ],
          dependencies: [
            /^torch[=<>~!\s]/m,
            /^pytorch[=<>~!\s]/m,
            /^torchvision[=<>~!\s]/m,
            /^torchaudio[=<>~!\s]/m,
          ],
        },
      },

      // ========================
      // HuggingFace
      // ========================
      {
        name: "transformers",
        provider: "HuggingFace",
        description: "HuggingFace Transformers library for NLP",
        documentationUrl: "https://huggingface.co/docs/transformers",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+transformers/m,
            /^from\s+transformers\s+import/m,
          ],
          dependencies: [/^transformers[=<>~!\s]/m],
        },
      },
      {
        name: "huggingface_hub",
        provider: "HuggingFace",
        description: "HuggingFace Hub client library",
        documentationUrl: "https://huggingface.co/docs/huggingface_hub",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+huggingface_hub/m,
            /^from\s+huggingface_hub\s+import/m,
          ],
          dependencies: [/^huggingface[-_]hub[=<>~!\s]/m],
        },
      },
      {
        name: "datasets",
        provider: "HuggingFace",
        description: "HuggingFace Datasets library",
        documentationUrl: "https://huggingface.co/docs/datasets",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+datasets/m,
            /^from\s+datasets\s+import/m,
          ],
          dependencies: [/^datasets[=<>~!\s]/m],
        },
      },

      // ========================
      // LangChain
      // ========================
      {
        name: "langchain",
        provider: "LangChain",
        description: "LangChain framework for LLM applications",
        documentationUrl: "https://docs.langchain.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+langchain/m,
            /^from\s+langchain\s+import/m,
            /^from\s+langchain_core\s+import/m,
            /^from\s+langchain_community\s+import/m,
            /^from\s+langchain_openai\s+import/m,
            /^from\s+langchain_anthropic\s+import/m,
            /require\s*\(\s*['"]langchain['"]\s*\)/,
            /from\s+['"]langchain['"]/,
            /from\s+['"]@langchain\/core['"]/,
          ],
          dependencies: [
            /^langchain[=<>~!\s]/m,
            /^langchain[-_]/m,
            /"@langchain\//,
            /'@langchain\//,
          ],
        },
      },

      // ========================
      // LlamaIndex
      // ========================
      {
        name: "llama_index",
        provider: "LlamaIndex",
        description: "LlamaIndex data framework for LLM applications",
        documentationUrl: "https://docs.llamaindex.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+llama_index/m,
            /^from\s+llama_index\s+import/m,
            /^from\s+llama_index\.core\s+import/m,
          ],
          dependencies: [
            /^llama[-_]index[=<>~!\s]/m,
            /^llama[-_]index[-_]/m,
          ],
        },
      },

      // ========================
      // Cohere
      // ========================
      {
        name: "cohere",
        provider: "Cohere",
        description: "Cohere NLP API client",
        documentationUrl: "https://docs.cohere.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+cohere/m,
            /^from\s+cohere\s+import/m,
          ],
          dependencies: [/^cohere[=<>~!\s]/m],
        },
      },

      // ========================
      // Replicate
      // ========================
      {
        name: "replicate",
        provider: "Replicate",
        description: "Replicate ML model hosting API",
        documentationUrl: "https://replicate.com/docs",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+replicate/m,
            /^from\s+replicate\s+import/m,
          ],
          dependencies: [/^replicate[=<>~!\s]/m],
        },
      },

      // ========================
      // AWS Bedrock
      // ========================
      {
        name: "aws-bedrock",
        provider: "AWS",
        description: "AWS Bedrock foundation models service",
        documentationUrl: "https://docs.aws.amazon.com/bedrock",
        confidence: "high",
        patterns: {
          imports: [
            /from\s+['"]@aws-sdk\/client-bedrock['"]/,
            /from\s+['"]@aws-sdk\/client-bedrock-runtime['"]/,
            /require\s*\(\s*['"]@aws-sdk\/client-bedrock['"]\s*\)/,
            /boto3\.client\s*\(\s*['"]bedrock['"]/,
          ],
          dependencies: [
            /"@aws-sdk\/client-bedrock"\s*:/,
            /"@aws-sdk\/client-bedrock-runtime"\s*:/,
          ],
        },
      },

      // ========================
      // Microsoft Azure OpenAI
      // ========================
      {
        name: "azure-openai",
        provider: "Microsoft",
        description: "Azure OpenAI Service SDK",
        documentationUrl: "https://learn.microsoft.com/azure/ai-services/openai",
        confidence: "high",
        patterns: {
          imports: [
            /from\s+['"]@azure\/openai['"]/,
            /require\s*\(\s*['"]@azure\/openai['"]\s*\)/,
            /^from\s+azure\.ai\.openai\s+import/m,
          ],
          dependencies: [
            /"@azure\/openai"\s*:/,
            /^azure-ai-openai[=<>~!\s]/m,
          ],
        },
      },

      // ========================
      // Mistral AI
      // ========================
      {
        name: "mistralai",
        provider: "Mistral",
        description: "Mistral AI Python client",
        documentationUrl: "https://docs.mistral.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+mistralai/m,
            /^from\s+mistralai\s+import/m,
          ],
          dependencies: [/^mistralai[=<>~!\s]/m],
        },
      },

      // ========================
      // Traditional ML Libraries
      // ========================
      {
        name: "scikit-learn",
        provider: "scikit-learn",
        description: "Machine learning library for Python",
        documentationUrl: "https://scikit-learn.org/stable/documentation.html",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+sklearn/m,
            /^from\s+sklearn\s+import/m,
            /^from\s+sklearn\./m,
          ],
          dependencies: [
            /^scikit-learn[=<>~!\s]/m,
            /^sklearn[=<>~!\s]/m,
          ],
        },
      },
      {
        name: "numpy",
        provider: "NumPy",
        description: "Fundamental package for scientific computing with Python",
        documentationUrl: "https://numpy.org/doc/stable/",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+numpy/m,
            /^from\s+numpy\s+import/m,
            /import\s+numpy\s+as\s+np/m,
          ],
          dependencies: [/^numpy[=<>~!\s]/m],
        },
      },
      {
        name: "pandas",
        provider: "Pandas",
        description: "Data analysis and manipulation library for Python",
        documentationUrl: "https://pandas.pydata.org/docs/",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+pandas/m,
            /^from\s+pandas\s+import/m,
            /import\s+pandas\s+as\s+pd/m,
          ],
          dependencies: [/^pandas[=<>~!\s]/m],
        },
      },
      {
        name: "matplotlib",
        provider: "Matplotlib",
        description: "Comprehensive library for creating visualizations in Python",
        documentationUrl: "https://matplotlib.org/stable/",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+matplotlib/m,
            /^from\s+matplotlib\s+import/m,
            /^from\s+matplotlib\.pyplot\s+import/m,
            /import\s+matplotlib\.pyplot\s+as\s+plt/m,
          ],
          dependencies: [/^matplotlib[=<>~!\s]/m],
        },
      },
      {
        name: "scipy",
        provider: "SciPy",
        description: "Library for scientific and technical computing",
        documentationUrl: "https://docs.scipy.org/doc/scipy/",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+scipy/m,
            /^from\s+scipy\s+import/m,
            /^from\s+scipy\./m,
          ],
          dependencies: [/^scipy[=<>~!\s]/m],
        },
      },
      {
        name: "mxnet",
        provider: "MXNet",
        description: "Flexible and efficient deep learning framework",
        documentationUrl: "https://mxnet.apache.org/",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+mxnet/m,
            /^from\s+mxnet\s+import/m,
            /import\s+mxnet\s+as\s+mx/m,
          ],
          dependencies: [/^mxnet[=<>~!\s]/m],
        },
      },
      {
        name: "xgboost",
        provider: "XGBoost",
        description: "Gradient boosting framework",
        documentationUrl: "https://xgboost.readthedocs.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+xgboost/m,
            /^from\s+xgboost\s+import/m,
          ],
          dependencies: [/^xgboost[=<>~!\s]/m],
        },
      },
      {
        name: "lightgbm",
        provider: "Microsoft",
        description: "Light Gradient Boosting Machine",
        documentationUrl: "https://lightgbm.readthedocs.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+lightgbm/m,
            /^from\s+lightgbm\s+import/m,
          ],
          dependencies: [/^lightgbm[=<>~!\s]/m],
        },
      },

      // ========================
      // NLP Libraries
      // ========================
      {
        name: "spacy",
        provider: "Explosion",
        description: "Industrial-strength NLP library",
        documentationUrl: "https://spacy.io/api",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+spacy/m,
            /^from\s+spacy\s+import/m,
          ],
          dependencies: [/^spacy[=<>~!\s]/m],
        },
      },
      {
        name: "nltk",
        provider: "NLTK",
        description: "Natural Language Toolkit",
        documentationUrl: "https://www.nltk.org",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+nltk/m,
            /^from\s+nltk\s+import/m,
          ],
          dependencies: [/^nltk[=<>~!\s]/m],
        },
      },
      {
        name: "gensim",
        provider: "Gensim",
        description: "Topic modeling and word embeddings",
        documentationUrl: "https://radimrehurek.com/gensim/",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+gensim/m,
            /^from\s+gensim\s+import/m,
          ],
          dependencies: [/^gensim[=<>~!\s]/m],
        },
      },

      // ========================
      // Deep Learning Frameworks
      // ========================
      {
        name: "fastai",
        provider: "fast.ai",
        description: "Deep learning library built on PyTorch",
        documentationUrl: "https://docs.fast.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+fastai/m,
            /^from\s+fastai\s+import/m,
            /^from\s+fastai\./m,
          ],
          dependencies: [/^fastai[=<>~!\s]/m],
        },
      },
      {
        name: "jax",
        provider: "Google",
        description: "High-performance numerical computing",
        documentationUrl: "https://jax.readthedocs.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+jax/m,
            /^from\s+jax\s+import/m,
          ],
          dependencies: [/^jax[=<>~!\s]/m, /^jaxlib[=<>~!\s]/m],
        },
      },
      {
        name: "flax",
        provider: "Google",
        description: "Neural network library for JAX",
        documentationUrl: "https://flax.readthedocs.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+flax/m,
            /^from\s+flax\s+import/m,
          ],
          dependencies: [/^flax[=<>~!\s]/m],
        },
      },
      // ========================
      // Model Serving & Deployment
      // ========================
      {
        name: "onnx",
        provider: "ONNX",
        description: "Open Neural Network Exchange format",
        documentationUrl: "https://onnx.ai/onnx/",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+onnx/m,
            /^from\s+onnx\s+import/m,
            /^import\s+onnxruntime/m,
            /^from\s+onnxruntime\s+import/m,
          ],
          dependencies: [
            /^onnx[=<>~!\s]/m,
            /^onnxruntime[=<>~!\s]/m,
          ],
        },
      },

      // ========================
      // ML Operations
      // ========================
      {
        name: "mlflow",
        provider: "MLflow",
        description: "ML lifecycle management platform",
        documentationUrl: "https://mlflow.org/docs/latest/index.html",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+mlflow/m,
            /^from\s+mlflow\s+import/m,
          ],
          dependencies: [/^mlflow[=<>~!\s]/m],
        },
      },
      {
        name: "wandb",
        provider: "Weights & Biases",
        description: "ML experiment tracking and visualization",
        documentationUrl: "https://docs.wandb.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+wandb/m,
            /^from\s+wandb\s+import/m,
          ],
          dependencies: [/^wandb[=<>~!\s]/m],
        },
      },

      // ========================
      // Distributed Computing (Medium Confidence)
      // ========================
      {
        name: "ray",
        provider: "Anyscale",
        description: "Distributed computing framework often used for ML",
        documentationUrl: "https://docs.ray.io",
        confidence: "medium",
        patterns: {
          imports: [
            /^import\s+ray/m,
            /^from\s+ray\s+import/m,
          ],
          dependencies: [/^ray[=<>~!\s]/m],
        },
      },
      {
        name: "dask",
        provider: "Dask",
        description: "Parallel computing library for analytics",
        documentationUrl: "https://docs.dask.org",
        confidence: "medium",
        patterns: {
          imports: [
            /^import\s+dask/m,
            /^from\s+dask\s+import/m,
          ],
          dependencies: [/^dask[=<>~!\s]/m],
        },
      },

      // ========================
      // Computer Vision
      // ========================
      {
        name: "opencv",
        provider: "OpenCV",
        description: "Computer vision library",
        documentationUrl: "https://docs.opencv.org",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+cv2/m,
            /^from\s+cv2\s+import/m,
          ],
          dependencies: [
            /^opencv-python[=<>~!\s]/m,
            /^opencv-python-headless[=<>~!\s]/m,
          ],
        },
      },
      {
        name: "detectron2",
        provider: "Meta",
        description: "Meta's object detection library",
        documentationUrl: "https://detectron2.readthedocs.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+detectron2/m,
            /^from\s+detectron2\s+import/m,
          ],
          dependencies: [/^detectron2[=<>~!\s]/m],
        },
      },
      {
        name: "ultralytics",
        provider: "Ultralytics",
        description: "YOLO object detection library",
        documentationUrl: "https://docs.ultralytics.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+ultralytics/m,
            /^from\s+ultralytics\s+import/m,
          ],
          dependencies: [/^ultralytics[=<>~!\s]/m],
        },
      },

      // ========================
      // Speech & Audio
      // ========================
      {
        name: "whisper",
        provider: "OpenAI",
        description: "OpenAI Whisper speech recognition",
        documentationUrl: "https://github.com/openai/whisper",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+whisper/m,
            /^from\s+whisper\s+import/m,
          ],
          dependencies: [/^openai-whisper[=<>~!\s]/m],
        },
      },

      // ========================
      // Vector Databases / Embeddings
      // ========================
      {
        name: "pinecone",
        provider: "Pinecone",
        description: "Vector database for ML applications",
        documentationUrl: "https://docs.pinecone.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+pinecone/m,
            /^from\s+pinecone\s+import/m,
          ],
          dependencies: [/^pinecone-client[=<>~!\s]/m],
        },
      },
      {
        name: "chromadb",
        provider: "Chroma",
        description: "Open-source embedding database",
        documentationUrl: "https://docs.trychroma.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+chromadb/m,
            /^from\s+chromadb\s+import/m,
          ],
          dependencies: [/^chromadb[=<>~!\s]/m],
        },
      },
      {
        name: "weaviate",
        provider: "Weaviate",
        description: "Vector search engine",
        documentationUrl: "https://weaviate.io/developers/weaviate",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+weaviate/m,
            /^from\s+weaviate\s+import/m,
          ],
          dependencies: [/^weaviate-client[=<>~!\s]/m],
        },
      },
      {
        name: "qdrant",
        provider: "Qdrant",
        description: "Vector similarity search engine",
        documentationUrl: "https://qdrant.tech/documentation",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+qdrant_client/m,
            /^from\s+qdrant_client\s+import/m,
          ],
          dependencies: [/^qdrant-client[=<>~!\s]/m],
        },
      },
      {
        name: "faiss",
        provider: "Meta",
        description: "Facebook AI Similarity Search",
        documentationUrl: "https://faiss.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+faiss/m,
            /^from\s+faiss\s+import/m,
          ],
          dependencies: [
            /^faiss-cpu[=<>~!\s]/m,
            /^faiss-gpu[=<>~!\s]/m,
          ],
        },
      },

      // ========================
      // AI Agent Frameworks
      // ========================
      {
        name: "autogen",
        provider: "Microsoft",
        description: "Multi-agent conversation framework",
        documentationUrl: "https://microsoft.github.io/autogen",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+autogen/m,
            /^from\s+autogen\s+import/m,
          ],
          dependencies: [/^pyautogen[=<>~!\s]/m],
        },
      },
      {
        name: "crewai",
        provider: "CrewAI",
        description: "Multi-agent orchestration framework",
        documentationUrl: "https://docs.crewai.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+crewai/m,
            /^from\s+crewai\s+import/m,
          ],
          dependencies: [/^crewai[=<>~!\s]/m],
        },
      },

      // ========================
      // Semantic Kernel
      // ========================
      {
        name: "semantic-kernel",
        provider: "Microsoft",
        description: "Microsoft's AI orchestration framework",
        documentationUrl: "https://learn.microsoft.com/semantic-kernel",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+semantic_kernel/m,
            /^from\s+semantic_kernel\s+import/m,
          ],
          dependencies: [/^semantic-kernel[=<>~!\s]/m],
        },
      },

      // ========================
      // Additional LLM Providers
      // ========================
      {
        name: "groq",
        provider: "Groq",
        description: "Groq API client for fast LLM inference",
        documentationUrl: "https://console.groq.com/docs",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+groq/m,
            /^from\s+groq\s+import/m,
          ],
          dependencies: [/^groq[=<>~!\s]/m],
        },
      },
      {
        name: "together",
        provider: "Together AI",
        description: "Together AI platform client",
        documentationUrl: "https://docs.together.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+together/m,
            /^from\s+together\s+import/m,
          ],
          dependencies: [/^together[=<>~!\s]/m],
        },
      },
      {
        name: "fireworks-ai",
        provider: "Fireworks AI",
        description: "Fireworks AI inference platform",
        documentationUrl: "https://docs.fireworks.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+fireworks/m,
            /^from\s+fireworks\s+import/m,
          ],
          dependencies: [/^fireworks-ai[=<>~!\s]/m],
        },
      },
      {
        name: "ai21",
        provider: "AI21 Labs",
        description: "AI21 Labs Jurassic models API",
        documentationUrl: "https://docs.ai21.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+ai21/m,
            /^from\s+ai21\s+import/m,
          ],
          dependencies: [/^ai21[=<>~!\s]/m],
        },
      },
      {
        name: "stability-sdk",
        provider: "Stability AI",
        description: "Stability AI SDK for Stable Diffusion",
        documentationUrl: "https://platform.stability.ai/docs",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+stability_sdk/m,
            /^from\s+stability_sdk\s+import/m,
          ],
          dependencies: [/^stability-sdk[=<>~!\s]/m],
        },
      },
      {
        name: "writer",
        provider: "Writer",
        description: "Writer AI platform SDK",
        documentationUrl: "https://dev.writer.com/docs",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+writer/m,
            /^from\s+writer\s+import/m,
          ],
          dependencies: [/^writer-sdk[=<>~!\s]/m],
        },
      },

      // ========================
      // Agent & Orchestration Frameworks
      // ========================
      {
        name: "haystack",
        provider: "deepset",
        description: "LLM orchestration framework for RAG pipelines",
        documentationUrl: "https://docs.haystack.deepset.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+haystack/m,
            /^from\s+haystack\s+import/m,
            /^from\s+haystack\./m,
          ],
          dependencies: [
            /^haystack-ai[=<>~!\s]/m,
            /^farm-haystack[=<>~!\s]/m,
          ],
        },
      },
      {
        name: "instructor",
        provider: "Instructor",
        description: "Structured output extraction from LLMs",
        documentationUrl: "https://python.useinstructor.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+instructor/m,
            /^from\s+instructor\s+import/m,
          ],
          dependencies: [/^instructor[=<>~!\s]/m],
        },
      },
      {
        name: "dspy",
        provider: "Stanford NLP",
        description: "Programming framework for LLMs",
        documentationUrl: "https://dspy-docs.vercel.app",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+dspy/m,
            /^from\s+dspy\s+import/m,
          ],
          dependencies: [/^dspy-ai[=<>~!\s]/m],
        },
      },
      {
        name: "guidance",
        provider: "Microsoft",
        description: "Guidance language for LLM control",
        documentationUrl: "https://github.com/guidance-ai/guidance",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+guidance/m,
            /^from\s+guidance\s+import/m,
          ],
          dependencies: [/^guidance[=<>~!\s]/m],
        },
      },
      {
        name: "marvin",
        provider: "Prefect",
        description: "AI engineering toolkit",
        documentationUrl: "https://www.askmarvin.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+marvin/m,
            /^from\s+marvin\s+import/m,
          ],
          dependencies: [/^marvin[=<>~!\s]/m],
        },
      },
      {
        name: "pydantic-ai",
        provider: "Pydantic",
        description: "Type-safe AI agent framework",
        documentationUrl: "https://ai.pydantic.dev",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+pydantic_ai/m,
            /^from\s+pydantic_ai\s+import/m,
          ],
          dependencies: [/^pydantic-ai[=<>~!\s]/m],
        },
      },
      {
        name: "outlines",
        provider: "Outlines",
        description: "Structured text generation",
        documentationUrl: "https://outlines-dev.github.io/outlines",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+outlines/m,
            /^from\s+outlines\s+import/m,
          ],
          dependencies: [/^outlines[=<>~!\s]/m],
        },
      },
      {
        name: "phidata",
        provider: "Phidata",
        description: "AI assistant framework with memory",
        documentationUrl: "https://docs.phidata.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+phi/m,
            /^from\s+phi\s+import/m,
            /^from\s+phi\./m,
          ],
          dependencies: [/^phidata[=<>~!\s]/m],
        },
      },
      {
        name: "smolagents",
        provider: "HuggingFace",
        description: "Lightweight agent library from HuggingFace",
        documentationUrl: "https://huggingface.co/docs/smolagents",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+smolagents/m,
            /^from\s+smolagents\s+import/m,
          ],
          dependencies: [/^smolagents[=<>~!\s]/m],
        },
      },

      // ========================
      // Additional Vector Databases
      // ========================
      {
        name: "milvus",
        provider: "Zilliz",
        description: "Open-source vector database",
        documentationUrl: "https://milvus.io/docs",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+pymilvus/m,
            /^from\s+pymilvus\s+import/m,
          ],
          dependencies: [/^pymilvus[=<>~!\s]/m],
        },
      },
      {
        name: "pgvector",
        provider: "pgvector",
        description: "Vector similarity search for PostgreSQL",
        documentationUrl: "https://github.com/pgvector/pgvector",
        confidence: "high",
        patterns: {
          imports: [
            /^from\s+pgvector\s+import/m,
            /^from\s+pgvector\./m,
          ],
          dependencies: [/^pgvector[=<>~!\s]/m],
        },
      },
      {
        name: "lancedb",
        provider: "LanceDB",
        description: "Serverless vector database",
        documentationUrl: "https://lancedb.github.io/lancedb",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+lancedb/m,
            /^from\s+lancedb\s+import/m,
          ],
          dependencies: [/^lancedb[=<>~!\s]/m],
        },
      },

      // ========================
      // Model Optimization & Deployment
      // ========================
      {
        name: "vllm",
        provider: "vLLM",
        description: "High-throughput LLM serving engine",
        documentationUrl: "https://docs.vllm.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+vllm/m,
            /^from\s+vllm\s+import/m,
          ],
          dependencies: [/^vllm[=<>~!\s]/m],
        },
      },
      {
        name: "llama-cpp-python",
        provider: "llama.cpp",
        description: "Python bindings for llama.cpp",
        documentationUrl: "https://llama-cpp-python.readthedocs.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+llama_cpp/m,
            /^from\s+llama_cpp\s+import/m,
          ],
          dependencies: [/^llama-cpp-python[=<>~!\s]/m],
        },
      },
      {
        name: "ollama",
        provider: "Ollama",
        description: "Local LLM runtime",
        documentationUrl: "https://ollama.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+ollama/m,
            /^from\s+ollama\s+import/m,
          ],
          dependencies: [/^ollama[=<>~!\s]/m],
        },
      },
      {
        name: "tensorrt",
        provider: "NVIDIA",
        description: "NVIDIA TensorRT for optimized inference",
        documentationUrl: "https://developer.nvidia.com/tensorrt",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+tensorrt/m,
            /^from\s+tensorrt\s+import/m,
          ],
          dependencies: [
            /^tensorrt[=<>~!\s]/m,
            /^nvidia-tensorrt[=<>~!\s]/m,
          ],
        },
      },
      {
        name: "text-generation-inference",
        provider: "HuggingFace",
        description: "HuggingFace Text Generation Inference",
        documentationUrl: "https://huggingface.co/docs/text-generation-inference",
        confidence: "high",
        patterns: {
          imports: [
            /^from\s+text_generation\s+import/m,
          ],
          dependencies: [/^text-generation[=<>~!\s]/m],
        },
      },
      {
        name: "triton",
        provider: "NVIDIA",
        description: "NVIDIA Triton Inference Server client",
        documentationUrl: "https://docs.nvidia.com/deeplearning/triton-inference-server",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+tritonclient/m,
            /^from\s+tritonclient\s+import/m,
          ],
          dependencies: [
            /^tritonclient[=<>~!\s]/m,
            /^nvidia-pytriton[=<>~!\s]/m,
          ],
        },
      },
      {
        name: "ctransformers",
        provider: "CTransformers",
        description: "Python bindings for GGML models",
        documentationUrl: "https://github.com/marella/ctransformers",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+ctransformers/m,
            /^from\s+ctransformers\s+import/m,
          ],
          dependencies: [/^ctransformers[=<>~!\s]/m],
        },
      },

      // ========================
      // Computer Vision (expanded)
      // ========================
      {
        name: "pillow",
        provider: "Pillow",
        description: "Python Imaging Library fork",
        documentationUrl: "https://pillow.readthedocs.io",
        confidence: "medium",
        patterns: {
          imports: [
            /^import\s+PIL/m,
            /^from\s+PIL\s+import/m,
          ],
          dependencies: [/^[Pp]illow[=<>~!\s]/m],
        },
      },
      {
        name: "torchvision",
        provider: "Meta",
        description: "PyTorch computer vision library",
        documentationUrl: "https://pytorch.org/vision/stable/index.html",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+torchvision/m,
            /^from\s+torchvision\s+import/m,
          ],
          dependencies: [/^torchvision[=<>~!\s]/m],
        },
      },
      {
        name: "albumentations",
        provider: "Albumentations",
        description: "Image augmentation library",
        documentationUrl: "https://albumentations.ai/docs",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+albumentations/m,
            /^from\s+albumentations\s+import/m,
          ],
          dependencies: [/^albumentations[=<>~!\s]/m],
        },
      },
      {
        name: "mmdetection",
        provider: "OpenMMLab",
        description: "OpenMMLab object detection toolbox",
        documentationUrl: "https://mmdetection.readthedocs.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+mmdet/m,
            /^from\s+mmdet\s+import/m,
          ],
          dependencies: [/^mmdet[=<>~!\s]/m],
        },
      },
      {
        name: "timm",
        provider: "HuggingFace",
        description: "PyTorch Image Models",
        documentationUrl: "https://huggingface.co/docs/timm",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+timm/m,
            /^from\s+timm\s+import/m,
          ],
          dependencies: [/^timm[=<>~!\s]/m],
        },
      },
      {
        name: "supervision",
        provider: "Roboflow",
        description: "Computer vision utilities and visualization",
        documentationUrl: "https://supervision.roboflow.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+supervision/m,
            /^from\s+supervision\s+import/m,
          ],
          dependencies: [/^supervision[=<>~!\s]/m],
        },
      },

      // ========================
      // Audio & Speech (expanded)
      // ========================
      {
        name: "speechbrain",
        provider: "SpeechBrain",
        description: "PyTorch speech toolkit",
        documentationUrl: "https://speechbrain.github.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+speechbrain/m,
            /^from\s+speechbrain\s+import/m,
          ],
          dependencies: [/^speechbrain[=<>~!\s]/m],
        },
      },
      {
        name: "coqui-tts",
        provider: "Coqui",
        description: "Text-to-speech library",
        documentationUrl: "https://tts.readthedocs.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+TTS/m,
            /^from\s+TTS\s+import/m,
          ],
          dependencies: [/^TTS[=<>~!\s]/m, /^coqui-tts[=<>~!\s]/m],
        },
      },
      {
        name: "librosa",
        provider: "librosa",
        description: "Audio analysis library",
        documentationUrl: "https://librosa.org/doc",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+librosa/m,
            /^from\s+librosa\s+import/m,
          ],
          dependencies: [/^librosa[=<>~!\s]/m],
        },
      },
      {
        name: "pyannote",
        provider: "pyannote",
        description: "Speaker diarization toolkit",
        documentationUrl: "https://github.com/pyannote/pyannote-audio",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+pyannote/m,
            /^from\s+pyannote\s+import/m,
            /^from\s+pyannote\./m,
          ],
          dependencies: [/^pyannote[=<>~!\s]/m],
        },
      },
      {
        name: "audiocraft",
        provider: "Meta",
        description: "Audio generation models (MusicGen, AudioGen)",
        documentationUrl: "https://github.com/facebookresearch/audiocraft",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+audiocraft/m,
            /^from\s+audiocraft\s+import/m,
          ],
          dependencies: [/^audiocraft[=<>~!\s]/m],
        },
      },

      // ========================
      // Reinforcement Learning
      // ========================
      {
        name: "stable-baselines3",
        provider: "Stable Baselines",
        description: "Reliable RL implementations",
        documentationUrl: "https://stable-baselines3.readthedocs.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+stable_baselines3/m,
            /^from\s+stable_baselines3\s+import/m,
          ],
          dependencies: [/^stable-baselines3[=<>~!\s]/m],
        },
      },
      {
        name: "gymnasium",
        provider: "Farama Foundation",
        description: "RL environment toolkit (successor to OpenAI Gym)",
        documentationUrl: "https://gymnasium.farama.org",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+gymnasium/m,
            /^from\s+gymnasium\s+import/m,
            /^import\s+gym\b/m,
            /^from\s+gym\s+import/m,
          ],
          dependencies: [
            /^gymnasium[=<>~!\s]/m,
            /^gym[=<>~!\s]/m,
          ],
        },
      },
      {
        name: "rllib",
        provider: "Anyscale",
        description: "Ray's reinforcement learning library",
        documentationUrl: "https://docs.ray.io/en/latest/rllib",
        confidence: "high",
        patterns: {
          imports: [
            /^from\s+ray\.rllib\s+import/m,
            /^from\s+ray\s+import\s+rllib/m,
          ],
          dependencies: [/^ray\[rllib\]/m],
        },
      },

      // ========================
      // AutoML & Hyperparameter Optimization
      // ========================
      {
        name: "optuna",
        provider: "Optuna",
        description: "Hyperparameter optimization framework",
        documentationUrl: "https://optuna.readthedocs.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+optuna/m,
            /^from\s+optuna\s+import/m,
          ],
          dependencies: [/^optuna[=<>~!\s]/m],
        },
      },
      {
        name: "hyperopt",
        provider: "Hyperopt",
        description: "Distributed hyperparameter optimization",
        documentationUrl: "http://hyperopt.github.io/hyperopt",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+hyperopt/m,
            /^from\s+hyperopt\s+import/m,
          ],
          dependencies: [/^hyperopt[=<>~!\s]/m],
        },
      },
      {
        name: "auto-sklearn",
        provider: "AutoML",
        description: "Automated machine learning toolkit",
        documentationUrl: "https://automl.github.io/auto-sklearn",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+autosklearn/m,
            /^from\s+autosklearn\s+import/m,
          ],
          dependencies: [/^auto-sklearn[=<>~!\s]/m],
        },
      },
      {
        name: "autokeras",
        provider: "AutoKeras",
        description: "AutoML library for deep learning",
        documentationUrl: "https://autokeras.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+autokeras/m,
            /^from\s+autokeras\s+import/m,
          ],
          dependencies: [/^autokeras[=<>~!\s]/m],
        },
      },
      {
        name: "tpot",
        provider: "TPOT",
        description: "Genetic AutoML tool",
        documentationUrl: "http://epistasislab.github.io/tpot",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+tpot/m,
            /^from\s+tpot\s+import/m,
          ],
          dependencies: [/^tpot[=<>~!\s]/m],
        },
      },

      // ========================
      // Explainability & Interpretability
      // ========================
      {
        name: "shap",
        provider: "SHAP",
        description: "SHapley Additive exPlanations",
        documentationUrl: "https://shap.readthedocs.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+shap/m,
            /^from\s+shap\s+import/m,
          ],
          dependencies: [/^shap[=<>~!\s]/m],
        },
      },
      {
        name: "lime",
        provider: "LIME",
        description: "Local Interpretable Model-agnostic Explanations",
        documentationUrl: "https://lime-ml.readthedocs.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+lime/m,
            /^from\s+lime\s+import/m,
          ],
          dependencies: [/^lime[=<>~!\s]/m],
        },
      },
      {
        name: "captum",
        provider: "Meta",
        description: "Model interpretability for PyTorch",
        documentationUrl: "https://captum.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+captum/m,
            /^from\s+captum\s+import/m,
          ],
          dependencies: [/^captum[=<>~!\s]/m],
        },
      },
      {
        name: "interpret",
        provider: "Microsoft",
        description: "InterpretML for model interpretability",
        documentationUrl: "https://interpret.ml",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+interpret/m,
            /^from\s+interpret\s+import/m,
          ],
          dependencies: [/^interpret[=<>~!\s]/m],
        },
      },
      {
        name: "alibi",
        provider: "Seldon",
        description: "Machine learning model inspection and interpretation",
        documentationUrl: "https://docs.seldon.io/projects/alibi",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+alibi/m,
            /^from\s+alibi\s+import/m,
          ],
          dependencies: [/^alibi[=<>~!\s]/m],
        },
      },

      // ========================
      // Time Series
      // ========================
      {
        name: "prophet",
        provider: "Meta",
        description: "Forecasting at scale",
        documentationUrl: "https://facebook.github.io/prophet",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+prophet/m,
            /^from\s+prophet\s+import/m,
          ],
          dependencies: [/^prophet[=<>~!\s]/m],
        },
      },
      {
        name: "statsmodels",
        provider: "statsmodels",
        description: "Statistical models and tests",
        documentationUrl: "https://www.statsmodels.org",
        confidence: "medium",
        patterns: {
          imports: [
            /^import\s+statsmodels/m,
            /^from\s+statsmodels\s+import/m,
          ],
          dependencies: [/^statsmodels[=<>~!\s]/m],
        },
      },
      {
        name: "darts",
        provider: "Unit8",
        description: "Time series forecasting library",
        documentationUrl: "https://unit8co.github.io/darts",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+darts/m,
            /^from\s+darts\s+import/m,
          ],
          dependencies: [/^darts[=<>~!\s]/m],
        },
      },
      {
        name: "neuralprophet",
        provider: "NeuralProphet",
        description: "Neural network based forecasting",
        documentationUrl: "https://neuralprophet.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+neuralprophet/m,
            /^from\s+neuralprophet\s+import/m,
          ],
          dependencies: [/^neuralprophet[=<>~!\s]/m],
        },
      },
      {
        name: "sktime",
        provider: "sktime",
        description: "Unified time series ML framework",
        documentationUrl: "https://www.sktime.net",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+sktime/m,
            /^from\s+sktime\s+import/m,
          ],
          dependencies: [/^sktime[=<>~!\s]/m],
        },
      },

      // ========================
      // Graph Neural Networks
      // ========================
      {
        name: "pytorch-geometric",
        provider: "PyG",
        description: "Graph neural network library for PyTorch",
        documentationUrl: "https://pytorch-geometric.readthedocs.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+torch_geometric/m,
            /^from\s+torch_geometric\s+import/m,
          ],
          dependencies: [/^torch-geometric[=<>~!\s]/m],
        },
      },
      {
        name: "dgl",
        provider: "DGL",
        description: "Deep Graph Library",
        documentationUrl: "https://www.dgl.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+dgl/m,
            /^from\s+dgl\s+import/m,
          ],
          dependencies: [/^dgl[=<>~!\s]/m],
        },
      },
      {
        name: "networkx",
        provider: "NetworkX",
        description: "Network analysis library",
        documentationUrl: "https://networkx.org",
        confidence: "medium",
        patterns: {
          imports: [
            /^import\s+networkx/m,
            /^from\s+networkx\s+import/m,
          ],
          dependencies: [/^networkx[=<>~!\s]/m],
        },
      },

      // ========================
      // Data Validation & Quality
      // ========================
      {
        name: "great-expectations",
        provider: "Great Expectations",
        description: "Data validation and documentation",
        documentationUrl: "https://docs.greatexpectations.io",
        confidence: "medium",
        patterns: {
          imports: [
            /^import\s+great_expectations/m,
            /^from\s+great_expectations\s+import/m,
          ],
          dependencies: [/^great-expectations[=<>~!\s]/m],
        },
      },
      {
        name: "pandera",
        provider: "Pandera",
        description: "Data validation for pandas",
        documentationUrl: "https://pandera.readthedocs.io",
        confidence: "medium",
        patterns: {
          imports: [
            /^import\s+pandera/m,
            /^from\s+pandera\s+import/m,
          ],
          dependencies: [/^pandera[=<>~!\s]/m],
        },
      },
      {
        name: "pydantic",
        provider: "Pydantic",
        description: "Data validation using Python type hints",
        documentationUrl: "https://docs.pydantic.dev",
        confidence: "low",
        patterns: {
          imports: [
            /^import\s+pydantic/m,
            /^from\s+pydantic\s+import/m,
          ],
          dependencies: [/^pydantic[=<>~!\s]/m],
        },
      },

      // ========================
      // Feature Engineering
      // ========================
      {
        name: "featuretools",
        provider: "Alteryx",
        description: "Automated feature engineering",
        documentationUrl: "https://featuretools.alteryx.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+featuretools/m,
            /^from\s+featuretools\s+import/m,
          ],
          dependencies: [/^featuretools[=<>~!\s]/m],
        },
      },
      {
        name: "category-encoders",
        provider: "Category Encoders",
        description: "Categorical variable encoding",
        documentationUrl: "https://contrib.scikit-learn.org/category_encoders",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+category_encoders/m,
            /^from\s+category_encoders\s+import/m,
          ],
          dependencies: [/^category-encoders[=<>~!\s]/m],
        },
      },

      // ========================
      // Visualization for ML
      // ========================
      {
        name: "seaborn",
        provider: "Seaborn",
        description: "Statistical data visualization",
        documentationUrl: "https://seaborn.pydata.org",
        confidence: "medium",
        patterns: {
          imports: [
            /^import\s+seaborn/m,
            /^from\s+seaborn\s+import/m,
          ],
          dependencies: [/^seaborn[=<>~!\s]/m],
        },
      },
      {
        name: "plotly",
        provider: "Plotly",
        description: "Interactive visualization library",
        documentationUrl: "https://plotly.com/python",
        confidence: "medium",
        patterns: {
          imports: [
            /^import\s+plotly/m,
            /^from\s+plotly\s+import/m,
          ],
          dependencies: [/^plotly[=<>~!\s]/m],
        },
      },
      {
        name: "yellowbrick",
        provider: "Yellowbrick",
        description: "ML visualization",
        documentationUrl: "https://www.scikit-yb.org",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+yellowbrick/m,
            /^from\s+yellowbrick\s+import/m,
          ],
          dependencies: [/^yellowbrick[=<>~!\s]/m],
        },
      },

      // ========================
      // Diffusion Models & Image Generation
      // ========================
      {
        name: "diffusers",
        provider: "HuggingFace",
        description: "Diffusion models library",
        documentationUrl: "https://huggingface.co/docs/diffusers",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+diffusers/m,
            /^from\s+diffusers\s+import/m,
          ],
          dependencies: [/^diffusers[=<>~!\s]/m],
        },
      },
      {
        name: "compel",
        provider: "Compel",
        description: "Prompt weighting for diffusion models",
        documentationUrl: "https://github.com/damian0815/compel",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+compel/m,
            /^from\s+compel\s+import/m,
          ],
          dependencies: [/^compel[=<>~!\s]/m],
        },
      },

      // ========================
      // Embedding Models
      // ========================
      {
        name: "sentence-transformers",
        provider: "HuggingFace",
        description: "Sentence embeddings library",
        documentationUrl: "https://www.sbert.net",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+sentence_transformers/m,
            /^from\s+sentence_transformers\s+import/m,
          ],
          dependencies: [/^sentence-transformers[=<>~!\s]/m],
        },
      },
      {
        name: "fastembed",
        provider: "Qdrant",
        description: "Fast lightweight embedding generation",
        documentationUrl: "https://qdrant.github.io/fastembed",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+fastembed/m,
            /^from\s+fastembed\s+import/m,
          ],
          dependencies: [/^fastembed[=<>~!\s]/m],
        },
      },

      // ========================
      // LLM Evaluation
      // ========================
      {
        name: "ragas",
        provider: "Ragas",
        description: "RAG evaluation framework",
        documentationUrl: "https://docs.ragas.io",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+ragas/m,
            /^from\s+ragas\s+import/m,
          ],
          dependencies: [/^ragas[=<>~!\s]/m],
        },
      },
      {
        name: "deepeval",
        provider: "DeepEval",
        description: "LLM evaluation framework",
        documentationUrl: "https://docs.deepeval.ai",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+deepeval/m,
            /^from\s+deepeval\s+import/m,
          ],
          dependencies: [/^deepeval[=<>~!\s]/m],
        },
      },
      {
        name: "trulens",
        provider: "TruEra",
        description: "LLM app evaluation and tracking",
        documentationUrl: "https://www.trulens.org",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+trulens/m,
            /^from\s+trulens\s+import/m,
          ],
          dependencies: [/^trulens[=<>~!\s]/m],
        },
      },

      // ========================
      // Prompt Engineering
      // ========================
      {
        name: "promptflow",
        provider: "Microsoft",
        description: "LLM app development toolkit",
        documentationUrl: "https://microsoft.github.io/promptflow",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+promptflow/m,
            /^from\s+promptflow\s+import/m,
          ],
          dependencies: [/^promptflow[=<>~!\s]/m],
        },
      },

      // ========================
      // Monitoring & Observability
      // ========================
      {
        name: "langsmith",
        provider: "LangChain",
        description: "LLM application tracing and monitoring",
        documentationUrl: "https://docs.smith.langchain.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+langsmith/m,
            /^from\s+langsmith\s+import/m,
          ],
          dependencies: [/^langsmith[=<>~!\s]/m],
        },
      },
      {
        name: "phoenix",
        provider: "Arize",
        description: "ML observability for LLMs",
        documentationUrl: "https://docs.arize.com/phoenix",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+phoenix/m,
            /^from\s+phoenix\s+import/m,
            /^import\s+arize_phoenix/m,
          ],
          dependencies: [/^arize-phoenix[=<>~!\s]/m],
        },
      },
      {
        name: "evidently",
        provider: "Evidently",
        description: "ML model monitoring and testing",
        documentationUrl: "https://docs.evidentlyai.com",
        confidence: "high",
        patterns: {
          imports: [
            /^import\s+evidently/m,
            /^from\s+evidently\s+import/m,
          ],
          dependencies: [/^evidently[=<>~!\s]/m],
        },
      },
    ],
  },
];

/**
 * Get all patterns flattened into a single array
 */
export function getAllPatterns(): DetectionPattern[] {
  const patterns: DetectionPattern[] = [];
  for (const category of AI_DETECTION_PATTERNS) {
    patterns.push(...category.patterns);
  }
  return patterns;
}

/**
 * Get patterns by confidence level
 */
export function getPatternsByConfidence(
  confidence: "high" | "medium" | "low"
): DetectionPattern[] {
  return getAllPatterns().filter((p) => p.confidence === confidence);
}

/**
 * Get pattern by name (case-insensitive)
 */
export function getPatternByName(name: string): DetectionPattern | undefined {
  return getAllPatterns().find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}
