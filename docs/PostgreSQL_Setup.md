# PostgreSQL Setup Guide

## Infrastructure Status

✅ **PostgreSQL Database** - Port 5432
✅ **pgAdmin Web Interface** - Port 8080
✅ **Redis (Parallel Operation)** - Port 6379
✅ **Redis Commander** - Port 8081

## Database Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: todoapp
- **Username**: todouser
- **Password**: todopass123

## Web Interfaces

### pgAdmin (PostgreSQL Management)
- **URL**: http://localhost:8080
- **Email**: admin@todoapp.com
- **Password**: admin123

### Redis Commander (Redis Management)
- **URL**: http://localhost:8081

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key database variables:
```
DATABASE_URL="postgresql://todouser:todopass123@localhost:5432/todoapp?schema=public"
POSTGRES_DB=todoapp
POSTGRES_USER=todouser
POSTGRES_PASSWORD=todopass123
```

## Docker Commands

```bash
# Start PostgreSQL and pgAdmin
docker-compose up postgres pgadmin -d

# Start all services (including Redis)
docker-compose up -d

# Check service status
docker-compose ps

# Test PostgreSQL connection
docker exec todo-postgres pg_isready -U todouser -d todoapp

# Access PostgreSQL directly
docker exec -it todo-postgres psql -U todouser -d todoapp

# View logs
docker-compose logs postgres
docker-compose logs pgadmin
```

## Next Steps

1. ✅ **Stage 1 Complete**: PostgreSQL infrastructure setup
2. **Stage 2**: Prisma ORM integration and schema design
3. **Stage 3**: Repository layer reconstruction
4. **Stage 4**: Service layer updates
5. **Stage 5**: Data migration tool development
6. **Stage 6**: Test updates
7. **Stage 7**: Deployment and transition

## Extensions Installed

- `uuid-ossp`: UUID generation support
- `pgcrypto`: Cryptographic functions (if needed)

## Health Check

PostgreSQL is configured with health checks and will show "healthy" status when ready to accept connections.