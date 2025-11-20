#!/bin/bash

# Walrus Single File Upload Script
# Usage: ./upload-single.sh <filepath> [epochs] [permanent]

AGGREGATOR=${AGGREGATOR:-"https://aggregator.walrus-testnet.walrus.space"}
PUBLISHER=${PUBLISHER:-"https://publisher.walrus-testnet.walrus.space"}

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: $0 <filepath> [epochs] [permanent]"
    echo "Example: $0 ./pitchdeck.pdf 5"
    echo "Example: $0 ./whitepaper.pdf 0 true"
    exit 1
fi

FILEPATH="$1"
EPOCHS="${2:-5}"
PERMANENT="${3:-false}"

# Check file exists
if [ ! -f "$FILEPATH" ]; then
    echo "Error: File not found: $FILEPATH"
    exit 1
fi

# Build URL
URL="$PUBLISHER/v1/blobs"

if [ "$PERMANENT" = "true" ]; then
    URL="$URL?permanent=true"
else
    URL="$URL?epochs=$EPOCHS"
fi

echo "📤 Uploading $FILEPATH to Walrus..."
echo "🌐 Publisher: $PUBLISHER"
echo "⏰ Epochs: $EPOCHS (Permanent: $PERMANENT)"
echo ""

# Upload file
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$URL" --upload-file "$FILEPATH")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Upload successful!"
    echo ""
    echo "$BODY" | jq '.'
    
    # Extract blob ID
    BLOB_ID=$(echo "$BODY" | jq -r '.newlyCreated.blobObject.blobId // .alreadyCertified.blobId')
    OBJECT_ID=$(echo "$BODY" | jq -r '.newlyCreated.blobObject.id // ""')
    
    echo ""
    echo "📋 Summary:"
    echo "  Blob ID: $BLOB_ID"
    if [ ! -z "$OBJECT_ID" ] && [ "$OBJECT_ID" != "null" ]; then
        echo "  Object ID: $OBJECT_ID"
    fi
    
    # Save to file
    OUTPUT_FILE="walrus_upload_$(basename $FILEPATH).json"
    echo "$BODY" > "$OUTPUT_FILE"
    echo ""
    echo "💾 Full response saved to: $OUTPUT_FILE"
    
    # Provide retrieval command
    echo ""
    echo "📥 To retrieve this file, run:"
    echo "  curl \"$AGGREGATOR/v1/blobs/$BLOB_ID\" -o retrieved_$(basename $FILEPATH)"
else
    echo "❌ Upload failed with HTTP code: $HTTP_CODE"
    echo "$BODY"
    exit 1
fi
