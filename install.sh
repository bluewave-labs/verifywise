#!/bin/bash

# Function to read environment variables from .env file
load_env() {
    if [ -f .env ]; then
        export $(cat .env | grep -v '#' | awk '/=/ {print $1}')

        # Store the backend api url in the env file of frontend
        echo "VITE_APP_API_BASE_URL=$VITE_APP_API_HOST:$BACKEND_PORT" > ./Clients/.env
    else
        echo "Error: .env file not found"
        exit 1
    fi
}

# Function to check if database has been initialized
check_db_initialized() {
    local init_flag_file=".db_initialized"
    if [ -f "$init_flag_file" ]; then
        return 0
    else
        return 1
    fi
}

wait_for_postgres() {
    echo "Waiting for PostgreSQL to be ready..."
    # Get the PostgreSQL container ID
    PG_CONTAINER=$(docker-compose ps | grep postgresdb | grep Up | awk '{print $1}')
    
    # Wait for PostgreSQL to be ready to accept connections
    until docker exec $PG_CONTAINER pg_isready; do
        echo "PostgreSQL is unavailable - sleeping"
        sleep 1
    done
    
    echo "PostgreSQL is ready!"
}

# Function to initialize database
initialize_db() {
    echo "Initializing database..."

    wait_for_postgres
    
    # Get the PostgreSQL container ID
    PG_CONTAINER=$(docker-compose ps | grep postgresdb | grep Up | awk '{print $1}')
    
    # Check if SQL files exist
    if [ ! -f "SQL_Commands.sql" ]; then
        echo "Error: Required SQL files (SQL_Commands.sql) not found"
        exit 1
    fi

    # Copy SQL files to container
    echo "Copying SQL files to container..."
    docker cp ./SQL_Commands.sql $PG_CONTAINER:/SQL_Commands.sql

    # Execute SQL files inside container
    echo "Executing SQL_Commands.sql..."
    docker exec -i $PG_CONTAINER psql -U $DB_USER -d $DB_NAME -f ./SQL_Commands.sql

    if [ $? -eq 0 ]; then
        touch .db_initialized
        echo "Database initialized successfully"
        
        # Clean up SQL files from container
        docker exec $PG_CONTAINER rm ./SQL_Commands.sql
    else
        echo "Error: Failed to initialize database"
        exit 1
    fi
}

# Main script
main() {
    # Load environment variables
    load_env

    # Start Docker Compose
    echo "Starting Docker Compose..."
    docker-compose up -d

    # Check if database needs initialization
    if ! check_db_initialized; then
        initialize_db
    else
        echo "Database already initialized, skipping initialization"
    fi

    # Keep containers running in foreground
    docker-compose logs -f
}

# Run main function
main
