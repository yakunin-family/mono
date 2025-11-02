# Deployment Guide

**Last Updated**: 2025-01-24
**Status**: Current
**Owner**: DevOps / Engineering

## Overview

This document describes deployment options and strategies for the Lexly platform, with focus on Hocuspocus WebSocket server deployment.

## Hosting Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  (TanStack Start app + Tiptap + Y.js provider)              │
└────────────┬─────────────────────────────────┬──────────────┘
             │                                 │
             │ HTTPS (REST)                   │ WSS (WebSocket)
             ▼                                 ▼
┌────────────────────────┐      ┌─────────────────────────────┐
│   Vercel (Frontend)    │      │   Hocuspocus (Collab)       │
│  - TanStack Start app  │      │  - Y.js WebSocket server    │
│  - Static assets       │      │  - JWT auth via hooks       │
│  - API routes          │      │  - EU region (Frankfurt)    │
└───────────┬────────────┘      └──────────────┬──────────────┘
            │                                  │
            │ HTTP API                         │ Persistence
            ▼                                  │
┌────────────────────────┐                    │
│   Convex (Backend)     │◄───────────────────┘
│  - Better Auth         │
│  - Structured data     │
│  - Real-time queries   │
│  - Y.js snapshots      │
└────────────────────────┘
```

## Component Hosting

| Component | Provider | Reason |
|-----------|----------|--------|
| Frontend (TanStack Start) | Vercel | SSR optimized, EU region, edge functions |
| Backend (Convex) | Convex Cloud | Managed serverless, real-time subscriptions |
| Collaboration (Hocuspocus) | Fly.io / Render / VPS | Self-hosted WebSocket server (see options below) |
| Marketing site | Vercel | Static/Astro, global CDN |

## Hocuspocus Deployment Options

Hocuspocus requires a long-running Node.js server. Three strategies compared:

### Option 1: Platform-as-a-Service (Fly.io / Render)

#### Stack
- Fly.io or Render.com
- Docker container with Hocuspocus
- Auto-scaling and load balancing
- Managed TLS certificates
- GitHub Actions CI/CD

#### Cost
€20-30/month (1-2 small instances)

#### Pros
- **Minimal ops burden**: Platform handles scaling, TLS, monitoring
- **Auto-TLS**: Let's Encrypt certificates managed automatically
- **GitHub integration**: Deploy on push to main branch
- **EU region selection**: Frankfurt/Amsterdam data centers available
- **Built-in monitoring**: Logs and metrics dashboards included
- **Easy horizontal scaling**: Add instances via config change

#### Cons
- Higher cost than raw VPS
- Some vendor lock-in (though Docker mitigates)
- Less transparency into underlying infrastructure

#### Best For
Launching quickly with minimal ops burden, team without DevOps expertise

#### Setup Steps

**Fly.io**:
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Create app
cd apps/hocuspocus
fly launch --name lexly-collab --region fra

# Configure environment
fly secrets set JWT_PUBLIC_KEY="..." CONVEX_URL="..."

# Deploy
fly deploy
```

**Render**:
1. Create `render.yaml` in repo root:
```yaml
services:
  - type: web
    name: lexly-collab
    env: docker
    region: frankfurt
    plan: starter
    dockerfilePath: ./apps/hocuspocus/Dockerfile
    envVars:
      - key: JWT_PUBLIC_KEY
        sync: false
      - key: CONVEX_URL
        sync: false
```
2. Connect GitHub repo in Render dashboard
3. Deploy automatically on push

