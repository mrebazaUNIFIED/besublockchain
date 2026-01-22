// src/types/marketplaceTypes.ts

/**
 * Datos de aprobación de un loan para tokenización
 */
export interface LoanApprovalData {
  isApproved: boolean;
  askingPrice: string; // En ether (formato string)
  modifiedInterestRate: number;
  lenderAddress: string;
  approvalTimestamp: number;
  isMinted: boolean;
  isCancelled: boolean;
}

/**
 * Request para aprobar un loan
 */
export interface ApproveLoanRequest {
  privateKey: string;
  askingPrice: string; // En ether
  modifiedInterestRate: number;
}

/**
 * Request para cancelar aprobación
 */
export interface CancelSaleRequest {
  privateKey: string;
}

/**
 * Request para establecer token ID de Avalanche
 */
export interface SetTokenIdRequest {
  privateKey: string;
  loanId: string;
  tokenId: string;
}

/**
 * Request para registrar transferencia de ownership
 */
export interface RecordTransferRequest {
  privateKey: string;
  loanId: string;
  newOwnerAddress: string;
  salePrice: string; // En ether
}

/**
 * Request para registrar pago
 */
export interface RecordPaymentRequest {
  privateKey: string;
  loanId: string;
  amount: string; // En ether
}

/**
 * Respuesta de aprobación
 */
export interface ApprovalResponse {
  success: boolean;
  message: string;
  data: {
    loanId: string;
    askingPrice: string;
    modifiedInterestRate: number;
    txHash: string;
    blockNumber: number;
    gasUsed: string;
  };
}

/**
 * Respuesta de cancelación
 */
export interface CancelResponse {
  success: boolean;
  message: string;
  data: {
    loanId: string;
    txHash: string;
    blockNumber: number;
  };
}

/**
 * Respuesta de datos de aprobación
 */
export interface ApprovalDataResponse {
  success: boolean;
  data: LoanApprovalData;
}

/**
 * Estado de tokenización de un loan
 */
export interface TokenizationStatus {
  loanId: string;
  isLocked: boolean;
  isTokenized: boolean;
  avalancheTokenId: string;
  approval: LoanApprovalData | null;
}

/**
 * Respuesta de estado de tokenización
 */
export interface TokenizationStatusResponse {
  success: boolean;
  data: TokenizationStatus;
}

/**
 * Respuesta de set token ID
 */
export interface SetTokenIdResponse {
  success: boolean;
  message: string;
  data: {
    loanId: string;
    tokenId: string;
    txHash: string;
    blockNumber: number;
    gasUsed: string;
  };
}

/**
 * Respuesta de record transfer
 */
export interface RecordTransferResponse {
  success: boolean;
  message: string;
  data: {
    loanId: string;
    newOwnerAddress: string;
    salePrice: string;
    txHash: string;
    blockNumber: number;
    gasUsed: string;
  };
}

/**
 * Respuesta de record payment
 */
export interface RecordPaymentResponse {
  success: boolean;
  message: string;
  data: {
    loanId: string;
    amount: string;
    txHash: string;
    blockNumber: number;
    gasUsed: string;
  };
}