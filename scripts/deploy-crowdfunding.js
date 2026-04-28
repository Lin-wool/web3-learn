// ============================================
// 部署众筹合约脚本
// ============================================
//
// 运行命令：npx hardhat run scripts/deploy-crowdfunding.js --network sepolia

import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("📦 开始部署 Crowdfunding 合约...");
  console.log(`   部署者: ${deployer.address}`);

  // ─────────────────────────────────────────────────────────
  // 构造函数参数
  // ─────────────────────────────────────────────────────────

  // 受益人地址（可以是部署者自己，也可以是其他人）
  const beneficiary = deployer.address;

  // 目标金额：0.01 ETH（换成 wei）
  const targetAmount = hre.ethers.parseEther("0.01");

  // 众筹持续时间：5 分钟（用于测试）
  // 实际项目可能是 30 天
  const durationInSeconds = 5 * 60;

  console.log(`\n📝 众筹参数:`);
  console.log(`   受益人: ${beneficiary}`);
  console.log(`   目标金额: ${hre.ethers.formatEther(targetAmount)} ETH`);
  console.log(`   持续时间: ${durationInSeconds / 60} 分钟`);

  // ─────────────────────────────────────────────────────────
  // 部署
  // ─────────────────────────────────────────────────────────

  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy(
    beneficiary,
    targetAmount,
    durationInSeconds
  );

  await crowdfunding.waitForDeployment();
  const contractAddress = await crowdfunding.getAddress();

  console.log(`\n✅ 部署成功！`);
  console.log(`📍 合约地址: ${contractAddress}`);
  console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);

  // ─────────────────────────────────────────────────────────
  // 验证
  // ─────────────────────────────────────────────────────────

  console.log(`\n📊 验证信息:`);
  const beneficiary_ = await crowdfunding.beneficiary();
  const target = await crowdfunding.targetAmount();
  const deadline = await crowdfunding.deadline();
  const raised = await crowdfunding.raisedAmount();

  console.log(`   受益人: ${beneficiary_}`);
  console.log(`   目标金额: ${hre.ethers.formatEther(target)} ETH`);
  console.log(`   截止时间: ${new Date(Number(deadline) * 1000).toLocaleString()}`);
  console.log(`   已筹集: ${hre.ethers.formatEther(raised)} ETH`);

  console.log(`\n💡 测试步骤:`);
  console.log(`   1. 用另一个账户向合约转账 ETH 测试 invest()`);
  console.log(`   2. 达到 0.01 ETH 后测试 withdraw()`);
  console.log(`   3. 或等待 5 分钟后测试 claimRefund()`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });
