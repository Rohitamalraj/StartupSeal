#!/bin/bash

# Walrus Quilt Upload Script
# Usage: ./upload-quilt.sh <epochs>

AGGREGATOR=${AGGREGATOR:-"https://aggregator.walrus-testnet.walrus.space"}
PUBLISHER=${PUBLISHER:-"https://publisher.walrus-testnet.walrus.space"}

EPOCHS="${1:-5}"

echo "📦 Walrus Quilt Upload Script"
echo "🌐 Publisher: $PUBLISHER"
echo "⏰ Epochs: $EPOCHS"
echo ""

# Check if files exist
if [ ! -f "pitchdeck.pdf" ] || [ ! -f "whitepaper.pdf" ]; then
    echo "⚠️  Sample files not found. Creating dummy files for demonstration..."
    echo "This is a sample pitch deck" > pitchdeck.pdf
    echo "This is a sample whitepaper" > whitepaper.pdf
    echo "This is sample financial data" > financials.xlsx
fi

echo "📤 Uploading quilt with multiple files..."
echo ""

# Upload quilt
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$PUBLISHER/v1/quilts?epochs=$EPOCHS" \
  -F "deck=@pitchdeck.pdf" \
  -F "whitepaper=@whitepaper.pdf" \
  -F "financials=@financials.xlsx" \
  -F "_metadata=[
    {\"identifier\":\"deck\",\"tags\":{\"type\":\"pitch\",\"version\":\"1.0\",\"date\":\"2025-11-19\"}},
    {\"identifier\":\"whitepaper\",\"tags\":{\"type\":\"technical\",\"version\":\"1.0\",\"date\":\"2025-11-19\"}},
    {\"identifier\":\"financials\",\"tags\":{\"type\":\"financial\",\"version\":\"1.0\",\"date\":\"2025-11-19\"}}
  ]")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Quilt uploaded successfully!"
    echo ""
    echo "$BODY" | jq '.'
    
    # Extract quilt ID
    QUILT_ID=$(echo "$BODY" | jq -r '.newlyCreated.quiltObject.quiltId')
    OBJECT_ID=$(echo "$BODY" | jq -r '.newlyCreated.quiltObject.id')
    
    echo ""
    echo "📋 Summary:"
    echo "  Quilt ID: $QUILT_ID"
    echo "  Object ID: $OBJECT_ID"
    
    # Extract individual blob IDs
    echo ""
    echo "📄 Individual Blobs:"
    echo "$BODY" | jq -r '.newlyCreated.quiltObject.blobs[] | "  \(.identifier): \(.blobId)"'
    
    # Save to file
    OUTPUT_FILE="walrus_quilt_upload.json"
    echo "$BODY" > "$OUTPUT_FILE"
    echo ""
    echo "💾 Full response saved to: $OUTPUT_FILE"
    
    # Provide retrieval commands
    echo ""
    echo "📥 To retrieve files from this quilt:"
    echo "  Pitch Deck:"
    echo "    curl \"$AGGREGATOR/v1/blobs/by-quilt-id/$QUILT_ID/deck\" -o retrieved_deck.pdf"
    echo ""
    echo "  Whitepaper:"
    echo "    curl \"$AGGREGATOR/v1/blobs/by-quilt-id/$QUILT_ID/whitepaper\" -o retrieved_whitepaper.pdf"
    echo ""
    echo "  Financials:"
    echo "    curl \"$AGGREGATOR/v1/blobs/by-quilt-id/$QUILT_ID/financials\" -o retrieved_financials.xlsx"
else
    echo "❌ Upload failed with HTTP code: $HTTP_CODE"
    echo "$BODY"
    exit 1
fi
