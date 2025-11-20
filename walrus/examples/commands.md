# Walrus Storage Commands and Examples

## Environment Variables

```bash
export AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
export PUBLISHER=https://publisher.walrus-testnet.walrus.space
```

## Command Reference

### 1. Store a Single File

**Basic Upload:**
```bash
curl -X PUT "$PUBLISHER/v1/blobs" --upload-file "./pitchdeck.pdf"
```

**Response (Already Certified):**
```json
{
  "alreadyCertified": {
    "blobId": "FLTe75EszRnuHmzZdaMVy8dIepUEfF_6RxLIr72nPXI",
    "event": {
      "txDigest": "7Dossjkh3gcgz5BNQAk1PBrZr68bKBL54KYSTxq4F7bW",
      "eventSeq": "0"
    },
    "endEpoch": 150
  }
}
```

**Response (Newly Created):**
```json
{
  "newlyCreated": {
    "blobObject": {
      "id": "0x8e2257f5a2e5f8f7c9f3a7f1d5e3a2b4c6d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2",
      "storedEpoch": 100,
      "blobId": "FLTe75EszRnuHmzZdaMVy8dIepUEfF_6RxLIr72nPXI",
      "size": 2457600,
      "erasureCodeType": "RedStuff",
      "certifiedEpoch": 100,
      "storage": {
        "id": "0x123...",
        "startEpoch": 100,
        "endEpoch": 105,
        "storageSize": 3145728
      }
    },
    "resourceOperation": {
      "RegisterFromScratch": {
        "encoded_length": 3145728,
        "epochs_ahead": 5
      }
    },
    "cost": 12500
  }
}
```

### 2. Store with Custom Epochs

**5 Epochs (Temporary):**
```bash
curl -X PUT "$PUBLISHER/v1/blobs?epochs=5" \
  --upload-file "./whitepaper.pdf"
```

**Response:**
```json
{
  "newlyCreated": {
    "blobObject": {
      "id": "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
      "storedEpoch": 100,
      "blobId": "A8F3k2nWp7rJqL9zXvY4mT6hB1cV5sR8dN2fE7gK3wU",
      "size": 1048576,
      "storage": {
        "endEpoch": 105
      }
    }
  }
}
```

### 3. Store Permanent Blob

**Permanent Storage:**
```bash
curl -X PUT "$PUBLISHER/v1/blobs?permanent=true" \
  --upload-file "./demo.mp4"
```

**Response:**
```json
{
  "newlyCreated": {
    "blobObject": {
      "blobId": "ZxR9vK4qW2nL7pT3mY8fB6cE1sD5hJ9gA4wN7rV2kQ0",
      "storage": {
        "endEpoch": 18446744073709551615
      }
    },
    "resourceOperation": {
      "RegisterFromScratch": {
        "encoded_length": 52428800,
        "epochs_ahead": 18446744073709551615
      }
    }
  }
}
```

### 4. Read Blob by Blob ID

```bash
curl "$AGGREGATOR/v1/blobs/FLTe75EszRnuHmzZdaMVy8dIepUEfF_6RxLIr72nPXI" \
  -o pitchdeck_retrieved.pdf
```

**Success Output:**
```
% Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 2457k  100 2457k    0     0  4912k      0 --:--:-- --:--:-- --:--:-- 4918k
```

### 5. Store Quilt (Multiple Files with Metadata)

**Upload Quilt:**
```bash
curl -X PUT "$PUBLISHER/v1/quilts?epochs=5" \
  -F "deck=@pitchdeck.pdf" \
  -F "whitepaper=@whitepaper.pdf" \
  -F "demo=@demo.mp4" \
  -F "_metadata=[
    {\"identifier\":\"deck\",\"tags\":{\"type\":\"pitch\",\"version\":\"1.0\"}},
    {\"identifier\":\"whitepaper\",\"tags\":{\"type\":\"doc\",\"version\":\"1.0\"}},
    {\"identifier\":\"demo\",\"tags\":{\"type\":\"video\",\"version\":\"1.0\"}}
  ]"
```

**Response:**
```json
{
  "newlyCreated": {
    "quiltObject": {
      "id": "0x7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
      "quiltId": "Q9mK7pL3nR5wT8vB2cF4hJ6dS1aG9xE7yN4qW0zV5rU",
      "storedEpoch": 100,
      "blobs": [
        {
          "identifier": "deck",
          "blobId": "FLTe75EszRnuHmzZdaMVy8dIepUEfF_6RxLIr72nPXI",
          "size": 2457600,
          "tags": {
            "type": "pitch",
            "version": "1.0"
          }
        },
        {
          "identifier": "whitepaper",
          "blobId": "A8F3k2nWp7rJqL9zXvY4mT6hB1cV5sR8dN2fE7gK3wU",
          "size": 1048576,
          "tags": {
            "type": "doc",
            "version": "1.0"
          }
        },
        {
          "identifier": "demo",
          "blobId": "M4vN8rT2pK7wL3qY9fB6cE1sH5jD9xA0gR4zV7nW2kQ",
          "size": 52428800,
          "tags": {
            "type": "video",
            "version": "1.0"
          }
        }
      ],
      "storage": {
        "endEpoch": 105
      }
    },
    "cost": 125000
  }
}
```

### 6. Read Blob from Quilt by Identifier

```bash
curl "$AGGREGATOR/v1/blobs/by-quilt-id/Q9mK7pL3nR5wT8vB2cF4hJ6dS1aG9xE7yN4qW0zV5rU/deck" \
  -o deck_retrieved.pdf
```

