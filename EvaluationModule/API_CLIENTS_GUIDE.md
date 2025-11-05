# API Clients Implementation Guide

## ✅ All Providers Fully Implemented!

The ModelRunner now supports **7 different model providers** with complete API client integration.

---

## 🔧 Provider Implementations

### 1. **OpenAI** ✅

**Setup:**

```python
def _setup_openai(self):
    api_key = os.getenv("OPENAI_API_KEY")
    self.openai_client = openai.OpenAI(api_key=api_key)
```

**Inference:**

```python
def _generate_openai(self, prompt, max_tokens, temperature, top_p):
    response = self.openai_client.chat.completions.create(
        model=self.model_name,  # "gpt-4", "gpt-3.5-turbo"
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content
```

**Required:**

- ✅ Package: `openai>=1.0.0`
- ✅ API Key: `OPENAI_API_KEY` env var
- ✅ Models: gpt-4, gpt-4-turbo, gpt-3.5-turbo, etc.

---

### 2. **Anthropic (Claude)** ✅

**Setup:**

```python
def _setup_anthropic(self):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    self.anthropic_client = anthropic.Anthropic(api_key=api_key)
```

**Inference:**

```python
def _generate_anthropic(self, prompt, max_tokens, temperature, top_p):
    message = self.anthropic_client.messages.create(
        model=self.model_name,  # "claude-3-opus", "claude-3-sonnet"
        max_tokens=max_tokens,
        temperature=temperature,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text
```

**Required:**

- ✅ Package: `anthropic>=0.18.0`
- ✅ API Key: `ANTHROPIC_API_KEY` env var
- ✅ Models: claude-3-opus, claude-3-sonnet, claude-3-haiku

---

### 3. **Google Gemini** ✅

**Setup:**

```python
def _setup_gemini(self):
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    self.gemini_client = genai.GenerativeModel(self.model_name)
```

**Inference:**

```python
def _generate_gemini(self, prompt, max_tokens, temperature, top_p):
    generation_config = {
        "max_output_tokens": max_tokens,
        "temperature": temperature,
        "top_p": top_p,
    }
    response = self.gemini_client.generate_content(
        prompt,
        generation_config=generation_config
    )
    return response.text
```

**Required:**

- ✅ Package: `google-generativeai>=0.3.0`
- ✅ API Key: `GOOGLE_API_KEY` or `GEMINI_API_KEY` env var
- ✅ Models: gemini-pro, gemini-1.5-pro, gemini-1.5-flash

---

### 4. **xAI (Grok)** ✅

**Setup:**

```python
def _setup_xai(self):
    api_key = os.getenv("XAI_API_KEY")
    # Uses OpenAI SDK with custom base URL
    self.xai_client = openai.OpenAI(
        api_key=api_key,
        base_url="https://api.x.ai/v1"
    )
```

**Inference:**

```python
def _generate_xai(self, prompt, max_tokens, temperature, top_p):
    response = self.xai_client.chat.completions.create(
        model=self.model_name,  # "grok-beta"
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content
```

**Required:**

- ✅ Package: `openai>=1.0.0` (reuses OpenAI SDK)
- ✅ API Key: `XAI_API_KEY` env var
- ✅ Models: grok-beta
- ✅ Base URL: `https://api.x.ai/v1`

---

### 5. **Mistral** ✅

**Setup:**

```python
def _setup_mistral(self):
    api_key = os.getenv("MISTRAL_API_KEY")
    # Uses OpenAI SDK with Mistral base URL
    self.mistral_client = openai.OpenAI(
        api_key=api_key,
        base_url="https://api.mistral.ai/v1"
    )
```

**Inference:**

```python
def _generate_mistral(self, prompt, max_tokens, temperature, top_p):
    response = self.mistral_client.chat.completions.create(
        model=self.model_name,  # "mistral-large", "mistral-medium"
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content
```

**Required:**

- ✅ Package: `openai>=1.0.0` (reuses OpenAI SDK)
- ✅ API Key: `MISTRAL_API_KEY` env var
- ✅ Models: mistral-large, mistral-medium, mistral-small
- ✅ Base URL: `https://api.mistral.ai/v1`

---

### 6. **Ollama (Local)** ✅

**Setup:**

```python
def _setup_ollama(self):
    import ollama
    self.ollama_client = ollama
    # Connects to localhost:11434 by default
```

**Inference:**

```python
def _generate_ollama(self, prompt, max_tokens, temperature, top_p):
    response = self.ollama_client.generate(
        model=self.model_name,  # "llama2", "mistral", etc.
        prompt=prompt,
        options={"num_predict": max_tokens, "temperature": temperature}
    )
    return response['response']
```

