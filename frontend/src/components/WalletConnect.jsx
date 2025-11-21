import { useCurrentAccount, useDisconnectWallet, ConnectButton, useConnectWallet } from '@mysten/dapp-kit';
import { Button } from './ui/button';
import { Wallet, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function WalletConnect() {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const navigate = useNavigate();
  const [userSeals, setUserSeals] = useState([]);

  useEffect(() => {
    if (currentAccount) {
      // Get all startup seals created by this user from localStorage
      const allSeals = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('startup_seal_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            // Check if this seal was created by the current user
            if (data.owner === currentAccount.address || data.data_blob_id) {
              const transactionId = key.replace('startup_seal_', '');
              allSeals.push(transactionId);
            }
          } catch (e) {
            console.error('Error parsing seal data:', e);
          }
        }
      }
      setUserSeals(allSeals);
    }
  }, [currentAccount]);

  const handleProfileClick = () => {
    if (userSeals.length > 0) {
      // Navigate to the most recent seal
      navigate(`/profile/${userSeals[userSeals.length - 1]}`);
    } else {
      // Navigate to verify page if no seals exist
      navigate('/verify');
    }
  };

  if (currentAccount) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e0dedb] rounded-full">
          <Wallet className="w-4 h-4 text-[#37322f]" />
          <span className="text-sm font-medium text-[#37322f]">
            {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
          </span>
        </div>
        {userSeals.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-[#37322f] hover:bg-[#37322f]/5 gap-1"
            onClick={handleProfileClick}
          >
            <User className="w-4 h-4" />
            <span className="hidden md:inline">My Profile</span>
          </Button>
        )}
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
