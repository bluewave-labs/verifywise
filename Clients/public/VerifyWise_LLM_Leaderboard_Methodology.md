# VerifyWise LLM Leaderboard Methodology

**Version 2.0 | January 2026**

---

## Overview

The VerifyWise LLM Leaderboard provides a comprehensive evaluation of large language models (LLMs) for enterprise applications. Our leaderboard combines two types of metrics:

1. **VerifyWise Application Score** — Our proprietary evaluation measuring real-world enterprise task performance
2. **Standard Academic Benchmarks** — Established benchmarks from the research community (sourced from LLMStats)

---

## Part 1: VerifyWise Application Score

### What It Measures

The VerifyWise Application Score measures how well LLMs perform on **real-world enterprise application tasks**, going beyond traditional academic benchmarks to evaluate practical utility. Unlike benchmarks that test isolated capabilities, our evaluation assesses models in scenarios that mirror actual business use cases.

### Methodology

Each model is evaluated on **44 carefully designed tasks** across **5 evaluation suites**. Tasks are scored as pass/fail based on strict criteria, and the final score is a weighted average of suite performance.

### Evaluation Suites

#### 1. Instruction Following (25% weight)
- **Tasks:** 12
- **Description:** Tests the model's ability to follow complex, multi-step instructions precisely. Includes format constraints, conditional logic, and edge case handling.
- **Example Tasks:**
  - Follow specific output formats (JSON, XML, markdown tables)
  - Handle conditional instructions ("If X, then do Y, otherwise do Z")
  - Satisfy multiple constraints simultaneously
  - Parse and execute nested instructions

#### 2. RAG Grounded QA (25% weight)
- **Tasks:** 8
- **Description:** Evaluates retrieval-augmented generation quality. Tests whether models can accurately answer questions using provided context without hallucinating.
- **Example Tasks:**
  - Answer questions using only provided context
  - Cite sources correctly with page/section references
  - Acknowledge knowledge gaps when information is insufficient
  - Distinguish between context-supported and unsupported claims

#### 3. Coding Tasks (20% weight)
- **Tasks:** 8
- **Description:** Assesses code generation, debugging, and explanation capabilities across multiple programming languages and complexity levels.
- **Example Tasks:**
  - Generate working, executable code from specifications
  - Debug existing code with logical errors
  - Explain complex algorithms in plain language
  - Refactor code for improved performance or readability

#### 4. Agent Workflows (15% weight)
- **Tasks:** 6
- **Description:** Tests agentic capabilities including tool use, multi-step planning, and autonomous task completion.
- **Example Tasks:**
  - Execute multi-step workflows with tool calls
  - Recover gracefully from errors and retry appropriately
  - Decompose complex goals into actionable steps
  - Maintain context across long interaction chains

#### 5. Safety & Policy (15% weight)
- **Tasks:** 10
- **Description:** Evaluates adherence to safety guidelines, refusal of harmful requests, and compliance with content policies.
- **Example Tasks:**
  - Refuse harmful or unethical requests appropriately
  - Handle sensitive topics with care and nuance
  - Maintain appropriate professional boundaries
  - Avoid generating misleading or dangerous content

### Scoring Formula

```
Application Score = (IF × 0.25) + (RAG × 0.25) + (Coding × 0.20) + (Agent × 0.15) + (Safety × 0.15)
```

Where:
- **IF** = Instruction Following suite score (0-100)
- **RAG** = RAG Grounded QA suite score (0-100)
- **Coding** = Coding Tasks suite score (0-100)
- **Agent** = Agent Workflows suite score (0-100)
- **Safety** = Safety & Policy suite score (0-100)

### Evaluation Details

| Attribute | Value |
|-----------|-------|
| **Evaluator** | VerifyWise Evaluation Pipeline v2.0 |
| **Judge Model** | Human review + GPT-4.1 as automated judge |
| **Evaluation Date** | January 2026 |
| **Reproducibility** | All evaluation prompts and scoring criteria are available in our open-source evaluation suite |

---

## Part 2: Standard Academic Benchmarks

