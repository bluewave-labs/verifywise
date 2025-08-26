#!/bin/bash

echo "🏠 Setting up Confluence Test Environment"
echo "======================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create logs directory
mkdir -p confluence-logs

echo "🚀 Starting Confluence and PostgreSQL containers..."

# Start the containers
docker-compose -f docker-compose.confluence.yml up -d

echo "⏳ Waiting for containers to start..."
sleep 10

# Check container status
if docker ps | grep -q "confluence-test"; then
    echo "✅ Confluence container is running"
else
    echo "❌ Failed to start Confluence container"
    exit 1
fi

if docker ps | grep -q "confluence-postgres"; then
    echo "✅ PostgreSQL container is running"
else
    echo "❌ Failed to start PostgreSQL container"
    exit 1
fi

echo ""
echo "🎉 Confluence Test Environment Ready!"
echo "=================================="
echo ""
echo "📍 Access Confluence at: http://localhost:8090"
echo "🔑 Database connection details:"
echo "   - Host: confluence-postgres (or localhost from host)"
echo "   - Port: 5432"
echo "   - Database: confluence" 
echo "   - User: confluence"
echo "   - Password: confluence"
echo ""
echo "📝 Setup Instructions:"
echo "1. Open http://localhost:8090 in your browser"
echo "2. Choose 'Production Installation'"
echo "3. Generate evaluation license at https://my.atlassian.com/"
echo "4. Configure database with the details above"
echo "5. Create admin user and initial space"
echo ""
echo "🛑 To stop: docker-compose -f docker-compose.confluence.yml down"
echo "🧹 To clean up: docker-compose -f docker-compose.confluence.yml down -v"