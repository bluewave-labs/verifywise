FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Copy requirements first for better caching
COPY ./EvalServer/src/requirements.txt requirements.txt

# Install CPU-only PyTorch (much smaller, no triton/CUDA ~2GB savings)
# Using --extra-index-url ensures CPU wheels are preferred for torch and related packages
RUN pip install --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements.txt

# Copy the application source
COPY ./EvalServer/src .

# Copy the datasets from EvaluationModule
COPY ./EvaluationModule/data/datasets /app/datasets

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
