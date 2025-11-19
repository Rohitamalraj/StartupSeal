import { useCurrentAccount, useDisconnectWallet, ConnectButton, useConnectWallet } from '@mysten/dapp-kit';
import { Button } from './ui/button';
import { Wallet, LogOut } from 'lucide-react';

export function WalletConnect() {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();

  if (currentAccount) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e0dedb] rounded-full">
          <Wallet className="w-4 h-4 text-[#37322f]" />
          <span className="text-sm font-medium text-[#37322f]">
            {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-[#37322f] hover:bg-[#37322f]/5"
          onClick={() => disconnect()}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <ConnectButton className="h-10 px-6 bg-[#37322f] hover:bg-[#37322f]/90 text-white rounded-full font-medium text-sm shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset]">
      Connect Wallet
    </ConnectButton>
  );
}
