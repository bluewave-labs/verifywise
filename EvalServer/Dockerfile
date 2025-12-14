FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY ./src/requirements.txt requirements.txt

# Install core packages first
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    fastapi==0.115.5 \
    uvicorn==0.32.1 \
    sqlalchemy==2.0.36 \
    alembic==1.16.5 \
    asyncpg==0.30.0 \
    psycopg2-binary==2.9.10 \
    redis==5.2.1 \
    python-dotenv==1.0.1 \
    pydantic==2.10.3 \
    pydantic-settings==2.6.1 \
    && rm -rf /root/.cache/pip

# Install ML packages separately with cleanup
RUN pip install --no-cache-dir \
    torch==2.8.0 \
    transformers==4.47.1 \
    scikit-learn==1.6.1 \
    && rm -rf /root/.cache/pip

# Install remaining packages
RUN pip install --no-cache-dir -r requirements.txt || true \
    && rm -rf /root/.cache/pip

# Copy the rest of the application
COPY ./src .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
