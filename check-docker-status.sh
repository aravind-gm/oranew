#!/usr/bin/env bash
set -e

echo "Docker version:"
docker --version || { echo "Docker not installed"; exit 1; }

echo "Docker Compose version:"
docker compose version || { echo "Docker Compose plugin not installed"; exit 1; }

echo "Running containers:"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo "Compose services:"
docker compose ps
