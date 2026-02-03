"""
VerifyWise Architecture Diagram
Generated using https://github.com/mingrammer/diagrams
"""

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Users, Client
from diagrams.onprem.compute import Server
from diagrams.onprem.database import PostgreSQL
from diagrams.onprem.inmemory import Redis
from diagrams.onprem.queue import RabbitMQ
from diagrams.onprem.network import Nginx
from diagrams.programming.framework import React, FastAPI
from diagrams.programming.language import NodeJS, Python
from diagrams.saas.chat import Slack
from diagrams.generic.storage import Storage
from diagrams.generic.compute import Rack
from diagrams.custom import Custom

# Graph attributes for better layout
graph_attr = {
    "fontsize": "24",
    "bgcolor": "white",
    "pad": "0.5",
    "splines": "ortho",
    "nodesep": "0.8",
    "ranksep": "1.2",
}

node_attr = {
    "fontsize": "12",
}

edge_attr = {
    "fontsize": "10",
}

with Diagram(
    "VerifyWise Architecture",
    filename="/Users/gorkemcetin/verifywise/docs/verifywise_architecture",
    show=False,
    direction="TB",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):

    # External Users
    users = Users("Users")

    with Cluster("Frontend Layer"):
        nginx = Nginx("Nginx\nReverse Proxy")
        with Cluster("React SPA"):
            react_app = React("React 18\n+ Redux Toolkit\n+ React Query")

    with Cluster("Backend Services"):
        with Cluster("Main API Server"):
            express = NodeJS("Express.js API\nPort 3000")

        with Cluster("Background Workers"):
            worker = NodeJS("BullMQ Workers\n- Notifications\n- Automations\n- MLFlow Sync")

    with Cluster("Evaluation Services"):
        with Cluster("EvalServer"):
            fastapi = FastAPI("FastAPI\nPort 8000")
            deepeval = Python("DeepEval\nEngine")

    with Cluster("Data Layer"):
        with Cluster("PostgreSQL (Multi-Tenant)"):
            postgres = PostgreSQL("PostgreSQL 16")
            with Cluster("Tenant Schemas"):
                public_schema = Storage("public\n(shared tables)")
                tenant_schema = Storage("tenant_hash\n(isolated data)")

        redis = Redis("Redis 7\n- Cache\n- Job Queues\n- Pub/Sub")

    with Cluster("External Integrations"):
        with Cluster("LLM Providers"):
            llm = Rack("Anthropic Claude\nOpenAI\nMistral\nGoogle AI")

        with Cluster("Notifications"):
            slack = Slack("Slack")
            email = Server("Email Service\n(Resend/SMTP/\nAzure/AWS SES)")

        mlflow = Server("MLFlow\nModel Registry")

    with Cluster("File Storage"):
        files = Storage("Local Storage\n/uploads")

    # Data Flow
    users >> Edge(label="HTTPS") >> nginx
    nginx >> Edge(label="Static Assets") >> react_app
    react_app >> Edge(label="REST API") >> express

    # Backend connections
    express >> Edge(label="SQL") >> postgres
    express >> Edge(label="Jobs/Cache") >> redis
    express >> Edge(label="Evaluation API") >> fastapi

    # Worker connections
    redis >> Edge(label="Job Queue") >> worker
    worker >> Edge(label="SQL") >> postgres
    worker >> Edge(label="Notify") >> slack
    worker >> Edge(label="Sync") >> mlflow

    # EvalServer connections
    fastapi >> deepeval
    fastapi >> Edge(label="SQL") >> postgres
    fastapi >> Edge(label="Cache") >> redis
    deepeval >> Edge(label="API Calls") >> llm

    # Multi-tenant schema relationship
    postgres >> public_schema
    postgres >> tenant_schema

    # File storage
    express >> Edge(label="Upload/Download") >> files

    # Email notifications
    express >> Edge(label="Send") >> email

print("Diagram generated: /Users/gorkemcetin/verifywise/docs/verifywise_architecture.png")
