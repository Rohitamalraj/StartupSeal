import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Badge } from "./ui/badge"
import { ExternalLink, Lock, Key, FileCheck, AlertCircle, Copy, CheckCircle2 } from "lucide-react"
import { Button } from "./ui/button"
import { useState } from "react"

/**
 * Blockchain Verification Component
 * Displays cryptographic proofs and blockchain verification links
 */
export function BlockchainVerification({ verificationData, className = "" }) {
  if (!verificationData) return null

  const { signature, publicKey, blockchain, isDevMode, verifiable } = verificationData
  const [copiedField, setCopiedField] = useState(null)

  // Copy to clipboard handler
  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Truncate long strings for display
  const truncateMiddle = (str, maxLength = 40) => {
    if (!str || str.length <= maxLength) return str
    const halfLength = Math.floor(maxLength / 2)
    return `${str.substring(0, halfLength)}...${str.substring(str.length - halfLength)}`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cryptographic Proof Card */}
      <Card className="border-2 border-purple-200 bg-purple-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600" />
                Cryptographic Proof
              </CardTitle>
              <CardDescription>
                {isDevMode 
                  ? "Mock enclave signature (development mode)" 
                  : "Signed by Nautilus AWS Nitro Enclave"}
              </CardDescription>
            </div>
            {isDevMode ? (
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                DEV MODE
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                PRODUCTION
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Signature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Digital Signature
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(signature, 'signature')}
                className="h-8"
              >
                {copiedField === 'signature' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 font-mono text-xs break-all">
              {signature || 'No signature available'}
            </div>
          </div>

          {/* Public Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Public Key
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(publicKey, 'publicKey')}
                className="h-8"
              >
                {copiedField === 'publicKey' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 font-mono text-xs break-all">
              {publicKey || 'No public key available'}
            </div>
          </div>

          {/* Verification Status */}
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
            {verifiable ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Signature can be verified on-chain
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">
                  {isDevMode 
                    ? "Development mode - Signature is deterministic for testing" 
                    : "Signature verification pending"}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Verification Card */}
      {blockchain && (
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              Blockchain Verification
            </CardTitle>
            <CardDescription>
              View and verify on Sui blockchain explorer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Package ID */}
            {blockchain.packageId && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Smart Contract Package
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 font-mono text-xs break-all">
                    {truncateMiddle(blockchain.packageId, 50)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(blockchain.packageId, 'packageId')}
                  >
                    {copiedField === 'packageId' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Blockchain Actions */}
            <div className="flex flex-col gap-3">
              {blockchain.explorerUrl && (
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => window.open(blockchain.explorerUrl, '_blank')}
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View on Sui Explorer
                  </span>
                  <Badge variant="secondary">Testnet</Badge>
                </Button>
              )}

              {blockchain.canVerify && (
                <Button
                  variant="outline"
                  className="w-full border-green-200 text-green-700 hover:bg-green-50"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verify On-Chain
                </Button>
              )}
            </div>

            {/* Transaction Data Preview */}
            {blockchain.txData && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Transaction Details
                </label>
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Module:</span>
                    <span className="font-mono font-medium">{blockchain.txData.module}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Function:</span>
                    <span className="font-mono font-medium">{blockchain.txData.function}</span>
                  </div>
                  {blockchain.txData.arguments?.project_id && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Project ID:</span>
                      <span className="font-mono font-medium">
                        {truncateMiddle(blockchain.txData.arguments.project_id, 30)}
                      </span>
                    </div>
                  )}
                  {blockchain.txData.arguments?.trust_score !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Trust Score:</span>
                      <span className="font-mono font-bold text-purple-600">
                        {blockchain.txData.arguments.trust_score}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">
              How Verification Works
            </p>
            <p className="text-xs text-gray-600">
              {isDevMode ? (
                <>
                  In development mode, signatures are generated using deterministic SHA256 hashing.
                  Production mode will use AWS Nitro Enclaves for hardware-level attestation.
                </>
              ) : (
                <>
                  Your trust score is signed by a Nautilus AWS Nitro Enclave, providing hardware-attested
                  cryptographic proof. The signature is verifiable on the Sui blockchain.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
