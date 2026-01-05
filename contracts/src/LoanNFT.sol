// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LoanNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;

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
        string status;
        string LUid;
    }

    mapping(uint256 => Loan[]) public loanHistory;
    mapping(string => uint256) public luidToTokenId;
    mapping(string => uint256[]) public userIdToTokenIds;
    mapping(bytes32 => uint256) public hashToTokenId;

    constructor(address initialOwner) ERC721("LoanNFT", "LOAN") Ownable(initialOwner) {
        _tokenIdCounter = 0;
    }

    function calculateHash(Loan memory loan) internal pure returns (bytes32) {
        bytes memory encoded1 = abi.encode(
            loan.ID,
            loan.UserID,
            loan.BorrowerFullName,
            loan.BorrowerHomePhone,
            loan.BorrowerPropertyAddress,
            loan.BorrowerState,
            loan.BorrowerZip,
            loan.BorrowerCity,
            loan.BorrowerEmail,
            loan.BorrowerOccupancyStatus,
            loan.CurrentPrincipalBal,
            loan.RestrictedFunds,
            loan.SuspenseBalance,
            loan.EscrowBalance
        );

        bytes memory encoded2 = abi.encode(
            loan.TotalInTrust,
            loan.NoteRate,
            loan.SoldRate,
            loan.DefaultRate,
            loan.UnpaidInterest,
            loan.UnpaidFees,
            loan.LateFeesAmount,
            loan.UnpaidLateFees,
            loan.AccruedLateFees,
            loan.UnpaidLoanCharges,
            loan.DeferredPrincBalance,
            loan.DeferredUnpCharges,
            loan.OriginalLoanAmount,
            loan.OriginationDate
        );

        bytes memory encoded3 = abi.encode(
            loan.NextPaymentDue,
            loan.LoanMaturityDate,
            loan.LastPaymentRec,
            loan.InterestPaidTo,
            loan.DeferredUnpaidInt,
            loan.FCIRestrictedPrincipal,
            loan.FCIRestrictedInterest,
            loan.PymtGraceDays,
            loan.DaysSinceLastPymt,
            loan.NumOfPymtsDue,
            loan.ScheduledPayment,
            loan.PromisesToPay,
            loan.NFSInLast12Months
        );

        bytes memory encoded4 = abi.encode(
            loan.DeferredLateFees,
            loan.InvestorRestrictedPrincipal,
            loan.InvestorRestrictedInterest,
            loan.status,
            loan.LUid
        );

        return keccak256(bytes.concat(encoded1, encoded2, encoded3, encoded4));
    }

    function createLoan(
        string memory _ID,
        string memory _UserID,
        string memory _Borrower_FullName,
        string memory _Borrower_Home_Phone,
        string memory _Borrower_Propery_Address,
        string memory _Borrower_State,
        string memory _Borrower_Zip,
        string memory _Borrower_City,
        string memory _Borrower_Email,
        string memory _Borrower_Occupancy_Status,
        uint256 _Currrent_Principal_Bal,
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
        string memory _status,
        string memory _LUid
    ) public onlyOwner returns (uint256) {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(owner(), tokenId);

        Loan memory newLoan = Loan({
            ID: _ID,
            UserID: _UserID,
            BorrowerFullName: _Borrower_FullName,
            BorrowerHomePhone: _Borrower_Home_Phone,
            BorrowerPropertyAddress: _Borrower_Propery_Address,
            BorrowerState: _Borrower_State,
            BorrowerZip: _Borrower_Zip,
            BorrowerCity: _Borrower_City,
            BorrowerEmail: _Borrower_Email,
            BorrowerOccupancyStatus: _Borrower_Occupancy_Status,
            CurrentPrincipalBal: _Currrent_Principal_Bal,
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
            status: _status,
            LUid: _LUid
        });

        loanHistory[tokenId].push(newLoan);
        luidToTokenId[_LUid] = tokenId;
        userIdToTokenIds[_UserID].push(tokenId);
        bytes32 loanHash = calculateHash(newLoan);
        hashToTokenId[loanHash] = tokenId;

        return tokenId;
    }

    function updateLoan(
        uint256 tokenId,
        string memory _ID,
        string memory _UserID,
        string memory _Borrower_FullName,
        string memory _Borrower_Home_Phone,
        string memory _Borrower_Propery_Address,
        string memory _Borrower_State,
        string memory _Borrower_Zip,
        string memory _Borrower_City,
        string memory _Borrower_Email,
        string memory _Borrower_Occupancy_Status,
        uint256 _Currrent_Principal_Bal,
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
        string memory _status,
        string memory _LUid
    ) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        Loan memory oldLoan = getCurrentLoan(tokenId);
        bytes32 oldHash = calculateHash(oldLoan);

        // If LUid or UserID changes, update mappings (assuming they can change, though rare)
        if (keccak256(bytes(oldLoan.LUid)) != keccak256(bytes(_LUid))) {
            delete luidToTokenId[oldLoan.LUid];
            luidToTokenId[_LUid] = tokenId;
        }

        if (keccak256(bytes(oldLoan.UserID)) != keccak256(bytes(_UserID))) {
            // Remove from old userId list
            uint256[] storage oldTokens = userIdToTokenIds[oldLoan.UserID];
            for (uint256 i = 0; i < oldTokens.length; i++) {
                if (oldTokens[i] == tokenId) {
                    oldTokens[i] = oldTokens[oldTokens.length - 1];
                    oldTokens.pop();
                    break;
                }
            }
            // Add to new
            userIdToTokenIds[_UserID].push(tokenId);
        }

        Loan memory newLoan = Loan({
            ID: _ID,
            UserID: _UserID,
            BorrowerFullName: _Borrower_FullName,
            BorrowerHomePhone: _Borrower_Home_Phone,
            BorrowerPropertyAddress: _Borrower_Propery_Address,
            BorrowerState: _Borrower_State,
            BorrowerZip: _Borrower_Zip,
            BorrowerCity: _Borrower_City,
            BorrowerEmail: _Borrower_Email,
            BorrowerOccupancyStatus: _Borrower_Occupancy_Status,
            CurrentPrincipalBal: _Currrent_Principal_Bal,
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
            status: _status,
            LUid: _LUid
        });

        loanHistory[tokenId].push(newLoan);

        bytes32 newHash = calculateHash(newLoan);
        if (oldHash != newHash) {
            delete hashToTokenId[oldHash];
        }
        hashToTokenId[newHash] = tokenId;
    }

    function getCurrentLoan(uint256 tokenId) public view returns (Loan memory) {
        require(loanHistory[tokenId].length > 0, "No loan data");
        return loanHistory[tokenId][loanHistory[tokenId].length - 1];
    }

    function getLoanHistory(uint256 tokenId) public view returns (Loan[] memory) {
        return loanHistory[tokenId];
    }

    function getTokenIdByLUid(string memory _LUid) public view returns (uint256) {
        return luidToTokenId[_LUid];
    }

    function getTokenIdsByUserId(string memory _UserID) public view returns (uint256[] memory) {
        return userIdToTokenIds[_UserID];
    }

    function getTokenIdByHash(bytes32 _hash) public view returns (uint256) {
        return hashToTokenId[_hash];
    }

    // Override mint function if needed, but keeping the original
    function mint(address to) public onlyOwner returns (uint256) {
        _tokenIdCounter++;
        _safeMint(to, _tokenIdCounter);
        return _tokenIdCounter;
    }
}