package main

import (
	"context"
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
	sendTransaction()
}

func sendTransaction() {
	// 加载 .env
	err := godotenv.Load()
	if err != nil {
		log.Println("没有找到 .env 文件")
	}

	ctx := context.Background()

	// RPC 连接
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

	fmt.Println("=== Go 发送交易 ===\n")

	// ─────────────────────────────────────────────────────────
	// 第一步：从私钥获取地址
	// ─────────────────────────────────────────────────────────

	privateKeyHex := os.Getenv("SEPOLIA_PRIVATE_KEY")
	if privateKeyHex == "" {
		log.Fatal("需要设置 SEPOLIA_PRIVATE_KEY 环境变量")
	}

	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		log.Fatal("私钥解析失败:", err)
	}

	fromAddress := crypto.PubkeyToAddress(privateKey.PublicKey)
	fmt.Printf("发送者地址: %s\n", fromAddress.Hex())

	// ─────────────────────────────────────────────────────────
	// 第二步：查询发送者余额
	// ─────────────────────────────────────────────────────────

	balance, err := client.BalanceAt(ctx, fromAddress, nil)
	if err != nil {
		log.Fatal("查询余额失败:", err)
	}
	fmt.Printf("发送前余额: %s ETH\n", weiToEth(balance))

	// ─────────────────────────────────────────────────────────
	// 第三步：构建交易
	// ─────────────────────────────────────────────────────────

	// 目标地址（你自己的钱包）
	toAddressStr := os.Getenv("WALLET_ADDRESS")
	if toAddressStr == "" {
		toAddressStr = fromAddress.Hex() // 如果没设置，就转给自己
	}
	toAddress := common.HexToAddress(toAddressStr)

	// 转账金额：0.001 ETH
	amount := new(big.Int).Mul(big.NewInt(1), big.NewInt(1e15)) // 0.001 ETH = 10^15 wei
	fmt.Printf("转账金额: %s ETH\n", weiToEth(amount))
	fmt.Printf("收款地址: %s\n", toAddress.Hex())

	// 获取 nonce（交易序号）
	nonce, err := client.NonceAt(ctx, fromAddress, nil)
	if err != nil {
		log.Fatal("获取 nonce 失败:", err)
	}
	fmt.Printf("Nonce: %d\n", nonce)

	// 估算 Gas
	gasLimit := uint64(21000) // ETH 转账固定 21000
	fmt.Printf("Gas Limit: %d\n", gasLimit)

	// 获取当前 Gas 价格
	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		log.Fatal("获取 gas 价格失败:", err)
	}
	fmt.Printf("Gas 价格: %s gwei\n", weiToEth(gasPrice))

	// ─────────────────────────────────────────────────────────
	// 第四步：构建交易对象
	// ─────────────────────────────────────────────────────────

	tx := types.NewTransaction(nonce, toAddress, amount, gasLimit, gasPrice, nil)

	// ─────────────────────────────────────────────────────────
	// 第五步：签名
	// ─────────────────────────────────────────────────────────

	signedTx, err := types.SignTx(tx, types.LatestSignerForChainID(big.NewInt(11155111)), privateKey)
	if err != nil {
		log.Fatal("签名失败:", err)
	}

	fmt.Printf("交易已签名: %s\n", signedTx.Hash().Hex())

	// ─────────────────────────────────────────────────────────
	// 第六步：发送交易
	// ─────────────────────────────────────────────────────────

	err = client.SendTransaction(ctx, signedTx)
	if err != nil {
		log.Fatal("发送交易失败:", err)
	}

	fmt.Printf("交易已发送: https://sepolia.etherscan.io/tx/%s\n", signedTx.Hash().Hex())

	// ─────────────────────────────────────────────────────────
	// 第七步：等待打包
	// ─────────────────────────────────────────────────────────

	fmt.Println("\n等待打包...")

	receipt, err := waitForReceipt(ctx, client, signedTx.Hash())
	if err != nil {
		log.Fatal("等待打包失败:", err)
	}

	fmt.Printf("\n✅ 交易成功！\n")
	fmt.Printf("   区块: %d\n", receipt.BlockNumber)
	fmt.Printf("   Gas 使用: %d\n", receipt.GasUsed)

	// ─────────────────────────────────────────────────────────
	// 第八步：验证余额变化
	// ─────────────────────────────────────────────────────────

	newBalance, err := client.BalanceAt(ctx, fromAddress, nil)
	if err != nil {
		log.Fatal("查询新余额失败:", err)
	}

	fmt.Printf("\n💰 余额变化:\n")
	fmt.Printf("   转账前: %s ETH\n", weiToEth(balance))
	fmt.Printf("   转账后: %s ETH\n", weiToEth(newBalance))

	gasUsed := new(big.Int).Mul(big.NewInt(int64(receipt.GasUsed)), gasPrice)
	totalCost := new(big.Int).Add(amount, gasUsed)
	fmt.Printf("   实际花费: %s ETH (含 gas 费)\n", weiToEth(totalCost))
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
