FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Copy requirements first for better caching
COPY ./EvalServer/requirements.txt requirements.txt

# Install dependencies using CPU-only PyTorch index for smaller image size
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Copy the application source
COPY ./EvalServer/src .

# Copy the deepeval_engine module from EvaluationModule
COPY ./EvaluationModule/src/deepeval_engine /app/deepeval_engine

# Copy the datasets from EvaluationModule
COPY ./EvaluationModule/data/datasets /app/datasets

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
