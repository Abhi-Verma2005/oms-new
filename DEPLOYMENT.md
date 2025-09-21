ll mysql
 # Complete CI/CD Auto-Deployment Guide

This guide provides step-by-step instructions for setting up automated deployment of your Next.js application to a VM using Docker, Nginx, and GitHub Actions.

## Prerequisites

- A VM (Ubuntu/CentOS/Debian) with SSH access
- GitHub repository with your Next.js app
- Domain name (optional but recommended for SSL)

## Quick Start

### 1. VM Setup

Connect to your VM and run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx (for reverse proxy and SSL)
sudo apt install nginx -y

# Install Node.js (optional, for local builds)



# Create deployment directory
mkdir -p /home/$USER/app
cd /home/$USER/app
```

### 2. Clone Your Repository

```bash
# Replace with YOUR repository URL
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git /home/$USER/app

# Example:
# git clone https://github.com/johndoe/my-nextjs-app.git /home/$USER/app

cd /home/$USER/app

# Set up Git configuration
git config user.name "Deploy Bot"
git config user.email "deploy@yourdomain.com"
```

### 3. Environment Setup

```bash
# Copy environment template
cp env.example .env.production

# Edit with your actual values
nano .env.production
```

Required environment variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: A random secret for NextAuth.js
- `NEXTAUTH_URL`: Your domain URL (e.g., https://yourdomain.com)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: For Google OAuth
- `STRIPE_*`: Your Stripe keys
- `GEMINI_API_KEY`: For AI features
- Email configuration for notifications

### 4. GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and Variables → Actions

Add these secrets:
- `SSH_PRIVATE_KEY`: Your private SSH key for VM access
- `SSH_HOST`: Your VM's IP address
- `SSH_USER`: Your VM username
- `SSH_PORT`: SSH port (usually 22)
- `DATABASE_URL`: Your database connection string
- `NEXTAUTH_SECRET`: Your NextAuth secret
- `NEXTAUTH_URL`: Your production URL
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
- `NEXT_PUBLIC_WEBSOCKET_URL`: Your WebSocket URL
- `GEMINI_API_KEY`: Your Gemini API key
- `EMAIL_SERVER_HOST`: SMTP server host
- `EMAIL_SERVER_PORT`: SMTP server port
- `EMAIL_SERVER_USER`: SMTP username
- `EMAIL_SERVER_PASSWORD`: SMTP password
- `EMAIL_FROM`: From email address

### 5. SSH Key Setup

#### Option A: Generate SSH Key Directly on VM (Recommended)

**On your VM:**

```bash
# Generate SSH key pair directly on VM
ssh-keygen -t rsa -b 4096 -C "deployment@your-domain.com"
# When prompted, save as: deploy_key (or just press Enter for default)
# Leave passphrase empty for automation

# Add the public key to authorized_keys
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys

# Set proper permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Copy the private key content for GitHub Secrets
cat ~/.ssh/id_rsa
```

#### Option B: Generate on Local Machine (Alternative)

**On your local machine:**

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "deployment@your-domain.com"
# When prompted, save as: deploy_key
# Leave passphrase empty for automation

# Copy the public key content
cat deploy_key.pub
```

**On your VM:**

```bash
# Create SSH directory
mkdir -p ~/.ssh

# Add the public key (paste the content from cat deploy_key.pub)
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQ... deployment@your-domain.com" >> ~/.ssh/authorized_keys

# Set proper permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

#### Option C: Use Existing SSH Key

If you already have SSH access to your VM:

```bash
# On your VM, copy your existing public key
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Copy the private key content for GitHub Secrets
cat ~/.ssh/id_rsa
```

### 6. Test Local Deployment

```bash
# Make sure you're in the app directory
cd /home/$USER/app

# Verify docker-compose.yml exists
ls -la docker-compose.yml

# Build and run locally
docker-compose build
docker-compose up -d

