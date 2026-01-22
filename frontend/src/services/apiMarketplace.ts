// src/api/apiMarketplace.ts

import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type {
  LoanApprovalData,
  ApproveLoanRequest,
  CancelSaleRequest,
  SetTokenIdRequest,
  RecordTransferRequest,
  RecordPaymentRequest,
  ApprovalResponse,
  CancelResponse,
  ApprovalDataResponse,
  TokenizationStatus,
  TokenizationStatusResponse,
  SetTokenIdResponse,
  RecordTransferResponse,
  RecordPaymentResponse
} from '../types/marketplaceTypes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// ==================== INTERCEPTORS ====================
api.interceptors.request.use(
  (config) => {
    const vaultUser = localStorage.getItem('vaultUser');
    const vaultKey = localStorage.getItem('vaultKey');

    const publicRoutes = [
      '/marketplace/approval',
      '/marketplace/status'
    ];

    const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));
    const isGetRequest = config.method === 'get';

    // Solo requerir auth para operaciones de escritura
    if (!isPublicRoute && !isGetRequest) {
      if (!vaultUser || !vaultKey) {
        toast.error('Please log in to access this resource.');
        window.location.href = '/vault';
        return Promise.reject(new Error('Not authenticated'));
      }
    }

    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast.error('Session expired. Please log in again.');
      localStorage.removeItem('vaultUser');
      localStorage.removeItem('vaultKey');
      window.location.href = '/vault';
    }
    console.error('Response Error:', error.response || error.message);
    return Promise.reject(error);
  }
);

// ==================== MARKETPLACE API FUNCTIONS ====================

/**
 * POST /marketplace/approve/:loanId
 * Aprobar un loan para tokenización/venta
 */
export const approveLoanForSale = async (
  loanId: string,
  data: ApproveLoanRequest
): Promise<ApprovalResponse> => {
  const response = await api.post<ApprovalResponse>(
    `/marketplace/approve/${loanId}`,
    data
  );
  return response.data;
};

/**
 * POST /marketplace/cancel/:loanId
 * Cancelar aprobación de venta
 */
export const cancelSaleListing = async (
  loanId: string,
  data: CancelSaleRequest
): Promise<CancelResponse> => {
  const response = await api.post<CancelResponse>(
    `/marketplace/cancel/${loanId}`,
    data
  );
  return response.data;
};

/**
 * GET /marketplace/approval/:loanId
 * Obtener datos de aprobación de un loan
 */
export const getApprovalData = async (loanId: string): Promise<LoanApprovalData> => {
  const response = await api.get<ApprovalDataResponse>(
    `/marketplace/approval/${loanId}`
  );
  return response.data.data;
};

/**
 * GET /marketplace/status/:loanId
 * Obtener estado completo de tokenización
 */
export const getTokenizationStatus = async (loanId: string): Promise<TokenizationStatus> => {
  const response = await api.get<TokenizationStatusResponse>(
    `/marketplace/status/${loanId}`
  );
  return response.data.data;
};

/**
 * POST /marketplace/set-token-id
 * Relayer establece el tokenId de Avalanche
 */
export const setAvalancheTokenId = async (
  data: SetTokenIdRequest
): Promise<SetTokenIdResponse> => {
  const response = await api.post<SetTokenIdResponse>(
    '/marketplace/set-token-id',
    data
  );
  return response.data;
};

/**
 * POST /marketplace/record-transfer
 * Relayer registra transferencia de ownership
 */
export const recordOwnershipTransfer = async (
  data: RecordTransferRequest
): Promise<RecordTransferResponse> => {
  const response = await api.post<RecordTransferResponse>(
    '/marketplace/record-transfer',
    data
  );
  return response.data;
};

/**
 * POST /marketplace/record-payment
 * Relayer registra pago del borrower
 */
export const recordPayment = async (
  data: RecordPaymentRequest
): Promise<RecordPaymentResponse> => {
  const response = await api.post<RecordPaymentResponse>(
    '/marketplace/record-payment',
    data
  );
  return response.data;
};

// ==================== QUERY KEYS ====================
export const marketplaceKeys = {
  all: ['marketplace'] as const,
  approval: (loanId: string) => [...marketplaceKeys.all, 'approval', loanId] as const,
  status: (loanId: string) => [...marketplaceKeys.all, 'status', loanId] as const,
};

// ==================== REACT QUERY HOOKS ====================

/**
 * Hook para obtener datos de aprobación de un loan
 */
export const useApprovalData = (loanId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: marketplaceKeys.approval(loanId),
    queryFn: () => getApprovalData(loanId),
    enabled: enabled && !!loanId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 1,
  });
};

/**
 * Hook para obtener estado de tokenización de un loan
 */
export const useTokenizationStatus = (loanId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: marketplaceKeys.status(loanId),
    queryFn: () => getTokenizationStatus(loanId),
    enabled: enabled && !!loanId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 1,
  });
};

// ==================== MUTATIONS ====================

/**
 * Hook para aprobar un loan para tokenización
 */
export const useApproveLoanForSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ loanId, data }: { loanId: string; data: ApproveLoanRequest }) =>
      approveLoanForSale(loanId, data),
    onSuccess: (response, variables) => {
      toast.success(`Loan ${variables.loanId} approved for tokenization`);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.approval(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.status(variables.loanId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve loan for sale');
    },
  });
};

/**
 * Hook para cancelar aprobación de venta
 */
export const useCancelSaleListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ loanId, data }: { loanId: string; data: CancelSaleRequest }) =>
      cancelSaleListing(loanId, data),
    onSuccess: (response, variables) => {
      toast.success(`Sale listing cancelled for loan ${variables.loanId}`);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.approval(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.status(variables.loanId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel sale listing');
    },
  });
};

/**
 * Hook para establecer token ID de Avalanche (solo para relayer)
 */
export const useSetAvalancheTokenId = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SetTokenIdRequest) => setAvalancheTokenId(data),
    onSuccess: (response, variables) => {
      toast.success(`Token ID set for loan ${variables.loanId}`);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.status(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.approval(variables.loanId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to set token ID');
    },
  });
};

/**
 * Hook para registrar transferencia de ownership (solo para relayer)
 */
export const useRecordOwnershipTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordTransferRequest) => recordOwnershipTransfer(data),
    onSuccess: (response, variables) => {
      toast.success(`Ownership transfer recorded for loan ${variables.loanId}`);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.status(variables.loanId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to record ownership transfer');
    },
  });
};

/**
 * Hook para registrar pago (solo para relayer)
 */
export const useRecordPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordPaymentRequest) => recordPayment(data),
    onSuccess: (response, variables) => {
      toast.success(`Payment recorded for loan ${variables.loanId}`);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.status(variables.loanId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to record payment');
    },
  });
};