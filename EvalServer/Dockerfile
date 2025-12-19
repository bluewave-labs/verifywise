FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Copy requirements first for better caching
COPY ./EvalServer/src/requirements.txt requirements.txt

# Install CPU-only PyTorch first (forces CPU wheel, no triton/CUDA)
# Then install remaining dependencies from PyPI
RUN pip install --no-cache-dir torch==2.5.1 --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy the application source
COPY ./EvalServer/src .

# Copy the datasets from EvaluationModule
COPY ./EvaluationModule/data/datasets /app/datasets

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