### 7. Read Blob by Object ID

```bash
curl "$AGGREGATOR/v1/blobs/by-object-id/0x7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8" \
  -o retrieved_by_object.pdf
```

### 8. Get Blob Metadata

```bash
curl "$AGGREGATOR/v1/blobs/FLTe75EszRnuHmzZdaMVy8dIepUEfF_6RxLIr72nPXI/metadata"
```

**Response:**
```json
{
  "blobId": "FLTe75EszRnuHmzZdaMVy8dIepUEfF_6RxLIr72nPXI",
  "size": 2457600,
  "erasureCodeType": "RedStuff",
  "certifiedEpoch": 100,
  "storage": {
    "startEpoch": 100,
    "endEpoch": 105,
    "storageSize": 3145728
  }
}
```

## Complete Workflow Example

### Scenario: Startup Submits Full Package

```bash
#!/bin/bash

# Set environment
export AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
export PUBLISHER=https://publisher.walrus-testnet.walrus.space

# 1. Upload quilt with all startup documents
echo "Uploading startup package..."
RESPONSE=$(curl -s -X PUT "$PUBLISHER/v1/quilts?epochs=10" \
  -F "pitchdeck=@./startup_docs/pitchdeck.pdf" \
  -F "whitepaper=@./startup_docs/whitepaper.pdf" \
  -F "financials=@./startup_docs/financials.xlsx" \
  -F "demo=@./startup_docs/demo.mp4" \
  -F "code=@./startup_docs/github_export.zip" \
  -F "_metadata=[
    {\"identifier\":\"pitchdeck\",\"tags\":{\"type\":\"pitch\",\"version\":\"2.1\",\"date\":\"2025-11-19\"}},
    {\"identifier\":\"whitepaper\",\"tags\":{\"type\":\"technical\",\"version\":\"1.5\",\"date\":\"2025-11-15\"}},
    {\"identifier\":\"financials\",\"tags\":{\"type\":\"financial\",\"version\":\"1.0\",\"date\":\"2025-11-18\"}},
    {\"identifier\":\"demo\",\"tags\":{\"type\":\"video\",\"version\":\"1.0\",\"date\":\"2025-11-17\"}},
    {\"identifier\":\"code\",\"tags\":{\"type\":\"source\",\"version\":\"0.9.2\",\"date\":\"2025-11-19\"}}
  ]")

# Extract quilt ID
QUILT_ID=$(echo $RESPONSE | jq -r '.newlyCreated.quiltObject.quiltId')
OBJECT_ID=$(echo $RESPONSE | jq -r '.newlyCreated.quiltObject.id')

echo "Quilt uploaded successfully!"
echo "Quilt ID: $QUILT_ID"
echo "Object ID: $OBJECT_ID"

# 2. Extract individual blob IDs
PITCHDECK_BLOB=$(echo $RESPONSE | jq -r '.newlyCreated.quiltObject.blobs[] | select(.identifier=="pitchdeck") | .blobId')
WHITEPAPER_BLOB=$(echo $RESPONSE | jq -r '.newlyCreated.quiltObject.blobs[] | select(.identifier=="whitepaper") | .blobId')
DEMO_BLOB=$(echo $RESPONSE | jq -r '.newlyCreated.quiltObject.blobs[] | select(.identifier=="demo") | .blobId')

echo "Pitch Deck Blob: $PITCHDECK_BLOB"
echo "Whitepaper Blob: $WHITEPAPER_BLOB"
echo "Demo Blob: $DEMO_BLOB"

# 3. Verify uploads by downloading
echo "Verifying uploads..."
curl -s "$AGGREGATOR/v1/blobs/by-quilt-id/$QUILT_ID/pitchdeck" -o verify_pitchdeck.pdf
curl -s "$AGGREGATOR/v1/blobs/by-quilt-id/$QUILT_ID/whitepaper" -o verify_whitepaper.pdf

echo "Verification complete!"

# 4. Output data for Sui transaction
cat > walrus_output.json <<EOF
{
  "quilt_id": "$QUILT_ID",
  "object_id": "$OBJECT_ID",
  "blobs": {
    "pitchdeck": "$PITCHDECK_BLOB",
    "whitepaper": "$WHITEPAPER_BLOB",
    "demo": "$DEMO_BLOB"
  },
  "upload_timestamp": "$(date -u +%s)",
  "storage_epochs": 10
}
EOF

echo "Data saved to walrus_output.json for Sui submission"
```

## Error Handling

### Blob Not Found
```bash
curl "$AGGREGATOR/v1/blobs/invalid_blob_id"
```
**Response:**
```json
{
  "error": "Blob not found",
  "blobId": "invalid_blob_id"
}
```

### Invalid Epoch Range
```bash
curl -X PUT "$PUBLISHER/v1/blobs?epochs=0" --upload-file "./file.pdf"
```
**Response:**
```json
{
  "error": "Invalid epoch range",
  "message": "Epochs must be greater than 0"
}
```

## Best Practices

1. **Use Quilts for Related Files**: Group all startup documents in a single quilt for atomic storage
2. **Tag Appropriately**: Include version, type, and date in metadata
3. **Verify Uploads**: Always download and verify critical files after upload
4. **Store Object IDs**: Save Sui object IDs for on-chain reference
5. **Choose Epochs Wisely**: 
   - Use 5-10 epochs for temporary submissions
   - Use permanent storage for final, verified records
6. **Handle Errors**: Always check response status and handle already certified cases
