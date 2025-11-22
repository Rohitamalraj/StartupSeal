import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl('localnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  devnet: { url: getFullnodeUrl('devnet') },
});

const queryClient = new QueryClient();

export function SuiProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider 
          autoConnect
          preferredWallets={[
            'Suiet',           // Suiet Wallet (also known as Slush)
            'Sui Wallet',      // Official Sui Wallet
            'Ethos Wallet',    // Ethos Wallet
            'Martian Wallet',  // Martian Sui Wallet
            'Surf Wallet',     // Surf Wallet
            'Glass Wallet',    // Glass Wallet
            'Morphis Wallet',
            'Slush Wallet'   // Morphis Wallet
          ]}
          enableUnsafeBurner={false}
        >
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
