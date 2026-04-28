/**
 * DApp.tsx - Web3 DAPP 主界面
 *
 * 功能：
 * - 连接 MetaMask 钱包
 * - 查询/转账 ETH
 * - 查询/转账 ERC20 代币
 *
 * 界面设计：
 * - 左侧：钱包状态卡片
 * - 右侧：操作面板（ETH / Token 切换）
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './DApp.css';

// ============================================
// 类型定义
// ============================================

interface Network {
  id: string;
  name: string;
  color: string;
}

interface Wallet {
  address: string;
  ethBalance: string;
  tokenAddress: string;
  tokenBalance: string;
  tokenDecimals: number;
  tokenSymbol: string;
}

// ============================================
// ERC20 ABI
// ============================================
const ERC20_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// ============================================
// 组件：网络选择器
// ============================================
function NetworkSelector({ currentNetwork, onNetworkChange }: { currentNetwork: Network; onNetworkChange: (net: Network) => void }) {
  const networks: Network[] = [
    { id: 'sepolia', name: 'Sepolia Testnet', color: '#7b3fe4' },
    { id: 'mainnet', name: 'Ethereum Mainnet', color: '#627eea' },
  ];

  return (
    <div className="network-selector">
      <div className="network-indicator" style={{ backgroundColor: currentNetwork.color }}>
        <span className="network-dot"></span>
        {currentNetwork.name}
      </div>
      <div className="network-dropdown">
        {networks.map(net => (
          <button
            key={net.id}
            className={currentNetwork.id === net.id ? 'active' : ''}
            onClick={() => onNetworkChange(net)}
          >
            {net.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 组件：钱包卡片
// ============================================
function WalletCard({ wallet, onDisconnect }: { wallet: Wallet; onDisconnect: () => void }) {
  const formatAddress = (addr: string): string => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance: string): string => {
    if (!balance) return '0.0000';
    return parseFloat(balance).toFixed(4);
  };

  return (
    <div className="wallet-card">
      <div className="wallet-header">
        <h3>我的钱包</h3>
        <button className="disconnect-btn" onClick={onDisconnect}>断开</button>
      </div>

      <div className="wallet-address">
        <span className="label">地址</span>
        <span className="value">{formatAddress(wallet.address)}</span>
      </div>

      <div className="wallet-balance">
        <span className="label">ETH 余额</span>
        <span className="value eth">
          <span className="currency">Ξ</span>
          {formatBalance(wallet.ethBalance)}
        </span>
      </div>

      {wallet.tokenBalance && (
        <div className="wallet-balance token">
          <span className="label">{wallet.tokenSymbol || '代币'} 余额</span>
          <span className="value">
            {formatBalance(wallet.tokenBalance)} {wallet.tokenSymbol}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// 组件：操作面板
// ============================================
function OperationPanel({ wallet, activeTab, onTabChange, onRefresh }: {
  wallet: Wallet;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="operation-panel">
      <div className="tab-header">
        <button
          className={`tab ${activeTab === 'eth' ? 'active' : ''}`}
          onClick={() => onTabChange('eth')}
        >
          <span className="tab-icon">Ξ</span>
          ETH 操作
        </button>
        <button
          className={`tab ${activeTab === 'token' ? 'active' : ''}`}
          onClick={() => onTabChange('token')}
        >
          <span className="tab-icon">🪙</span>
          代币操作
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'eth' && (
          <ETHOperations wallet={wallet} onRefresh={onRefresh} />
        )}
        {activeTab === 'token' && (
          <TokenOperations wallet={wallet} onRefresh={onRefresh} />
        )}
      </div>
    </div>
  );
}

// ============================================
// 组件：ETH 操作
// ============================================
function ETHOperations({ wallet, onRefresh }: { wallet: Wallet; onRefresh: () => void }) {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const sendETH = async () => {
    try {
      setError('');
      setTxHash('');

      if (!toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('无效的收款地址');
      }

      const amountNum = parseFloat(amount);
      if (amountNum <= 0 || amountNum > parseFloat(wallet.ethBalance)) {
        throw new Error('金额无效或余额不足');
      }

      setIsSending(true);

      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount)
      });

      setTxHash(tx.hash);
      await tx.wait();

      setToAddress('');
      setAmount('');
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '转账失败');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="operations">
      <div className="section-title">
        <span>发送 ETH</span>
        <button className="refresh-btn" onClick={onRefresh}>↻ 刷新</button>
      </div>

      <div className="input-group">
        <label>收款地址</label>
        <input
          type="text"
          placeholder="0x..."
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          disabled={isSending}
        />
      </div>

      <div className="input-group">
        <label>金额 (ETH)</label>
        <input
          type="number"
          placeholder="0.0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isSending}
        />
        <span className="balance-hint">可用: {wallet.ethBalance} ETH</span>
      </div>

      {error && <div className="error">{error}</div>}
      {txHash && (
        <div className="success">
          ✅ 转账成功！
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
            查看交易
          </a>
        </div>
      )}

      <button
        className="submit-btn primary"
        onClick={sendETH}
        disabled={isSending || !toAddress || !amount}
      >
        {isSending ? '确认中...' : '发送 ETH'}
      </button>
    </div>
  );
}

// ============================================
// 组件：Token 操作
// ============================================
function TokenOperations({ wallet, onRefresh }: { wallet: Wallet; onRefresh: () => void }) {
  const [tokenAddress, setTokenAddress] = useState(wallet.tokenAddress || '');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  const queryToken = async () => {
    if (!tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('无效的合约地址');
      return;
    }

    try {
      setError('');
      setIsLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum!);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      const [balance, decimals, symbol] = await Promise.all([
        contract.balanceOf(wallet.address),
        contract.decimals(),
        contract.symbol()
      ]);

      wallet.tokenAddress = tokenAddress;
      wallet.tokenBalance = ethers.formatUnits(balance, Number(decimals));
      wallet.tokenDecimals = Number(decimals);
      wallet.tokenSymbol = symbol;

      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? '查询失败：' + err.message : '查询失败');
    } finally {
      setIsLoading(false);
    }
  };

  const sendToken = async () => {
    try {
      setError('');
      setTxHash('');

      if (!toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('无效的收款地址');
      }

      const amountNum = parseFloat(amount);
      if (amountNum <= 0 || amountNum > parseFloat(wallet.tokenBalance)) {
        throw new Error('金额无效或余额不足');
      }

      setIsSending(true);

      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

      const tx = await contract.transfer(
        toAddress,
        ethers.parseUnits(amount, wallet.tokenDecimals)
      );

      setTxHash(tx.hash);
      await tx.wait();

      setToAddress('');
      setAmount('');
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '转账失败');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="operations">
      <div className="section-title">
        <span>代币操作</span>
      </div>

      <div className="input-group">
        <label>代币合约地址</label>
        <div className="input-with-btn">
          <input
            type="text"
            placeholder="0x..."
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            disabled={isLoading}
          />
          <button
            className="query-btn"
            onClick={queryToken}
            disabled={isLoading || !tokenAddress}
          >
            {isLoading ? '查询中...' : '查询'}
          </button>
        </div>
      </div>

      {wallet.tokenSymbol && (
        <div className="token-info">
          <span className="token-badge">{wallet.tokenSymbol}</span>
          <span>余额: {wallet.tokenBalance}</span>
        </div>
      )}

      <div className="divider"></div>

      <div className="input-group">
        <label>收款地址</label>
        <input
          type="text"
          placeholder="0x..."
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          disabled={isSending || !wallet.tokenBalance}
        />
      </div>

      <div className="input-group">
        <label>金额 ({wallet.tokenSymbol || '代币'})</label>
        <input
          type="number"
          placeholder="0.0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isSending || !wallet.tokenBalance}
        />
        {wallet.tokenBalance && (
          <span className="balance-hint">可用: {wallet.tokenBalance}</span>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      {txHash && (
        <div className="success">
          ✅ 转账成功！
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
            查看交易
          </a>
        </div>
      )}

      <button
        className="submit-btn secondary"
        onClick={sendToken}
        disabled={isSending || !toAddress || !amount || !wallet.tokenBalance}
      >
        {isSending ? '确认中...' : `发送 ${wallet.tokenSymbol || '代币'}`}
      </button>
    </div>
  );
}

// ============================================
// 主组件
// ============================================
function DApp() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState('eth');
  const [error, setError] = useState('');

  const [currentNetwork, setCurrentNetwork] = useState<Network>({
    id: 'sepolia',
    name: 'Sepolia Testnet',
    color: '#7b3fe4'
  });

  const [wallet, setWallet] = useState<Wallet>({
    address: '',
    ethBalance: '',
    tokenAddress: '',
    tokenBalance: '',
    tokenDecimals: 18,
    tokenSymbol: ''
  });

  const connectWallet = async () => {
    try {
      setError('');
      setIsConnecting(true);

      if (typeof window.ethereum === 'undefined') {
        throw new Error('请先安装 MetaMask 钱包插件！');
      }

      const provider = new ethers.BrowserProvider(window.ethereum!);
      const accounts = await provider.send('eth_requestAccounts', []) as string[];

      if (accounts.length === 0) {
        throw new Error('没有找到已授权的账户');
      }

      const address = accounts[0];
      const balance = await provider.getBalance(address);

      setWallet(prev => ({
        ...prev,
        address,
        ethBalance: ethers.formatEther(balance)
      }));

      setIsConnected(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '连接失败');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setWallet({
      address: '',
      ethBalance: '',
      tokenAddress: '',
      tokenBalance: '',
      tokenDecimals: 18,
      tokenSymbol: ''
    });
    setActiveTab('eth');
  };

  const refresh = async () => {
    if (!wallet.address) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const balance = await provider.getBalance(wallet.address);
      setWallet(prev => ({
        ...prev,
        ethBalance: ethers.formatEther(balance)
      }));

      if (wallet.tokenAddress) {
        const contract = new ethers.Contract(wallet.tokenAddress, ERC20_ABI, provider);
        const balance = await contract.balanceOf(wallet.address);
        setWallet(prev => ({
          ...prev,
          tokenBalance: ethers.formatUnits(balance, wallet.tokenDecimals)
        }));
      }
    } catch (err) {
      console.error('刷新失败:', err);
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: unknown) => {
          if (Array.isArray(accounts) && accounts.length > 0) {
            connectWallet();
          }
        })
        .catch(console.error);
    }
  }, []);

  return (
    <div className="dapp">
      <header className="dapp-header">
        <div className="logo">
          <span className="logo-icon">🔗</span>
          <span className="logo-text">Web3 DAPP</span>
        </div>
        {isConnected && (
          <NetworkSelector
            currentNetwork={currentNetwork}
            onNetworkChange={setCurrentNetwork}
          />
        )}
      </header>

      <main className="dapp-main">
        {!isConnected ? (
          <div className="connect-screen">
            <div className="connect-card">
              <div className="connect-icon">👛</div>
              <h2>连接你的钱包</h2>
              <p>连接 MetaMask 钱包开始使用 DAPP</p>

              {error && <div className="error">{error}</div>}

              <button
                className="connect-btn"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? '连接中...' : '连接 MetaMask'}
              </button>

              <p className="hint">
                需要安装
                <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">
                  MetaMask
                </a>
                钱包
              </p>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <WalletCard
              wallet={wallet}
              onDisconnect={disconnect}
            />

            <OperationPanel
              wallet={wallet}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onRefresh={refresh}
            />
          </div>
        )}
      </main>

      <footer className="dapp-footer">
        <p>Built with React + TypeScript + ethers.js</p>
      </footer>
    </div>
  );
}

export default DApp;
