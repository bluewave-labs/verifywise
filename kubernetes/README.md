# VerifyWise Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the VerifyWise application using Kustomize.

## Architecture

The application consists of the following components:
- **Backend API** (Node.js) - Main application server on port 3000
- **Worker** - Background job processor
- **Frontend** (React) - Web interface on port 80
- **PostgreSQL** - Database on port 5432
- **Redis** - Cache and queue on port 6379
- **Bias & Fairness Backend** (Python) - ML service on port 8000

## Prerequisites

- Kubernetes cluster (Minikube for local, or cloud provider for production)
- kubectl CLI tool
- Kustomize (built into kubectl v1.14+)
- Docker images available at `ghcr.io/bluewave-labs/verifywise-*`

### For Local Development
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) installed
- Minimum 4GB RAM allocated to Minikube

## Directory Structure

```
kubernetes/
      base/                    # Base configurations
          deployment.yaml      # Main deployment with all containers
          service.yaml         # Service definition
          configmap.yaml       # Base ConfigMap
          postgres-pvc.yaml    # PostgreSQL persistent volume
          kustomization.yaml   # Base kustomization
      dev/                     # Development overlay
          ingress.yaml         # Ingress rules
          configmap.yaml       # Dev-specific config
          secrets.env          # Environment secrets
          kustomization.yaml   # Dev kustomization
```

## Configuration

### Step 1: Configure Secrets

Create or update `dev/secrets.env` with your actual values:

```bash
DB_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-key
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
OPENAI_API_KEY=your-openai-api-key
```

### Step 2: Update ConfigMap (Optional)

Edit `dev/configmap.yaml` to customize environment variables:
- `BACKEND_URL`: Backend API URL
- `FRONTEND_URL`: Frontend URL
- `DB_NAME`, `DB_USER`: Database credentials
- `MOCK_DATA_ON`: Set to "true" for demo data

## Deployment Options

### Option 1: Local Development with Minikube

This option uses Minikube's service command to expose the application locally without requiring Ingress setup.

#### 1. Start Minikube

```bash
minikube start --memory=4096 --cpus=2
```

#### 2. Deploy the Application

```bash
# From the kubernetes directory
kubectl apply -k dev/
```

#### 3. Wait for Pods to be Ready

```bash
kubectl get pods -w
```

Wait until all containers in the `verifywise` pod show `Running` status.

#### 4. Access the Application

Use Minikube's service command to expose and access the application:

```bash
minikube service verifywise-svc
```

This will:
- Tunnel to the service
- Automatically open your browser to the application
- Display the URL (typically `http://127.0.0.1:<random-port>`)

**Alternative**: Get the URL without opening browser:

```bash
minikube service verifywise-svc --url
```

#### 5. Access Different Services

The main service exposes port 80 for the frontend. To access the API directly:

```bash
# Port forward to backend
kubectl port-forward svc/verifywise-svc 3000:3000
# Access at http://localhost:3000
```

#### 6. View Logs

```bash
# View all containers
kubectl logs -l app=verifywise --all-containers=true

# View specific container
kubectl logs -l app=verifywise -c verifywise-backend
kubectl logs -l app=verifywise -c verifywise-frontend
kubectl logs -l app=verifywise -c verifywise-postgres-temp
```

#### 7. Stop and Cleanup

```bash
kubectl delete -k dev/
minikube stop
# Optional: delete cluster
minikube delete
```

### Option 2: Production with Ingress

This option uses Kubernetes Ingress for production deployments with proper domain routing and SSL termination.

#### 1. Prerequisites

Ensure you have an Ingress Controller installed. For cloud providers:
- **GKE**: Use GCE Ingress Controller (default)
- **EKS**: Install AWS ALB Ingress Controller
- **AKS**: Install nginx-ingress or Application Gateway
- **Minikube** (testing): Enable ingress addon

For Minikube testing:
```bash
minikube addons enable ingress
```

#### 2. Configure Domain

The default configuration uses `verifywise.local` as the hostname. Update `dev/ingress.yaml` for your domain:

```yaml
spec:
  rules:
    - host: verifywise.yourdomain.com  # Change this
```

#### 3. Update ConfigMap URLs

Update `dev/configmap.yaml` with your production domain:

