package main

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	// 加载 .env 文件
	err := godotenv.Load()
	if err != nil {
		log.Println("没有找到 .env 文件，使用环境变量")
	}

	// 从环境变量获取配置
	rpcURL := os.Getenv("SEPOLIA_RPC_URL")
	if rpcURL == "" {
		apiKey := os.Getenv("INFURA_API_KEY")
		if apiKey != "" {
			rpcURL = fmt.Sprintf("https://eth-sepolia.g.alchemy.com/v2/%s", apiKey)
		} else {
			log.Fatal("请设置 SEPOLIA_RPC_URL 或 INFURA_API_KEY 环境变量")
		}
	}

	// MyToken 合约地址（Sepolia）
	contractAddr := "0xf92a6c5CdBA97088d3D88a655284fA0A11578A8e"

	// 钱包地址
	walletAddress := os.Getenv("WALLET_ADDRESS")
	if walletAddress == "" {
		walletAddress = "0xf92a6c5CdBA97088d3D88a655284fA0A11578A8e"
	}

	fmt.Println("=== Go + Ethereum 代币查询 ===\n")

	ctx := context.Background()

	// 创建代币客户端
	tokenClient, err := NewTokenClient(rpcURL, contractAddr)
	if err != nil {
		log.Fatal(err)
	}
	defer tokenClient.Close()

	// 获取代币信息
	info, err := tokenClient.GetTokenInfo(ctx)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("📊 代币信息:\n")
	fmt.Printf("   名称: %s\n", info.Name)
	fmt.Printf("   符号: %s\n", info.Symbol)
	fmt.Printf("   精度: %d\n", info.Decimals)
	fmt.Printf("   总供应量: %s\n", formatTokenAmount(info.TotalSupply, info.Decimals))

	// 查询余额
	balance, err := tokenClient.GetBalance(ctx, walletAddress)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("\n💰 钱包余额:\n")
	fmt.Printf("   地址: %s\n", walletAddress)
	fmt.Printf("   余额: %s %s\n", formatTokenAmount(balance, info.Decimals), info.Symbol)

	fmt.Println("\n=== 测试完成 ===")
}

// formatTokenAmount 格式化代币数量
func formatTokenAmount(amount *big.Int, decimals uint8) string {
	// 10^decimals
	divisor := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil)

	// 整数部分
	integer := new(big.Int).Div(amount, divisor)

	// 小数部分
	remainder := new(big.Int).Mod(amount, divisor)

	// 如果有小数部分
	if remainder.Sign() > 0 {
		// 补齐前导零
		decimalsStr := remainder.String()
		padding := int(decimals) - len(decimalsStr)
		for i := 0; i < padding; i++ {
			decimalsStr = "0" + decimalsStr
		}
		return fmt.Sprintf("%s.%s", integer.String(), decimalsStr)
	}

	return integer.String()
}
