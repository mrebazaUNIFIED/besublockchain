// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./UserRegistry.sol";

contract LoanRegistry is Ownable {
    UserRegistry public userRegistry;
    address public marketplaceBridge;

    struct Loan {
        string ID;
        string UserID;
        string BorrowerFullName;
        string BorrowerHomePhone;
        string BorrowerPropertyAddress;
        string BorrowerState;
        string BorrowerZip;
        string BorrowerCity;
        string BorrowerEmail;
        string BorrowerOccupancyStatus;
        uint256 CurrentPrincipalBal;
        uint256 RestrictedFunds;
        uint256 SuspenseBalance;
        uint256 EscrowBalance;
        uint256 TotalInTrust;
        uint256 NoteRate;
        uint256 SoldRate;
        uint256 DefaultRate;
        uint256 UnpaidInterest;
        uint256 UnpaidFees;
        uint256 LateFeesAmount;
        uint256 UnpaidLateFees;
        uint256 AccruedLateFees;
        uint256 UnpaidLoanCharges;
        uint256 DeferredPrincBalance;
        uint256 DeferredUnpCharges;
        uint256 OriginalLoanAmount;
        string OriginationDate;
        string NextPaymentDue;
        string LoanMaturityDate;
        string LastPaymentRec;
        string InterestPaidTo;
        uint256 DeferredUnpaidInt;
        uint256 FCIRestrictedPrincipal;
        uint256 FCIRestrictedInterest;
        uint256 PymtGraceDays;
        uint256 DaysSinceLastPymt;
        uint256 NumOfPymtsDue;
        uint256 ScheduledPayment;
        uint256 PromisesToPay;
        uint256 NFSInLast12Months;
        uint256 DeferredLateFees;
        uint256 InvestorRestrictedPrincipal;
        uint256 InvestorRestrictedInterest;
        string Status;
        string LUid;
        bytes32 TxId;
        uint256 BLOCKAUDITCreationAt;
        uint256 BLOCKAUDITUpdatedAt;
        bool exists;
        uint256 avalancheTokenId;
        uint256 lastSyncTimestamp;
        bool isLocked;
    }

    struct Change {
        string PropertyName;
        string OldValue;
        string NewValue;
    }

    struct LoanActivity {
        bytes32 TxId;
        string LoanInformationId;
        Change[] Changes;
        uint256 Timestamp;
    }

    struct LoanHistoryEntry {
        bytes32 TxId;
        uint256 Timestamp;
        bool IsDelete;
    }

    // ===== NUEVO: Struct para actualizaciones parciales =====
    struct LoanUpdateFields {
        bool updateCurrentPrincipalBal;
        uint256 CurrentPrincipalBal;
        
        bool updateUnpaidInterest;
        uint256 UnpaidInterest;
        
        bool updateStatus;
        string Status;
        
        bool updateLastPaymentRec;
        string LastPaymentRec;
        
        bool updateDaysSinceLastPymt;
        uint256 DaysSinceLastPymt;
        
        bool updateNumOfPymtsDue;
        uint256 NumOfPymtsDue;
        
        bool updateNextPaymentDue;
        string NextPaymentDue;
        
        bool updateUnpaidFees;
        uint256 UnpaidFees;
        
        bool updateLateFeesAmount;
        uint256 LateFeesAmount;
        
        bool updateNoteRate;
        uint256 NoteRate;
        
        bool updateBorrowerFullName;
        string BorrowerFullName;
        
        bool updateBorrowerPropertyAddress;
        string BorrowerPropertyAddress;
        
        bool updateBorrowerEmail;
        string BorrowerEmail;
        
        bool updateBorrowerHomePhone;
        string BorrowerHomePhone;
        
        bool updateBorrowerCity;
        string BorrowerCity;
        
        bool updateBorrowerState;
        string BorrowerState;
        
        bool updateBorrowerZip;
        string BorrowerZip;
    }

    // Mappings principales
    mapping(string => Loan) private loans;
    mapping(string => string[]) private loanHistoryIds;
    mapping(string => Loan) private loanHistory;
    mapping(bytes32 => LoanActivity) private activities;
    mapping(string => bytes32[]) private loanTransactions;
    mapping(string => string[]) private userIdToLoanIds;
    mapping(string => string) private luidToLoanId;
    mapping(bytes32 => string) private txIdToLoanId;
    string[] private allLoanIds;

    event LoanCreated(string indexed loanId, string indexed userId, bytes32 txId, uint256 timestamp);
    event LoanUpdated(string indexed loanId, bytes32 txId, uint256 changeCount);
    event LoanDeleted(string indexed loanId, bytes32 txId);
    event LoanLocked(string indexed loanId, uint256 timestamp);
    event LoanUnlocked(string indexed loanId, uint256 timestamp);
    event AvalancheTokenIdSet(string indexed loanId, uint256 tokenId, uint256 timestamp);
    event LockedLoanUpdated(string indexed loanId, uint256 newBalance, string newStatus, uint256 timestamp);

    constructor(address initialOwner, address userRegistryAddress) Ownable(initialOwner) {
        require(userRegistryAddress != address(0), "UserRegistry address required");
        userRegistry = UserRegistry(userRegistryAddress);
    }

    modifier onlyAuthorized() {
        if (msg.sender != owner()) {
            UserRegistry.User memory user = userRegistry.getUser(msg.sender);
            require(user.isActive, "User not active");
            bytes32 roleHash = keccak256(bytes(user.role));
            require(
                roleHash == keccak256(bytes("operator")) || roleHash == keccak256(bytes("admin")),
                "Not authorized: must be operator or admin"
            );
        }
        _;
    }

    modifier onlyBridge() {
        require(msg.sender == marketplaceBridge, "Only MarketplaceBridge");
        _;
    }

    function setMarketplaceBridge(address _bridge) external onlyOwner {
        require(_bridge != address(0), "Invalid bridge address");
        marketplaceBridge = _bridge;
    }

    function lockLoan(string memory loanId) external onlyBridge returns (bool) {
        require(loans[loanId].exists, "Loan does not exist");
        require(!loans[loanId].isLocked, "Already locked");
        require(loans[loanId].CurrentPrincipalBal > 0, "Loan balance must be > 0");
        require(keccak256(bytes(loans[loanId].Status)) != keccak256(bytes("Paid Off")), "Cannot tokenize paid off loan");

        loans[loanId].isLocked = true;
        emit LoanLocked(loanId, block.timestamp);
        return true;
    }

    function unlockLoan(string memory loanId) external onlyBridge returns (bool) {
        require(loans[loanId].exists, "Loan does not exist");
        require(loans[loanId].isLocked, "Not locked");

        loans[loanId].isLocked = false;
        loans[loanId].avalancheTokenId = 0;

        emit LoanUnlocked(loanId, block.timestamp);
        return true;
    }

    function setAvalancheTokenId(string memory loanId, uint256 tokenId) external onlyBridge returns (bool) {
        require(loans[loanId].exists, "Loan does not exist");
        require(loans[loanId].isLocked, "Loan must be locked first");
        require(tokenId > 0, "Invalid token ID");
        require(loans[loanId].avalancheTokenId == 0, "Token ID already set");

        loans[loanId].avalancheTokenId = tokenId;
        loans[loanId].lastSyncTimestamp = block.timestamp;

        emit AvalancheTokenIdSet(loanId, tokenId, block.timestamp);
        return true;
    }

    function updateSyncTimestamp(string memory loanId) external onlyBridge returns (bool) {
        require(loans[loanId].exists, "Loan does not exist");
        loans[loanId].lastSyncTimestamp = block.timestamp;
        return true;
    }

    // ===== NUEVA FUNCIÓN: Actualización Parcial =====
    function updateLoanPartial(
        string memory loanId,
        LoanUpdateFields memory fields
    ) public onlyAuthorized returns (bytes32) {
        require(loans[loanId].exists, "Loan does not exist");
        require(!loans[loanId].isLocked, "Cannot update locked loan");

        bytes32 txId = keccak256(
            abi.encodePacked(block.timestamp, block.number, loanId, "PARTIAL_UPDATE")
        );

        Loan memory oldLoan = loans[loanId];
        Loan storage currentLoan = loans[loanId];

        // Aplicar solo los campos que se marcaron para actualizar
        if (fields.updateCurrentPrincipalBal) {
            currentLoan.CurrentPrincipalBal = fields.CurrentPrincipalBal;
        }
        if (fields.updateUnpaidInterest) {
            currentLoan.UnpaidInterest = fields.UnpaidInterest;
        }
        if (fields.updateStatus) {
            currentLoan.Status = fields.Status;
        }
        if (fields.updateLastPaymentRec) {
            currentLoan.LastPaymentRec = fields.LastPaymentRec;
        }
        if (fields.updateDaysSinceLastPymt) {
            currentLoan.DaysSinceLastPymt = fields.DaysSinceLastPymt;
        }
        if (fields.updateNumOfPymtsDue) {
            currentLoan.NumOfPymtsDue = fields.NumOfPymtsDue;
        }
        if (fields.updateNextPaymentDue) {
            currentLoan.NextPaymentDue = fields.NextPaymentDue;
        }
        if (fields.updateUnpaidFees) {
            currentLoan.UnpaidFees = fields.UnpaidFees;
        }
        if (fields.updateLateFeesAmount) {
            currentLoan.LateFeesAmount = fields.LateFeesAmount;
        }
        if (fields.updateNoteRate) {
            currentLoan.NoteRate = fields.NoteRate;
        }
        if (fields.updateBorrowerFullName) {
            currentLoan.BorrowerFullName = fields.BorrowerFullName;
        }
        if (fields.updateBorrowerPropertyAddress) {
            currentLoan.BorrowerPropertyAddress = fields.BorrowerPropertyAddress;
        }
        if (fields.updateBorrowerEmail) {
            currentLoan.BorrowerEmail = fields.BorrowerEmail;
        }
        if (fields.updateBorrowerHomePhone) {
            currentLoan.BorrowerHomePhone = fields.BorrowerHomePhone;
        }
        if (fields.updateBorrowerCity) {
            currentLoan.BorrowerCity = fields.BorrowerCity;
        }
        if (fields.updateBorrowerState) {
            currentLoan.BorrowerState = fields.BorrowerState;
        }
        if (fields.updateBorrowerZip) {
            currentLoan.BorrowerZip = fields.BorrowerZip;
        }

        // Actualizar metadata
        currentLoan.BLOCKAUDITUpdatedAt = block.timestamp;
        currentLoan.TxId = txId;

        // Guardar en historial
        string memory historicalId = string(
            abi.encodePacked(loanId, "_", uint2str(block.timestamp))
        );
        loanHistory[historicalId] = currentLoan;
        loanHistoryIds[loanId].push(historicalId);

        // Registrar cambios
        LoanActivity storage activity = activities[txId];
        activity.TxId = txId;
        activity.LoanInformationId = loanId;
        activity.Timestamp = block.timestamp;

        _compareLoans(oldLoan, currentLoan, activity);

        loanTransactions[loanId].push(txId);
        txIdToLoanId[txId] = loanId;

        emit LoanUpdated(loanId, txId, activity.Changes.length);
        return txId;
    }

    function updateLockedLoan(
        string memory loanId,
        uint256 newBalance,
        uint256 newUnpaidInterest,
        string memory newStatus,
        string memory newLastPaymentRec,
        uint256 newDaysSinceLastPymt
    ) external onlyAuthorized returns (bytes32) {
        require(loans[loanId].exists, "Loan does not exist");
        require(loans[loanId].isLocked, "Only for locked loans");
        require(loans[loanId].avalancheTokenId > 0, "NFT not minted yet");

        bytes32 txId = keccak256(
            abi.encodePacked(block.timestamp, block.number, loanId, "LOCKED_UPDATE")
        );

        Loan storage loan = loans[loanId];
        loan.CurrentPrincipalBal = newBalance;
        loan.UnpaidInterest = newUnpaidInterest;
        loan.Status = newStatus;
        loan.LastPaymentRec = newLastPaymentRec;
        loan.DaysSinceLastPymt = newDaysSinceLastPymt;
        loan.BLOCKAUDITUpdatedAt = block.timestamp;
        loan.TxId = txId;

        loanTransactions[loanId].push(txId);
        txIdToLoanId[txId] = loanId;

        emit LockedLoanUpdated(loanId, newBalance, newStatus, block.timestamp);
        return txId;
    }

    function isLoanLocked(string memory loanId) public view returns (bool) {
        return loans[loanId].isLocked;
    }

    function isLoanTokenized(string memory loanId) public view returns (bool) {
        return loans[loanId].avalancheTokenId > 0;
    }

    function getAvalancheTokenId(string memory loanId) public view returns (uint256) {
        return loans[loanId].avalancheTokenId;
    }

    // Función createLoan original (mantiene toda la funcionalidad existente)
    function createLoan(
        string memory _ID,
        string memory _UserID,
        string memory _Borrower_FullName,
        string memory _Borrower_Home_Phone,
        string memory _Borrower_Property_Address,
        string memory _Borrower_State,
        string memory _Borrower_Zip,
        string memory _Borrower_City,
        string memory _Borrower_Email,
        string memory _Borrower_Occupancy_Status,
        uint256 _Current_Principal_Bal,
        uint256 _Restricted_Funds,
        uint256 _Suspense_Balance,
        uint256 _Escrow_Balance,
        uint256 _Total_In_Trust,
        uint256 _Note_Rate,
        uint256 _Sold_Rate,
        uint256 _Default_Rate,
        uint256 _Unpaid_Interest,
        uint256 _Unpaid_Fees,
        uint256 _Late_Fees_Amount,
        uint256 _Unpaid_Late_Fees,
        uint256 _Accrued_Late_fees,
        uint256 _Unpaid_Loan_Charges,
        uint256 _Deferred_Princ_Balance,
        uint256 _Deferred_Unp_Charges,
        uint256 _Original_Loan_Amount,
        string memory _Origination_Date,
        string memory _Next_Payment_Due,
        string memory _Loan_Maturity_Date,
        string memory _Last_Payment_Rec,
        string memory _Interest_Paid_To,
        uint256 _Deferred_Unpaid_Int,
        uint256 _FCI_Restricted_Principal,
        uint256 _FCI_Restricted_Interest,
        uint256 _Pymt_Grace_Days,
        uint256 _Days_Since_Last_Pymt,
        uint256 _Num_Of_Pymts_Due,
        uint256 _Scheduled_Payment,
        uint256 _Promises_To_Pay,
        uint256 _NFS_In_Last_12_Months,
        uint256 _Deferred_Late_Fees,
        uint256 _Investor_Restricted_Principal,
        uint256 _Investor_Restricted_Interest,
        string memory _Status,
        string memory _LUid
    ) public onlyAuthorized returns (bytes32) {
        require(
            bytes(_UserID).length > 0 && keccak256(bytes(_UserID)) != keccak256(bytes("---")),
            "UserID is required"
        );
        require(bytes(_ID).length > 0, "Loan ID is required");

        if (loans[_ID].exists) {
            require(!loans[_ID].isLocked, "Cannot update locked loan via createLoan");
        }

        bytes32 txId = keccak256(abi.encodePacked(block.timestamp, block.number, _ID, msg.sender));
        uint256 creationTimestamp = block.timestamp;
        bool isUpdate = loans[_ID].exists;

        if (isUpdate) {
            creationTimestamp = loans[_ID].BLOCKAUDITCreationAt;
        }

        Loan memory oldLoan = loans[_ID];

        Loan memory newLoan = Loan({
            ID: _ID,
            UserID: _UserID,
            BorrowerFullName: _Borrower_FullName,
            BorrowerHomePhone: _Borrower_Home_Phone,
            BorrowerPropertyAddress: _Borrower_Property_Address,
            BorrowerState: _Borrower_State,
            BorrowerZip: _Borrower_Zip,
            BorrowerCity: _Borrower_City,
            BorrowerEmail: _Borrower_Email,
            BorrowerOccupancyStatus: _Borrower_Occupancy_Status,
            CurrentPrincipalBal: _Current_Principal_Bal,
            RestrictedFunds: _Restricted_Funds,
            SuspenseBalance: _Suspense_Balance,
            EscrowBalance: _Escrow_Balance,
            TotalInTrust: _Total_In_Trust,
            NoteRate: _Note_Rate,
            SoldRate: _Sold_Rate,
            DefaultRate: _Default_Rate,
            UnpaidInterest: _Unpaid_Interest,
            UnpaidFees: _Unpaid_Fees,
            LateFeesAmount: _Late_Fees_Amount,
            UnpaidLateFees: _Unpaid_Late_Fees,
            AccruedLateFees: _Accrued_Late_fees,
            UnpaidLoanCharges: _Unpaid_Loan_Charges,
            DeferredPrincBalance: _Deferred_Princ_Balance,
            DeferredUnpCharges: _Deferred_Unp_Charges,
            OriginalLoanAmount: _Original_Loan_Amount,
            OriginationDate: _Origination_Date,
            NextPaymentDue: _Next_Payment_Due,
            LoanMaturityDate: _Loan_Maturity_Date,
            LastPaymentRec: _Last_Payment_Rec,
            InterestPaidTo: _Interest_Paid_To,
            DeferredUnpaidInt: _Deferred_Unpaid_Int,
            FCIRestrictedPrincipal: _FCI_Restricted_Principal,
            FCIRestrictedInterest: _FCI_Restricted_Interest,
            PymtGraceDays: _Pymt_Grace_Days,
            DaysSinceLastPymt: _Days_Since_Last_Pymt,
            NumOfPymtsDue: _Num_Of_Pymts_Due,
            ScheduledPayment: _Scheduled_Payment,
            PromisesToPay: _Promises_To_Pay,
            NFSInLast12Months: _NFS_In_Last_12_Months,
            DeferredLateFees: _Deferred_Late_Fees,
            InvestorRestrictedPrincipal: _Investor_Restricted_Principal,
            InvestorRestrictedInterest: _Investor_Restricted_Interest,
            Status: _Status,
            LUid: _LUid,
            TxId: txId,
            BLOCKAUDITCreationAt: creationTimestamp,
            BLOCKAUDITUpdatedAt: block.timestamp,
            exists: true,
            avalancheTokenId: isUpdate ? oldLoan.avalancheTokenId : 0,
            lastSyncTimestamp: isUpdate ? oldLoan.lastSyncTimestamp : 0,
            isLocked: isUpdate ? oldLoan.isLocked : false
        });

        string memory historicalId = string(abi.encodePacked(_ID, "_", uint2str(block.timestamp)));
        loanHistory[historicalId] = newLoan;
        loanHistoryIds[_ID].push(historicalId);

        LoanActivity storage activity = activities[txId];
        activity.TxId = txId;
        activity.LoanInformationId = _ID;
        activity.Timestamp = block.timestamp;

        if (isUpdate) {
            _compareLoans(oldLoan, newLoan, activity);
            emit LoanUpdated(_ID, txId, activity.Changes.length);
        } else {
            allLoanIds.push(_ID);
            userIdToLoanIds[_UserID].push(_ID);
            emit LoanCreated(_ID, _UserID, txId, block.timestamp);
        }

        if (bytes(oldLoan.LUid).length > 0 && keccak256(bytes(oldLoan.LUid)) != keccak256(bytes(_LUid))) {
            delete luidToLoanId[oldLoan.LUid];
        }
        if (bytes(_LUid).length > 0) {
            luidToLoanId[_LUid] = _ID;
        }

        if (isUpdate && bytes(oldLoan.UserID).length > 0 && keccak256(bytes(oldLoan.UserID)) != keccak256(bytes(_UserID))) {
            _removeFromUserIndex(oldLoan.UserID, _ID);
            userIdToLoanIds[_UserID].push(_ID);
        }

        loans[_ID] = newLoan;
        loanTransactions[_ID].push(txId);
        txIdToLoanId[txId] = _ID;

        return txId;
    }

    function readLoan(string memory loanId) public view returns (Loan memory) {
        require(loans[loanId].exists, "The loan does not exist");
        return loans[loanId];
    }

    function deleteLoan(string memory loanId) public onlyAuthorized returns (bytes32) {
        require(loans[loanId].exists, "Loan does not exist");
        require(!loans[loanId].isLocked, "Cannot delete locked loan");
        require(loans[loanId].avalancheTokenId == 0, "Cannot delete tokenized loan");

        bytes32 txId = keccak256(abi.encodePacked(block.timestamp, block.number, loanId, "DELETE"));
        Loan memory loan = loans[loanId];

        LoanActivity storage activity = activities[txId];
        activity.TxId = txId;
        activity.LoanInformationId = loanId;
        activity.Timestamp = block.timestamp;

        if (bytes(loan.LUid).length > 0) {
            delete luidToLoanId[loan.LUid];
        }
        _removeFromUserIndex(loan.UserID, loanId);
        _removeFromAllLoans(loanId);

        loans[loanId].exists = false;
        loanTransactions[loanId].push(txId);
        txIdToLoanId[txId] = loanId;

        emit LoanDeleted(loanId, txId);
        return txId;
    }

    function loanExists(string memory loanId) public view returns (bool) {
        return loans[loanId].exists;
    }

    function getLoanHistory(string memory loanId) public view returns (LoanHistoryEntry[] memory) {
        require(bytes(loanId).length > 0, "Loan ID required");
        bytes32[] memory txIds = loanTransactions[loanId];
        LoanHistoryEntry[] memory history = new LoanHistoryEntry[](txIds.length);

        for (uint256 i = 0; i < txIds.length; i++) {
            LoanActivity memory activity = activities[txIds[i]];
            history[i] = LoanHistoryEntry({
                TxId: txIds[i],
                Timestamp: activity.Timestamp,
                IsDelete: !loans[loanId].exists && i == txIds.length - 1
            });
        }

        return history;
    }

    function getLoanHistoryWithChanges(string memory loanId)
        public
        view
        returns (
            bytes32[] memory txIds,
            uint256[] memory timestamps,
            bool[] memory isDeletes,
            uint256[] memory changeCounts
        )
    {
        require(bytes(loanId).length > 0, "Loan ID required");
        bytes32[] memory transactions = loanTransactions[loanId];
        txIds = new bytes32[](transactions.length);
        timestamps = new uint256[](transactions.length);
        isDeletes = new bool[](transactions.length);
        changeCounts = new uint256[](transactions.length);

        for (uint256 i = 0; i < transactions.length; i++) {
            LoanActivity memory activity = activities[transactions[i]];
            txIds[i] = transactions[i];
            timestamps[i] = activity.Timestamp;
            isDeletes[i] = !loans[loanId].exists && i == transactions.length - 1;
            changeCounts[i] = activity.Changes.length;
        }

        return (txIds, timestamps, isDeletes, changeCounts);
    }

    function getActivityChanges(bytes32 txId) public view returns (Change[] memory) {
        return activities[txId].Changes;
    }

    function getLoanByTxId(bytes32 txId) public view returns (Loan memory loan, Change[] memory changes) {
        string memory loanId = txIdToLoanId[txId];
        require(bytes(loanId).length > 0, "Transaction not found");

        string[] memory historicalIds = loanHistoryIds[loanId];

        for (uint256 i = 0; i < historicalIds.length; i++) {
            Loan memory historicalLoan = loanHistory[historicalIds[i]];
            if (historicalLoan.TxId == txId) {
                return (historicalLoan, activities[txId].Changes);
            }
        }

        revert("Loan state not found for this TxId");
    }

    function getCurrentTransactionByLoan(string memory loanId) public view returns (bytes32) {
        bytes32[] memory txIds = loanTransactions[loanId];
        require(txIds.length > 0, "No transactions found");
        return txIds[txIds.length - 1];
    }

    function queryAllLoans() public view returns (Loan[] memory) {
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allLoanIds.length; i++) {
            if (loans[allLoanIds[i]].exists) {
                activeCount++;
            }
        }

        Loan[] memory result = new Loan[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allLoanIds.length; i++) {
            if (loans[allLoanIds[i]].exists) {
                result[index] = loans[allLoanIds[i]];
                index++;
            }
        }

        return result;
    }

    function queryLoansPaginated(uint256 offset, uint256 limit)
        public
        view
        returns (Loan[] memory loans_, uint256 total, uint256 returned)
    {
        total = allLoanIds.length;
        require(offset < total, "Offset out of bounds");

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 activeCount = 0;
        for (uint256 i = offset; i < end; i++) {
            if (loans[allLoanIds[i]].exists) {
                activeCount++;
            }
        }

        loans_ = new Loan[](activeCount);
        uint256 index = 0;

        for (uint256 i = offset; i < end; i++) {
            if (loans[allLoanIds[i]].exists) {
                loans_[index] = loans[allLoanIds[i]];
                index++;
            }
        }

        returned = activeCount;
        return (loans_, total, returned);
    }

    function findLoanByLoanUid(string memory loanUid) public view returns (Loan memory) {
        string memory loanId = luidToLoanId[loanUid];
        require(bytes(loanId).length > 0, "No loan found with this LUid");
        require(loans[loanId].exists, "Loan has been deleted");
        return loans[loanId];
    }

    function findLoansByUserId(string memory userId) public view returns (Loan[] memory) {
        string[] memory loanIds = userIdToLoanIds[userId];

        uint256 activeCount = 0;
        for (uint256 i = 0; i < loanIds.length; i++) {
            if (loans[loanIds[i]].exists) {
                activeCount++;
            }
        }

        Loan[] memory result = new Loan[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < loanIds.length; i++) {
            if (loans[loanIds[i]].exists) {
                result[index] = loans[loanIds[i]];
                index++;
            }
        }

        return result;
    }

    function getLastTransactionsByLoans(string[] memory loanIds)
        public
        view
        returns (string[] memory ids, bytes32[] memory txIds)
    {
        ids = new string[](loanIds.length);
        txIds = new bytes32[](loanIds.length);

        for (uint256 i = 0; i < loanIds.length; i++) {
            ids[i] = loanIds[i];
            bytes32[] memory transactions = loanTransactions[loanIds[i]];
            if (transactions.length > 0) {
                txIds[i] = transactions[transactions.length - 1];
            }
        }

        return (ids, txIds);
    }

    function _compareLoans(Loan memory oldLoan, Loan memory newLoan, LoanActivity storage activity) private {
        if (oldLoan.CurrentPrincipalBal != newLoan.CurrentPrincipalBal) {
            activity.Changes.push(
                Change("CurrentPrincipalBal", uint2str(oldLoan.CurrentPrincipalBal), uint2str(newLoan.CurrentPrincipalBal))
            );
        }

        if (keccak256(bytes(oldLoan.Status)) != keccak256(bytes(newLoan.Status))) {
            activity.Changes.push(Change("Status", oldLoan.Status, newLoan.Status));
        }

        if (oldLoan.UnpaidInterest != newLoan.UnpaidInterest) {
            activity.Changes.push(Change("UnpaidInterest", uint2str(oldLoan.UnpaidInterest), uint2str(newLoan.UnpaidInterest)));
        }

        if (keccak256(bytes(oldLoan.LastPaymentRec)) != keccak256(bytes(newLoan.LastPaymentRec))) {
            activity.Changes.push(Change("LastPaymentRec", oldLoan.LastPaymentRec, newLoan.LastPaymentRec));
        }

        if (oldLoan.DaysSinceLastPymt != newLoan.DaysSinceLastPymt) {
            activity.Changes.push(
                Change("DaysSinceLastPymt", uint2str(oldLoan.DaysSinceLastPymt), uint2str(newLoan.DaysSinceLastPymt))
            );
        }

        if (oldLoan.NumOfPymtsDue != newLoan.NumOfPymtsDue) {
            activity.Changes.push(Change("NumOfPymtsDue", uint2str(oldLoan.NumOfPymtsDue), uint2str(newLoan.NumOfPymtsDue)));
        }

        if (keccak256(bytes(oldLoan.NextPaymentDue)) != keccak256(bytes(newLoan.NextPaymentDue))) {
            activity.Changes.push(Change("NextPaymentDue", oldLoan.NextPaymentDue, newLoan.NextPaymentDue));
        }

        if (oldLoan.UnpaidFees != newLoan.UnpaidFees) {
            activity.Changes.push(Change("UnpaidFees", uint2str(oldLoan.UnpaidFees), uint2str(newLoan.UnpaidFees)));
        }

        if (oldLoan.LateFeesAmount != newLoan.LateFeesAmount) {
            activity.Changes.push(Change("LateFeesAmount", uint2str(oldLoan.LateFeesAmount), uint2str(newLoan.LateFeesAmount)));
        }

        if (oldLoan.NoteRate != newLoan.NoteRate) {
            activity.Changes.push(Change("NoteRate", uint2str(oldLoan.NoteRate), uint2str(newLoan.NoteRate)));
        }

        if (keccak256(bytes(oldLoan.BorrowerFullName)) != keccak256(bytes(newLoan.BorrowerFullName))) {
            activity.Changes.push(Change("BorrowerFullName", oldLoan.BorrowerFullName, newLoan.BorrowerFullName));
        }

        if (keccak256(bytes(oldLoan.BorrowerPropertyAddress)) != keccak256(bytes(newLoan.BorrowerPropertyAddress))) {
            activity.Changes.push(
                Change("BorrowerPropertyAddress", oldLoan.BorrowerPropertyAddress, newLoan.BorrowerPropertyAddress)
            );
        }
    }

    function _removeFromUserIndex(string memory userId, string memory loanId) private {
        string[] storage userLoans = userIdToLoanIds[userId];
        for (uint256 i = 0; i < userLoans.length; i++) {
            if (keccak256(bytes(userLoans[i])) == keccak256(bytes(loanId))) {
                userLoans[i] = userLoans[userLoans.length - 1];
                userLoans.pop();
                break;
            }
        }
    }

    function _removeFromAllLoans(string memory loanId) private {
        for (uint256 i = 0; i < allLoanIds.length; i++) {
            if (keccak256(bytes(allLoanIds[i])) == keccak256(bytes(loanId))) {
                allLoanIds[i] = allLoanIds[allLoanIds.length - 1];
                allLoanIds.pop();
                break;
            }
        }
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            bstr[k] = bytes1(uint8(48 + (_i % 10)));
            _i /= 10;
        }
        return string(bstr);
    }

    function getTotalLoansCount() public view returns (uint256) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allLoanIds.length; i++) {
            if (loans[allLoanIds[i]].exists) {
                activeCount++;
            }
        }
        return activeCount;
    }

    function getAllLoanIds() public view returns (string[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allLoanIds.length; i++) {
            if (loans[allLoanIds[i]].exists) {
                activeCount++;
            }
        }

        string[] memory activeIds = new string[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allLoanIds.length; i++) {
            if (loans[allLoanIds[i]].exists) {
                activeIds[index] = allLoanIds[i];
                index++;
            }
        }

        return activeIds;
    }
}