```yaml
data:
  BACKEND_URL: "https://verifywise.yourdomain.com/api"
  FRONTEND_URL: "https://verifywise.yourdomain.com"
  HOST: "verifywise.yourdomain.com"
```

#### 4. Deploy the Application

```bash
kubectl apply -k dev/
```

#### 5. Configure DNS

Point your domain to the Ingress IP address:

```bash
# Get Ingress IP
kubectl get ingress verifywise-config-rule

# Example output:
# NAME                      CLASS    HOSTS              ADDRESS          PORTS
# verifywise-config-rule    <none>   verifywise.local   192.168.49.2    80
```

For production: Create an A record pointing to the ADDRESS
For local testing with Minikube: Add to `/etc/hosts`:

```bash
# Get Minikube IP
minikube ip

# Add to /etc/hosts
echo "$(minikube ip) verifywise.local" | sudo tee -a /etc/hosts
```

#### 6. Access the Application

Visit your configured domain:
- Frontend: `http://verifywise.local` or `https://verifywise.yourdomain.com`
- API: `http://verifywise.local/api` or `https://verifywise.yourdomain.com/api`

#### 7. Enable HTTPS (Production)

Uncomment the SSL annotations in `dev/ingress.yaml`:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"  # If using cert-manager
```

Add TLS configuration:

```yaml
spec:
  tls:
    - hosts:
        - verifywise.yourdomain.com
      secretName: verifywise-tls
  rules:
    - host: verifywise.yourdomain.com
```

Install [cert-manager](https://cert-manager.io/) for automatic SSL certificate management.

#### 8. Monitor the Deployment

```bash
# Check all resources
kubectl get all -l app=verifywise

# Check Ingress status
kubectl describe ingress verifywise-config-rule

# View logs
kubectl logs -l app=verifywise --all-containers=true -f
```

## Resource Management

The deployment includes resource limits in `dev/set-resources.yaml`. Adjust based on your needs:

```bash
kubectl edit -k dev/
```

## Database Persistence

PostgreSQL data is stored in a persistent volume defined in `base/postgres-pvc.yaml`. In production, ensure:
- Adequate storage allocation
- Backup strategy in place
- Consider using managed database services for production

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods
kubectl describe pod <pod-name>

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

### Image Pull Errors

Ensure the GitHub Container Registry images are accessible:

```bash
# Images should be public or authenticated
kubectl get pods -o jsonpath='{.items[*].spec.containers[*].image}' | tr ' ' '\n'
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
kubectl logs -l app=verifywise -c verifywise-postgres-temp

# Verify database is ready
kubectl exec -it <pod-name> -c verifywise-backend -- nc -zv localhost 5432
```

### Service Not Accessible (Minikube)

```bash
# Check service
kubectl get svc verifywise-svc

# Try direct port-forward
kubectl port-forward svc/verifywise-svc 8080:80

# Check Minikube service list
minikube service list
```

### Ingress Not Working

```bash
# Check Ingress controller is running
kubectl get pods -n ingress-nginx

# Verify Ingress resource
kubectl describe ingress verifywise-config-rule

# Check Ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

## Updating the Application

```bash
# Update deployment with new image versions
kubectl rollout restart deployment/verifywise

# Check rollout status
kubectl rollout status deployment/verifywise

# Rollback if needed
kubectl rollout undo deployment/verifywise
```

## Scaling

```bash
# Scale replicas (note: StatefulSet might be needed for multi-replica with shared DB)
kubectl scale deployment verifywise --replicas=3

# Current setup uses single pod with sidecar containers
# For true horizontal scaling, separate the services
```

## Development Workflow

1. Make changes to manifests
2. Apply updates: `kubectl apply -k dev/`
3. Watch rollout: `kubectl rollout status deployment/verifywise`
4. Test changes
5. Check logs: `kubectl logs -l app=verifywise -c <container-name> -f`

## Production Checklist

- [ ] Update `secrets.env` with production credentials from `.env.prod`
- [ ] Configure production domain in Ingress
- [ ] Set up SSL/TLS certificates
- [ ] Configure resource limits appropriately
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for PostgreSQL
- [ ] Review security settings (RBAC, Network Policies)
- [ ] Set up horizontal pod autoscaling if needed
- [ ] Configure proper health checks
- [ ] Set `MOCK_DATA_ON=false` in production

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Ingress NGINX Documentation](https://kubernetes.github.io/ingress-nginx/)
