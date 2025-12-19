FROM python:3.10

# Set the working directory inside the container
WORKDIR /app

# Copy requirements first for better caching
COPY ./EvalServer/src/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application source
COPY ./EvalServer/src .

# Copy the datasets from EvaluationModule
COPY ./EvaluationModule/data/datasets /app/datasets

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
