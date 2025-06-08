FROM python:3.9

# Set the working directory inside the container
WORKDIR /app

# Copy requirements first for better caching
COPY ./src/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY ./src .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
