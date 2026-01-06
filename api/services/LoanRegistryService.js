const { ethers } = require('ethers');
const { provider, CONTRACTS, ABIs } = require('../config/blockchain');

class LoanRegistryService {
  constructor() {
    this.contractAddress = CONTRACTS.LoanRegistry;
    this.abi = ABIs.LoanRegistry;
  }

  getContract(privateKey) {
    const wallet = new ethers.Wallet(privateKey, provider);
    return new ethers.Contract(this.contractAddress, this.abi, wallet);
  }

  getContractReadOnly() {
    return new ethers.Contract(this.contractAddress, this.abi, provider);
  }

  /**
   * Crear un loan - Usa los nombres EXACTOS del contrato
   */
  async createLoan(privateKey, loanData) {
    const contract = this.getContract(privateKey);

    // Los datos vienen con los nombres exactos del contrato
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
      loanData.CurrentPrincipalBal,
      loanData.RestrictedFunds,
      loanData.SuspenseBalance,
      loanData.EscrowBalance,
      loanData.TotalInTrust,
      loanData.NoteRate,
      loanData.SoldRate,
      loanData.DefaultRate,
      loanData.UnpaidInterest,
      loanData.UnpaidFees,
      loanData.LateFeesAmount,
      loanData.UnpaidLateFees,
      loanData.AccruedLateFees,
      loanData.UnpaidLoanCharges,
      loanData.DeferredPrincBalance,
      loanData.DeferredUnpCharges,
      loanData.OriginalLoanAmount,
      loanData.OriginationDate,
      loanData.NextPaymentDue,
      loanData.LoanMaturityDate,
      loanData.LastPaymentRec,
      loanData.InterestPaidTo,
      loanData.DeferredUnpaidInt,
      loanData.FCIRestrictedPrincipal,
      loanData.FCIRestrictedInterest,
      loanData.PymtGraceDays,
      loanData.DaysSinceLastPymt,
      loanData.NumOfPymtsDue,
      loanData.ScheduledPayment,
      loanData.PromisesToPay,
      loanData.NFSInLast12Months,
      loanData.DeferredLateFees,
      loanData.InvestorRestrictedPrincipal,
      loanData.InvestorRestrictedInterest,
      loanData.Status,
      loanData.LUid
    );

    const receipt = await tx.wait();

    // Parsear evento
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
      txId = parsed.args[2]; // Tercer argumento es txId
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
 * Actualizar un loan - Usa los nombres EXACTOS del contrato
 */
  async updateLoan(privateKey, loanData) {
    // Verificar si el loan existe antes de proceder
    const exists = await this.loanExists(loanData.ID);
    if (!exists) {
      throw new Error('Loan does not exist. Use createLoan for new loans.');
    }

    // Llama al mismo createLoan, que el contrato tratará como update
    return await this.createLoan(privateKey, loanData);
  }

