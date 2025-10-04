#!/bin/bash

API_URL="https://kcs.karasu.live/api/matches"
API_TOKEN="2:YZ5N8F4ZQ8PP8NY7JDJL6F71D1EORSY7GEBMTIERARZFQ55HZL07PKSLBHUJWRXM"

SERVERS_RESPONSE=$(curl -s -X GET "${API_URL%/matches}/servers/available" \
  -H 'accept: application/json' \
  -H "user-api: ${API_TOKEN}")
SERVER_ID=$(echo $SERVERS_RESPONSE | jq -r '.servers[0].id // empty')
if [ -z "$SERVER_ID" ]; then
    echo "ERROR: Could not extract server ID from response"
    exit 1
fi
TEAM1_RESPONSE=$(curl -s -X POST "${API_URL%/matches}/teams" \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "user-api: ${API_TOKEN}" \
  -d '[
{
  "name": "Test Team Alpha",
  "flag": "US",
  "auth_name": {
    "76561198000000001": {
      "name": "TestPlayer1",
      "captain": true,
      "coach": true
    }
  },
  "tag": "ALPHA",
  "public_team": true
}
]')
TEAM1_ID=$(echo $TEAM1_RESPONSE | jq -r '.id // empty')
TEAM2_RESPONSE=$(curl -s -X POST "${API_URL%/matches}/teams" \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "user-api: ${API_TOKEN}" \
  -d '[
{
  "name": "Test Team Beta",
  "flag": "DE",
  "auth_name": {
    "76561198000000002": {
      "name": "TestPlayer2",
      "captain": true,
      "coach": true
    }
  },
  "tag": "BETA",
  "public_team": true
}
]')
TEAM2_ID=$(echo $TEAM2_RESPONSE | jq -r '.id // empty')
if [ -z "$TEAM1_ID" ] || [ -z "$TEAM2_ID" ]; then
    echo "ERROR: Could not create teams"
    exit 1
fi
MATCH_PAYLOAD='[{
  "server_id": '${SERVER_ID}',
  "team1_id": '${TEAM1_ID}',
  "team2_id": '${TEAM2_ID}',
  "max_maps": 1,
  "title": "Test Match",
  "skip_veto": true,
  "private_match": true,
  "enforce_teams": true
}]'
MATCH_RESPONSE=$(curl -s -X POST "${API_URL}" \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "user-api: ${API_TOKEN}" \
  -d "${MATCH_PAYLOAD}")
echo "Match response: ${MATCH_RESPONSE}"
if echo "${MATCH_RESPONSE}" | grep -q '"id"' 2>/dev/null; then
    echo "✅ SUCCESS! Match created successfully!"
    MATCH_ID=$(echo $MATCH_RESPONSE | jq -r '.id // empty')
    echo "Match ID: ${MATCH_ID}"
else
    echo "❌ Failed to create match"
    echo "Error: ${MATCH_RESPONSE}"
    exit 1
fi
