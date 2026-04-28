// ============================================
// MetaMask 类型声明
// ============================================
//
// 当 TypeScript 看到 window.ethereum 时，它不知道这个属性存在
// 因为 ethereum 不是标准的 Window 接口的一部分
// 我们需要告诉 TypeScript："这是 MetaMask 注入的对象"
//
// 同时需要兼容 ethers.js 的 Eip1193Provider 接口

// 扩展 Window 接口，添加 ethereum 属性
interface Window {
  ethereum?: {
    // MetaMask 的主要方法
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (event: string, callback: (...args: unknown[]) => void) => void;
    removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    isMetaMask?: boolean;
    isConnected?: () => boolean;
    selectedAddress?: string | null;
  };
}
