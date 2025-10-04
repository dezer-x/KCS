#!/bin/bash

API_URL="https://kcs.karasu.live/api/teams"
API_TOKEN="2:YZ5N8F4ZQ8PP8NY7JDJL6F71D1EORSY7GEBMTIERARZFQ55HZL07PKSLBHUJWRXM"

JSON_PAYLOAD='[
{
  "name": "New Team",
  "flag": "DE",
  "auth_name": {
    "76561198000000001": {
      "name": "SeniorWoofers",
      "captain": true,
      "coach": true
    }
  },
  "tag": "NEW",
  "public_team": true
}
]'

echo "Creating new team..."
echo "API URL: ${API_URL}"
echo "Using API Key: ${API_TOKEN}"
echo "--------------------------------------------------------"

curl -X POST "${API_URL}" \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "user-api: ${API_TOKEN}" \
  -d "${JSON_PAYLOAD}"
