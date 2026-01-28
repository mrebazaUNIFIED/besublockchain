// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LoanRegistry.sol";
import "./UserRegistry.sol";

contract MarketplaceBridge is Ownable {
    LoanRegistry public loanRegistry;
    UserRegistry public userRegistry;

    address public relayerAddress;

    // Tracking de loans aprobados
    struct ApprovalData {
        bool isApproved;
        uint256 askingPrice;
        uint256 modifiedInterestRate;
        address lenderAddress;
        uint256 approvalTimestamp;
        bool isMinted;
        bool isCancelled;
    }

    mapping(string => ApprovalData) public loanApprovals;
    mapping(string => uint256) public loanToAvalancheTokenId;
    
    // ✅ NUEVO: Mapping de txHash a loanId
    mapping(bytes32 => string) public txHashToLoanId;

    // ===== EVENTOS =====
    event LoanApprovedForSale(
        string indexed loanId,
        address indexed lenderAddress,
        uint256 askingPrice,
        uint256 modifiedInterestRate,
        uint256 timestamp
    );

    event LoanApprovalCancelled(
        string indexed loanId,
        address indexed lenderAddress,
        uint256 timestamp
    );

    event AvalancheTokenIdSet(
        string indexed loanId,
        uint256 tokenId,
        uint256 timestamp
    );

    event EmergencyUnlockNeedsSync(
        string indexed loanId,
        uint256 indexed tokenId,
        uint256 timestamp
    );

    event OwnershipTransferred(
        string indexed loanId,
        address indexed newOwner,
        uint256 salePrice,
        uint256 timestamp
    );

    event PaymentRecorded(
        string indexed loanId,
        uint256 amount,
        uint256 timestamp
    );

    event LoanPaidOff(string indexed loanId, uint256 timestamp);

    constructor(
        address initialOwner,
        address _loanRegistry,
        address _userRegistry
    ) Ownable(initialOwner) {
        require(_loanRegistry != address(0), "Invalid LoanRegistry");
        require(_userRegistry != address(0), "Invalid UserRegistry");

        loanRegistry = LoanRegistry(_loanRegistry);
        userRegistry = UserRegistry(_userRegistry);
    }

    // ===== MODIFICADORES =====
    modifier onlyLender(string memory loanId) {
        LoanRegistry.Loan memory loan = loanRegistry.readLoan(loanId);
        UserRegistry.User memory user = userRegistry.getUser(msg.sender);

        require(
            keccak256(bytes(user.userId)) == keccak256(bytes(loan.UserID)),
            "Not the loan owner"
        );
        require(user.isActive, "User not active");
        _;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayerAddress, "Not authorized relayer");
        _;
    }

    // ===== FUNCIÓN PRINCIPAL: APROBAR PARA VENTA =====
    function approveLoanForSale(
        string memory loanId,
        uint256 askingPrice,
        uint256 modifiedInterestRate
    ) public onlyLender(loanId) returns (bool) {
        require(loanRegistry.loanExists(loanId), "Loan does not exist");
        require(!loanRegistry.isLoanLocked(loanId), "Loan already tokenized");
        require(!loanApprovals[loanId].isApproved, "Already approved");
        require(
            !loanApprovals[loanId].isCancelled,
            "Was cancelled, use new approval"
        );
        require(askingPrice > 0, "Invalid price");

        // Validar que el loan sea elegible
        LoanRegistry.Loan memory loan = loanRegistry.readLoan(loanId);
        require(loan.CurrentPrincipalBal > 0, "Loan balance must be > 0");
        require(
            keccak256(bytes(loan.Status)) != keccak256(bytes("Paid Off")),
            "Cannot sell paid off loan"
        );

        // Bloquear el loan en LoanRegistry
        require(loanRegistry.lockLoan(loanId), "Failed to lock loan");

        // Guardar aprobación
        loanApprovals[loanId] = ApprovalData({
            isApproved: true,
            askingPrice: askingPrice,
            modifiedInterestRate: modifiedInterestRate,
            lenderAddress: msg.sender,
            approvalTimestamp: block.timestamp,
            isMinted: false,
            isCancelled: false
        });

        emit LoanApprovedForSale(
            loanId,
            msg.sender,
            askingPrice,
            modifiedInterestRate,
            block.timestamp
        );

        return true;
    }

    // ✅ NUEVA FUNCIÓN: Registrar el txHash después de la aprobación
    function registerApprovalTxHash(
        string memory loanId,
        bytes32 txHash
    ) external onlyRelayer returns (bool) {
        require(loanApprovals[loanId].isApproved, "Loan not approved");
        require(txHash != bytes32(0), "Invalid txHash");
        
        txHashToLoanId[txHash] = loanId;
        return true;
    }

    // ✅ NUEVA FUNCIÓN: Obtener loanId desde txHash
    function getLoanIdByTxHash(
        bytes32 txHash
    ) public view returns (string memory) {
        return txHashToLoanId[txHash];
    }

    // ✅ NUEVA FUNCIÓN: Obtener ApprovalData por txHash
    function getApprovalDataByTxHash(
        bytes32 txHash
    ) public view returns (ApprovalData memory, string memory) {
        string memory loanId = txHashToLoanId[txHash];
        require(bytes(loanId).length > 0, "TxHash not found");
        
        return (loanApprovals[loanId], loanId);
    }

    // ===== CANCELAR APROBACIÓN =====
    function cancelSaleListing(
        string memory loanId
    ) public onlyLender(loanId) returns (bool) {
        ApprovalData storage approval = loanApprovals[loanId];

        require(approval.isApproved, "Not approved for sale");
        require(!approval.isMinted, "NFT already minted, cannot cancel");
        require(!approval.isCancelled, "Already cancelled");

        approval.isCancelled = true;
        approval.isApproved = false;

        require(loanRegistry.unlockLoan(loanId), "Failed to unlock loan");

        emit LoanApprovalCancelled(loanId, msg.sender, block.timestamp);
        return true;
    }

    // ===== FUNCIONES DEL RELAYER =====
    function setAvalancheTokenId(
        string memory loanId,
        uint256 tokenId
    ) public onlyRelayer returns (bool) {
        ApprovalData storage approval = loanApprovals[loanId];

        require(approval.isApproved, "Loan not approved");
        require(!approval.isCancelled, "Approval was cancelled");
        require(!approval.isMinted, "Already minted");
        require(tokenId > 0, "Invalid token ID");
        require(loanRegistry.isLoanLocked(loanId), "Loan is not locked");

        approval.isMinted = true;
        loanToAvalancheTokenId[loanId] = tokenId;

        require(
            loanRegistry.setAvalancheTokenId(loanId, tokenId),
            "Failed to set token ID"
        );

        emit AvalancheTokenIdSet(loanId, tokenId, block.timestamp);
        return true;
    }

    function recordOwnershipTransfer(
        string memory loanId,
        address newOwnerAddress,
        uint256 salePrice
    ) public onlyRelayer returns (bool) {
        require(loanRegistry.loanExists(loanId), "Loan does not exist");
        require(loanApprovals[loanId].isMinted, "NFT not minted yet");
        require(newOwnerAddress != address(0), "Invalid address");

        emit OwnershipTransferred(
            loanId,
            newOwnerAddress,
            salePrice,
            block.timestamp
        );

        return true;
    }

    function recordPayment(
        string memory loanId,
        uint256 amount
    ) public onlyRelayer returns (bool) {
        require(loanRegistry.loanExists(loanId), "Loan does not exist");
        require(amount > 0, "Invalid amount");

        emit PaymentRecorded(loanId, amount, block.timestamp);
        return true;
    }

    function markLoanAsPaidOff(
        string memory loanId
    ) external onlyRelayer returns (bool) {
        require(loanRegistry.loanExists(loanId), "Loan does not exist");
        require(loanApprovals[loanId].isMinted, "Not minted");

        LoanRegistry.Loan memory loan = loanRegistry.readLoan(loanId);
        require(
            keccak256(bytes(loan.Status)) == keccak256(bytes("Paid Off")),
            "Loan not paid off"
        );

        emit LoanPaidOff(loanId, block.timestamp);
        return true;
    }

    // ===== FUNCIONES DE VISTA =====
    function isLoanApprovedForSale(
        string memory loanId
    ) public view returns (bool) {
        ApprovalData memory approval = loanApprovals[loanId];
        return approval.isApproved && !approval.isCancelled;
    }

    function getApprovalData(
        string memory loanId
    ) public view returns (ApprovalData memory) {
        return loanApprovals[loanId];
    }

    function getAvalancheTokenId(
        string memory loanId
    ) public view returns (uint256) {
        return loanToAvalancheTokenId[loanId];
    }

    function canBeMinted(string memory loanId) public view returns (bool) {
        ApprovalData memory approval = loanApprovals[loanId];
        return
            approval.isApproved && !approval.isMinted && !approval.isCancelled;
    }

    // ===== ADMINISTRACIÓN =====
    function setRelayerAddress(address _relayer) public onlyOwner {
        require(_relayer != address(0), "Invalid address");
        relayerAddress = _relayer;
    }

    // ===== FUNCIÓN DE EMERGENCIA =====
    function emergencyUnlock(
        string memory loanId
    ) external onlyOwner returns (bool) {
        ApprovalData storage approval = loanApprovals[loanId];

        require(approval.isApproved, "Not approved");
        require(!approval.isMinted, "NFT already minted");

        uint256 tokenIdBeforeUnlock = loanToAvalancheTokenId[loanId];

        approval.isCancelled = true;
        approval.isApproved = false;

        require(loanRegistry.unlockLoan(loanId), "Failed to unlock");

        emit LoanApprovalCancelled(
            loanId,
            approval.lenderAddress,
            block.timestamp
        );

        if (tokenIdBeforeUnlock > 0) {
            emit EmergencyUnlockNeedsSync(
                loanId,
                tokenIdBeforeUnlock,
                block.timestamp
            );
        }

        return true;
    }
}