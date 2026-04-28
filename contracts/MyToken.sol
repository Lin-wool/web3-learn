// ============================================
// SPDX-License-Identifier: MIT
// ============================================
//
// Solidity 版本声明（必须写在第一行）
// version ^0.8.24 表示接受 0.8.24 到 0.9.0 之间的版本
pragma solidity ^0.8.24;

// ============================================
// 什么是 ERC20？
// ============================================
//
// ERC20 是以太坊上的代币标准
// 类似于 "Java 中的接口"，定义了所有代币必须实现的函数
//
// 主要功能：
// - transfer（转账）
// - balanceOf（查余额）
// - approve（授权）
// - transferFrom（授权转账）

// ============================================
// 简单代币合约
// ============================================
//
// 这是一个简化版的 ERC20 代币
// 用于学习目的，实际项目请使用 OpenZeppelin 的经过审计的合约库

contract MyToken {
    // ─────────────────────────────────────────────────────────
    // 状态变量（存储在区块链上）
    // ─────────────────────────────────────────────────────────

    // 代币名称（类似 "Bitcoin"、"Ethereum"）
    string public name;

    // 代币符号（类似 "BTC"、"ETH"）
    string public symbol;

    // 代币精度（决定最小分割单位）
    // 大部分代币用 18，和 ETH 一样
    uint8 public decimals;

    // 总供应量（所有代币的总量）
    uint256 public totalSupply;

    // 余额映射（类似 Java 的 HashMap）
    // key 是钱包地址，value 是代币余额
    mapping(address => uint256) public balanceOf;

    // ─────────────────────────────────────────────────────────
    // 事件（Events）
    // ─────────────────────────────────────────────────────────
    //
    // 事件用于记录区块链上的操作日志
    // 类似 "日志系统"，可以方便前端监听和查询

    // 转账事件
    event Transfer(address indexed from, address indexed to, uint256 value);

    // 发行事件
    event Mint(address indexed to, uint256 value);

    // ─────────────────────────────────────────────────────────
    // 构造函数
    // ─────────────────────────────────────────────────────────
    //
    // 合约部署时自动执行一次
    // 用于初始化代币的参数

    constructor(
        string memory _name,      // 代币名称
        string memory _symbol,    // 代币符号
        uint8 _decimals,         // 精度
        uint256 _initialSupply    // 初始发行量
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _initialSupply;

        // 初始代币全部发给合约部署者
        // msg.sender 是部署者的地址（类似 this.address）
        balanceOf[msg.sender] = _initialSupply;

        // 发出发行事件
        emit Mint(msg.sender, _initialSupply);
        emit Transfer(address(0), msg.sender, _initialSupply);
    }

    // ─────────────────────────────────────────────────────────
    // 转账函数
    // ─────────────────────────────────────────────────────────
    //
    // from: 转出方地址
    // to: 转入方地址
    // value: 转账数量

    function transfer(address to, uint256 value) public returns (bool) {
        // 检查余额是否足够
        require(balanceOf[msg.sender] >= value, "Insufficient balance");

        // 检查地址是否有效
        require(to != address(0), "Invalid recipient");

        // 执行转账
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;

        // 发出转账事件（方便前端监听）
        emit Transfer(msg.sender, to, value);

        return true;
    }

    // ─────────────────────────────────────────────────────────
    // 读取函数（view 函数，不消耗 Gas）
    // ─────────────────────────────────────────────────────────

    // 获取代币信息的函数
    function getTokenInfo() public view returns (
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply
    ) {
        return (name, symbol, decimals, totalSupply);
    }
}
