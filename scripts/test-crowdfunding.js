// ============================================
// 测试众筹合约脚本
// ============================================
//
// 运行命令：npx hardhat run scripts/test-crowdfunding.js --network hardhat
//
// 注意：使用 hardhat 网络，本地模拟多个账户

import hre from "hardhat";

async function main() {
  // 获取多个测试账户
  const [deployer, investor1, investor2] = await hre.ethers.getSigners();

  // 众筹合约地址（先部署获取）
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  console.log("=== 众筹合约测试 (Hardhat Local) ===\n");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Investor1: ${investor1.address}`);
  console.log(`   Investor2: ${investor2.address}`);

  // ─────────────────────────────────────────────────────────
  // 获取合约实例
  // ─────────────────────────────────────────────────────────

  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = Crowdfunding.attach(contractAddress);

  // ─────────────────────────────────────────────────────────
  // 查询初始状态
  // ─────────────────────────────────────────────────────────

  console.log("\n📊 当前状态:");
  const beneficiary = await crowdfunding.beneficiary();
  const target = await crowdfunding.targetAmount();
  const raised = await crowdfunding.raisedAmount();
  const deadline = await crowdfunding.deadline();
  const isSuccess = await crowdfunding.isSuccess();

  console.log(`   受益人: ${beneficiary}`);
  console.log(`   目标金额: ${hre.ethers.formatEther(target)} ETH`);
  console.log(`   已筹集: ${hre.ethers.formatEther(raised)} ETH`);
  console.log(`   是否成功: ${isSuccess}`);

  // ─────────────────────────────────────────────────────────
  // 投资者1：投资 0.006 ETH
  // ─────────────────────────────────────────────────────────

  console.log("\n👤 投资者1 投资 0.006 ETH...");
  const invest1Amount = hre.ethers.parseEther("0.006");

  // 连接 investor1 的签名者发送交易
  const crowdfunding1 = crowdfunding.connect(investor1);
  const tx1 = await crowdfunding1.invest({ value: invest1Amount });
  await tx1.wait();

  const raisedAfter1 = await crowdfunding.raisedAmount();
  console.log(`   ✅ 投资成功！已筹集: ${hre.ethers.formatEther(raisedAfter1)} ETH`);

  // ─────────────────────────────────────────────────────────
  // 投资者2：投资 0.01 ETH（达到目标！）
  // ─────────────────────────────────────────────────────────

  console.log("\n👤 投资者2 投资 0.01 ETH...");
  const invest2Amount = hre.ethers.parseEther("0.01");

  const crowdfunding2 = crowdfunding.connect(investor2);
  const tx2 = await crowdfunding2.invest({ value: invest2Amount });
  await tx2.wait();

  const raisedAfter2 = await crowdfunding.raisedAmount();
  const isSuccessNow = await crowdfunding.isSuccess();
  console.log(`   ✅ 投资成功！已筹集: ${hre.ethers.formatEther(raisedAfter2)} ETH`);
  console.log(`   🎉 众筹成功！ isSuccess = ${isSuccessNow}`);

  // ─────────────────────────────────────────────────────────
  // 受益人取款
  // ─────────────────────────────────────────────────────────

  console.log("\n💰 受益人取款...");
  const balanceBefore = await hre.ethers.provider.getBalance(beneficiary);

  const crowdfundingOwner = crowdfunding.connect(deployer);
  const tx3 = await crowdfundingOwner.withdraw();
  await tx3.wait();

  const balanceAfter = await hre.ethers.provider.getBalance(beneficiary);

  console.log(`   ✅ 取款成功！`);
  console.log(`   受益人余额变化: ${hre.ethers.formatEther(balanceBefore)} → ${hre.ethers.formatEther(balanceAfter)} ETH`);

  // ─────────────────────────────────────────────────────────
  // 最终状态
  // ─────────────────────────────────────────────────────────

  console.log("\n📊 最终状态:");
  console.log(`   合约余额: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(contractAddress))} ETH`);

  console.log("\n=== 测试完成 ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 测试失败:", error);
    process.exit(1);
  });
