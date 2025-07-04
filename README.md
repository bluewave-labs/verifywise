
[Join our Discord channel](https://discord.com/invite/d3k3E4uEpR) to get the latest announcement.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bluewave-labs/verifywise)
![](https://img.shields.io/github/license/bluewave-labs/verifywise)
![](https://img.shields.io/github/repo-size/bluewave-labs/verifywise)
![](https://img.shields.io/github/commit-activity/m/bluewave-labs/verifywise)
![](https://img.shields.io/github/last-commit/bluewave-labs/verifywise)
![](https://img.shields.io/github/languages/top/bluewave-labs/verifywise)
![](https://img.shields.io/github/issues/bluewave-labs/verifywise)
![](https://img.shields.io/github/issues-pr/bluewave-labs/verifywise)

<img src="https://github.com/user-attachments/assets/27640e05-0180-4b3d-ad80-3914d00d0eb2">


[VerifyWise](https://verifywise.ai) is an open-source AI governance platform designed to help businesses harness the power of AI safely and responsibly. Our platform ensures compliance and robust AI management without compromising on security.

We are democratizing AI best practices with an open-source solution that can be hosted on-premises, giving you complete control over your AI governance. 

Please [get in touch](https://tidycal.com/verifywise/info-session) with us to see the latest demo, or [click here](https://verifywise.ai/see-a-demo-of-verifywise/) to experience the demo yourself.

![SCR-20250619-jrmy-2-scaled](https://github.com/user-attachments/assets/1fc614e4-76f3-45a4-b2e4-8cb5a29dfd38)


## Who is it for?

The platform simplifies AI governance for organizations, helping them manage risks, ensure regulatory compliance, and promote responsible AI practices throughout their operations.

VerifyWise is designed for:

- **Businesses**: From those considering AI adoption to organizations developing proprietary AI at scale.
- **Compliance officers**: Professionals ensuring adherence to EU AI Act regulations and internal policies.
- **Risk management teams**: Groups tasked with identifying and mitigating AI-related risks.
- **Legal and privacy teams**: Professionals addressing the legal and ethical implications of AI use.
- **AI developers**: Teams working on AI projects who need to ensure compliance and responsible development.

## Why now? 

- **Urgent need for regulatory compliance:** Regulations establish clear rules for AI applications, creating a need for organizations to comply with legal requirements.
- **Complexity of compliance:** Companies will require governance tools to help them navigate a changing regulatory landscape. 
- **Growing concerns for ethical AI:** There is a strong push from governments, businesses, and consumers for more ethical and transparent AI systems.
- **Good timing with global AI expansion:** Launching an open-source AI governance application now aligns with the AI adoption trend across industries (e.g., healthcare, finance), addressing the need for a deployable governance solution.

## Features

![VerifyWise platform](https://github.com/user-attachments/assets/2d05cd1f-f67b-45d2-aca4-1fdcde287a44)

- Option to host the application on-premises or in a private cloud
- Open source with a permissive license (AGPLv3)
- Faster audits using AI-generated answers for compliance and assessment questions
- Full access to the source code for transparency, security audits, and customization
- Docker deployment (also deployable on render.com and similar platforms)
- User registration, authentication, and role-based access control (RBAC) support
- Major features:
  - Multiple projects
  - Support for EU AI Act and ISO 42001
  - Vendors & vendor risks
  - AI project risks
  - Bias & fairness check of ML systems
  - Evidence center
  - Reports
  - AI literacy training
 
## Roadmap 

- More frameworks
- Mappings between frameworks
- AI trust center
- Integration with MIT AI risk repository
- Automated reports
- Risk and control mappings

## Installation

The VerifyWise application has two components: a frontend built with React.js and a backend built with Node.js. At present, you can use `npm` (for development) or Docker (production) to run VerifyWise. A PostgreSQL database is required to run VerifyWise.

### Installation using npm (for development)

Prerequisites: 
- npm and Docker
- A running PostgreSQL, preferably as a Docker image (eg. using `docker pull postgres:latest`)

First, clone the repository to your local machine and go to verifywise directory. Then, navigate to the Clients directory and install the dependencies:

```
git clone https://github.com/bluewave-labs/verifywise.git
cd verifywise
cd Clients
npm i
```

Navigate back to the `/Servers` directory under root to install the dependencies:

```
cd ..
cd Servers
npm install
```

Go to the root directory:

```
cd ..
```

Copy the contents of .env.dev to the .env file. Make sure to change the JWT_SECRET variable to your liking. 

```
cp .env.dev .env
```

In `.env` file, change FRONTEND_URL and ALLOWED_ORIGINS:

```
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=["http://localhost:5173", "http://localhost:8082"]
```

Run the PostgreSQL container with the following command:

```
docker run -d --name mypostgres -p 5432:5432 -e POSTGRES_PASSWORD={env variable password} postgres
```

Access the PostgreSQL container and create the verifywise database:

```
docker exec -it mypostgres psql -U postgres
CREATE DATABASE verifywise;
```

Navigate to the Servers directory and start the server in watch mode:

```
cd Servers
npm run watch
```

Navigate to the Clients directory and start the client in development mode:

```
cd Clients
npm run dev
```

**Note:** Make sure to replace {env variable password} with the actual password from your environment variables.

### Installation using Docker (production)

First, ensure you have the following installed:

- npm
- Docker
- Docker Compose

Create a directory in your desired folder:

```
mkdir verifywise
cd verifywise
```

Download the required files using wget: 

```
curl -O https://raw.githubusercontent.com/bluewave-labs/verifywise/develop/install.sh
curl -O https://raw.githubusercontent.com/bluewave-labs/verifywise/develop/.env.prod
```

Make sure to change the JWT_SECRET variable to your liking, and change `localhost` to the IP of the server. An example is shown below:

```
BACKEND_URL=http://64.23.242.4:3000
FRONTEND_URL=http://64.23.242.4:8080 
ALLOWED_ORIGINS=["http://64.23.242.4:5173", "http://64.23.242.4:8080"]
```

Change the permissions of the `install.sh` script to make it executable, and then execute it.

```
chmod +x ./install.sh
./install.sh
```

Now the server is running on the IP and the port you defined in .env.prod file (8080 by default).

If the install.sh script doesn't work for some reason, try the following commands:

```
docker-compose --env-file .env.prod up -d backend
docker ps  # to confirm
docker-compose --env-file .env.prod up -d frontend
docker ps  # to confirm
```

If you want to re-run install.sh for some reason (e.g want to change a configuration in .env.prod file), first stop all Docker containers before starting a new one:

```
docker-compose --env-file .env.prod down
./install.sh
```

### Installing SSL

Here are the steps to enable SSL on your system. 

1. Make sure to point domain to VM IP

2. Install Nginx:

```
sudo apt update
sudo apt install nginx -y
```

3. Create a config file  (`/etc/nginx/sites-available/verifywise`) with the following content. Change the domain name accordingly.

```
server {
    server_name domainname.com;
    
    client_max_body_size 200M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
 }
```

4. Enable the config:

```
sudo ln -s /etc/nginx/sites-available/verifywise /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. Install Certbot for SSL:

```
sudo apt install certbot python3-certbot-nginx -y
```

6. Obtain SSL certificate. Change the domain name accordingly.

```
sudo certbot --nginx -d domainname.com
```

7. Update the `.env.prod` to point to correct domain. Change the domain name accordingly.

```
BACKEND_URL=https://domainname.com/api
FRONTEND_URL=https://domainname.com
ALLOWED_ORIGINS=["https://domainname.com:5173", "https://domainname.com"]
```

8. Restart the application

```
./install.sh
```


## Quick links

- The designs and workflows are [available for everyone](https://www.figma.com/design/o4xu4PeC5bo1Ii4dyom6vQ/VerifyWise?node-id=0-1&t=Ty2Jh4S8QgHGrqon-1). This link includes 2 pages: dashboard designs and the style guide.

- The [VerifyWise presentation](https://pitch.com/v/verifywise-democratizing-ai-governance-zhxvh6), including terminology, why we started this project, technology, and roadmap

## Security

If you find a vulnerability, please report it [here](https://github.com/bluewave-labs/verifywise/security/advisories/new).
