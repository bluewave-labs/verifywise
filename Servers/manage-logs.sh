#!/bin/bash

# Multi-Tenant Logging Management Script
# This script provides utilities for managing tenant-specific logs

LOGS_DIR="/app/logs"
LOCAL_LOGS_DIR="./logs"

# Determine log directory based on environment
if [ -d "$LOGS_DIR" ]; then
    LOG_BASE_DIR="$LOGS_DIR"
elif [ -d "$LOCAL_LOGS_DIR" ]; then
    LOG_BASE_DIR="$LOCAL_LOGS_DIR"
else
    echo "No logs directory found. Creating $LOCAL_LOGS_DIR"
    mkdir -p "$LOCAL_LOGS_DIR"
    LOG_BASE_DIR="$LOCAL_LOGS_DIR"
fi

# Function to list all tenants with logs
list_tenants() {
    echo "=== Available Tenants ==="
    if [ -d "$LOG_BASE_DIR" ]; then
        ls -la "$LOG_BASE_DIR" | grep "^d" | awk '{print $9}' | grep -v "^\.$\|^\.\.$"
    else
        echo "No tenants found."
    fi
}

# Function to show logs for a specific tenant
show_tenant_logs() {
    local tenant_id="$1"
    if [ -z "$tenant_id" ]; then
        echo "Usage: $0 show <tenant_id>"
        echo "Available tenants:"
        list_tenants
        return 1
    fi

    local tenant_dir="$LOG_BASE_DIR/$tenant_id"
    if [ ! -d "$tenant_dir" ]; then
        echo "Tenant '$tenant_id' not found."
        return 1
    fi

    echo "=== Logs for tenant: $tenant_id ==="
    echo "Location: $tenant_dir"
    echo "Files:"
    ls -la "$tenant_dir"
    echo ""
    echo "=== Latest log entries ==="
    local latest_log=$(ls -t "$tenant_dir"/*.log 2>/dev/null | head -1)
    if [ -n "$latest_log" ]; then
        tail -20 "$latest_log"
    else
        echo "No log files found for tenant $tenant_id"
    fi
}

# Function to follow logs for a specific tenant
follow_tenant_logs() {
    local tenant_id="$1"
    if [ -z "$tenant_id" ]; then
        echo "Usage: $0 follow <tenant_id>"
        echo "Available tenants:"
        list_tenants
        return 1
    fi

    local tenant_dir="$LOG_BASE_DIR/$tenant_id"
    if [ ! -d "$tenant_dir" ]; then
        echo "Tenant '$tenant_id' not found."
        return 1
    fi

    local latest_log=$(ls -t "$tenant_dir"/*.log 2>/dev/null | head -1)
    if [ -n "$latest_log" ]; then
        echo "Following logs for tenant: $tenant_id"
        echo "File: $latest_log"
        echo "Press Ctrl+C to stop"
        tail -f "$latest_log"
    else
        echo "No log files found for tenant $tenant_id"
    fi
}

# Function to clean old logs for a specific tenant
clean_tenant_logs() {
    local tenant_id="$1"
    local days="${2:-14}"
    
    if [ -z "$tenant_id" ]; then
        echo "Usage: $0 clean <tenant_id> [days_to_keep]"
        echo "Available tenants:"
        list_tenants
        return 1
    fi

    local tenant_dir="$LOG_BASE_DIR/$tenant_id"
    if [ ! -d "$tenant_dir" ]; then
        echo "Tenant '$tenant_id' not found."
        return 1
    fi

    echo "Cleaning logs older than $days days for tenant: $tenant_id"
    find "$tenant_dir" -name "*.log" -mtime +$days -delete
    echo "Cleanup completed."
}

# Function to show log statistics
show_stats() {
    echo "=== Log Statistics ==="
    echo "Base directory: $LOG_BASE_DIR"
    
    if [ ! -d "$LOG_BASE_DIR" ]; then
        echo "No logs directory found."
        return 1
    fi

    local total_tenants=$(ls -1 "$LOG_BASE_DIR" 2>/dev/null | wc -l)
    echo "Total tenants: $total_tenants"
    
    for tenant in $(ls "$LOG_BASE_DIR" 2>/dev/null); do
        if [ -d "$LOG_BASE_DIR/$tenant" ]; then
            local log_count=$(ls -1 "$LOG_BASE_DIR/$tenant"/*.log 2>/dev/null | wc -l)
            local size=$(du -sh "$LOG_BASE_DIR/$tenant" 2>/dev/null | awk '{print $1}')
            echo "  $tenant: $log_count files, $size total"
        fi
    done
}

# Function to backup tenant logs
backup_tenant_logs() {
    local tenant_id="$1"
    local backup_dir="${2:-./backups}"
    
    if [ -z "$tenant_id" ]; then
        echo "Usage: $0 backup <tenant_id> [backup_directory]"
        echo "Available tenants:"
        list_tenants
        return 1
    fi

    local tenant_dir="$LOG_BASE_DIR/$tenant_id"
    if [ ! -d "$tenant_dir" ]; then
        echo "Tenant '$tenant_id' not found."
        return 1
    fi

    mkdir -p "$backup_dir"
    local backup_file="$backup_dir/${tenant_id}_logs_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    echo "Backing up logs for tenant: $tenant_id"
    tar -czf "$backup_file" -C "$LOG_BASE_DIR" "$tenant_id"
    echo "Backup created: $backup_file"
}

# Main script logic
case "$1" in
    "list"|"ls")
        list_tenants
        ;;
    "show"|"view")
        show_tenant_logs "$2"
        ;;
    "follow"|"tail")
        follow_tenant_logs "$2"
        ;;
    "clean")
        clean_tenant_logs "$2" "$3"
        ;;
    "stats")
        show_stats
        ;;
    "backup")
        backup_tenant_logs "$2" "$3"
        ;;
    "help"|"--help"|"-h"|"")
        echo "Multi-Tenant Logging Management Script"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  list                    List all tenants with logs"
        echo "  show <tenant_id>        Show recent logs for a tenant"
        echo "  follow <tenant_id>      Follow live logs for a tenant"
        echo "  clean <tenant_id> [days] Clean old logs (default: 14 days)"
        echo "  stats                   Show logging statistics"
        echo "  backup <tenant_id> [dir] Backup tenant logs"
        echo "  help                    Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 list"
        echo "  $0 show default"
        echo "  $0 follow tenant_abc123"
        echo "  $0 clean default 30"
        echo "  $0 backup tenant_abc123 /backup"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information."
        exit 1
        ;;
esac
