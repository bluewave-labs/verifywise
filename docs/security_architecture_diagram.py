"""
VerifyWise Security Architecture Diagram
Generated using https://github.com/mingrammer/diagrams
"""

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Users
from diagrams.onprem.compute import Server
from diagrams.onprem.database import PostgreSQL
from diagrams.onprem.inmemory import Redis
from diagrams.onprem.network import Nginx
from diagrams.programming.framework import React, FastAPI
from diagrams.programming.language import NodeJS
from diagrams.generic.storage import Storage
from diagrams.generic.compute import Rack
from diagrams.onprem.security import Vault

graph_attr = {
    "fontsize": "24",
    "bgcolor": "white",
    "pad": "0.5",
    "splines": "ortho",
    "nodesep": "0.8",
    "ranksep": "1.0",
}

node_attr = {
    "fontsize": "11",
}

edge_attr = {
    "fontsize": "9",
}

with Diagram(
    "VerifyWise Security Architecture",
    filename="/Users/gorkemcetin/verifywise/docs/verifywise_security_architecture",
    show=False,
    direction="TB",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):

    # External actors
    users = Users("Authenticated\nUsers")
    attackers = Users("Potential\nThreats")

    with Cluster("Perimeter Security"):
        with Cluster("Web Application Firewall"):
            nginx = Nginx("Nginx\n+ HTTPS/TLS 1.3\n+ Rate Limiting")

        with Cluster("Security Headers"):
            helmet = Server("Helmet.js\n- CSP\n- X-Frame-Options\n- HSTS\n- XSS Protection")

    with Cluster("Authentication & Authorization"):
        with Cluster("Identity Management"):
            jwt_auth = Vault("JWT Authentication\n- Access Token (15m)\n- Refresh Token\n- Signature Verification")

        with Cluster("Access Control"):
            rbac = Server("Role-Based Access\n- Admin\n- Reviewer\n- Editor\n- Auditor")

        with Cluster("Session Security"):
            session = Server("Session Management\n- Token Expiration\n- Refresh Rotation\n- Secure Cookies")

    with Cluster("Application Security"):
        with Cluster("Frontend (React SPA)"):
            react = React("React 18\n- XSS Prevention\n- CSRF Tokens\n- Input Sanitization")

        with Cluster("Backend API (Express.js)"):
            express = NodeJS("Express.js\n- Input Validation\n- SQL Injection Prevention\n- Rate Limiting")

        with Cluster("Request Validation"):
            validator = Server("express-validator\n- Schema Validation\n- Type Checking\n- Sanitization")

    with Cluster("Multi-Tenant Isolation"):
        with Cluster("Tenant Security"):
            tenant_middleware = Server("Tenant Middleware\n- Organization Validation\n- Tenant Hash Check\n- Cross-tenant Prevention")

        with Cluster("Schema Isolation"):
            public_schema = Storage("public schema\n(shared metadata)")
            tenant_schema = Storage("tenant_hash schema\n(isolated org data)")

    with Cluster("Data Security"):
        with Cluster("Database Security"):
            postgres = PostgreSQL("PostgreSQL 16\n- Encrypted Connections\n- Parameterized Queries\n- Row-Level Security")

        with Cluster("Encryption at Rest"):
            encryption = Vault("Data Encryption\n- Bcrypt (passwords)\n- AES-256 (API keys)\n- ENCRYPTION_KEY")

        with Cluster("Cache Security"):
            redis = Redis("Redis 7\n- AUTH Required\n- Network Isolation\n- No Persistence")

    with Cluster("API Security"):
        with Cluster("External API Protection"):
            api_keys = Vault("API Key Management\n- Encrypted Storage\n- Key Rotation\n- Scoped Access")

        with Cluster("Rate Limiting"):
            rate_limit = Server("express-rate-limit\n- Per-IP Limits\n- Per-User Limits\n- Burst Protection")

    with Cluster("Audit & Compliance"):
        with Cluster("Audit Trail"):
            audit = Storage("Event Logging\n- User Actions\n- Data Changes\n- Access Logs")

        with Cluster("Change History"):
            history = Storage("Change Tracking\n- Policy Changes\n- Risk Changes\n- Model Changes")

    # Security flow - legitimate users
    users >> Edge(label="HTTPS/TLS", color="green") >> nginx
    nginx >> Edge(label="Security Headers", color="green") >> helmet
    helmet >> Edge(label="Validated Request", color="green") >> react
    react >> Edge(label="API Call + JWT", color="green") >> express

    # Authentication flow
    express >> Edge(label="Verify Token", color="blue") >> jwt_auth
    jwt_auth >> Edge(label="Check Role", color="blue") >> rbac
    rbac >> Edge(label="Session Check", color="blue") >> session

    # Request validation
    express >> Edge(label="Validate Input", color="orange") >> validator

    # Multi-tenant isolation
    express >> Edge(label="Tenant Check", color="purple") >> tenant_middleware
    tenant_middleware >> Edge(label="Route to Schema", color="purple") >> tenant_schema
    tenant_middleware >> Edge(label="Shared Data", color="purple") >> public_schema

    # Data security
    express >> Edge(label="Parameterized SQL", color="darkgreen") >> postgres
    postgres >> Edge(label="Encrypted Fields", color="darkgreen") >> encryption
    express >> Edge(label="Cache (Auth)") >> redis

    # API key management
    express >> Edge(label="Encrypted Keys", color="brown") >> api_keys
    express >> Edge(label="Rate Check", color="red") >> rate_limit

    # Audit
    express >> Edge(label="Log Events", color="gray") >> audit
    postgres >> Edge(label="Track Changes", color="gray") >> history

    # Attack prevention
    attackers >> Edge(label="Blocked", color="red", style="dashed") >> nginx

print("Security diagram generated: /Users/gorkemcetin/verifywise/docs/verifywise_security_architecture.png")
