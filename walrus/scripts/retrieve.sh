#!/bin/bash

# Walrus Retrieval Script
# Usage: ./retrieve.sh <blob-id|quilt-id> [identifier] [output-file]

AGGREGATOR=${AGGREGATOR:-"https://aggregator.walrus-testnet.walrus.space"}

if [ -z "$1" ]; then
    echo "Usage: $0 <blob-id|quilt-id> [identifier] [output-file]"
    echo ""
    echo "Examples:"
    echo "  Retrieve by blob ID:"
    echo "    $0 FLTe75EszRnuHmzZdaMVy8dIepUEfF_6RxLIr72nPXI output.pdf"
    echo ""
    echo "  Retrieve from quilt by identifier:"
    echo "    $0 Q9mK7pL3nR5wT8vB2cF4hJ6dS1aG9xE7yN4qW0zV5rU deck output.pdf"
    echo ""
    echo "  Retrieve metadata:"
    echo "    $0 FLTe75EszRnuHmzZdaMVy8dIepUEfF_6RxLIr72nPXI metadata"
    exit 1
fi

ID="$1"
IDENTIFIER="$2"
OUTPUT="${3:-retrieved_file}"

echo "📥 Walrus Retrieval Script"
echo "🌐 Aggregator: $AGGREGATOR"
echo ""

# Determine retrieval type
if [ "$IDENTIFIER" = "metadata" ]; then
    # Get metadata
    URL="$AGGREGATOR/v1/blobs/$ID/metadata"
    echo "🔍 Retrieving metadata for: $ID"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "$URL")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Metadata retrieved successfully!"
        echo ""
        echo "$BODY" | jq '.'
    else
        echo "❌ Failed to retrieve metadata (HTTP $HTTP_CODE)"
        echo "$BODY"
        exit 1
    fi

elif [ ! -z "$IDENTIFIER" ] && [ "$IDENTIFIER" != "metadata" ]; then
    # Retrieve from quilt
    URL="$AGGREGATOR/v1/blobs/by-quilt-id/$ID/$IDENTIFIER"
    echo "📦 Retrieving '$IDENTIFIER' from quilt: $ID"
    echo "💾 Saving to: $OUTPUT"
    
    HTTP_CODE=$(curl -s -w "%{http_code}" -o "$OUTPUT" "$URL")
    
    if [ "$HTTP_CODE" = "200" ]; then
        FILE_SIZE=$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null)
        echo "✅ File retrieved successfully!"
        echo "   Size: $FILE_SIZE bytes"
        echo "   Location: $OUTPUT"
    else
        echo "❌ Failed to retrieve file (HTTP $HTTP_CODE)"
        rm -f "$OUTPUT"
        exit 1
    fi

else
    # Retrieve by blob ID
    URL="$AGGREGATOR/v1/blobs/$ID"
    echo "📄 Retrieving blob: $ID"
    echo "💾 Saving to: $OUTPUT"
    
    HTTP_CODE=$(curl -s -w "%{http_code}" -o "$OUTPUT" "$URL")
    
    if [ "$HTTP_CODE" = "200" ]; then
        FILE_SIZE=$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null)
        echo "✅ File retrieved successfully!"
        echo "   Size: $FILE_SIZE bytes"
        echo "   Location: $OUTPUT"
    else
        echo "❌ Failed to retrieve file (HTTP $HTTP_CODE)"
        rm -f "$OUTPUT"
        exit 1
    fi
fi