In addition to our proprietary Application Score, we display three widely-recognized academic benchmarks to provide additional context on model capabilities. All benchmark data is sourced from **[LLMStats](https://llmstats.com)**, an independent aggregator of LLM benchmark results.

### MMLU (Massive Multitask Language Understanding)

| Attribute | Details |
|-----------|---------|
| **Full Name** | Massive Multitask Language Understanding |
| **Tasks** | 57 subjects across STEM, humanities, social sciences, and more |
| **Format** | Multiple-choice questions |
| **What It Measures** | Breadth of world knowledge and problem-solving ability |
| **Paper** | [Measuring Massive Multitask Language Understanding](https://arxiv.org/abs/2009.03300) (Hendrycks et al., 2020) |
| **Data Source** | LLMStats |

**Description:** MMLU tests models across 57 diverse subjects ranging from elementary mathematics to professional law and medicine. It evaluates both the breadth of a model's knowledge and its ability to apply that knowledge to answer questions correctly. Subjects include:
- STEM: Mathematics, Physics, Chemistry, Computer Science, Biology
- Humanities: History, Philosophy, Law
- Social Sciences: Psychology, Economics, Sociology
- Professional: Medicine, Accounting, Engineering

### GPQA (Graduate-Level Google-Proof Q&A)

| Attribute | Details |
|-----------|---------|
| **Full Name** | Graduate-Level Google-Proof Q&A |
| **Tasks** | 448 challenging multiple-choice questions |
| **Format** | Multiple-choice questions designed by PhD experts |
| **What It Measures** | Expert-level reasoning in biology, physics, and chemistry |
| **Paper** | [GPQA: A Graduate-Level Google-Proof Q&A Benchmark](https://arxiv.org/abs/2311.12022) (Rein et al., 2023) |
| **Data Source** | LLMStats |

**Description:** GPQA consists of 448 challenging multiple-choice questions written by domain experts with PhDs in biology, physics, and chemistry. The questions are specifically designed to be "Google-proof" — meaning they cannot be easily answered by searching the internet. This benchmark tests:
- Deep domain expertise
- Complex multi-step reasoning
- Understanding of advanced scientific concepts
- Ability to synthesize information across disciplines

### HumanEval (Code Generation)

| Attribute | Details |
|-----------|---------|
| **Full Name** | HumanEval |
| **Tasks** | 164 programming problems |
| **Format** | Function completion from docstrings |
| **What It Measures** | Functional correctness of generated code |
| **Paper** | [Evaluating Large Language Models Trained on Code](https://arxiv.org/abs/2107.03374) (Chen et al., 2021) |
| **Data Source** | LLMStats |

**Description:** HumanEval measures the functional correctness of code generated by language models. It consists of 164 original programming problems that assess:
- Language comprehension (understanding problem descriptions)
- Algorithm design and implementation
- Simple mathematics and logic
- Code syntax and correctness

Each problem includes a function signature and docstring, and models must generate code that passes all unit tests. The benchmark reports pass@1 (the percentage of problems solved correctly on the first attempt).

---

## Data Sources & Attribution

### VerifyWise Application Score
- **Source:** VerifyWise internal evaluation pipeline
- **Methodology:** Proprietary evaluation suite developed by VerifyWise
- **Updates:** Scores are updated as new models are released and evaluated

### Academic Benchmarks (MMLU, GPQA, HumanEval)
- **Source:** [LLMStats](https://llmstats.com)
- **Attribution:** All benchmark scores are sourced from LLMStats, which aggregates results from official model announcements, research papers, and verified third-party evaluations
- **Accuracy:** We use the most recent available scores; some scores may be self-reported by model providers

---

## Interpreting the Leaderboard

### Score Ranges

| Score Range | Interpretation |
|-------------|----------------|
| **90%+** | Excellent — Top-tier performance (highlighted in green) |
| **80-89%** | Very Good — Strong performance |
| **70-79%** | Good — Solid performance with room for improvement |
| **60-69%** | Fair — Adequate for some use cases |
| **Below 60%** | Limited — May struggle with complex tasks |

### Important Considerations

1. **No single score tells the whole story.** A model might excel at coding but struggle with safety compliance, or vice versa.

2. **Application Score vs. Academic Benchmarks:** Our Application Score focuses on practical enterprise tasks, while academic benchmarks test specific capabilities. Consider both when selecting a model.

3. **Task-specific needs matter.** If your use case is primarily code generation, HumanEval may be more relevant than MMLU.

4. **Scores are point-in-time.** Model capabilities may change with updates, and benchmark methodologies evolve.

---

## Contact & Feedback

For questions about our methodology or to report issues:
- **Website:** [verifywise.ai](https://verifywise.ai)
- **GitHub:** [github.com/verifywise/verifywise](https://github.com/verifywise/verifywise)

---

*Document Version: 2.0*  
*Last Updated: January 2026*  
*© 2026 VerifyWise. All rights reserved.*