**GitHub Actions** (for both):
```yaml
name: Deploy Hocuspocus
on:
  push:
    branches: [main]
    paths: ['apps/hocuspocus/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master  # or Render CLI
      - run: flyctl deploy --config apps/hocuspocus/fly.toml
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### Option 2: CapRover on Hetzner VPS

#### Stack
- Hetzner Cloud VPS (CX21: 2 vCPU, 4GB RAM)
- CapRover (self-hosted PaaS with web UI)
- Docker Compose orchestration
- Let's Encrypt automatic TLS
- Traefik reverse proxy

#### Cost
€6-8/month (VPS only)

#### Pros
- **Dramatically cheaper**: 75% cost savings vs PaaS
- **Full control**: Own server and data
- **EU location guaranteed**: Hetzner Frankfurt/Falkenstein
- **Web UI for deployments**: Similar UX to Heroku
- **One-click SSL**: Let's Encrypt via CapRover dashboard
- **Multi-service**: Can host other services on same VPS

#### Cons
- **OS maintenance**: Need to apply security patches
- **CapRover learning curve**: New abstraction layer
- **Manual backup setup**: Not automatic like managed services
- **Single point of failure**: No auto-failover (mitigated by Hetzner snapshots)

#### Best For
Cost-conscious deployment with semi-managed experience, side projects

#### Setup Steps

1. **Provision Hetzner VPS**:
```bash
# Via Hetzner Cloud Console or CLI
hcloud server create --name lexly-collab --type cx21 --image ubuntu-22.04 --location fsn1
```

2. **Install CapRover**:
```bash
ssh root@<server-ip>
docker run -p 80:80 -p 443:443 -p 3000:3000 -v /var/run/docker.sock:/var/run/docker.sock -v /captain:/captain caprover/caprover
```

3. **Configure DNS**:
```
A record: collab.lexly.io → <server-ip>
A record: *.collab.lexly.io → <server-ip>  # For CapRover wildcard
```

4. **Connect CapRover**:
```bash
caprover serversetup
# Follow prompts to configure HTTPS
```

5. **Deploy app**:
```bash
cd apps/hocuspocus
caprover deploy
```

6. **Enable HTTPS** in CapRover dashboard (one-click Let's Encrypt)

#### Maintenance
- Run `apt update && apt upgrade` monthly
- Monitor disk space (CapRover logs can fill disk)
- Set up automated Hetzner snapshots (daily backups)

### Option 3: Raw VPS with Docker Compose

#### Stack
- Hetzner/OVH/Linode VPS
- Ubuntu 24.04 LTS
- Docker + Docker Compose
- Nginx reverse proxy
- Certbot for Let's Encrypt
- GitHub Actions for CI/CD

#### Cost
€6-8/month (raw VPS)

#### Pros
- **Maximum transparency**: Know exactly what's running
- **Cheapest option**: No platform markup
- **Full customization**: Configure every aspect
- **Learning opportunity**: Understand infrastructure deeply
- **EU GDPR compliance**: Full control over data location

#### Cons
- **Most hands-on**: Configure Nginx, SSL, networking manually
- **Security is your responsibility**: Firewall, SSH hardening, updates
- **Deployment pipeline requires setup**: Not automatic out-of-box

#### Best For
Learning, teams with DevOps expertise, long-term cost optimization

#### Setup Steps

1. **Provision VPS**:
```bash
# Hetzner, OVH, Linode, or any provider
# Choose: 2 vCPU, 4GB RAM, Ubuntu 24.04, Frankfurt region
```

2. **Secure SSH**:
```bash
ssh root@<server-ip>

# Create non-root user
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Configure SSH key auth
mkdir -p /home/deploy/.ssh
echo "<your-public-key>" >> /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Disable password auth
vi /etc/ssh/sshd_config  # Set PasswordAuthentication no
systemctl restart sshd
```

3. **Install Docker**:
```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

4. **Create docker-compose.yml**:
```yaml
version: '3.8'
services:
  hocuspocus:
    image: ghcr.io/lexly/hocuspocus:latest
    restart: always
    environment:
      - JWT_PUBLIC_KEY=${JWT_PUBLIC_KEY}
      - CONVEX_URL=${CONVEX_URL}
      - PORT=3001
    ports:
      - "3001:3001"
    volumes:
      - ./logs:/app/logs
```

5. **Configure Nginx**:
```nginx
# /etc/nginx/sites-available/collab.lexly.io
upstream hocuspocus {
    server localhost:3001;
}

server {
    listen 80;
    server_name collab.lexly.io;

    location / {
        proxy_pass http://hocuspocus;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeout
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

6. **Enable HTTPS**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d collab.lexly.io
sudo systemctl enable certbot.timer  # Auto-renewal
```

7. **Configure firewall**:
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

8. **GitHub Actions deployment**:
```yaml
name: Deploy to VPS
on:
  push:
    branches: [main]
    paths: ['apps/hocuspocus/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build and push Docker image
        run: |
          docker build -t ghcr.io/lexly/hocuspocus:latest ./apps/hocuspocus
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/lexly/hocuspocus:latest

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/deploy/lexly
            docker-compose pull
            docker-compose up -d
```

## Recommended Strategy

### Phase 1: MVP (Launch)
**Provider**: Fly.io or Render

**Rationale**:
- Focus on product development, not infrastructure
- Hocuspocus is portable (easy to change later)
- Cost is manageable for validation phase (€20-30/mo)
- Fast setup (hours, not days)

### Phase 2: Post-Launch (First 100 users)
**Provider**: Evaluate based on usage

