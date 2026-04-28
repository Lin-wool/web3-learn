package main

import (
	"context"
	"encoding/hex"
	"fmt"
	"log"
	"math/big"
	"os"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"
)

func main() {
	sendToken()
}

func sendToken() {
	err := godotenv.Load()
	if err != nil {
		log.Println("没有找到 .env 文件")
	}

	ctx := context.Background()

	rpcURL := os.Getenv("SEPOLIA_RPC_URL")
	if rpcURL == "" {
		apiKey := os.Getenv("INFURA_API_KEY")
		rpcURL = fmt.Sprintf("https://eth-sepolia.g.alchemy.com/v2/%s", apiKey)
	}

	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	fmt.Println("=== Go ERC20 代币转账 ===\n")

	// ─────────────────────────────────────────────────────────
	// 配置
	// ─────────────────────────────────────────────────────────

	// 私钥
	privateKeyHex := os.Getenv("SEPOLIA_PRIVATE_KEY")
	if privateKeyHex == "" {
		log.Fatal("需要设置 SEPOLIA_PRIVATE_KEY")
	}

	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		log.Fatal("私钥解析失败:", err)
	}

	fromAddress := crypto.PubkeyToAddress(privateKey.PublicKey)
	fmt.Printf("发送者地址: %s\n", fromAddress.Hex())

	// 代币合约地址
	tokenAddr := common.HexToAddress("0xf92a6c5CdBA97088d3D88a655284fA0A11578A8e")
	fmt.Printf("代币合约: %s\n", tokenAddr.Hex())

	// 收款地址（随便一个地址）
	toAddress := common.HexToAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD31")
	fmt.Printf("收款地址: %s\n", toAddress.Hex())

	// 转账金额：10 MLT
	decimals := 18
	amount := new(big.Int).Mul(big.NewInt(10), new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil))
	fmt.Printf("转账金额: 10 MLT (%s wei)\n", amount.String())

	// ─────────────────────────────────────────────────────────
	// 构建 data（调用 transfer 函数）
	// ─────────────────────────────────────────────────────────

	// transfer(address,uint256) 的 selector
	transferFnSig := crypto.Keccak256Hash([]byte("transfer(address,uint256)"))
	selector := transferFnSig.Bytes()[:4]

	// 编码参数
	// address: 32 bytes, 左对齐
	// uint256: 32 bytes
	toPadded := common.LeftPadBytes(toAddress.Bytes(), 32)
	amountPadded := common.LeftPadBytes(amount.Bytes(), 32)

	// 拼接: selector + to + amount
	data := append(selector, append(toPadded, amountPadded...)...)
	dataHex := "0x" + hex.EncodeToString(data)

	fmt.Printf("调用数据: %s\n", dataHex[:50]+"...")

	// ─────────────────────────────────────────────────────────
	// 获取 nonce 和 gas
	// ─────────────────────────────────────────────────────────

	nonce, err := client.NonceAt(ctx, fromAddress, nil)
	if err != nil {
		log.Fatal("获取 nonce 失败:", err)
	}
	fmt.Printf("Nonce: %d\n", nonce)

	// 估算 Gas（代币转账约 65000-80000）
	gasLimit := uint64(100000)
	fmt.Printf("Gas Limit: %d\n", gasLimit)

	// 获取当前 gas 价格
	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		log.Fatal("获取 gas 价格失败:", err)
	}
	fmt.Printf("Gas 价格: %s gwei\n", weiToEth(gasPrice))

	// ─────────────────────────────────────────────────────────
	// 构建交易
	// ─────────────────────────────────────────────────────────

	// 注意：value = 0，因为是代币转账，不是 ETH 转账
	tx := types.NewTransaction(
		nonce,
		tokenAddr,   // 目标：代币合约
		big.NewInt(0), // value = 0
		gasLimit,
		gasPrice,
		dataHex,     // 调用数据
	)

	// 签名
	chainID := big.NewInt(11155111) // Sepolia
	signedTx, err := types.SignTx(tx, types.LatestSignerForChainID(chainID), privateKey)
	if err != nil {
		log.Fatal("签名失败:", err)
	}

	fmt.Printf("交易已签名: %s\n", signedTx.Hash().Hex())

	// ─────────────────────────────────────────────────────────
	// 发送交易
	// ─────────────────────────────────────────────────────────

	err = client.SendTransaction(ctx, signedTx)
	if err != nil {
		log.Fatal("发送交易失败:", err)
	}

	fmt.Printf("\n✅ 交易已发送!\n")
	fmt.Printf("   Etherscan: https://sepolia.etherscan.io/tx/%s\n", signedTx.Hash().Hex())

	// ─────────────────────────────────────────────────────────
	// 等待打包
	// ─────────────────────────────────────────────────────────

	fmt.Println("\n等待打包...")

	receipt, err := waitForReceipt(ctx, client, signedTx.Hash())
	if err != nil {
		log.Fatal("等待打包失败:", err)
	}

	fmt.Printf("\n✅ 打包成功!\n")
	fmt.Printf("   区块: %d\n", receipt.BlockNumber)
	fmt.Printf("   状态: %s\n", status(receipt.Status))
	fmt.Printf("   Gas 使用: %d / %d\n", receipt.GasUsed, gasLimit)

	if receipt.Status == 1 {
		fmt.Printf("\n🎉 代币转账成功！\n")
		fmt.Printf("   发送了 10 MLT 到 %s\n", toAddress.Hex())
	} else {
		fmt.Printf("\n❌ 交易失败（Revert）\n")
	}
}

func waitForReceipt(ctx context.Context, client *ethclient.Client, txHash common.Hash) (*types.Receipt, error) {
	for {
		receipt, err := client.TransactionReceipt(ctx, txHash)
		if err == nil {
			return receipt, nil
		}
		if err != ethereum.NotFound {
			return nil, err
		}
	}
}

func weiToEth(wei *big.Int) string {
	divisor := new(big.Int).Exp(big.NewInt(10), big.NewInt(18), nil)
	integer := new(big.Int).Div(wei, divisor)
	return integer.String()
}

func status(s uint64) string {
	if s == 1 {
		return "成功 (1)"
	}
	return "失败 (0)"
}
