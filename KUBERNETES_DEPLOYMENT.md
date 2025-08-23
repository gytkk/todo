# Kubernetes 배포 가이드

이 가이드는 Calendar Todo 애플리케이션을 Kubernetes 클러스터에 Helm Chart를 사용하여 배포하는 방법을 설명합니다.

## 📋 사전 요구사항

### 필수 구성 요소
- Kubernetes 클러스터 (v1.19+)
- Helm (v3.8.0+)
- Docker (이미지 빌드용)
- kubectl (Kubernetes CLI)

### 클러스터 환경 확인
```bash
# Kubernetes 버전 확인
kubectl version --short

# Helm 버전 확인
helm version

# 클러스터 노드 상태 확인
kubectl get nodes
```

## 🏗 이미지 빌드 및 배포

### 1. Docker 이미지 빌드

#### Backend 이미지 빌드
```bash
# 프로젝트 루트에서 실행
docker build -t calendar-todo/backend:latest -f apps/backend/Dockerfile .
```

#### Frontend 이미지 빌드
```bash
# 프로젝트 루트에서 실행
docker build -t calendar-todo/frontend:latest -f apps/frontend/Dockerfile .
```

#### 이미지 레지스트리에 푸시 (선택사항)
```bash
# Docker Hub 또는 다른 레지스트리에 푸시
docker tag calendar-todo/backend:latest your-registry/calendar-todo-backend:v1.0.0
docker tag calendar-todo/frontend:latest your-registry/calendar-todo-frontend:v1.0.0

docker push your-registry/calendar-todo-backend:v1.0.0
docker push your-registry/calendar-todo-frontend:v1.0.0
```

### 2. Helm 의존성 설치

```bash
# PostgreSQL dependency 추가
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

## 🚀 환경별 배포

### 개발 환경 배포

```bash
# 개발 환경용 네임스페이스 생성
kubectl create namespace calendar-todo-dev

# 개발 환경 배포
helm install calendar-todo-dev ./helm-chart \
  -f helm-chart/values-dev.yaml \
  -n calendar-todo-dev
```

### 프로덕션 환경 배포

```bash
# 프로덕션 환경용 네임스페이스 생성
kubectl create namespace calendar-todo-prod

# 시크릿 생성 (프로덕션용)
kubectl create secret generic calendar-todo-jwt-secret \
  --from-literal=jwt-secret="your-super-secure-jwt-secret-min-32-chars-production" \
  --from-literal=jwt-refresh-secret="your-super-secure-refresh-secret-min-32-chars-production" \
  -n calendar-todo-prod

# PostgreSQL 시크릿 생성 (외부 DB 사용시)
kubectl create secret generic calendar-todo-db-secret \
  --from-literal=postgres-password="your-secure-database-password" \
  -n calendar-todo-prod

# 프로덕션 환경 배포
helm install calendar-todo-prod ./helm-chart \
  -f helm-chart/values-prod.yaml \
  -n calendar-todo-prod \
  --set image.registry=your-registry \
  --set backend.image.repository=calendar-todo-backend \
  --set frontend.image.repository=calendar-todo-frontend \
  --set image.tag=v1.0.0
```

## 🔧 배포 후 설정

### 1. Ingress 설정

#### NGINX Ingress Controller 설치 (필요한 경우)
```bash
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace
```

#### 도메인 설정
개발 환경에서는 `/etc/hosts` 파일에 다음을 추가:
```
<CLUSTER-IP> calendar-todo-dev.local
```

### 2. 인증서 설정 (프로덕션)

#### cert-manager 설치
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

#### Let's Encrypt Issuer 생성
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

## 📊 모니터링 설정

### 1. Prometheus 및 Grafana 설치

```bash
# Prometheus Operator 설치
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --set grafana.adminPassword=admin
```

### 2. 애플리케이션 모니터링 활성화

```bash
# 모니터링이 활성화된 상태로 업그레이드
helm upgrade calendar-todo-prod ./helm-chart \
  -f helm-chart/values-prod.yaml \
  -n calendar-todo-prod \
  --set monitoring.enabled=true \
  --set monitoring.serviceMonitor.enabled=true