  /**
   * Leer un loan - Devuelve con nombres del contrato
   */
  async readLoan(loanId) {
    const contract = this.getContractReadOnly();
    const loan = await contract.readLoan(loanId);

    // Devolver exactamente como viene del contrato
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
      CurrentPrincipalBal: ethers.formatEther(loan.CurrentPrincipalBal),
      RestrictedFunds: ethers.formatEther(loan.RestrictedFunds),
      SuspenseBalance: ethers.formatEther(loan.SuspenseBalance),
      EscrowBalance: ethers.formatEther(loan.EscrowBalance),
      TotalInTrust: ethers.formatEther(loan.TotalInTrust),
      NoteRate: Number(loan.NoteRate),
      SoldRate: Number(loan.SoldRate),
      DefaultRate: Number(loan.DefaultRate),
      UnpaidInterest: ethers.formatEther(loan.UnpaidInterest),
      UnpaidFees: ethers.formatEther(loan.UnpaidFees),
      LateFeesAmount: ethers.formatEther(loan.LateFeesAmount),
      UnpaidLateFees: ethers.formatEther(loan.UnpaidLateFees),
      AccruedLateFees: ethers.formatEther(loan.AccruedLateFees),
      UnpaidLoanCharges: ethers.formatEther(loan.UnpaidLoanCharges),
      DeferredPrincBalance: ethers.formatEther(loan.DeferredPrincBalance),
      DeferredUnpCharges: ethers.formatEther(loan.DeferredUnpCharges),
      OriginalLoanAmount: ethers.formatEther(loan.OriginalLoanAmount),
      OriginationDate: loan.OriginationDate,
      NextPaymentDue: loan.NextPaymentDue,
      LoanMaturityDate: loan.LoanMaturityDate,
      LastPaymentRec: loan.LastPaymentRec,
      InterestPaidTo: loan.InterestPaidTo,
      DeferredUnpaidInt: ethers.formatEther(loan.DeferredUnpaidInt),
      FCIRestrictedPrincipal: ethers.formatEther(loan.FCIRestrictedPrincipal),
      FCIRestrictedInterest: ethers.formatEther(loan.FCIRestrictedInterest),
      PymtGraceDays: Number(loan.PymtGraceDays),
      DaysSinceLastPymt: Number(loan.DaysSinceLastPymt),
      NumOfPymtsDue: Number(loan.NumOfPymtsDue),
      ScheduledPayment: ethers.formatEther(loan.ScheduledPayment),
      PromisesToPay: Number(loan.PromisesToPay),
      NFSInLast12Months: Number(loan.NFSInLast12Months),
      DeferredLateFees: ethers.formatEther(loan.DeferredLateFees),
      InvestorRestrictedPrincipal: ethers.formatEther(loan.InvestorRestrictedPrincipal),
      InvestorRestrictedInterest: ethers.formatEther(loan.InvestorRestrictedInterest),
      Status: loan.Status,
      LUid: loan.LUid,
      TxId: loan.TxId,
      BLOCKAUDITCreationAt: new Date(Number(loan.BLOCKAUDITCreationAt) * 1000),
      BLOCKAUDITUpdatedAt: new Date(Number(loan.BLOCKAUDITUpdatedAt) * 1000)
    };
  }

  /**
   * Buscar loans por UserID
   */
  async findLoansByUserId(userId) {
    const contract = this.getContractReadOnly();
    const loans = await contract.findLoansByUserId(userId);

    return loans.map(loan => ({
      ID: loan.ID,
      UserID: loan.UserID,
      Status: loan.Status,
      BorrowerFullName: loan.BorrowerFullName,
      BorrowerPropertyAddress: loan.BorrowerPropertyAddress,
      CurrentPrincipalBal: ethers.formatEther(loan.CurrentPrincipalBal),
      NoteRate: Number(loan.NoteRate),
      BLOCKAUDITCreationAt: new Date(Number(loan.BLOCKAUDITCreationAt) * 1000)
    }));
  }

  /**
   * Obtener historial con cambios
   */
  async getLoanHistory(loanId) {
    const contract = this.getContractReadOnly();
    const result = await contract.getLoanHistoryWithChanges(loanId);

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
   * Eliminar un loan
   */
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

  /**
   * Verificar si existe
   */
  async loanExists(loanId) {
    const contract = this.getContractReadOnly();
    return await contract.loanExists(loanId);
  }

  /**
   * Obtener todos los loans
   */
  async queryAllLoans() {
    const contract = this.getContractReadOnly();
    const loans = await contract.queryAllLoans();

    return loans.map(loan => ({
      ID: loan.ID,
      UserID: loan.UserID,
      Status: loan.Status,
      BorrowerFullName: loan.BorrowerFullName,
      CurrentPrincipalBal: ethers.formatEther(loan.CurrentPrincipalBal),
      BLOCKAUDITCreationAt: new Date(Number(loan.BLOCKAUDITCreationAt) * 1000)
    }));
  }

  /**
   * Buscar por LUid
   */
  async findLoanByLoanUid(loanUid) {
    const contract = this.getContractReadOnly();
    const loan = await contract.findLoanByLoanUid(loanUid);
    return this.readLoan(loan.ID); // Reutiliza readLoan para formatear
  }
}

module.exports = new LoanRegistryService();