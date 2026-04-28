# Web3 DAPP 开发学习指南

> 本文档记录 Web3 DAPP 开发的学习过程，持续更新中...

---

## 目录

1. [区块链基础概念](#1-区块链基础概念)
2. [钱包与 MetaMask](#2-钱包与-metamask)
3. [智能合约基础](#3-智能合约基础)
4. [ERC20 代币标准](#4-erc20-代币标准)
5. [Hardhat 开发环境](#5-hardhat-开发环境)
6. [DAPP 前端开发](#6-dapp-前端开发)
7. [众筹合约](#7-众筹合约)
8. [智能合约安全问题](#8-智能合约安全问题)
9. [Go + 以太坊后端开发](#9-go--以太坊后端开发)
10. [开发工具与资源](#10-开发工具与资源)

---

## 1. 区块链基础概念

### 什么是区块链？

区块链是一个分布式账本，由多个节点共同维护，不可篡改、可追溯。

### 核心特性

| 特性 | 说明 |
|------|------|
| 去中心化 | 无需第三方机构 |
| 不可篡改 | 数据一旦上链就无法修改 |
| 可追溯 | 所有交易记录公开可查 |
| 共识机制 | 通过共识算法达成一致 |

### 区块结构

```
┌─────────────────────────────────┐
│         区块 (Block)            │
├─────────────────────────────────┤
│ 区块高度   │ 当前区块编号        │
│ 时间戳     │ 创建时间            │
│ 上一区块哈希│ 指向前一个区块      │
│ 区块哈希   │ 当前区块唯一标识    │
├─────────────────────────────────┤
│           交易数据               │
│  - 转账记录                     │
│  - 合约调用                     │
└─────────────────────────────────┘
```

### 以太坊虚拟机 (EVM)

- EVM 是运行智能合约的运行时环境
- 类似 Java 的 JVM
- 每个节点都运行 EVM，执行相同的计算

---

## 2. 钱包与 MetaMask

### 钱包核心概念

| 概念 | 说明 |
|------|------|
| 私钥 (Private Key) | 256位随机数，用于签名交易，绝对保密 |
| 公钥 (Public Key) | 由私钥推导，用于验证签名 |
| 地址 (Address) | 公钥的哈希，用于接收资产 |
| 助记词 (Mnemonic) | 12/24个单词，导出私钥的备份 |

```
私钥 → (椭圆曲线运算) → 公钥 → (Keccak256哈希) → 地址
```

### MetaMask

- 浏览器插件钱包
- 管理私钥，签名交易
- 连接 DAPP 到区块链

### 网络配置

| 网络 | Chain ID | RPC URL |
|------|----------|---------|
| Ethereum Mainnet | 1 | - |
| Sepolia Testnet | 11155111 | https://eth-sepolia.g.alchemy.com/v2/{key} |
| localhost | - | http://localhost:8545 |

---

## 3. 智能合约基础

### 什么是智能合约？

智能合约是部署在区块链上的代码，自动执行预设逻辑。

```
传统合约：法律约束 → 人工执行
智能合约：代码约束 → 自动执行
```

### Solidity 基础

#### 数据类型

| 类型 | 说明 |
|------|------|
| `uint256` / `uint` | 无符号整数 |
| `int256` / `int` | 有符号整数 |
| `bool` | 布尔值 |
| `address` | 20字节地址 |
| `string` | 字符串 |
| `bytes` | 字节数组 |
| `mapping(K => V)` | 键值对，类似 HashMap |

#### 函数修饰符

```solidity
function name() external view returns (uint) {
    // external: 外部可调用
    // view: 只读，不修改状态
    // returns: 返回值类型
}
```

| 修饰符 | 说明 |
|--------|------|
| `public` | 内外均可调用 |
| `external` | 仅外部调用 |
| `internal` | 仅内部调用 |
| `private` | 仅本合约 |
| `view` | 只读 |
| `pure` | 不读也不写 |
| `payable` | 可接收 ETH |

#### 全局变量

| 变量 | 说明 |
|------|------|
| `msg.sender` | 调用者地址 |
| `msg.value` | 调用时发送的 ETH（wei） |
| `block.timestamp` | 当前区块时间戳 |
| `block.number` | 当前区块高度 |
| `gasleft()` | 剩余 gas |

#### 错误处理

```solidity
require(condition, "error message");  // 条件不满足则回退
revert("error message");             // 无条件回退
assert(condition);                   // 用于检查永远不应该发生的错误
```

---

## 4. ERC20 代币标准

### 什么是 ERC20？

ERC20 是以太坊上的代币标准，定义了代币的基本接口。

### 核心函数

```solidity
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
```

### 事件

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed owner, address indexed spender, uint256 value);
```

### decimals 精度

- 大部分代币 `decimals = 18`
- `1 MLT = 10^18` 最小单位
- 前端显示时需要转换：`ethers.formatUnits(balance, 18)`

### 我们的 MyToken 合约

部署地址（Sepolia）：`0xf92a6c5CdBA97088d3D88a655284fA0A11578A8e`

```solidity
// 合约路径：contracts/MyToken.sol
contract MyToken {
    string public name = "My Learning Token";
    string public symbol = "MLT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value);
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
}
```

---

## 5. Hardhat 开发环境

### 项目结构

```
learn/
├── contracts/           # 智能合约源码
│   └── MyToken.sol
├── scripts/             # 部署脚本
│   └── deploy.js
├── test/                # 测试文件
├── hardhat.config.js    # Hardhat 配置
└── package.json
```

### 常用命令

```bash
npx hardhat compile      # 编译合约
npx hardhat test         # 运行测试
npx hardhat node         # 启动本地节点
npx hardhat run scripts/deploy.js --network sepolia  # 部署到 Sepolia
```

### 配置示例

```javascript
// hardhat.config.js
import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};
```

### 部署脚本模板

```javascript
import hre from "hardhat";

async function main() {
  const MyContract = await hre.ethers.getContractFactory("MyContract");
  const contract = await MyContract.deploy(arg1, arg2);
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`Deployed to: ${address}`);
}

main().then(() => process.exit(0)).catch(console.error);
```

---

## 6. DAPP 前端开发

### ethers.js 核心概念

| 概念 | 说明 |
|------|------|
| BrowserProvider | 连接 MetaMask |
| Signer | 签名交易，管理账户 |
| Contract | 合约实例，调用函数 |

### 连接 MetaMask

```typescript
const provider = new ethers.BrowserProvider(window.ethereum);
const accounts = await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();
const address = await signer.getAddress();
```

### ETH 转账

```typescript
const tx = await signer.sendTransaction({
  to: toAddress,
  value: ethers.parseEther("0.01")  // 0.01 ETH
});
await tx.wait();  // 等待打包
```

### ERC20 代币操作

```typescript
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

// 查余额
const balance = await contract.balanceOf(address);
const formatted = ethers.formatUnits(balance, 18);

// 转账
const contractWithSigner = contract.connect(signer);
const tx = await contractWithSigner.transfer(to, ethers.parseUnits("100", 18));
await tx.wait();
```

### Read vs Write 操作

| 类型 | Gas | 是否签名 | 示例 |
|------|-----|----------|------|
| Read | 免费 | 不需要 | `balanceOf()`, `totalSupply()` |
| Write | 需要 | 需要 | `transfer()`, `mint()` |

---

## 7. 众筹合约

### 合约地址

部署地址（Sepolia）：`0x982b51BAA1Dae18f8f9d6e7e16C691491386aA9B`

### 合约路径

`contracts/Crowdfunding.sol`

### 核心逻辑

```
投资者 ──invest()──▶ 合约账户
                         │
        ┌────────────────┴────────────────┐
        │                                 │
    达到目标？                         未达目标？
        │                                 │
        ▼                                 ▼
  withdraw() 可取款                  claimRefund() 可退款
  (受益人调用)                      (投资者调用)
```

### 核心函数

| 函数 | 调用者 | 说明 |
|------|--------|------|
| `invest()` | 投资者 | 参与众筹，支付 ETH |
| `withdraw()` | 受益人 | 成功后取走资金 |
| `claimRefund()` | 投资者 | 失败后退款 |
| `close()` | 任意人 | 触发结束众筹 |

### 状态变量

```solidity
address public beneficiary;           // 受益人
uint256 public targetAmount;         // 目标金额
uint256 public deadline;             // 截止时间
uint256 public raisedAmount;         // 已筹集
bool public isSuccess;               // 是否成功
mapping(address => uint256) investors;// 投资记录
```

---

## 8. 智能合约安全问题

### 8.1 重入攻击 (Reentrancy)

**原理：** 调用外部合约时，外部合约可能回调原合约，造成状态未更新就被再次调用。

**错误写法：**
```solidity
function withdraw() external {
    (bool sent, ) = msg.sender.call{value: balances[msg.sender]}("");
    balances[msg.sender] = 0;  // 转账后才清零，危险！
}
```

**正确写法（检查-生效-交互）：**
```solidity
function withdraw() external {
    uint256 amount = balances[msg.sender];
    require(amount > 0);
    balances[msg.sender] = 0;  // 先清零
    (bool sent, ) = msg.sender.call{value: amount}("");
    require(sent);
}
```

### 8.2 整数溢出

- Solidity 0.8+ 自动检查溢出
- 0.8 之前需要使用 SafeMath

### 8.3 权限控制

```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}

function changeOwner(address newOwner) external onlyOwner {
    owner = newOwner;
}
```

### 8.4 DoS 拒绝服务

**问题：** 循环遍历可能导致 gas 耗尽

**解决方案：** 使用 Pull Payment，让用户主动领取

```solidity
// 不推荐：主动转账
function refundAll() external {
    for (uint i = 0; i < investors.length; i++) {  // 可能 gas 超限
        payable(investors[i]).transfer(investors[investor]);
    }
}

// 推荐：用户自己来领
function claimRefund() external {
    uint256 amount = refunds[msg.sender];
    require(amount > 0);
    refunds[msg.sender] = 0;
    payable(msg.sender).transfer(amount);
}
```

### 8.5 Front-Running 抢先攻击

**场景：** 取消竞拍价时被抢先提交更高价

**防护：** 使用暗标（commit-reveal）机制

### 8.6 精确度问题

```solidity
// 错误
uint256 reward = principal * rate / 100;

// 正确：先乘后除，使用高精度
uint256 multiplier = 10 ** 18;
uint256 reward = principal * rate * multiplier / 100 / multiplier;
```

### 8.7 随机数安全

**链上随机数可被预测！**

```solidity
// 危险：使用 block.timestamp 等作为随机源
uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp)));

// 解决方案：使用 Chainlink VRF
```

### 8.8 签名验证问题

**重放攻击：** 同一签名可在不同链上重复使用

**防护：** 在签名消息中加入 `chainId`

```solidity
bytes32 hash = keccak256(abi.encodePacked(message, block.chainid));
```

### 8.9 transfer vs send vs call

| 方法 | gas限制 | 失败处理 | 推荐 |
|------|---------|----------|------|
| `transfer` | 2300 | 自动revert | ❌ 不推荐 |
| `send` | 2300 | 需检查返回值 | ❌ 不用 |
| `call` | 全部 | 需检查返回值 | ✅ 推荐 |

**注意：** `call` 更灵活但更危险，必须先清零再转账。

### 8.10 时间戳依赖

```solidity
// 危险
require(block.timestamp >= endTime);

// 修复：增加时间窗口
require(block.timestamp >= endTime + 15 seconds);
```

### 8.11 初始化问题

**防护：** 使用 OpenZeppelin 的 Initializable

```solidity
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

function initialize(address _owner) external initializer {
    owner = _owner;
}
```

---

## 9. Go + 以太坊后端开发

### Go 区块链库

| 库 | 说明 |
|-----|------|
| go-ethereum | 以太坊官方Go实现，最全面 |
| abigen | 从 ABI 生成 Go 代码 |

### 项目结构

```
blockchain-service/
├── main.go           # 入口
├── client.go         # 区块链连接
├── token.go          # 代币操作
├── go.mod            # Go 模块文件
└── .env              # 环境变量
```

### 连接区块链

```go
import "github.com/ethereum/go-ethereum/ethclient"

client, err := ethclient.Dial("https://eth-sepolia.g.alchemy.com/v2/KEY")
if err != nil {
    log.Fatal(err)
}
defer client.Close()

// 获取区块高度
block, _ := client.BlockNumber(context.Background())
fmt.Printf("区块: %d\n", block)
```

### 查询余额

```go
address := common.HexToAddress("0x...")
balance, _ := client.BalanceAt(context.Background(), address, nil)
fmt.Printf("余额: %s wei\n", balance.String())
```

### 调用合约（只读）

```go
// keccak256("functionName(args)")[:4] 得到 method selector
hash := crypto.Keccak256Hash([]byte("balanceOf(address)"))
selector := hash.Bytes()[:4]

// 编码参数
addrPadded := common.LeftPadBytes(address.Bytes(), 32)

// eth_call
var result string
err = client.Client().CallContext(ctx, &result, "eth_call", map[string]interface{}{
    "to":   contractAddress,
    "data": "0x" + hex.EncodeToString(append(selector, addrPadded...)),
}, "latest")
```

### 关键对比

| ethers.js | go-ethereum |
|----------|-------------|
| BrowserProvider | ethclient.Dial |
| Contract | bindings.NewXxx 或手动 call |
| signer.sendTransaction | contract.Function(auth, ...) |
| tx.wait() | bind.WaitMined |

### 环境变量

```bash
# .env 文件
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
WALLET_ADDRESS=0x...
```

### 常用命令

```bash
# 初始化 Go 模块
go mod init blockchain-service

# 安装依赖
GOPROXY=https://goproxy.cn,direct go get github.com/ethereum/go-ethereum@latest

# 运行
go run .

# 编译
go build -o blockchain-service.exe
```

---

## 10. 开发工具与资源

### 开发框架

| 框架 | 说明 |
|------|------|
| Hardhat | 主流开发框架，支持本地节点、编译、测试 |
| Foundry | 高性能 Rust 实现，测试速度快 |
| Truffle | 老牌框架，逐渐被 Hardhat 取代 |

### 合约库

| 库 | 说明 |
|-----|------|
| OpenZeppelin Contracts | 经过审计的安全库，推荐使用 |
| Chainlink | 预言机，提供 VRF 等服务 |

### 学习资源

| 资源 | 链接 |
|------|------|
| Solidity 文档 | https://docs.soliditylang.org |
| ethers.js 文档 | https://docs.ethers.org |
| Hardhat 文档 | https://hardhat.org/docs |
| OpenZeppelin | https://openzeppelin.com/contracts |

### 安全工具

| 工具 | 说明 |
|------|------|
| Slither | 静态分析，自动检测漏洞 |
| Mythril | 符号执行分析 |
| Echidna | 模糊测试 |

---

## 11. 拍卖合约 (Auction Contract)

### 拍卖核心逻辑

```
卖家发布拍卖
     │
     ▼
┌─────────────────────────────────┐
│        拍卖进行中               │
│  买家竞价 > 当前最高价           │
│  → 更新最高价 + 退款上一赢家      │
└─────────────────────────────────┘
     │
     ▼ (到达截止时间)
┌─────────────────────────────────┐
│        拍卖结束                 │
│  最高价买家赢得拍卖              │
│  卖家获得 ETH                   │
└─────────────────────────────────┘
```

### 合约状态机

```
NotStarted ──startAuction()──► Running ──endAuction()──► Ended
     │                              │
     │                              │ (时间到自动结束)
     │                              │
     └──────────────────────────────┘
```

### 英式拍卖合约

```solidity
// contracts/EnglishAuction.sol
contract EnglishAuction {
    enum AuctionState { NotStarted, Running, Ended }

    address public seller;
    uint256 public startPrice;
    uint256 public highestBid;
    address public highestBidder;
    uint256 public biddingEndTime;
    AuctionState public state;

    mapping(address => uint256) public pendingReturns;

    modifier onlyWhileRunning() {
        require(state == AuctionState.Running);
        require(block.timestamp < biddingEndTime);
        _;
    }

    constructor(uint256 _startPrice, uint256 _duration) {
        seller = msg.sender;
        startPrice = _startPrice;
        state = AuctionState.NotStarted;
        biddingEndTime = 0;
    }

    function startAuction(uint256 _duration) external {
        require(state == AuctionState.NotStarted);
        state = AuctionState.Running;
        biddingEndTime = block.timestamp + _duration;
    }

    function bid() external payable onlyWhileRunning {
        require(msg.value > highestBid);
        if (highestBidder != address(0)) {
            pendingReturns[highestBidder] += highestBid;
        }
        highestBid = msg.value;
        highestBidder = msg.sender;
    }

    function withdraw() external {
        uint256 amount = pendingReturns[msg.sender];
        pendingReturns[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function endAuction() external onlyWhileRunning {
        require(block.timestamp >= biddingEndTime);
        state = AuctionState.Ended;
        if (highestBidder != address(0)) {
            payable(seller).transfer(highestBid);
        }
    }
}
```

### 防抢先出价（Sniping）

| 方案 | 实现 |
|------|------|
| 动态开始时间 | 结束时间 = 调用 startAuction 时计算 |
| 延时结束 | 最后 N 分钟出价，时间自动延长 |
| 暗标拍卖 | 先提交哈希，时间到了再揭示 |

### 拍卖类型

| 类型 | 特点 |
|------|------|
| 英式拍卖 | 价格递增，价高者得 |
| 荷兰式拍卖 | 价格递减 |
| 密封拍卖 | 同时提交，最后公开 |
| Vickrey拍卖 | 密封 + 二价支付 |

---

## 12. 签名与钱包安全

### 私钥存储对比

| 场景 | 私钥位置 | 安全性 |
|------|----------|--------|
| Go 后端直接存储 | 代码/服务器 | ⚠️ 风险高 |
| 前端 MetaMask | 用户本地浏览器 | ✅ 安全 |
| 硬件钱包 | 专用物理设备 | ✅✅ 最安全 |

### 前端签名流程

```
用户浏览器          MetaMask            区块链
    │                  │                  │
    │ eth_requestAccounts              │
    ├─────────────────►│                  │
    │◄─────────────────┤                  │
    │                  │                  │
    │ sendTransaction{...}              │
    ├─────────────────►│                  │ （弹出确认框）
    │                  │ 签名并发送        │
    │                  ├────────────────►│
    │◄─────────────────┤                  │
    │ 返回 tx.hash()   │                  │
```

### 关键代码

```javascript
// 1. 连接 MetaMask
const provider = new ethers.BrowserProvider(window.ethereum)
await provider.send("eth_requestAccounts", [])
const signer = await provider.getSigner()

// 2. 发送交易（MetaMask 自动弹出确认）
const tx = await signer.sendTransaction({
    to: "0x...",
    value: ethers.parseEther("0.001")
})

// 3. 等待打包
await tx.wait()
```

### 后端角色划分

| 后端类型 | 职责 | 涉及私钥 |
|----------|------|----------|
| 数据索引 | 读取链上数据，提供快速查询 | ❌ |
| 交易提交 | 帮前端转发已签名交易 | ❌ |
| 自动化脚本 | 定时任务、服务器直接操作 | ✅ |

---

## 附录

### 常用命令速查

```bash
# 编译合约
npx hardhat compile

# 部署到 Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# 部署到本地节点
npx hardhat run scripts/deploy.js --network hardhat

# 启动本地节点
npx hardhat node

# 清理缓存重新编译
npx hardhat clean && npx hardhat compile
```

### 关键地址

| 项目 | 地址 | 网络 |
|------|------|------|
| MyToken | `0xf92a6c5CdBA97088d3D88a655284fA0A11578A8e` | Sepolia |
| Crowdfunding | `0x982b51BAA1Dae18f8f9d6e7e16C691491386aA9B` | Sepolia |

---

*文档更新时间：2026-04-27（新增拍卖合约、签名机制章节）*
