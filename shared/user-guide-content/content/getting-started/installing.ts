import type { ArticleContent } from '../../contentTypes';

export const installingContent: ArticleContent = {
  blocks: [
    {
      type: 'time-estimate',
      text: '**Estimated setup time:** 20-30 minutes',
    },
    {
      type: 'heading',
      id: 'before-you-begin',
      level: 2,
      text: 'Before you begin',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise can be deployed on your own infrastructure, giving you complete control over your data. Before starting the installation, make sure you have the following prerequisites in place.',
    },
    {
      type: 'requirements',
      items: [
        {
          icon: 'Server',
          title: 'Server requirements',
          items: [
            'Linux server (Ubuntu 20.04+ recommended)',
            'Minimum 2GB RAM, 2 CPU cores',
            'At least 20GB available disk space',
          ],
        },
        {
          icon: 'Terminal',
          title: 'Software requirements',
          items: [
            'Docker and Docker Compose installed',
            'npm (for development setup only)',
            'Git for cloning the repository',
          ],
        },
        {
          icon: 'Database',
          title: 'Network requirements',
          items: [
            'Ports 80 and 443 open for web traffic',
            'Port 5432 for PostgreSQL (internal)',
            'Port 6379 for Redis (internal)',
          ],
        },
      ],
    },
    {
      type: 'heading',
      id: 'deployment-method',
      level: 2,
      text: 'Choose your deployment method',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise supports two deployment approaches depending on your needs:',
    },
    {
      type: 'grid-cards',
      columns: 2,
      items: [
        {
          title: 'Production (Docker)',
          description: 'Recommended for most users. Uses Docker Compose for a fully containerized deployment with minimal configuration. Best for: Teams, production environments',
        },
        {
          title: 'Development (npm)',
          description: 'Run services individually with hot reload. Useful for contributing to the project or customizing the platform. Best for: Developers, contributors',
        },
      ],
    },
    {
      type: 'heading',
      id: 'production-setup',
      level: 2,
      text: 'Production setup (recommended)',
    },
    {
      type: 'paragraph',
      text: 'The production setup uses Docker Compose to run all services in containers. This is the simplest way to get VerifyWise running.',
    },
    {
      type: 'heading',
      id: 'production-step-1',
      level: 3,
      text: 'Step 1: Download the installation files',
    },
    {
      type: 'paragraph',
      text: 'Create a directory and download the required files:',
    },
    {
      type: 'code',
      code: `mkdir verifywise && cd verifywise
curl -O https://raw.githubusercontent.com/bluewave-labs/verifywise/develop/install.sh
curl -O https://raw.githubusercontent.com/bluewave-labs/verifywise/develop/.env.prod`,
    },
    {
      type: 'heading',
      id: 'production-step-2',
      level: 3,
      text: 'Step 2: Configure environment variables',
    },
    {
      type: 'paragraph',
      text: 'Open the `.env.prod` file and update these required values:',
    },
    {
      type: 'code',
      code: `# Replace with your server's IP address or domain
BACKEND_URL=http://your-server-ip:3000
FRONTEND_URL=http://your-server-ip:8080

# Generate a secure JWT secret (run this command)
# openssl rand -base64 32
JWT_SECRET=your-generated-secret-here

# Set a strong database password
POSTGRES_PASSWORD=your-secure-password`,
    },
    {
      type: 'heading',
      id: 'production-step-3',
      level: 3,
      text: 'Step 3: Run the installation script',
    },
    {
      type: 'paragraph',
      text: 'Make the script executable and run it:',
    },
    {
      type: 'code',
      code: `chmod +x ./install.sh
./install.sh`,
    },
    {
      type: 'paragraph',
      text: 'The script will pull the Docker images, create the database, and start all services. Once complete, VerifyWise will be available at your configured `FRONTEND_URL`.',
    },
    {
      type: 'heading',
      id: 'development-setup',
      level: 2,
      text: 'Development setup',
    },
    {
      type: 'paragraph',
      text: "For development, you'll run the frontend and backend separately with hot reload enabled. This setup requires more steps but gives you full control over each service.",
    },
    {
      type: 'heading',
      id: 'dev-step-1',
      level: 3,
      text: 'Step 1: Clone and install dependencies',
    },
    {
      type: 'code',
      code: `git clone https://github.com/bluewave-labs/verifywise.git
cd verifywise

# Install frontend dependencies
cd Clients && npm install

# Install backend dependencies
cd ../Servers && npm install`,
    },
    {
      type: 'heading',
      id: 'dev-step-2',
      level: 3,
      text: 'Step 2: Start database services',
    },
    {
      type: 'paragraph',
      text: 'Run PostgreSQL and Redis in Docker containers:',
    },
    {
      type: 'code',
      code: `# Start PostgreSQL
docker run -d --name mypostgres -p 5432:5432 \\
  -e POSTGRES_PASSWORD=your_password postgres

# Start Redis
docker run -d --name myredis -p 6379:6379 redis

# Create the database
docker exec -it mypostgres psql -U postgres -c "CREATE DATABASE verifywise;"`,
    },
    {
      type: 'heading',
      id: 'dev-step-3',
      level: 3,
      text: 'Step 3: Configure and start services',
    },
    {
      type: 'code',
      code: `# Copy the environment file
cp .env.dev Servers/.env

# Start the backend (in one terminal)
cd Servers && npm run watch

# Start the frontend (in another terminal)
cd Clients && npm run dev`,
    },
    {
      type: 'paragraph',
      text: 'The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:3000`.',
    },
    {
      type: 'heading',
      id: 'environment-config',
      level: 2,
      text: 'Environment configuration',
    },
    {
      type: 'paragraph',
      text: "Here's a reference of the key environment variables you can configure:",
    },
    {
      type: 'table',
      columns: [
        { key: 'variable', label: 'Variable', width: '180px' },
        { key: 'description', label: 'Description' },
      ],
      rows: [
        { variable: 'BACKEND_URL', description: 'URL where the API server is accessible' },
        { variable: 'FRONTEND_URL', description: 'URL where the web application is accessible' },
        { variable: 'JWT_SECRET', description: 'Secret key for signing authentication tokens' },
        { variable: 'POSTGRES_PASSWORD', description: 'Password for the PostgreSQL database' },
        { variable: 'POSTGRES_DB', description: 'Database name (default: verifywise)' },
        { variable: 'REDIS_HOST', description: 'Redis server hostname (default: localhost)' },
      ],
    },
    {
      type: 'heading',
      id: 'first-access',
      level: 2,
      text: 'First-time access',
    },
    {
      type: 'paragraph',
      text: "When you first access VerifyWise, you'll see the admin registration page. This is expected — the platform ships without any default users for security reasons.",
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Navigate to your VerifyWise URL in a web browser' },
        { text: 'Complete the admin registration form with your details' },
        { text: 'Log in with your new admin credentials' },
        { text: "You'll land on the dashboard, ready to create your first use case" },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Important',
      text: 'Complete the admin registration promptly after deployment. Anyone with access to your VerifyWise URL can register as admin until the first account is created.',
    },
    {
      type: 'heading',
      id: 'ssl-security',
      level: 2,
      text: 'SSL and security',
    },
    {
      type: 'paragraph',
      text: "For production deployments, we strongly recommend enabling SSL/TLS encryption. You can obtain free certificates using Let's Encrypt with Certbot.",
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Install Nginx as a reverse proxy on your server' },
        { text: 'Install Certbot and obtain certificates for your domain' },
        { text: 'Configure Nginx to proxy requests to VerifyWise services' },
        { text: 'Update your `.env.prod` URLs to use `https://`' },
        { text: 'Restart the services to apply the changes' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Next step',
      text: 'Now that VerifyWise is installed, learn how to navigate the dashboard and set up your first AI governance use case.',
    },
  ],
};