```

## 🔍 상태 확인 및 디버깅

### 기본 상태 확인
```bash
# 모든 리소스 상태 확인
kubectl get all -n calendar-todo-prod

# Pod 상태 상세 확인
kubectl describe pods -n calendar-todo-prod

# 로그 확인
kubectl logs -l app.kubernetes.io/name=calendar-todo-backend -n calendar-todo-prod
kubectl logs -l app.kubernetes.io/name=calendar-todo-frontend -n calendar-todo-prod
```

### 데이터베이스 연결 테스트
```bash
# Backend pod에서 데이터베이스 연결 테스트
kubectl exec -it deployment/calendar-todo-prod-backend -n calendar-todo-prod -- \
  pg_isready -h calendar-todo-prod-postgresql -p 5432
```

### 포트 포워딩을 통한 로컬 테스트
```bash
# Frontend 접속 테스트
kubectl port-forward svc/calendar-todo-prod-frontend 3000:3000 -n calendar-todo-prod

# Backend 접속 테스트
kubectl port-forward svc/calendar-todo-prod-backend 3001:3001 -n calendar-todo-prod
```

## 🔄 업데이트 및 롤백

### 애플리케이션 업데이트
```bash
# 새 이미지로 업데이트
helm upgrade calendar-todo-prod ./helm-chart \
  -f helm-chart/values-prod.yaml \
  -n calendar-todo-prod \
  --set image.tag=v1.1.0
```

### 롤백
```bash
# 릴리즈 히스토리 확인
helm history calendar-todo-prod -n calendar-todo-prod

# 이전 버전으로 롤백
helm rollback calendar-todo-prod 1 -n calendar-todo-prod
```

## 🛡 보안 설정

### 1. Network Policies (선택사항)
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: calendar-todo-network-policy
  namespace: calendar-todo-prod
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/instance: calendar-todo-prod
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
  egress:
  - to: []
```

### 2. Pod Security Standards
```bash
# 네임스페이스에 보안 라벨 추가
kubectl label namespace calendar-todo-prod pod-security.kubernetes.io/enforce=restricted
kubectl label namespace calendar-todo-prod pod-security.kubernetes.io/audit=restricted
kubectl label namespace calendar-todo-prod pod-security.kubernetes.io/warn=restricted
```

## 📈 확장성 설정

### Horizontal Pod Autoscaling (HPA)
HPA는 values-prod.yaml에서 기본적으로 활성화되어 있습니다:

```yaml
backend:
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 15
    targetCPUUtilizationPercentage: 70

frontend:
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
```

### Vertical Pod Autoscaling (VPA) (선택사항)
```bash
# VPA 설치
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler
./hack/vpa-install.sh
```

## 🗑 정리

### 애플리케이션 제거
```bash
# Helm 릴리즈 제거
helm uninstall calendar-todo-prod -n calendar-todo-prod

# PVC 제거 (데이터 삭제됨 주의!)
kubectl delete pvc -l app.kubernetes.io/instance=calendar-todo-prod -n calendar-todo-prod

# 네임스페이스 제거
kubectl delete namespace calendar-todo-prod
```

## 🆘 문제 해결

### 일반적인 문제들

1. **이미지 Pull 실패**
   - 이미지 태그 및 레지스트리 URL 확인
   - imagePullSecrets 설정 확인

2. **데이터베이스 연결 실패**
   - DATABASE_URL 환경변수 확인
   - PostgreSQL 서비스 상태 확인
   - 네트워크 정책 확인

3. **마이그레이션 Job 실패**
   - Job 로그 확인: `kubectl logs job/calendar-todo-db-migration`
   - 데이터베이스 권한 확인

4. **Ingress 설정 문제**
   - Ingress Controller 설치 상태 확인
   - DNS 설정 확인
   - 인증서 상태 확인

### 지원 리소스
- [Kubernetes 공식 문서](https://kubernetes.io/ko/docs/)
- [Helm 공식 문서](https://helm.sh/ko/docs/)
- [프로젝트 이슈 트래커](https://github.com/your-username/calendar-todo/issues)