#!/bin/bash

# Backup script for the Next.js application
# This script creates backups of the application code and database

set -e

# Configuration
BACKUP_DIR="/home/$USER/backups"
APP_DIR="/home/$USER/app"
DATE=$(date +%Y%m%d_%H%M%S)
MAX_BACKUPS=5

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to create backup
create_backup() {
    log "📦 Creating backup..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Create application backup
    local app_backup="$BACKUP_DIR/app_$DATE.tar.gz"
    log "📁 Backing up application code..."
    tar -czf "$app_backup" -C "$(dirname "$APP_DIR")" "$(basename "$APP_DIR")" \
        --exclude="node_modules" \
        --exclude=".next" \
        --exclude=".git" \
        --exclude="logs" \
        --exclude="backups"
    
    # Create database backup (if PostgreSQL is running)
    if docker-compose -f "$APP_DIR/docker-compose.yml" ps | grep -q "postgres"; then
        local db_backup="$BACKUP_DIR/database_$DATE.sql"
        log "🗄️ Backing up database..."
        docker-compose -f "$APP_DIR/docker-compose.yml" exec -T postgres pg_dump -U postgres oms_db > "$db_backup" || {
            log "⚠️ Database backup failed (database might not be running)"
        }
    else
        log "⚠️ Database container not found, skipping database backup"
    fi
    
    log "✅ Backup completed: $app_backup"
}

# Function to clean old backups
cleanup_backups() {
    log "🧹 Cleaning up old backups..."
    
    # Keep only the last MAX_BACKUPS application backups
    cd "$BACKUP_DIR"
    ls -t app_*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
    ls -t database_*.sql 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
    
    log "✅ Cleanup completed"
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log "❌ No backup file specified"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log "❌ Backup file not found: $backup_file"
        exit 1
    fi
    
    log "🔄 Restoring from backup: $backup_file"
    
    # Stop application
    cd "$APP_DIR"
    docker-compose down || true
    
    # Create backup of current state
    create_backup
    
    # Restore from backup
    tar -xzf "$backup_file" -C "$(dirname "$APP_DIR")"
    
    log "✅ Restore completed"
}

# Main function
main() {
    case "${1:-backup}" in
        "backup")
            create_backup
            cleanup_backups
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "list")
            log "📋 Available backups:"
            ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || log "No backups found"
            ;;
        *)
            echo "Usage: $0 {backup|restore <file>|list}"
            echo "  backup  - Create a new backup"
            echo "  restore - Restore from backup file"
            echo "  list    - List available backups"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