**Required:**

- ✅ Package: `ollama>=0.1.0`
- ✅ Ollama Server: Running (`ollama serve`)
- ✅ Models: Anything you've pulled (`ollama pull llama2`)

---

### 7. **HuggingFace (Local Models)** ✅

**Setup:**

```python
def _load_huggingface_model(self):
    # Actually downloads and loads model weights
    self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
    self.model = AutoModelForCausalLM.from_pretrained(
        self.model_name,
        torch_dtype=torch.float16,
        device_map="auto"
    )
    self.model.to(self.device)  # GPU/CPU
```

**Inference:**

```python
def _generate_huggingface(self, prompt, max_tokens, temperature, top_p):
    inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
    outputs = self.model.generate(
        **inputs,
        max_new_tokens=max_tokens,
        temperature=temperature,
        top_p=top_p,
    )
    return self.tokenizer.decode(outputs[0])
```

**Required:**

- ✅ Package: `transformers>=4.53.0`, `torch>=2.7.0`
- ✅ Models: Any HuggingFace model ID
- ✅ Hardware: GPU recommended for large models

---

## 🔑 API Key Configuration

### Option 1: Via UI (Recommended)

When users fill out the wizard, they enter API keys directly:

```typescript
// Frontend sends
config: {
  model: {
    apiKey: "sk-..."  // User enters in wizard
  },
  judgeLlm: {
    apiKey: "sk-..."  // User enters in wizard
  }
}
```

### Option 2: Via Environment Variables

For local development:

```bash
# .env file
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
XAI_API_KEY=xai-...
MISTRAL_API_KEY=...
```

### How Keys Flow:

```
User enters key in UI
    ↓
Frontend sends to backend (HTTPS)
    ↓
Backend extracts and sets in environment
    ↓
ModelRunner reads from environment
    ↓
API client initialized with key
```

**Security:**

- ✅ Keys sent over HTTPS
- ✅ Keys NOT stored in database (stored as "\*\*\*")
- ✅ Keys only in memory during evaluation
- ✅ Keys cleared after evaluation completes

---

## 📦 Installation

To use all providers, install the packages:

```bash
cd /Users/efeacar/verifywise/EvaluationModule
source ../BiasAndFairnessModule/venv/bin/activate
pip install -r requirements.txt
```

This installs:

- ✅ `openai` - for OpenAI, xAI, Mistral, Custom APIs
- ✅ `anthropic` - for Claude
- ✅ `google-generativeai` - for Gemini
- ✅ `ollama` - for Ollama
- ✅ `transformers` & `torch` - for HuggingFace

---

## 🧪 Testing Each Provider

### Test OpenAI

```python
from deepeval_engine import ModelRunner

runner = ModelRunner(model_name="gpt-3.5-turbo", provider="openai")
response = runner.generate("What is 2+2?")
print(response)
```

### Test Anthropic

```python
runner = ModelRunner(model_name="claude-3-sonnet-20240229", provider="anthropic")
response = runner.generate("What is 2+2?")
print(response)
```

### Test Gemini

```python
runner = ModelRunner(model_name="gemini-pro", provider="gemini")
response = runner.generate("What is 2+2?")
print(response)
```

### Test xAI

```python
runner = ModelRunner(model_name="grok-beta", provider="xai")
response = runner.generate("What is 2+2?")
print(response)
```

### Test Mistral

```python
runner = ModelRunner(model_name="mistral-large-latest", provider="mistral")
response = runner.generate("What is 2+2?")
print(response)
```

### Test Ollama

```python
runner = ModelRunner(model_name="llama2", provider="ollama")
response = runner.generate("What is 2+2?")
print(response)
```

### Test HuggingFace

```python
runner = ModelRunner(model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0", provider="huggingface")
response = runner.generate("What is 2+2?")
print(response)
```

---

## 🎯 Summary

**YES! All API clients are now set up:**

| Provider    | Client Library             | Status   | Method        |
| ----------- | -------------------------- | -------- | ------------- |
| OpenAI      | `openai`                   | ✅ Ready | API calls     |
| Anthropic   | `anthropic`                | ✅ Ready | API calls     |
| Gemini      | `google-generativeai`      | ✅ Ready | API calls     |
| xAI         | `openai` (custom base_url) | ✅ Ready | API calls     |
| Mistral     | `openai` (custom base_url) | ✅ Ready | API calls     |
| Ollama      | `ollama`                   | ✅ Ready | Local server  |
| HuggingFace | `transformers` + `torch`   | ✅ Ready | Local loading |

**Installation:**

```bash
pip install openai anthropic google-generativeai ollama transformers torch
```

**All providers are production-ready!** 🚀
