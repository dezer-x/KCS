#!/bin/bash

API_URL="https://kcs.karasu.live/api/matches"
API_TOKEN="2:YZ5N8F4ZQ8PP8NY7JDJL6F71D1EORSY7GEBMTIERARZFQ55HZL07PKSLBHUJWRXM"

# Step 1 — Get list of matches
MATCHES_RESPONSE=$(curl -s -X GET "${API_URL}" \
  -H "accept: application/json" \
  -H "user-api: ${API_TOKEN}")

# Filter matches to delete (adjust the filter as needed)
MATCH_IDS=$(echo "$MATCHES_RESPONSE" | jq -r '.matches[] | .id')

if [ -z "$MATCH_IDS" ]; then
    echo "No matches found to delete."
    exit 0
fi

# Step 2 — Cancel matches individually first
for MATCH_ID in $MATCH_IDS; do
    echo "Cancelling match ID: $MATCH_ID"

    CANCEL_RESPONSE=$(curl -s -X GET "${API_URL}/${MATCH_ID}/cancel" \
      -H 'accept: application/json' \
      -H "user-api: ${API_TOKEN}")

    if echo "$CANCEL_RESPONSE" | grep -q '"message"' && ! echo "$CANCEL_RESPONSE" | grep -q "502 Bad Gateway"; then
        echo "✅ Match $MATCH_ID cancelled successfully."
        echo "Response: $CANCEL_RESPONSE"
    else
        echo "❌ Failed to cancel match $MATCH_ID."
        echo "Response: $CANCEL_RESPONSE"
    fi
done

# Step 3 — Delete matches individually
for MATCH_ID in $MATCH_IDS; do
    echo "Deleting match ID: $MATCH_ID"

    DELETE_RESPONSE=$(curl -s -X DELETE "${API_URL}" \
      -H 'accept: application/json' \
      -H 'Content-Type: application/json' \
      -H "user-api: ${API_TOKEN}" \
      -d "[{\"match_id\": ${MATCH_ID}, \"all_cancelled\": false}]")

    if echo "$DELETE_RESPONSE" | grep -q '"message"' && ! echo "$DELETE_RESPONSE" | grep -q "502 Bad Gateway"; then
        echo "✅ Match $MATCH_ID deleted successfully."
        echo "Response: $DELETE_RESPONSE"
    else
        echo "❌ Failed to delete match $MATCH_ID."
        echo "Response: $DELETE_RESPONSE"
    fi
done