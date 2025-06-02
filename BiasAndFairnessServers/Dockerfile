FROM python:3.9

# Set the working directory inside the container
WORKDIR /app

COPY . .

# Install dependencies (assuming you have requirements.txt at root)
RUN pip install --no-cache-dir -r ./src/requirements.txt

# Set default command (optional — can also be done in docker-compose.yml)
CMD sh -c "alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port 8000"
