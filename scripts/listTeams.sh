#!/bin/bash

API_URL="https://kcs.karasu.live/api/teams/"

echo "API URL: ${API_URL}"
echo "--------------------------------------------------------"

curl -s -X GET "${API_URL}" \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' | jq