**Decision factors**:
- If costs scale linearly with users → migrate to Hetzner + CapRover (save €200-400/mo at scale)
- If complexity increases (multi-region, custom routing) → stay on managed platform
- If global latency matters → multi-region Fly.io or AWS/GCP

### Phase 3: Growth (1000+ users)
**Provider**: Multi-region deployment

**Architecture**:
- Hocuspocus instances in EU, US, Asia
- Region selection based on lesson metadata
- See "Multi-Region Strategy" below

## Multi-Region Strategy (Future)

For global performance with GDPR compliance:

### Room Pinning Approach

1. **Deploy Hocuspocus** in multiple regions:
   - EU: Frankfurt (Fly.io fra region)
   - US: New York (Fly.io ewr region)
   - Asia: Tokyo (Fly.io nrt region)

2. **Track region preference** in Convex:
```typescript
lessons {
  // ...
  preferred_region: "eu" | "us" | "asia"
}
```

3. **Frontend fetches WebSocket URL**:
```typescript
GET /api/collab/ws-endpoint?lesson=123
Response: { url: "wss://collab-eu.lexly.io" }
```

4. **Backend returns nearest instance**:
```typescript
export const getWsEndpoint = query({
  args: { lessonId: v.id('lessons') },
  handler: async (ctx, { lessonId }) => {
    const lesson = await ctx.db.get(lessonId)
    const region = lesson.preferredRegion || 'eu'  // Default to EU

    const urls = {
      eu: 'wss://collab-eu.lexly.io',
      us: 'wss://collab-us.lexly.io',
      asia: 'wss://collab-asia.lexly.io',
    }

    return { url: urls[region] }
  }
})
```

5. **GDPR compliance**: EU users always connect to EU instance

### Alternative: Edge WebSocket Routing

Use Cloudflare Workers or Vercel Edge to route connections:

**Pros**:
- Automatic geo-location
- Single WebSocket URL

**Cons**:
- WebSocket + edge functions can be tricky
- Less control over routing logic
- Not all edge platforms support WebSocket (Vercel doesn't)

**Recommendation**: Use explicit region selection (room pinning) for reliability

## Backup and Disaster Recovery

### Y.js Document Backups

**Convex automatic backups**:
- Point-in-time recovery built-in
- Restores available for 30 days
- No configuration required

**Manual exports** (redundancy):
```bash
# Export Y.js updates to S3 daily
convex export --table yjs_updates --since 24h | aws s3 cp - s3://lexly-backups/yjs/$(date +%Y%m%d).json
```

**Test restoration** quarterly:
- Restore backup to test environment
- Verify Y.js documents can be reconstructed
- Check data integrity

### Hocuspocus Statelessness

**Key insight**: Hocuspocus is stateless (ephemeral connections only)

**Implications**:
- All document state persisted to Convex
- Server failures = users reconnect + reload from Convex
- No data loss even if server crashes
- Can restart/redeploy without coordination

**Failover strategy**:
- If Hocuspocus instance dies, Fly.io restarts automatically
- Users reconnect within seconds (retry logic in frontend)
- Y.js handles reconnection gracefully (no conflicts)

### Database Backups

**Convex**: Automatic point-in-time recovery (managed)

**If using PostgreSQL for Y.js**:
```bash
# Daily pg_dump to S3
pg_dump -h $DB_HOST -U $DB_USER lexly | gzip | aws s3 cp - s3://lexly-backups/postgres/$(date +%Y%m%d).sql.gz
```

## Monitoring and Observability

### Metrics to Track

**Hocuspocus**:
- Active WebSocket connections
- Messages per second
- Connection duration (p50, p95, p99)
- Authentication failures
- Memory usage

**Convex**:
- Query latency
- Mutation success rate
- Y.js snapshot creation rate
- Storage usage

**Frontend**:
- Time to first sync (TTFS)
- Offline → online reconnection time
- Y.js document size

### Monitoring Stack Options

**Fly.io built-in**: Metrics dashboard, log streaming (free)

**Self-hosted**:
- Prometheus + Grafana for metrics
- Loki for log aggregation
- Netdata for real-time system monitoring

**SaaS**:
- Datadog (expensive but comprehensive)
- Better Stack (logs + uptime monitoring, affordable)
- Sentry for error tracking

---

**Related Documentation**:
- [Technical Architecture](./02-technical-architecture.md) - System design overview
- [Implementation Guide](./05-implementation-guide.md) - Hocuspocus server code
- [Data Models](./03-data-models.md) - Y.js persistence schema
