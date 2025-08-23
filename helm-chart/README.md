# Calendar Todo Helm Chart

Korean calendar-based todo application Helm Chart for Kubernetes deployment.

## 📋 Prerequisites

- Kubernetes 1.19+
- Helm 3.8.0+
- PostgreSQL 15+ (if using external database)

## 🚀 Installation

### Quick Start

```bash
# Add the Bitnami repository (for PostgreSQL dependency)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install with default values
helm install calendar-todo ./helm-chart

# Install with custom values
helm install calendar-todo ./helm-chart -f values-dev.yaml
```

### Environment-Specific Deployments

#### Development Environment
```bash
helm install calendar-todo-dev ./helm-chart -f values-dev.yaml
```

#### Production Environment
```bash
# Create namespace
kubectl create namespace calendar-todo-prod

# Install with production values
helm install calendar-todo-prod ./helm-chart \
  -f values-prod.yaml \
  -n calendar-todo-prod \
  --set jwt.secret="your-production-jwt-secret-min-32-chars" \
  --set jwt.refreshSecret="your-production-refresh-secret-min-32-chars" \
  --set postgresql.auth.password="your-secure-db-password"
```

## 🔧 Configuration

### Core Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
| `image.registry` | Container image registry | `docker.io` |
| `image.tag` | Container image tag | `latest` |

### Frontend Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `frontend.enabled` | Enable frontend deployment | `true` |
| `frontend.replicaCount` | Frontend replica count | `2` |
| `frontend.image.repository` | Frontend image repository | `calendar-todo/frontend` |
| `frontend.service.port` | Frontend service port | `3000` |
| `frontend.autoscaling.enabled` | Enable HPA for frontend | `false` |

### Backend Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend.enabled` | Enable backend deployment | `true` |
| `backend.replicaCount` | Backend replica count | `2` |
| `backend.image.repository` | Backend image repository | `calendar-todo/backend` |
| `backend.service.port` | Backend service port | `3001` |
| `backend.env.NODE_ENV` | Node environment | `production` |

### Database Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `postgresql.enabled` | Enable bundled PostgreSQL | `true` |
| `postgresql.auth.database` | Database name | `todoapp` |
| `postgresql.auth.username` | Database username | `todouser` |
| `postgresql.auth.password` | Database password | `todopass123` |

### External Database

To use an external PostgreSQL database:

```yaml
postgresql:
  enabled: false

externalDatabase:
  host: "your-postgres-host"
  port: 5432
  username: "todouser"
  password: "your-password"
  database: "todoapp"
```

### JWT Configuration

```yaml
jwt:
  secret: "your-super-secret-jwt-key-min-32-chars"
  refreshSecret: "your-super-secret-refresh-key-min-32-chars"
  
  # Or use existing secret
  existingSecret: "jwt-secret"
  secretKey: "jwt-secret"
  refreshSecretKey: "jwt-refresh-secret"
```

### Ingress Configuration

```yaml
ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: calendar-todo.example.com
      paths:
        - path: /
          pathType: Prefix
          backend: frontend
        - path: /api
          pathType: Prefix
          backend: backend
  tls:
    - secretName: calendar-todo-tls
      hosts:
        - calendar-todo.example.com
```

## 🛠 Building Docker Images

### Build Backend Image
```bash
cd apps/backend
docker build -t calendar-todo/backend:latest -f Dockerfile ../../
```

### Build Frontend Image
```bash
cd apps/frontend
docker build -t calendar-todo/frontend:latest -f Dockerfile ../../
```

### Build and Push Images
```bash
# Build images
docker build -t your-registry/calendar-todo-backend:v1.0.0 -f apps/backend/Dockerfile .
docker build -t your-registry/calendar-todo-frontend:v1.0.0 -f apps/frontend/Dockerfile .

# Push images
docker push your-registry/calendar-todo-backend:v1.0.0
docker push your-registry/calendar-todo-frontend:v1.0.0

# Deploy with custom images
helm install calendar-todo ./helm-chart \
  --set image.registry=your-registry \
  --set backend.image.repository=calendar-todo-backend \
  --set frontend.image.repository=calendar-todo-frontend \
  --set image.tag=v1.0.0
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoints

- **Backend**: `GET /health`
- **Database**: `GET /health/database`
- **Frontend**: `GET /` (root path)

### Monitoring Setup

Enable monitoring with Prometheus:

```yaml
monitoring:
  enabled: true
  serviceMonitor:
    enabled: true
    namespace: "monitoring"
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database pod status
   kubectl get pods -l app.kubernetes.io/name=postgresql
   
   # Check database logs
   kubectl logs -l app.kubernetes.io/name=postgresql
   
   # Test database connection
   kubectl exec -it deployment/calendar-todo-backend -- sh
   pg_isready -h calendar-todo-postgresql -p 5432
   ```

2. **Migration Job Failures**
   ```bash
   # Check migration job logs
   kubectl logs job/calendar-todo-db-migration
   
   # Manually run migration
   kubectl exec -it deployment/calendar-todo-backend -- pnpm prisma db push
   ```

3. **Image Pull Issues**
   ```bash
   # Check image pull secrets
   kubectl get secrets
   
   # Describe pod for detailed error
   kubectl describe pod <pod-name>
   ```

### Debug Commands

```bash
# Check all resources
kubectl get all -l app.kubernetes.io/instance=calendar-todo

# Check pod logs
kubectl logs -l app.kubernetes.io/name=calendar-todo-backend
kubectl logs -l app.kubernetes.io/name=calendar-todo-frontend

# Port forward for local testing
kubectl port-forward svc/calendar-todo-frontend 3000:3000
kubectl port-forward svc/calendar-todo-backend 3001:3001

# Check configuration
kubectl get configmap calendar-todo-backend -o yaml
kubectl get secret calendar-todo-jwt -o yaml
```

## 🗑 Uninstallation

```bash
# Uninstall release
helm uninstall calendar-todo

# Clean up persistent volumes (optional)
kubectl delete pvc -l app.kubernetes.io/instance=calendar-todo
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [PostgreSQL Bitnami Chart](https://github.com/bitnami/charts/tree/main/bitnami/postgresql)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

## 🤝 Contributing

1. Make changes to the chart
2. Increment version in `Chart.yaml`
3. Test with `helm lint ./helm-chart`
4. Create pull request

## 📝 License

This project is licensed under the MIT License.