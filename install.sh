#!/bin/bash

# Function to detect whether to use `docker-compose` or `docker compose`
detect_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        echo "Error: Neither 'docker-compose' nor 'docker compose' is available. Please install Docker Compose."
        exit 1
    fi
}

# Function to read environment variables from .env file
load_env() {
    ENV_FILE=$1
    if [ -f $ENV_FILE ]; then
        export $(cat $ENV_FILE | grep -v '#' | awk '/=/ {print $1}')
    else
        echo "Error: $ENV_FILE file not found"
        exit 1
    fi
}

wait_for_postgres() {
    echo "Waiting for PostgreSQL to be ready..."
    # Get the PostgreSQL container ID
    PG_CONTAINER=$($DOCKER_COMPOSE_CMD ps | grep postgresdb | grep Up | awk '{print $1}')
    
    # Wait for PostgreSQL to be ready to accept connections
    if [ -z "$PG_CONTAINER" ]; then
        echo "Error: PostgreSQL container not found or not running. Please ensure the container name matches 'postgresdb' in your docker-compose.yml file."
        exit 1
    fi
 
    until docker exec $PG_CONTAINER pg_isready; do
        echo "PostgreSQL is unavailable - sleeping"
        sleep 1
    done
    
    echo "PostgreSQL is ready!"
}

# Main script
main() {
    detect_docker_compose

    ENVIRONMENT=${1:-prod}
    echo "Running in $ENVIRONMENT mode"

    # Start Docker Compose
    echo "Starting Docker Compose..."
    if [ $ENVIRONMENT == "dev" ]; then
        load_env .env.dev
        $DOCKER_COMPOSE_CMD --env-file .env.dev up --build -d
    else
        load_env .env.prod
        $DOCKER_COMPOSE_CMD -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d
    fi

    # Keep containers running in foreground
    $DOCKER_COMPOSE_CMD logs -f
}

# Run main function
main $1
