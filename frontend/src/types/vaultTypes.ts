// ==================== COMPACT LOAN (para listados) ====================
export interface CompactLoan {
  ID: string;
  LUid: string;
  UserID: string;
  Status: string;
  BorrowerFullName: string;
  BorrowerPropertyAddress: string;
  BorrowerCity: string;
  BorrowerState: string;
  BorrowerZip: string;
  CurrentPrincipalBal: string;
  DeferredPrincBalance: string; 
  TxId: string; 
  NoteRate: number;
  BLOCKAUDITCreationAt: string;
}

// ==================== FULL LOAN (para detalle completo) ====================
export interface Loan {
  ID: string;
  UserID: string;
  BorrowerFullName: string;
  BorrowerHomePhone: string;
  BorrowerPropertyAddress: string;
  BorrowerState: string;
  BorrowerZip: string;
  BorrowerCity: string;
  BorrowerEmail: string;
  BorrowerOccupancyStatus: string;
  CurrentPrincipalBal: string;
  RestrictedFunds: string;
  SuspenseBalance: string;
  EscrowBalance: string;
  TotalInTrust: string;
  NoteRate: number;
  SoldRate: number;
  DefaultRate: number;
  UnpaidInterest: string;
  UnpaidFees: string;
  LateFeesAmount: string;
  UnpaidLateFees: string;
  AccruedLateFees: string;
  UnpaidLoanCharges: string;
  DeferredPrincBalance: string;
  DeferredUnpCharges: string;
  OriginalLoanAmount: string;
  OriginationDate: string;
  NextPaymentDue: string;
  LoanMaturityDate: string;
  LastPaymentRec: string;
  InterestPaidTo: string;
  DeferredUnpaidInt: string;
  FCIRestrictedPrincipal: string;
  FCIRestrictedInterest: string;
  PymtGraceDays: number;
  DaysSinceLastPymt: number;
  NumOfPymtsDue: number;
  ScheduledPayment: string;
  PromisesToPay: number;
  NFSInLast12Months: number;
  DeferredLateFees: string;
  InvestorRestrictedPrincipal: string;
  InvestorRestrictedInterest: string;
  Status: string;
  LUid: string;
  TxId: string;
  BLOCKAUDITCreationAt: string;
  BLOCKAUDITUpdatedAt: string;
}

// ==================== REQUEST/RESPONSE TYPES ====================
export interface CreateLoanRequest {
  ID: string;
  UserID: string;
  BorrowerFullName?: string;
  BorrowerHomePhone?: string;
  BorrowerPropertyAddress?: string;
  BorrowerState?: string;
  BorrowerZip?: string;
  BorrowerCity?: string;
  BorrowerEmail?: string;
  BorrowerOccupancyStatus?: string;
  CurrentPrincipalBal?: string;
  RestrictedFunds?: string;
  SuspenseBalance?: string;
  EscrowBalance?: string;
  TotalInTrust?: string;
  NoteRate?: number;
  SoldRate?: number;
  DefaultRate?: number;
  UnpaidInterest?: string;
  UnpaidFees?: string;
  LateFeesAmount?: string;
  UnpaidLateFees?: string;
  AccruedLateFees?: string;
  UnpaidLoanCharges?: string;
  DeferredPrincBalance?: string;
  DeferredUnpCharges?: string;
  OriginalLoanAmount?: string;
  OriginationDate?: string;
  NextPaymentDue?: string;
  LoanMaturityDate?: string;
  LastPaymentRec?: string;
  InterestPaidTo?: string;
  DeferredUnpaidInt?: string;
  FCIRestrictedPrincipal?: string;
  FCIRestrictedInterest?: string;
  PymtGraceDays?: number;
  DaysSinceLastPymt?: number;
  NumOfPymtsDue?: number;
  ScheduledPayment?: string;
  PromisesToPay?: number;
  NFSInLast12Months?: number;
  DeferredLateFees?: string;
  InvestorRestrictedPrincipal?: string;
  InvestorRestrictedInterest?: string;
  Status?: string;
  LUid?: string;
}

export interface AllLoansResponse {
  success: boolean;
  count: number;
  data: CompactLoan[];
}

export interface LoanResponse {
  success: boolean;
  message?: string;
  data: Loan;
}

export interface MyLoansResponse {
  success: boolean;
  count: number;
  data: CompactLoan[];
}

export interface LoanExistsResponse {
  success: boolean;
  exists: boolean;
}

// ==================== HISTORY TYPES ====================
export interface LoanChange {
  PropertyName: string;
  OldValue: string;
  NewValue: string;
}

export interface LoanHistoryWithChanges {
  TxId: string;
  Timestamp: string; // ISO string desde el backend (ej: "2026-01-09T20:13:45.000Z")
  IsDelete: boolean;
  ChangeCount: number;
  Changes: LoanChange[];
}

export interface LoanHistoryResponse {
  success: boolean;
  count: number;
  data: LoanHistoryWithChanges[];
}

// ==================== LOAN BY TXID TYPES ====================
export interface LoanByTxIdResponse {
  success: boolean;
  message?: string;
  txId: string;
  loan: Loan;
  changes?: LoanChange[];
}

// ==================== PORTFOLIO CERTIFICATE TYPES ====================
export interface PortfolioCertificate {
  docType: 'portfolioCertificate';
  ID: string;
  UserId: string;
  TxId: string;
  Loans: string[] | number;
  CreationDate: string;
  TotalPrincipal: number;
}

export interface CreatePortfolioCertificateRequest {
  userId: string;
  loans: number | string[];
  totalPrincipal: number;
}

export interface UpdatePortfolioCertificateRequest {
  userId: string;
  loans: string[];
  totalPrincipal: number;
}

export interface PortfolioCertificateResponse {
  success: boolean;
  certificate: PortfolioCertificate;
}

export interface PortfolioCertificateTxIdResponse {
  success: boolean;
  userId: string;
  txId: string;
}

// ==================== LEGACY/DEPRECATED TYPES ====================
// Mantener temporalmente para compatibilidad
export interface LoanDetail {
  uid: string;
  account: string;
  borrowerFullName: string;
  status: number;
  principalBalance: number;
  noteRate: number;
  hash: string;
  transaction: string;
}

export interface LoanHistory {
  dateReceived: string;
  reference: string;
  totalAmount: number;
  toInterest: number;
  toPrincipal: number;
}

export interface IPFS {
  loanUid: string;
  account: string;
  name: string;
  type?: string;
  date: string;
}

