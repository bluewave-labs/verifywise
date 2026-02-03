"""
VerifyWise Deployment Architecture Diagram (Simplified)
Generated using https://github.com/mingrammer/diagrams
"""

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Users
from diagrams.onprem.database import PostgreSQL
from diagrams.onprem.inmemory import Redis
from diagrams.onprem.network import Nginx
from diagrams.onprem.container import Docker
from diagrams.programming.framework import FastAPI
from diagrams.programming.language import NodeJS
from diagrams.generic.storage import Storage

graph_attr = {
    "fontsize": "24",
    "bgcolor": "white",
    "pad": "0.5",
    "splines": "spline",
    "nodesep": "1.0",
    "ranksep": "1.2",
}

node_attr = {
    "fontsize": "12",
}

edge_attr = {
    "fontsize": "10",
}

with Diagram(
    "VerifyWise Deployment Architecture",
    filename="/Users/gorkemcetin/verifywise/docs/verifywise_deployment_architecture",
    show=False,
    direction="TB",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):

    users = Users("Users")

    with Cluster("Docker Compose Stack"):

        with Cluster("Web Tier"):
            nginx = Nginx("Frontend\nNginx :80")

        with Cluster("Application Tier"):
            backend = NodeJS("Backend API\nNode.js :3000")
            worker = NodeJS("Worker\nBullMQ Jobs")
            evalserver = FastAPI("EvalServer\nFastAPI :8000")

        with Cluster("Data Tier"):
            postgres = PostgreSQL("PostgreSQL\n:5432")
            redis = Redis("Redis\n:6379")

    with Cluster("Storage"):
        volumes = Storage("Volumes\n- pgdata\n- uploads\n- logs")

    # User flow
    users >> Edge(label="HTTPS") >> nginx
    nginx >> Edge(label="/api/*") >> backend

    # Backend connections
    backend >> Edge(color="purple") >> postgres
    backend >> Edge(color="orange") >> redis
    backend >> Edge(label="HTTP") >> evalserver

    # Worker connections
    redis >> Edge(label="Jobs", color="orange") >> worker
    worker >> Edge(color="purple") >> postgres

    # EvalServer connections
    evalserver >> Edge(color="purple") >> postgres
    evalserver >> Edge(color="orange") >> redis

    # Storage
    postgres >> Edge(style="dashed") >> volumes

print("Deployment diagram generated: /Users/gorkemcetin/verifywise/docs/verifywise_deployment_architecture.png")
