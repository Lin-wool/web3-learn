// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * 众筹智能合约
 *
 * 流程：
 * 1. 部署时设置目标金额和截止时间
 * 2. 投资者调用 invest() 参与众筹
 * 3. 众筹成功后，发起人调用 withdraw() 取款
 * 4. 众筹失败后，投资者调用 claimRefund() 退款
 */
contract Crowdfunding {
    // ─────────────────────────────────────────────────────────
    // 状态变量
    // ─────────────────────────────────────────────────────────

    // 众筹发起人（收款人）
    address public beneficiary;

    // 目标金额（以 wei 为单位）
    uint256 public targetAmount;

    // 截止时间（Unix时间戳）
    uint256 public deadline;

    // 已筹集金额
    uint256 public raisedAmount;

    // 众筹是否成功（达到目标）
    bool public isSuccess;

    // 众筹是否已结束
    bool public isClosed;

    // 投资者地址 => 投资金额
    mapping(address => uint256) public investors;

    // 投资者列表（用于退款）
    address[] public investorList;

    // ─────────────────────────────────────────────────────────
    // 事件
    // ─────────────────────────────────────────────────────────

    // 投资事件
    event Invested(address investor, uint256 amount);

    // 提款事件（成功后发起人取款）
    event Withdrawn(address beneficiary, uint256 amount);

    // 退款事件
    event Refunded(address investor, uint256 amount);

    // ─────────────────────────────────────────────────────────
    // 构造函数
    // ─────────────────────────────────────────────────────────

    constructor(
        address _beneficiary,
        uint256 _targetAmount,
        uint256 _durationInSeconds
    ) {
        beneficiary = _beneficiary;
        targetAmount = _targetAmount;
        deadline = block.timestamp + _durationInSeconds;
        isSuccess = false;
        isClosed = false;
        raisedAmount = 0;
    }

    // ─────────────────────────────────────────────────────────
    // 投资函数
    // ─────────────────────────────────────────────────────────

    /**
     * 投资者参与众筹
     * 支付 ETH 来支持项目
     */
    function invest() external payable {
        // 检查：众筹是否已结束
        require(!isClosed, "Crowdfunding is closed");

        // 检查：是否在截止时间前
        require(block.timestamp < deadline, "Crowdfunding ended");

        // 检查：投资金额必须大于 0
        require(msg.value > 0, "Amount must be greater than 0");

        // 记录投资金额
        investors[msg.sender] += msg.value;
        raisedAmount += msg.value;

        // 如果是新增投资者（非复投），加入列表
        if (investors[msg.sender] == msg.value) {
            investorList.push(msg.sender);
        }

        // 检查是否达到目标
        if (raisedAmount >= targetAmount) {
            isSuccess = true;
        }

        emit Invested(msg.sender, msg.value);
    }

    // ─────────────────────────────────────────────────────────
    // 发起人取款（众筹成功后）
    // ─────────────────────────────────────────────────────────

    /**
     * 众筹成功后，发起人调用此函数取款
     */
    function withdraw() external {
        // 检查：只有发起人可以调用
        require(msg.sender == beneficiary, "Only beneficiary can withdraw");

        // 检查：必须达到目标（达到目标就可以取款）
        require(isSuccess, "Target not reached");

        // 检查：众筹已结束（到达截止时间 OR 达到目标）
        require(isClosed || block.timestamp >= deadline || raisedAmount >= targetAmount, "Crowdfunding not ended");

        // 检查：还没取过款
        require(address(this).balance > 0, "Nothing to withdraw");

        uint256 amount = address(this).balance;

        // 转账给发起人
        (bool sent, ) = beneficiary.call{value: amount}("");
        require(sent, "Transfer failed");

        emit Withdrawn(beneficiary, amount);
    }

    // ─────────────────────────────────────────────────────────
    // 退款（众筹失败后）
    // ─────────────────────────────────────────────────────────

    /**
     * 众筹失败后，投资者调用此函数退款
     */
    function claimRefund() external {
        // 检查：众筹已结束且未达到目标
        require(isClosed || block.timestamp >= deadline, "Crowdfunding not ended");
        require(!isSuccess, "Cannot refund when successful");

        // 检查：该投资者有投资记录
        uint256 invested = investors[msg.sender];
        require(invested > 0, "No investment found");

        // 把投资者的投资记录清零
        investors[msg.sender] = 0;

        // 退款
        (bool sent, ) = msg.sender.call{value: invested}("");
        require(sent, "Refund failed");

        emit Refunded(msg.sender, invested);
    }

    // ─────────────────────────────────────────────────────────
    // 关闭众筹（手动触发）
    // ─────────────────────────────────────────────────────────

    /**
     * 众筹结束后，任意人可以调用此函数
     * 用于更新状态，让投资者可以退款
     */
    function close() external {
        require(block.timestamp >= deadline, "Not yet ended");
        require(!isClosed, "Already closed");

        isClosed = true;

        // 重新检查是否成功
        if (raisedAmount >= targetAmount) {
            isSuccess = true;
        }
    }

    // ─────────────────────────────────────────────────────────
    // 查询函数
    // ─────────────────────────────────────────────────────────

    // 获取合约当前余额
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // 获取投资者数量
    function getInvestorCount() external view returns (uint256) {
        return investorList.length;
    }

    // 获取某个投资者的投资金额
    function getInvestment(address investor) external view returns (uint256) {
        return investors[investor];
    }
}
