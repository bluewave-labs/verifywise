"""
VerifyWise Deployment Architecture Diagram (Simple)
Generated using https://github.com/mingrammer/diagrams
"""

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Users
from diagrams.onprem.database import PostgreSQL
from diagrams.onprem.inmemory import Redis
from diagrams.onprem.container import Docker
from diagrams.programming.framework import React, FastAPI
from diagrams.programming.language import NodeJS, Python

graph_attr = {
    "fontsize": "20",
    "bgcolor": "white",
    "pad": "0.5",
    "splines": "ortho",
    "nodesep": "0.8",
    "ranksep": "1.0",
}

with Diagram(
    "VerifyWise Deployment Architecture",
    filename="/Users/gorkemcetin/verifywise/docs/verifywise_deployment_simple",
    show=False,
    direction="LR",
    graph_attr=graph_attr,
):

    users = Users("Users")

    with Cluster("Docker Compose Environment"):

        with Cluster("Frontend"):
            frontend = React("React + Vite\n(Port 80)")

        with Cluster("Backend Services"):
            backend = NodeJS("Express API\n(Port 3000)")
            eval_server = Python("FastAPI\nEval Server\n(Port 8000)")

        with Cluster("Data Layer"):
            postgres = PostgreSQL("PostgreSQL 16.8\n(Port 5432)")
            redis = Redis("Redis 7\n(Port 6379)")

    # Connections
    users >> frontend
    frontend >> backend
    frontend >> eval_server
    backend >> postgres
    backend >> redis
    eval_server >> postgres
