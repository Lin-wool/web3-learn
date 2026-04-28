// ============================================
// Hardhat 配置文件
// ============================================
//
// ESM 模块语法（import/export）

import "dotenv/config";
import "@nomicfoundation/hardhat-toolbox";

const { INFURA_API_KEY, SEPOLIA_PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  // 智能合约编译器版本
  solidity: "0.8.24",

  // 网络配置
  networks: {
    // Sepolia 测试网配置
    sepolia: {
      // Alchemy RPC URL（如果用 Alchemy 的 key）
      // 或者用 Infura: https://sepolia.infura.io/v3/${INFURA_API_KEY}
      url: `https://eth-sepolia.g.alchemy.com/v2/${INFURA_API_KEY}`,
      // 钱包私钥（从 MetaMask 导出）
      accounts: [SEPOLIA_PRIVATE_KEY],
      // 链 ID，Sepolia 是 11155111
      chainId: 11155111,
    },
  },
};
