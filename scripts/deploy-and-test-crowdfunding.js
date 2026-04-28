// ============================================
// 部署并测试众筹合约脚本
// ============================================
//
// 运行命令：npx hardhat run scripts/deploy-and-test-crowdfunding.js --network hardhat

import hre from "hardhat";

async function main() {
  // 获取多个测试账户
  const [deployer, investor1, investor2] = await hre.ethers.getSigners();

  console.log("=== 众筹合约部署+测试 ===\n");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Investor1: ${investor1.address}`);
  console.log(`   Investor2: ${investor2.address}`);

  // ─────────────────────────────────────────────────────────
  // 部署合约
  // ─────────────────────────────────────────────────────────

  console.log("\n📦 部署合约...");

  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy(
    deployer.address,                 // 受益人
    hre.ethers.parseEther("0.01"),   // 目标 0.01 ETH
    5 * 60                            // 5分钟
  );

  await crowdfunding.waitForDeployment();
  const contractAddress = await crowdfunding.getAddress();

  console.log(`   ✅ 部署成功！地址: ${contractAddress}`);

  // ─────────────────────────────────────────────────────────
  // 查询初始状态
  // ─────────────────────────────────────────────────────────

  console.log("\n📊 初始状态:");
  console.log(`   受益人: ${await crowdfunding.beneficiary()}`);
  console.log(`   目标: ${hre.ethers.formatEther(await crowdfunding.targetAmount())} ETH`);
  console.log(`   已筹集: ${hre.ethers.formatEther(await crowdfunding.raisedAmount())} ETH`);
  console.log(`   是否成功: ${await crowdfunding.isSuccess()}`);

  // ─────────────────────────────────────────────────────────
  // 投资者1：投资 0.006 ETH
  // ─────────────────────────────────────────────────────────

  console.log("\n👤 投资者1 投资 0.006 ETH...");

  const invest1Tx = await crowdfunding.connect(investor1).invest({
    value: hre.ethers.parseEther("0.006")
  });
  await invest1Tx.wait();

  console.log(`   ✅ 投资成功！`);
  console.log(`   已筹集: ${hre.ethers.formatEther(await crowdfunding.raisedAmount())} ETH`);
  console.log(`   是否成功: ${await crowdfunding.isSuccess()}`);

  // ─────────────────────────────────────────────────────────
  // 投资者2：投资 0.01 ETH（达到目标！）
  // ─────────────────────────────────────────────────────────

  console.log("\n👤 投资者2 投资 0.01 ETH...");

  const invest2Tx = await crowdfunding.connect(investor2).invest({
    value: hre.ethers.parseEther("0.01")
  });
  await invest2Tx.wait();

  const raisedNow = await crowdfunding.raisedAmount();
  const isSuccessNow = await crowdfunding.isSuccess();

  console.log(`   ✅ 投资成功！`);
  console.log(`   已筹集: ${hre.ethers.formatEther(raisedNow)} ETH`);
  console.log(`   🎉 众筹成功！ isSuccess = ${isSuccessNow}`);

  // ─────────────────────────────────────────────────────────
  // 受益人取款
  // ─────────────────────────────────────────────────────────

  console.log("\n💰 受益人取款...");

  const balanceBefore = await hre.ethers.provider.getBalance(deployer.address);

  const withdrawTx = await crowdfunding.connect(deployer).withdraw();
  await withdrawTx.wait();

  const balanceAfter = await hre.ethers.provider.getBalance(deployer.address);
  const contractBalance = await hre.ethers.provider.getBalance(contractAddress);

  console.log(`   ✅ 取款成功！`);
  console.log(`   受益人余额变化:`);
  console.log(`     ${hre.ethers.formatEther(balanceBefore)} → ${hre.ethers.formatEther(balanceAfter)} ETH`);
  console.log(`   合约剩余余额: ${hre.ethers.formatEther(contractBalance)} ETH`);

  console.log("\n=== 测试完成 ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 失败:", error);
    process.exit(1);
  });
