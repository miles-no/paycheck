#!/bin/sh

set -ex

echo "Current working directory:"
pwd

echo "Running npm run setup.."
npm run setup

echo "Running npm run start.."
npm run start
