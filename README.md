<p align="center">
<img width="266" alt="VerifyWise Logo" src="https://github.com/user-attachments/assets/0bfc50fb-71cc-47e4-97bd-37faa14700fe">
</p>

<h3 align="center">Democratizing AI Governance</a></h3>

[VerifyWise](https://verifywise.ai) is an open-source AI governance platform designed to help businesses use the power of AI safely and responsibly. Our platform ensures compliance and robust AI management without compromising on security.

We are democratizing AI best practices with an open-source solution that can be hosted on-premises, giving you complete control over your AI governance.

<img width="1433" alt="VerifyWise" src="https://github.com/user-attachments/assets/268a2c44-01de-4f7b-8e10-1dd4f76e86a8">

## Developer Setup

The VerifyWise application has two components: a frontend in Reactjs and backend in Nodejs. At present, you can use Docker (recommended) or `npm` to run VerifyWise. 

A PostGreSQL database is required.

To run a development instance of VerifyWise via `npm`, follow these steps:

1. Crate "verifywise" database in your local PostgreSQL server.
2. Fork and clone the repository. Go to the Clients directory.
3. Run `npm i; npm run dev`
4. Go to ../Servers directory.
5. Run `npm i; npm run watch`
6. Now the application is up and running on `https://localhost:5173` 

Currently the application is in rapid development, so check back here often.

## Quick links

- This application is currently in the development stage. The designs and workflows are [available for everyone](https://www.figma.com/design/o4xu4PeC5bo1Ii4dyom6vQ/VerifyWise?node-id=0-1&t=Ty2Jh4S8QgHGrqon-1). This link includes 2 pages: dashboard designs and the style guide.
- The [VerifyWise presentation](https://pitch.com/v/verifywise-democratizing-ai-governance-zhxvh6), including terminology, why we started this project, technology, and roadmap

## Who is it for?

The platform makes AI governance easier for organizations. It helps them manage risks, ensure they follow rules, and promote responsible AI practices throughout their operations.

VerifyWise is designed for:

- **Businesses**: From those considering AI adoption to organizations developing proprietary AI at scale.
- **Compliance officers**: Professionals ensuring compliance to EU AI Act regulations and internal policies.
- **Risk management teams**: Groups tasked with identifying and mitigating AI-related risks.
- **Legal and privacy teams**: Professionals addressing the legal and ethical implications of AI use.
- **AI developers**: Teams working on AI projects who need to ensure compliance and responsible development.

## Why now? 

- **There is an urgent need for regulatory compliance:** Regulations set clear rules for AI applications and create a need for organizations to comply with legal requirements.
- **Complexity of compliance:** Companies will need governance tools that can help them manage a changing regulatory landscape. 
- **Growing concerns for Ethical AI:** There’s a strong push from governments, businesses, and consumers for more ethical and transparent AI systems.
- **Good timing with global AI expansion:** Starting an open source AI governance app now aligns with the AI adoption trend across industries (healthcare, finance etc), leading the need for a quickly deployable governance solution.

## Features

![VerifyWise platform](https://github.com/user-attachments/assets/2d05cd1f-f67b-45d2-aca4-1fdcde287a44)

- Option to host the application on-premises or in a private cloud
- Open source with a permissive license (AGPLv3)
- End-to-end encryption for data in transit and at rest to ensure data security
- Faster audits using AI-generated answers for compliance and assessment questions.
- Full access to the source code for transparency, security audits, and customization
- Docker deployment (deployable on render.com and similar platforms)
- User registration, authentication and role-based access control (RBAC) support.
- Key metrics, visualizations, and real-time reporting capabilities.
- Major features:
  - Multiple projects *(complete)*
  - Compliance tracker *(complete)*
  - Assessment tracker *(complete)*
  - Vendors *(complete)*
  - Risks *(complete)*
  - Evidence center *(complete)*
  - Reports *(in progress)* 
  - AI Trust Center *(in progress)*
 
## Security

If you find a vulnerability, please report it [here](https://github.com/bluewave-labs/verifywise/security/advisories/new).


