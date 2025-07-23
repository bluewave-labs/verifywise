# Bias and Fairness Evaluation for LLMs (Experimental Module)

> ⚠️ **This is an experimental module.** The purpose of creating this module is to test and validate different approaches for evaluating bias and fairness in large language models (LLMs). None of the branches or modules in this branch are intended for production use, and no code here will be merged into the main branch.

## Objective

This project aims to explore and validate methodologies for evaluating **bias** and **fairness** in LLMs across various model and dataset combinations. All code in this repository is experimental and intended to test feasibility, correctness, and performance before production integration.

## What We're Doing

- Running experiments using different **open/close-source LLMs** and **benchmark or custom datasets**.
- Implementing and testing **bias** and **fairness** metrics in a modular way.
- Evaluating different **prompting strategies** and **evaluation pipelines**.
- Ensuring our code is reproducible and extensible for future productionization.

## Tech Stack

- **Language**: Python
- **Frameworks/Libraries**: PyTorch, Hugging Face Transformers, Accelerate, pandas, matplotlib/seaborn, Streamlit
- **Hardware**: Designed to run on GPU

## Development Philosophy

- **Experiment-first**: This repo is for rapid iteration and learning.
- **No main merges**: All work stays in isolated branches.
- **Fail-safe**: Better to try and break it here than in production.
- **Collaborative**: Encourage collaboration through clear, modular design and code comments.