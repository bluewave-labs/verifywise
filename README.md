[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bluewave-labs/verifywise)
![](https://img.shields.io/github/license/bluewave-labs/checkmate)
![](https://img.shields.io/github/repo-size/bluewave-labs/checkmate)
![](https://img.shields.io/github/commit-activity/m/bluewave-labs/checkmate)
![](https://img.shields.io/github/last-commit/bluewave-labs/checkmate)
![](https://img.shields.io/github/languages/top/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues-pr/bluewave-labs/checkmate)

<img src="https://github.com/user-attachments/assets/27640e05-0180-4b3d-ad80-3914d00d0eb2">


[VerifyWise](https://verifywise.ai) is an open-source AI governance platform designed to help businesses harness the power of AI safely and responsibly. Our platform ensures compliance and robust AI management without compromising on security.

We are democratizing AI best practices with an open-source solution that can be hosted on-premises, giving you complete control over your AI governance. 

Please [get in touch](https://tidycal.com/verifywise/info-session) with us to see the latest demo, or [join the waitlist](https://airtable.com/appdK4RIXT5xKd2Zh/pagamLEwP1yvJgP0C/form) to be notified when the release announcement is made.

<img width="1433" alt="VerifyWise" src="https://github.com/user-attachments/assets/268a2c44-01de-4f7b-8e10-1dd4f76e86a8">

## Who is it for?

The platform simplifies AI governance for organizations, helping them manage risks, ensure regulatory compliance, and promote responsible AI practices throughout their operations.

VerifyWise is designed for:

- **Businesses**: From those considering AI adoption to organizations developing proprietary AI at scale.
- **Compliance officers**: Professionals ensuring adherence to EU AI Act regulations and internal policies.
- **Risk management teams**: Groups tasked with identifying and mitigating AI-related risks.
- **Legal and privacy teams**: Professionals addressing the legal and ethical implications of AI use.
- **AI developers**: Teams working on AI projects who need to ensure compliance and responsible development.

## Why now? 

- **Urgent Need for Regulatory Compliance:** Regulations establish clear rules for AI applications, creating a need for organizations to comply with legal requirements.
- **Complexity of Compliance:** Companies will require governance tools to help them navigate a changing regulatory landscape. 
- **Growing Concerns for Ethical AI:** There is a strong push from governments, businesses, and consumers for more ethical and transparent AI systems.
- **Good Timing with Global AI Expansion:** Launching an open-source AI governance application now aligns with the AI adoption trend across industries (e.g., healthcare, finance), addressing the need for a rapidly deployable governance solution.

## Features

![VerifyWise platform](https://github.com/user-attachments/assets/2d05cd1f-f67b-45d2-aca4-1fdcde287a44)

- Option to host the application on-premises or in a private cloud
- Open source with a permissive license (AGPLv3)
- End-to-end encryption for data in transit and at rest to ensure data security
- Faster audits using AI-generated answers for compliance and assessment questions.
- Full access to the source code for transparency, security audits, and customization
- Docker deployment (deployable on render.com and similar platforms)
- User registration, authentication, and role-based access control (RBAC) support.
- Key metrics, visualizations, and real-time reporting capabilities.
- Major features:
  - Multiple projects *(complete)*
  - Compliance tracker and assessment tracker for EU AI Act *(complete)*
  - ISO 42001 support *(in progress)*
  - Vendors *(complete)*
  - Risks *(complete)*
  - Evidence center *(complete)*
  - Reports *(in progress)* 
  - AI Trust Center *(planning)*

## Developer setup

The VerifyWise application has two components: a frontend built with React.js and a backend built with Node.js. At present, you can use Docker (recommended) or `npm` to run VerifyWise. 

A PostgreSQL database is required.

To run a development instance of VerifyWise via `npm`, follow these steps:

1. Create the "verifywise" database in your local PostgreSQL server.
2. Fork and clone the repository. Navigate to the `Clients` directory.
3. Run `npm i; npm run dev`
4. Navigate to the `../Servers` directory.
5. Copy the `.env.dev` [file](https://github.com/bluewave-labs/verifywise/blob/develop/.env.dev) to this directory, name it `.env`, and modify its contents to match your environment.
6. Run `npm i; npm run watch`
7. The application will now be up and running at `http://localhost:5173`. 

Currently the application is in rapid development, so check back here often.

## Quick links

- This application is currently in the development stage. The designs and workflows are [available for everyone](https://www.figma.com/design/o4xu4PeC5bo1Ii4dyom6vQ/VerifyWise?node-id=0-1&t=Ty2Jh4S8QgHGrqon-1). This link includes 2 pages: dashboard designs and the style guide.

- The [VerifyWise presentation](https://pitch.com/v/verifywise-democratizing-ai-governance-zhxvh6), including terminology, why we started this project, technology, and roadmap

## Security

If you find a vulnerability, please report it [here](https://github.com/bluewave-labs/verifywise/security/advisories/new).


