const { ethers } = require('ethers');
const { rpcLoadBalancer, CONTRACTS, ABIs } = require('../config/blockchain');
const BaseContractService = require('./BaseContractService');

class LoanRegistryService extends BaseContractService {
  constructor() {
    super('LoanRegistry', 'LoanRegistry');
  }

  /**
   * Helper: Convertir centavos a USD formateado
   */
  centsToUSD(cents) {
    if (!cents) return "0.00";
    const dollars = Number(cents) / 100;
    return dollars.toFixed(2);
  }

  /**
   * Crear un loan - Números normales (centavos), NO Wei
   */
  async createLoan(privateKey, loanData) {
    const contract = this.getContract(privateKey);

    const tx = await contract.createLoan(
      loanData.ID,
      loanData.UserID,
      loanData.BorrowerFullName,
      loanData.BorrowerHomePhone,
      loanData.BorrowerPropertyAddress,
      loanData.BorrowerState,
      loanData.BorrowerZip,
      loanData.BorrowerCity,
      loanData.BorrowerEmail,
      loanData.BorrowerOccupancyStatus,
      BigInt(loanData.CurrentPrincipalBal || 0),
      BigInt(loanData.RestrictedFunds || 0),
      BigInt(loanData.SuspenseBalance || 0),
      BigInt(loanData.EscrowBalance || 0),
      BigInt(loanData.TotalInTrust || 0),
      loanData.NoteRate || 0,
      loanData.SoldRate || 0,
      loanData.DefaultRate || 0,
      BigInt(loanData.UnpaidInterest || 0),
      BigInt(loanData.UnpaidFees || 0),
      BigInt(loanData.LateFeesAmount || 0),
      BigInt(loanData.UnpaidLateFees || 0),
      BigInt(loanData.AccruedLateFees || 0),
      BigInt(loanData.UnpaidLoanCharges || 0),
      BigInt(loanData.DeferredPrincBalance || 0),
      BigInt(loanData.DeferredUnpCharges || 0),
      BigInt(loanData.OriginalLoanAmount || 0),
      loanData.OriginationDate,
      loanData.NextPaymentDue,
      loanData.LoanMaturityDate,
      loanData.LastPaymentRec,
      loanData.InterestPaidTo,
      BigInt(loanData.DeferredUnpaidInt || 0),
      BigInt(loanData.FCIRestrictedPrincipal || 0),
      BigInt(loanData.FCIRestrictedInterest || 0),
      loanData.PymtGraceDays || 0,
      loanData.DaysSinceLastPymt || 0,
      loanData.NumOfPymtsDue || 0,
      BigInt(loanData.ScheduledPayment || 0),
      loanData.PromisesToPay || 0,
      loanData.NFSInLast12Months || 0,
      BigInt(loanData.DeferredLateFees || 0),
      BigInt(loanData.InvestorRestrictedPrincipal || 0),
      BigInt(loanData.InvestorRestrictedInterest || 0),
      loanData.Status,
      loanData.LUid
    );

    const receipt = await tx.wait();

    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'LoanCreated';
      } catch (e) {
        return false;
      }
    });

    let txId = null;
    if (event) {
      const parsed = contract.interface.parseLog(event);
      txId = parsed.args[2];
    }

    return {
      success: true,
      txId: txId,
      loanId: loanData.ID,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Actualización parcial - Números normales (centavos)
   */
  async updateLoanPartial(privateKey, loanId, fieldsToUpdate) {
    const exists = await this.loanExists(loanId);
    if (!exists) {
      throw new Error('Loan does not exist');
    }

    const contract = this.getContract(privateKey);

    const updateFields = {
      updateCurrentPrincipalBal: fieldsToUpdate.CurrentPrincipalBal !== undefined,
      CurrentPrincipalBal: fieldsToUpdate.CurrentPrincipalBal
        ? BigInt(fieldsToUpdate.CurrentPrincipalBal)
        : BigInt(0),

      updateUnpaidInterest: fieldsToUpdate.UnpaidInterest !== undefined,
      UnpaidInterest: fieldsToUpdate.UnpaidInterest
        ? BigInt(fieldsToUpdate.UnpaidInterest)
        : BigInt(0),

      updateStatus: fieldsToUpdate.Status !== undefined,
      Status: fieldsToUpdate.Status || '',

      updateLastPaymentRec: fieldsToUpdate.LastPaymentRec !== undefined,
      LastPaymentRec: fieldsToUpdate.LastPaymentRec || '',

      updateDaysSinceLastPymt: fieldsToUpdate.DaysSinceLastPymt !== undefined,
      DaysSinceLastPymt: fieldsToUpdate.DaysSinceLastPymt || 0,

      updateNumOfPymtsDue: fieldsToUpdate.NumOfPymtsDue !== undefined,
      NumOfPymtsDue: fieldsToUpdate.NumOfPymtsDue || 0,

      updateNextPaymentDue: fieldsToUpdate.NextPaymentDue !== undefined,
      NextPaymentDue: fieldsToUpdate.NextPaymentDue || '',

      updateUnpaidFees: fieldsToUpdate.UnpaidFees !== undefined,
      UnpaidFees: fieldsToUpdate.UnpaidFees
        ? BigInt(fieldsToUpdate.UnpaidFees)
        : BigInt(0),

      updateLateFeesAmount: fieldsToUpdate.LateFeesAmount !== undefined,
      LateFeesAmount: fieldsToUpdate.LateFeesAmount
        ? BigInt(fieldsToUpdate.LateFeesAmount)
        : BigInt(0),

      updateNoteRate: fieldsToUpdate.NoteRate !== undefined,
      NoteRate: fieldsToUpdate.NoteRate || 0,

      updateBorrowerFullName: fieldsToUpdate.BorrowerFullName !== undefined,
      BorrowerFullName: fieldsToUpdate.BorrowerFullName || '',

      updateBorrowerPropertyAddress: fieldsToUpdate.BorrowerPropertyAddress !== undefined,
      BorrowerPropertyAddress: fieldsToUpdate.BorrowerPropertyAddress || '',

      updateBorrowerEmail: fieldsToUpdate.BorrowerEmail !== undefined,
      BorrowerEmail: fieldsToUpdate.BorrowerEmail || '',

      updateBorrowerHomePhone: fieldsToUpdate.BorrowerHomePhone !== undefined,
      BorrowerHomePhone: fieldsToUpdate.BorrowerHomePhone || '',

      updateBorrowerCity: fieldsToUpdate.BorrowerCity !== undefined,
      BorrowerCity: fieldsToUpdate.BorrowerCity || '',

      updateBorrowerState: fieldsToUpdate.BorrowerState !== undefined,
      BorrowerState: fieldsToUpdate.BorrowerState || '',

      updateBorrowerZip: fieldsToUpdate.BorrowerZip !== undefined,
      BorrowerZip: fieldsToUpdate.BorrowerZip || ''
    };

    const tx = await contract.updateLoanPartial(loanId, updateFields);
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'LoanUpdated';
      } catch (e) {
        return false;
      }
    });

    let txId = null;
    let changeCount = 0;
    if (event) {
      const parsed = contract.interface.parseLog(event);
      txId = parsed.args[1];
      changeCount = Number(parsed.args[2]);
    }

    return {
      success: true,
      txId: txId,
      loanId: loanId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      changeCount: changeCount
    };
  }

  async updateLoan(privateKey, loanData) {
    const exists = await this.loanExists(loanData.ID);
    if (!exists) {
      throw new Error('Loan does not exist. Use createLoan for new loans.');
    }
    return await this.createLoan(privateKey, loanData);
  }

  /**
   * ✅ Leer loan - Devuelve valores en USD
   */
  async readLoan(loanId) {
    const contract = this.getContractReadOnly();
    const loan = await contract.readLoan(loanId, {
      gasLimit: 100000000
    });

    return {
      ID: loan.ID,
      UserID: loan.UserID,
      BorrowerFullName: loan.BorrowerFullName,
      BorrowerHomePhone: loan.BorrowerHomePhone,
      BorrowerPropertyAddress: loan.BorrowerPropertyAddress,
      BorrowerState: loan.BorrowerState,
      BorrowerZip: loan.BorrowerZip,
      BorrowerCity: loan.BorrowerCity,
      BorrowerEmail: loan.BorrowerEmail,
      BorrowerOccupancyStatus: loan.BorrowerOccupancyStatus,
      // ✅ Convertir centavos a USD
      CurrentPrincipalBal: this.centsToUSD(loan.CurrentPrincipalBal),
      RestrictedFunds: this.centsToUSD(loan.RestrictedFunds),
      SuspenseBalance: this.centsToUSD(loan.SuspenseBalance),
      EscrowBalance: this.centsToUSD(loan.EscrowBalance),
      TotalInTrust: this.centsToUSD(loan.TotalInTrust),
      NoteRate: Number(loan.NoteRate),
      SoldRate: Number(loan.SoldRate),
      DefaultRate: Number(loan.DefaultRate),
      UnpaidInterest: this.centsToUSD(loan.UnpaidInterest),
      UnpaidFees: this.centsToUSD(loan.UnpaidFees),
      LateFeesAmount: this.centsToUSD(loan.LateFeesAmount),
      UnpaidLateFees: this.centsToUSD(loan.UnpaidLateFees),
      AccruedLateFees: this.centsToUSD(loan.AccruedLateFees),
      UnpaidLoanCharges: this.centsToUSD(loan.UnpaidLoanCharges),
      DeferredPrincBalance: this.centsToUSD(loan.DeferredPrincBalance),
      DeferredUnpCharges: this.centsToUSD(loan.DeferredUnpCharges),
      OriginalLoanAmount: this.centsToUSD(loan.OriginalLoanAmount),
      OriginationDate: loan.OriginationDate,
      NextPaymentDue: loan.NextPaymentDue,
      LoanMaturityDate: loan.LoanMaturityDate,
      LastPaymentRec: loan.LastPaymentRec,
      InterestPaidTo: loan.InterestPaidTo,
      DeferredUnpaidInt: this.centsToUSD(loan.DeferredUnpaidInt),
      FCIRestrictedPrincipal: this.centsToUSD(loan.FCIRestrictedPrincipal),
      FCIRestrictedInterest: this.centsToUSD(loan.FCIRestrictedInterest),
      PymtGraceDays: Number(loan.PymtGraceDays),
      DaysSinceLastPymt: Number(loan.DaysSinceLastPymt),
      NumOfPymtsDue: Number(loan.NumOfPymtsDue),
      ScheduledPayment: this.centsToUSD(loan.ScheduledPayment),
      PromisesToPay: Number(loan.PromisesToPay),
      NFSInLast12Months: Number(loan.NFSInLast12Months),
      DeferredLateFees: this.centsToUSD(loan.DeferredLateFees),
      InvestorRestrictedPrincipal: this.centsToUSD(loan.InvestorRestrictedPrincipal),
      InvestorRestrictedInterest: this.centsToUSD(loan.InvestorRestrictedInterest),
      Status: loan.Status,
      LUid: loan.LUid,
      TxId: loan.TxId,
      BLOCKAUDITCreationAt: new Date(Number(loan.BLOCKAUDITCreationAt) * 1000),
      BLOCKAUDITUpdatedAt: new Date(Number(loan.BLOCKAUDITUpdatedAt) * 1000),
      isLocked: loan.isLocked,
      avalancheTokenId: loan.avalancheTokenId.toString(),
      lastSyncTimestamp: Number(loan.lastSyncTimestamp),
      isTokenized: loan.avalancheTokenId > 0
    };
  }

  /**
   * ✅ Buscar loans por userId - Devuelve valores en USD
   */
  async findLoansByUserId(userId) {
    const contract = this.getContractReadOnly();
    const loans = await contract.findLoansByUserId(userId, {
      gasLimit: 100000000
    });

    return loans.map(loan => ({
      ID: loan.ID,
      LUid: loan.LUid,
      UserID: loan.UserID,
      BorrowerFullName: loan.BorrowerFullName,
      BorrowerHomePhone: loan.BorrowerHomePhone,
      BorrowerPropertyAddress: loan.BorrowerPropertyAddress,
      BorrowerState: loan.BorrowerState,
      BorrowerZip: loan.BorrowerZip,
      BorrowerCity: loan.BorrowerCity,
      BorrowerEmail: loan.BorrowerEmail,
      BorrowerOccupancyStatus: loan.BorrowerOccupancyStatus,
      // ✅ Convertir centavos a USD
      CurrentPrincipalBal: this.centsToUSD(loan.CurrentPrincipalBal),
      RestrictedFunds: this.centsToUSD(loan.RestrictedFunds),
      SuspenseBalance: this.centsToUSD(loan.SuspenseBalance),
      EscrowBalance: this.centsToUSD(loan.EscrowBalance),
      TotalInTrust: this.centsToUSD(loan.TotalInTrust),
      NoteRate: Number(loan.NoteRate),
      SoldRate: Number(loan.SoldRate),
      DefaultRate: Number(loan.DefaultRate),
      UnpaidInterest: this.centsToUSD(loan.UnpaidInterest),
      UnpaidFees: this.centsToUSD(loan.UnpaidFees),
      LateFeesAmount: this.centsToUSD(loan.LateFeesAmount),
      UnpaidLateFees: this.centsToUSD(loan.UnpaidLateFees),
      AccruedLateFees: this.centsToUSD(loan.AccruedLateFees),
      UnpaidLoanCharges: this.centsToUSD(loan.UnpaidLoanCharges),
      DeferredPrincBalance: this.centsToUSD(loan.DeferredPrincBalance),
      DeferredUnpCharges: this.centsToUSD(loan.DeferredUnpCharges),
      OriginalLoanAmount: this.centsToUSD(loan.OriginalLoanAmount),
      OriginationDate: loan.OriginationDate,
      NextPaymentDue: loan.NextPaymentDue,
      LoanMaturityDate: loan.LoanMaturityDate,
      LastPaymentRec: loan.LastPaymentRec,
      InterestPaidTo: loan.InterestPaidTo,
      DeferredUnpaidInt: this.centsToUSD(loan.DeferredUnpaidInt),
      FCIRestrictedPrincipal: this.centsToUSD(loan.FCIRestrictedPrincipal),
      FCIRestrictedInterest: this.centsToUSD(loan.FCIRestrictedInterest),
      PymtGraceDays: Number(loan.PymtGraceDays),
      DaysSinceLastPymt: Number(loan.DaysSinceLastPymt),
      NumOfPymtsDue: Number(loan.NumOfPymtsDue),
      ScheduledPayment: this.centsToUSD(loan.ScheduledPayment),
      PromisesToPay: Number(loan.PromisesToPay),
      NFSInLast12Months: Number(loan.NFSInLast12Months),
      DeferredLateFees: this.centsToUSD(loan.DeferredLateFees),
      InvestorRestrictedPrincipal: this.centsToUSD(loan.InvestorRestrictedPrincipal),
      InvestorRestrictedInterest: this.centsToUSD(loan.InvestorRestrictedInterest),
      Status: loan.Status,
      TxId: loan.TxId,
      BLOCKAUDITCreationAt: new Date(Number(loan.BLOCKAUDITCreationAt) * 1000),
      BLOCKAUDITUpdatedAt: new Date(Number(loan.BLOCKAUDITUpdatedAt) * 1000),
      isLocked: loan.isLocked,
      avalancheTokenId: loan.avalancheTokenId.toString(),
      lastSyncTimestamp: Number(loan.lastSyncTimestamp),
      isTokenized: loan.avalancheTokenId > 0
    }));
  }

  async getLoanHistory(loanId) {
    const contract = this.getContractReadOnly();
    const result = await contract.getLoanHistoryWithChanges(loanId, {
      gasLimit: 100000000
    });

    const history = [];
    for (let i = 0; i < result.txIds.length; i++) {
      const changes = await contract.getActivityChanges(result.txIds[i]);

      history.push({
        TxId: result.txIds[i],
        Timestamp: new Date(Number(result.timestamps[i]) * 1000),
        IsDelete: result.isDeletes[i],
        ChangeCount: Number(result.changeCounts[i]),
        Changes: changes.map(c => ({
          PropertyName: c.PropertyName,
          OldValue: c.OldValue,
          NewValue: c.NewValue
        }))
      });
    }

    return history;
  }

  /**
   * ✅ Obtener loan por TxId - Devuelve valores en USD
   */
  async getLoanByTxId(txId) {
    const contract = this.getContractReadOnly();

    try {
      const result = await contract.getLoanByTxId(txId, {
        gasLimit: 100000000
      });

      const loan = result[0];
      const changes = result[1];

      return {
        loan: {
          ID: loan.ID,
          LUid: loan.LUid,
          UserID: loan.UserID,
          BorrowerFullName: loan.BorrowerFullName,
          BorrowerHomePhone: loan.BorrowerHomePhone,
          BorrowerPropertyAddress: loan.BorrowerPropertyAddress,
          BorrowerState: loan.BorrowerState,
          BorrowerZip: loan.BorrowerZip,
          BorrowerCity: loan.BorrowerCity,
          BorrowerEmail: loan.BorrowerEmail,
          BorrowerOccupancyStatus: loan.BorrowerOccupancyStatus,
          // ✅ Convertir centavos a USD
          CurrentPrincipalBal: this.centsToUSD(loan.CurrentPrincipalBal),
          RestrictedFunds: this.centsToUSD(loan.RestrictedFunds),
          SuspenseBalance: this.centsToUSD(loan.SuspenseBalance),
          EscrowBalance: this.centsToUSD(loan.EscrowBalance),
          TotalInTrust: this.centsToUSD(loan.TotalInTrust),
          NoteRate: Number(loan.NoteRate),
          SoldRate: Number(loan.SoldRate),
          DefaultRate: Number(loan.DefaultRate),
          UnpaidInterest: this.centsToUSD(loan.UnpaidInterest),
          UnpaidFees: this.centsToUSD(loan.UnpaidFees),
          LateFeesAmount: this.centsToUSD(loan.LateFeesAmount),
          UnpaidLateFees: this.centsToUSD(loan.UnpaidLateFees),
          AccruedLateFees: this.centsToUSD(loan.AccruedLateFees),
          UnpaidLoanCharges: this.centsToUSD(loan.UnpaidLoanCharges),
          DeferredPrincBalance: this.centsToUSD(loan.DeferredPrincBalance),
          DeferredUnpCharges: this.centsToUSD(loan.DeferredUnpCharges),
          OriginalLoanAmount: this.centsToUSD(loan.OriginalLoanAmount),
          OriginationDate: loan.OriginationDate,
          NextPaymentDue: loan.NextPaymentDue,
          LoanMaturityDate: loan.LoanMaturityDate,
          LastPaymentRec: loan.LastPaymentRec,
          InterestPaidTo: loan.InterestPaidTo,
          DeferredUnpaidInt: this.centsToUSD(loan.DeferredUnpaidInt),
          FCIRestrictedPrincipal: this.centsToUSD(loan.FCIRestrictedPrincipal),
          FCIRestrictedInterest: this.centsToUSD(loan.FCIRestrictedInterest),
          PymtGraceDays: Number(loan.PymtGraceDays),
          DaysSinceLastPymt: Number(loan.DaysSinceLastPymt),
          NumOfPymtsDue: Number(loan.NumOfPymtsDue),
          ScheduledPayment: this.centsToUSD(loan.ScheduledPayment),
          PromisesToPay: Number(loan.PromisesToPay),
          NFSInLast12Months: Number(loan.NFSInLast12Months),
          DeferredLateFees: this.centsToUSD(loan.DeferredLateFees),
          InvestorRestrictedPrincipal: this.centsToUSD(loan.InvestorRestrictedPrincipal),
          InvestorRestrictedInterest: this.centsToUSD(loan.InvestorRestrictedInterest),
          Status: loan.Status,
          TxId: loan.TxId,
          BLOCKAUDITCreationAt: new Date(Number(loan.BLOCKAUDITCreationAt) * 1000),
          BLOCKAUDITUpdatedAt: new Date(Number(loan.BLOCKAUDITUpdatedAt) * 1000),
          isLocked: loan.isLocked,
          avalancheTokenId: loan.avalancheTokenId.toString(),
          lastSyncTimestamp: Number(loan.lastSyncTimestamp),
          isTokenized: loan.avalancheTokenId > 0
        },
        changes: changes.map(c => ({
          PropertyName: c.PropertyName,
          OldValue: c.OldValue,
          NewValue: c.NewValue
        }))
      };
    } catch (error) {
      if (error.message.includes('Transaction not found')) {
        throw new Error('Transaction not found');
      }
      if (error.message.includes('Loan state not found')) {
        throw new Error('Loan state not found for this TxId');
      }
      throw error;
    }
  }

  async deleteLoan(privateKey, loanId) {
    const contract = this.getContract(privateKey);
    const tx = await contract.deleteLoan(loanId);
    const receipt = await tx.wait();

    return {
      success: true,
      loanId: loanId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  }

  async loanExists(loanId) {
    const contract = this.getContractReadOnly();
    return await contract.loanExists(loanId, {
      gasLimit: 100000000
    });
  }

  /**
   * ✅ Query loans paginado - Devuelve valores en USD
   */
  async queryAllLoans(offset = 0, limit = 50) {
    const contract = this.getContractReadOnly();

    try {
      const result = await contract.queryLoansPaginated(offset, limit, {
        gasLimit: 100000000
      });

      const loans = result[0].map(loan => ({
        ID: loan.ID,
        LUid: loan.LUid,
        UserID: loan.UserID,
        BorrowerFullName: loan.BorrowerFullName,
        BorrowerHomePhone: loan.BorrowerHomePhone,
        BorrowerPropertyAddress: loan.BorrowerPropertyAddress,
        BorrowerState: loan.BorrowerState,
        BorrowerZip: loan.BorrowerZip,
        BorrowerCity: loan.BorrowerCity,
        BorrowerEmail: loan.BorrowerEmail,
        BorrowerOccupancyStatus: loan.BorrowerOccupancyStatus,
        // ✅ Convertir centavos a USD
        CurrentPrincipalBal: this.centsToUSD(loan.CurrentPrincipalBal),
        RestrictedFunds: this.centsToUSD(loan.RestrictedFunds),
        SuspenseBalance: this.centsToUSD(loan.SuspenseBalance),
        EscrowBalance: this.centsToUSD(loan.EscrowBalance),
        TotalInTrust: this.centsToUSD(loan.TotalInTrust),
        NoteRate: Number(loan.NoteRate),
        SoldRate: Number(loan.SoldRate),
        DefaultRate: Number(loan.DefaultRate),
        UnpaidInterest: this.centsToUSD(loan.UnpaidInterest),
        UnpaidFees: this.centsToUSD(loan.UnpaidFees),
        LateFeesAmount: this.centsToUSD(loan.LateFeesAmount),
        UnpaidLateFees: this.centsToUSD(loan.UnpaidLateFees),
        AccruedLateFees: this.centsToUSD(loan.AccruedLateFees),
        UnpaidLoanCharges: this.centsToUSD(loan.UnpaidLoanCharges),
        DeferredPrincBalance: this.centsToUSD(loan.DeferredPrincBalance),
        DeferredUnpCharges: this.centsToUSD(loan.DeferredUnpCharges),
        OriginalLoanAmount: this.centsToUSD(loan.OriginalLoanAmount),
        OriginationDate: loan.OriginationDate,
        NextPaymentDue: loan.NextPaymentDue,
        LoanMaturityDate: loan.LoanMaturityDate,
        LastPaymentRec: loan.LastPaymentRec,
        InterestPaidTo: loan.InterestPaidTo,
        DeferredUnpaidInt: this.centsToUSD(loan.DeferredUnpaidInt),
        FCIRestrictedPrincipal: this.centsToUSD(loan.FCIRestrictedPrincipal),
        FCIRestrictedInterest: this.centsToUSD(loan.FCIRestrictedInterest),
        PymtGraceDays: Number(loan.PymtGraceDays),
        DaysSinceLastPymt: Number(loan.DaysSinceLastPymt),
        NumOfPymtsDue: Number(loan.NumOfPymtsDue),
        ScheduledPayment: this.centsToUSD(loan.ScheduledPayment),
        PromisesToPay: Number(loan.PromisesToPay),
        NFSInLast12Months: Number(loan.NFSInLast12Months),
        DeferredLateFees: this.centsToUSD(loan.DeferredLateFees),
        InvestorRestrictedPrincipal: this.centsToUSD(loan.InvestorRestrictedPrincipal),
        InvestorRestrictedInterest: this.centsToUSD(loan.InvestorRestrictedInterest),
        Status: loan.Status,
        TxId: loan.TxId,
        BLOCKAUDITCreationAt: new Date(Number(loan.BLOCKAUDITCreationAt) * 1000),
        BLOCKAUDITUpdatedAt: new Date(Number(loan.BLOCKAUDITUpdatedAt) * 1000),
        isLocked: loan.isLocked,
        avalancheTokenId: loan.avalancheTokenId.toString(),
        lastSyncTimestamp: Number(loan.lastSyncTimestamp),
        isTokenized: loan.avalancheTokenId > 0
      }));

      return {
        loans: loans,
        total: Number(result[1]),
        returned: Number(result[2]),
        offset: offset,
        limit: limit
      };

    } catch (error) {
      console.warn('Pagination not available, using queryAllLoans with high gas limit');

      const loans = await contract.queryAllLoans({
        gasLimit: 100000000
      });

      const formattedLoans = loans.map(loan => ({
        ID: loan.ID,
        LUid: loan.LUid,
        BorrowerFullName: loan.BorrowerFullName,
        BorrowerPropertyAddress: loan.BorrowerPropertyAddress,
        BorrowerCity: loan.BorrowerCity,
        BorrowerState: loan.BorrowerState,
        BorrowerZip: loan.BorrowerZip,
        CurrentPrincipalBal: this.centsToUSD(loan.CurrentPrincipalBal),
        UserID: loan.UserID,
        Status: loan.Status,
        BLOCKAUDITCreationAt: new Date(Number(loan.BLOCKAUDITCreationAt) * 1000),
        isLocked: loan.isLocked,
        avalancheTokenId: loan.avalancheTokenId.toString(),
        lastSyncTimestamp: Number(loan.lastSyncTimestamp),
        isTokenized: loan.avalancheTokenId > 0
      }));

      return {
        loans: formattedLoans,
        total: formattedLoans.length,
        returned: formattedLoans.length,
        offset: 0,
        limit: formattedLoans.length
      };
    }
  }

  async queryAllLoansComplete() {
    const pageSize = 50;
    let allLoans = [];
    let offset = 0;
    let total = 0;

    do {
      const result = await this.queryAllLoans(offset, pageSize);
      allLoans = allLoans.concat(result.loans);
      total = result.total;
      offset += pageSize;
    } while (offset < total);

    return allLoans;
  }

  async findLoanByLoanUid(loanUid) {
    const contract = this.getContractReadOnly();
    const loan = await contract.findLoanByLoanUid(loanUid, {
      gasLimit: 100000000
    });
    return this.readLoan(loan.ID);
  }
}

module.exports = new LoanRegistryService();