# Check if everything works
curl http://localhost:3000/api/hello
```

**If you get "no configuration file provided: not found" error:**
- Make sure you're in the correct directory: `cd /home/$USER/app`
- Verify the file exists: `ls -la docker-compose.yml`
- If the file doesn't exist, you need to clone your repository first (see step 2)

**If you get Prisma schema errors during Docker build:**
- The Dockerfile has been updated to handle Prisma properly
- Make sure you have the latest version: `git pull origin main`
- The build process now installs dependencies without running postinstall scripts first
- Then copies the Prisma schema and runs `prisma generate` separately

### 7. SSL Setup (Optional but Recommended)

```bash
# Run SSL setup script
./scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com
```

### 8. Deploy via GitHub Actions

Push your code to the main branch:

```bash
git add .
git commit -m "Add CI/CD deployment configuration"
git push origin main
```

The GitHub Actions workflow will automatically:
1. Run tests and linting
2. Build the application
3. Deploy to your VM
4. Perform health checks
5. Rollback on failure

## File Structure

```
oms-new/
├── .github/workflows/deploy.yml    # GitHub Actions CI/CD
├── Dockerfile                      # Docker configuration
├── docker-compose.yml              # Multi-container setup
├── nginx/nginx.conf                # Nginx reverse proxy
├── scripts/
│   ├── health-check.sh             # Health monitoring
│   ├── backup.sh                   # Backup management
│   └── setup-ssl.sh                # SSL certificate setup
├── env.example                     # Environment template
└── DEPLOYMENT.md                   # This guide
```

## Monitoring and Maintenance

### Health Checks

The system includes automatic health checks:

```bash
# Manual health check
./scripts/health-check.sh

# View logs
docker-compose logs -f nextjs-app
```

### Backups

```bash
# Create backup
./scripts/backup.sh backup

# List backups
./scripts/backup.sh list

# Restore from backup
./scripts/backup.sh restore /path/to/backup.tar.gz
```

### Logs

```bash
# Application logs
docker-compose logs nextjs-app

# Nginx logs
docker-compose logs nginx

# System logs
journalctl -u nginx
```

## Troubleshooting

### Common Issues

1. **SSH Key Setup Issues**
   - **Error: "No such file or directory" for deploy_key.pub**
     - Generate the key first: `ssh-keygen -t rsa -b 4096 -C "deployment@your-domain.com"`
     - Save as `deploy_key` when prompted
     - Copy the public key content: `cat deploy_key.pub`
     - Manually add to VM: `echo "KEY_CONTENT" >> ~/.ssh/authorized_keys`
   - **Permission denied errors**
     - Check file permissions: `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`
     - Verify SSH service is running: `sudo systemctl status ssh`

2. **Docker build fails**
   - Check Dockerfile syntax
   - Verify all files are present
   - Check for missing dependencies

3. **Port already in use**
   - Stop existing services: `docker-compose down`
   - Check for other services: `sudo netstat -tulpn | grep :3000`

4. **SSL certificate issues**
   - Ensure domain DNS points to your VM
   - Check if port 80 is accessible
   - Verify domain ownership

5. **API routes not working**
   - Check Next.js API route file structure
   - Verify environment variables
   - Check application logs

6. **Database connection issues**
   - Verify DATABASE_URL format
   - Check if database is accessible
   - Ensure Prisma client is generated

### Debugging Commands

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs nextjs-app --tail=100

# Access container shell
docker-compose exec nextjs-app sh

# Check environment variables
docker-compose exec nextjs-app env

# Test database connection
docker-compose exec nextjs-app npx prisma db push
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to git
2. **SSH Keys**: Use dedicated deployment keys with limited permissions
3. **Firewall**: Configure firewall to only allow necessary ports
4. **SSL**: Always use HTTPS in production
5. **Updates**: Keep system and dependencies updated

## Performance Optimization

1. **Docker Images**: Use multi-stage builds to reduce image size
2. **Nginx Caching**: Configure static file caching
3. **Database**: Optimize database queries and indexes
4. **CDN**: Consider using a CDN for static assets

## Scaling

For production scaling:

1. **Load Balancer**: Use multiple app instances behind a load balancer
2. **Database**: Consider managed database services
3. **Monitoring**: Implement comprehensive monitoring (Prometheus, Grafana)
4. **Logging**: Centralized logging with ELK stack

## Support

If you encounter issues:

1. Check the logs first
2. Verify all environment variables
3. Test components individually
4. Check GitHub Actions workflow logs
5. Review this documentation

## Updates

To update the deployment:

1. Make changes to your code
2. Commit and push to main branch
3. GitHub Actions will automatically deploy
4. Monitor the deployment logs
5. Verify the application is working

The system includes automatic rollback if deployment fails.
