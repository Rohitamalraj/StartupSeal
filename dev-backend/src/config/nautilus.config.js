module.exports = {
  rpcUrl: process.env.NAUTILUS_RPC_URL,
  computeEndpoint: process.env.NAUTILUS_COMPUTE_ENDPOINT,
  apiKey: process.env.NAUTILUS_API_KEY,
  
  // Nautilus compute configuration
  compute: {
    maxRetries: 3,
    timeout: 30000, // 30 seconds
    gasLimit: 1000000,
  },
  
  // Proof verification settings
  verification: {
    enabled: true,
    storeOnChain: true,
    proofType: 'zkSNARK', // or 'optimistic'
  },
  
  // AI execution settings
  aiExecution: {
    encrypted: true,
    verifiable: true,
    generateReceipt: true,
  }
};
