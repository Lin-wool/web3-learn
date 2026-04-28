// ============================================
// 部署脚本
// ============================================
//
// 这个脚本用于将 MyToken 合约部署到区块链
// 运行命令：npx hardhat run scripts/deploy.js --network sepolia

import hre from "hardhat";

async function main() {
  // ─────────────────────────────────────────────────────────
  // 第一步：获取合约工厂
  // ─────────────────────────────────────────────────────────
  //
  // hre.ethers.getContractFactory 用于获取合约编译后的字节码和 ABI
  // 类似于从前端获取 API 定义

  const MyToken = await hre.ethers.getContractFactory("MyToken");

  console.log("📦 开始部署 MyToken 合约...");

  // ─────────────────────────────────────────────────────────
  // 第二步：定义构造函数参数
  // ─────────────────────────────────────────────────────────
  //
  // constructor(
  //   string memory _name,      // 代币名称
  //   string memory _symbol,    // 代币符号
  //   uint8 _decimals,         // 精度
  //   uint256 _initialSupply    // 初始发行量
  // )

  const name = "My Learning Token";
  const symbol = "MLT";
  const decimals = 18;  // 和 ETH 一样，1 MLT = 10^18 最小单位
  const initialSupply = hre.ethers.parseUnits("1000", decimals);  // 发行 1000 个代币

  console.log(`📝 代币信息:`);
  console.log(`   名称: ${name}`);
  console.log(`   符号: ${symbol}`);
  console.log(`   精度: ${decimals}`);
  console.log(`   初始发行量: ${initialSupply.toString()} (最小单位)`);
  console.log(`   初始发行量: 1000 (人类可读)`);

  // ─────────────────────────────────────────────────────────
  // 第三步：部署合约
  // ─────────────────────────────────────────────────────────
  //
  // contractFactory.deploy() 会：
  // 1. 将合约字节码发送到区块链
  // 2. 创建合约实例
  // 3. 返回合约对象

  const token = await MyToken.deploy(name, symbol, decimals, initialSupply);

  // 等待合约部署完成（需要区块链确认）
  await token.waitForDeployment();

  // 获取合约地址
  const contractAddress = await token.getAddress();

  console.log("✅ 部署成功！");
  console.log(`📍 合约地址: ${contractAddress}`);
  console.log(`🔗 Etherscan 链接: https://sepolia.etherscan.io/address/${contractAddress}`);

  // ─────────────────────────────────────────────────────────
  // 第四步：验证部署结果
  // ─────────────────────────────────────────────────────────

  const [deployer] = await hre.ethers.getSigners();

  console.log(`\n📊 验证信息:`);
  console.log(`   部署者地址: ${deployer.address}`);

  // 查询部署者的代币余额
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log(`   部署者余额: ${hre.ethers.formatUnits(deployerBalance, decimals)} ${symbol}`);

  // 查询总供应量
  const totalSupply = await token.totalSupply();
  console.log(`   总供应量: ${hre.ethers.formatUnits(totalSupply, decimals)} ${symbol}`);

  console.log(`\n💡 下一步:`);
  console.log(`   1. 将合约地址复制到 DAPP 中测试`);
  console.log(`   2. 将代币添加到 MetaMask`);
  console.log(`   3. 测试转账功能`);
}

// ─────────────────────────────────────────────────────────
// 执行入口
// ─────────────────────────────────────────────────────────

// hre.run 会处理异步错误
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });
