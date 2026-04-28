package main

import (
	"context"
	"fmt"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Client 区块链连接客户端
type Client struct {
	RPCURL string
	conn   *ethclient.Client
}

// NewClient 创建新的区块链客户端
func NewClient(rpcURL string) (*Client, error) {
	conn, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("连接区块链失败: %w", err)
	}

	return &Client{
		RPCURL: rpcURL,
		conn:   conn,
	}, nil
}

// Close 关闭连接
func (c *Client) Close() {
	if c.conn != nil {
		c.conn.Close()
	}
}

// GetClient 获取原生 ethclient
func (c *Client) GetClient() *ethclient.Client {
	return c.conn
}

// GetBlockNumber 获取当前区块高度
func (c *Client) GetBlockNumber() (uint64, error) {
	ctx := context.Background()
	block, err := c.conn.BlockNumber(ctx)
	if err != nil {
		return 0, fmt.Errorf("获取区块高度失败: %w", err)
	}
	return block, nil
}

// GetBalance 获取地址余额（返回 wei 字符串）
func (c *Client) GetBalance(address string) (string, error) {
	ctx := context.Background()
	addr := common.HexToAddress(address)
	balance, err := c.conn.BalanceAt(ctx, addr, nil)
	if err != nil {
		return "", fmt.Errorf("查询余额失败: %w", err)
	}
	return balance.String(), nil
}

// GetChainID 获取链ID
func (c *Client) GetChainID() (string, error) {
	ctx := context.Background()
	chainID, err := c.conn.ChainID(ctx)
	if err != nil {
		return "", fmt.Errorf("获取链ID失败: %w", err)
	}
	return chainID.String(), nil
}
