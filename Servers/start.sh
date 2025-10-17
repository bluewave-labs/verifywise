#!/bin/sh

# NOTE: This script starts the cron daemon and then starts the Node.js application in docker container.

# Start cron daemon in background
crond

# Start the worker process in background
# npm run worker &

# Start your Node.js app in foreground
exec npm start