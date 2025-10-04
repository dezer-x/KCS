#!/bin/bash

API_URL="https://kcs.karasu.live/api/teams/"

JSON_PAYLOAD='{
  "team_id": 3
}'

echo "Deleting team with payload: ${JSON_PAYLOAD}"
echo "API URL: ${API_URL}"
echo "Using Token: Bearer ${API_TOKEN}"
echo "--------------------------------------------------------"

curl -v -X DELETE "${API_URL}" \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -d "${JSON_PAYLOAD}"