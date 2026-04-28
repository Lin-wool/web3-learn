package main

import (
	"context"
	"encoding/hex"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// TokenInfo 代币信息
type TokenInfo struct {
	Name        string
	Symbol      string
	Decimals    uint8
	TotalSupply *big.Int
}

// TokenClient 代币操作客户端
type TokenClient struct {
	conn         *ethclient.Client
	contractAddr common.Address
}

// NewTokenClient 创建代币客户端
func NewTokenClient(rpcURL string, contractAddr string) (*TokenClient, error) {
	conn, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("连接失败: %w", err)
	}

	return &TokenClient{
		conn:         conn,
		contractAddr: common.HexToAddress(contractAddr),
	}, nil
}

// Close 关闭连接
func (t *TokenClient) Close() {
	if t.conn != nil {
		t.conn.Close()
	}
}

// callContract 调用只读合约方法
func (t *TokenClient) callContract(ctx context.Context, methodSig string) (string, error) {
	hash := crypto.Keccak256Hash([]byte(methodSig))
	selector := hex.EncodeToString(hash.Bytes()[:4])

	var result string
	err := t.conn.Client().CallContext(ctx, &result, "eth_call", map[string]interface{}{
		"to":   t.contractAddr.Hex(),
		"data": "0x" + selector,
	}, "latest")
	if err != nil {
		return "", err
	}

	return result, nil
}

// GetTokenInfo 获取代币信息
func (t *TokenClient) GetTokenInfo(ctx context.Context) (*TokenInfo, error) {
	// decimals()
	decimalsResult, err := t.callContract(ctx, "decimals()")
	if err != nil {
		return nil, fmt.Errorf("获取精度失败: %w", err)
	}
	decimals := uint8(parseUint256(decimalsResult).Int64())

	// totalSupply()
	totalResult, err := t.callContract(ctx, "totalSupply()")
	if err != nil {
		return nil, fmt.Errorf("获取总供应量失败: %w", err)
	}
	totalSupply := parseUint256(totalResult)

	// name()
	nameResult, err := t.callContract(ctx, "name()")
	if err != nil {
		return nil, fmt.Errorf("获取名称失败: %w", err)
	}
	name := decodeString(nameResult)

	// symbol()
	symbolResult, err := t.callContract(ctx, "symbol()")
	if err != nil {
		return nil, fmt.Errorf("获取符号失败: %w", err)
	}
	symbol := decodeString(symbolResult)

	return &TokenInfo{
		Name:        name,
		Symbol:      symbol,
		Decimals:    decimals,
		TotalSupply: totalSupply,
	}, nil
}

// GetBalance 获取代币余额
func (t *TokenClient) GetBalance(ctx context.Context, address string) (*big.Int, error) {
	addr := common.HexToAddress(address)

	// balanceOf(address) selector
	hash := crypto.Keccak256Hash([]byte("balanceOf(address)"))
	selector := hash.Bytes()[:4]

	// 编码地址参数（32字节）
	addrPadded := common.LeftPadBytes(addr.Bytes(), 32)

	var result string
	err := t.conn.Client().CallContext(ctx, &result, "eth_call", map[string]interface{}{
		"to":   t.contractAddr.Hex(),
		"data": "0x" + hex.EncodeToString(append(selector, addrPadded...)),
	}, "latest")
	if err != nil {
		return nil, fmt.Errorf("查询余额失败: %w", err)
	}

	return parseBigInt(result), nil
}

// parseUint256 解析 uint256 结果
func parseUint256(hexStr string) *big.Int {
	if len(hexStr) > 2 && hexStr[:2] == "0x" {
		hexStr = hexStr[2:]
	}
	i, ok := new(big.Int).SetString(hexStr, 16)
	if !ok {
		return big.NewInt(0)
	}
	return i
}

// parseBigInt 解析 big.Int
func parseBigInt(hexStr string) *big.Int {
	if len(hexStr) > 2 && hexStr[:2] == "0x" {
		hexStr = hexStr[2:]
	}
	i, ok := new(big.Int).SetString(hexStr, 16)
	if !ok {
		return big.NewInt(0)
	}
	return i
}

// decodeString 解码 string/bytes
func decodeString(hexStr string) string {
	if len(hexStr) > 2 && hexStr[:2] == "0x" {
		hexStr = hexStr[2:]
	}

	data, err := hex.DecodeString(hexStr)
	if err != nil {
		return ""
	}

	// 跳过前32字节偏移量，读取长度，然后读取数据
	if len(data) < 64 {
		return ""
	}

	// 读取字符串长度（从 offset 0）
	offset := new(big.Int).SetBytes(data[0:32]).Int64()
	if offset < 0 || int(offset) >= len(data) {
		return ""
	}

	// 读取长度
	strLen := new(big.Int).SetBytes(data[int(offset) : int(offset)+32]).Int64()
	if strLen <= 0 || int(offset)+32+int(strLen) > len(data) {
		return ""
	}

	// 读取字符串内容
	return string(data[int(offset)+32 : int(offset)+32+int(strLen)])
}
