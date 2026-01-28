import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type {
  Loan,
  CompactLoan,
  CreateLoanRequest,
  AllLoansResponse,
  LoanResponse,
  MyLoansResponse,
  LoanExistsResponse,
  LoanHistoryWithChanges,
  LoanHistoryResponse,
  LoanByTxIdResponse,
  PortfolioCertificate,
  CreatePortfolioCertificateRequest,
  UpdatePortfolioCertificateRequest,
  PortfolioCertificateResponse,
  PortfolioCertificateTxIdResponse
} from '../types/vaultTypes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8070';

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
      '/loans',
      '/portfolio'
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

// ==================== LOAN API FUNCTIONS ====================

/**
 * GET /loans
 * Obtener todos los loans (formato compacto)
 */
export const queryAllLoans = async (): Promise<CompactLoan[]> => {
  const response = await api.get<AllLoansResponse>('/loans');
  return response.data.data;
};

/**
 * POST /loans
 * Crear un nuevo loan
 */
export const createLoan = async (privateKey: string, loanData: CreateLoanRequest): Promise<LoanResponse> => {
  const response = await api.post<LoanResponse>('/loans', {
    privateKey,
    loanData
  });
  return response.data;
};

/**
 * PUT /loans/:loanId
 * Actualizar un loan existente
 */
export const updateLoan = async (
  loanId: string,
  privateKey: string,
  loanData: CreateLoanRequest
): Promise<LoanResponse> => {
  const response = await api.put<LoanResponse>(`/loans/${loanId}`, {
    privateKey,
    loanData
  });
  return response.data;
};

/**
 * GET /loans/:loanId
 * Obtener un loan por ID (detalle completo)
 */
export const readLoan = async (loanId: string): Promise<Loan> => {
  const response = await api.get<LoanResponse>(`/loans/${loanId}`);
  return response.data.data;
};

/**
 * GET /loans/user/:userId
 * Obtener loans de un usuario
 */
export const getMyLoans = async (userId: string): Promise<CompactLoan[]> => {
  const response = await api.get<MyLoansResponse>(`/loans/user/${userId}`);
  return response.data.data;
};

/**
 * GET /loans/luid/:loanUid
 * Buscar loan por LUid
 */
export const findLoanByLoanUid = async (loanUid: string): Promise<Loan> => {
  const response = await api.get<LoanResponse>(`/loans/luid/${loanUid}`);
  return response.data.data;
};

/**
 * GET /loans/:loanId/exists
 * Verificar si un loan existe
 */
export const loanExists = async (loanId: string): Promise<boolean> => {
  const response = await api.get<LoanExistsResponse>(`/loans/${loanId}/exists`);
  return response.data.exists;
};

/**
 * GET /loans/:loanId/history
 * Obtener historial de un loan con cambios
 */
export const getLoanHistory = async (loanId: string): Promise<LoanHistoryWithChanges[]> => {
  const response = await api.get<LoanHistoryResponse>(`/loans/${loanId}/history`);
  return response.data.data;
};

/**
 * DELETE /loans/:loanId
 * Eliminar un loan (soft delete)
 */
export const deleteLoan = async (
  loanId: string,
  privateKey: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/loans/${loanId}`, {
    data: { privateKey }
  });
  return response.data;
};

/**
 * GET /loans/tx/:txId
 * Obtener loan por Transaction ID
 */
export const getLoanByTxId = async (txId: string): Promise<LoanByTxIdResponse> => {
  const response = await api.get<LoanByTxIdResponse>(`/loans/tx/${txId}`);
  return response.data;
};


// ==================== PORTFOLIO CERTIFICATE API FUNCTIONS ====================

export const createPortfolioCertificate = async (
  data: CreatePortfolioCertificateRequest
): Promise<PortfolioCertificateResponse> => {
  const response = await api.post('/portfolio/create', data);
  return response.data;
};

export const updatePortfolioCertificate = async (
  data: UpdatePortfolioCertificateRequest
): Promise<PortfolioCertificateResponse> => {
  const response = await api.put('/portfolio/update', data);
  return response.data;
};

export const getPortfolioCertificate = async (
  userId: string
): Promise<PortfolioCertificate> => {
  const response = await api.get(`/portfolio/${userId}`);
  return response.data;
};

export const getPortfolioCertificateTxId = async (
  userId: string
): Promise<PortfolioCertificateTxIdResponse> => {
  const response = await api.get(`/portfolio/${userId}/txid`);
  return response.data;
};

// ==================== QUERY KEYS ====================
export const vaultKeys = {
  all: ['vault'] as const,
  loans: () => [...vaultKeys.all, 'loans'] as const,
  allLoans: () => [...vaultKeys.loans(), 'all'] as const,
  myLoans: (userId: string) => [...vaultKeys.loans(), 'my', userId] as const,
  loan: (loanId: string) => [...vaultKeys.loans(), loanId] as const,
  loanByUid: (loanUid: string) => [...vaultKeys.loans(), 'uid', loanUid] as const,
  loanByTxId: (txId: string) => [...vaultKeys.loans(), 'tx', txId] as const,
  loanExists: (loanId: string) => [...vaultKeys.loan(loanId), 'exists'] as const,
  loanHistory: (loanId: string) => [...vaultKeys.loan(loanId), 'history'] as const,
  portfolios: () => [...vaultKeys.all, 'portfolios'] as const,
  portfolio: (userId: string) => [...vaultKeys.portfolios(), userId] as const,
  portfolioTxId: (userId: string) => [...vaultKeys.portfolio(userId), 'txid'] as const,
};

// ==================== LOAN REACT QUERY HOOKS ====================

export const useAllLoans = () => {
  return useQuery({
    queryKey: vaultKeys.allLoans(),
    queryFn: queryAllLoans,
    staleTime: 1000 * 60 * 5,
  });
};

export const useMyLoans = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: vaultKeys.myLoans(userId),
    queryFn: () => getMyLoans(userId),
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useLoan = (loanId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: vaultKeys.loan(loanId),
    queryFn: () => readLoan(loanId),
    enabled: enabled && !!loanId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useLoanByUid = (loanUid: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: vaultKeys.loanByUid(loanUid),
    queryFn: () => findLoanByLoanUid(loanUid),
    enabled: enabled && !!loanUid,
    staleTime: 1000 * 60 * 5,
  });
};

export const useLoanExists = (loanId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: vaultKeys.loanExists(loanId),
    queryFn: () => loanExists(loanId),
    enabled: enabled && !!loanId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useLoanHistory = (loanId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: vaultKeys.loanHistory(loanId),
    queryFn: () => getLoanHistory(loanId),
    enabled: enabled && !!loanId,
    staleTime: 1000 * 60 * 5,
  });
};

// Alias para compatibilidad con código existente
export const useLoanHistoryWithChanges = useLoanHistory;

export const useLoanByTxId = (txId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: vaultKeys.loanByTxId(txId),
    queryFn: () => getLoanByTxId(txId),
    enabled: enabled && !!txId && txId.startsWith('0x'),
    staleTime: 1000 * 60 * 10, // 10 minutos - datos históricos no cambian
    retry: 1,
  });
};

// ==================== PORTFOLIO CERTIFICATE REACT QUERY HOOKS ====================

export const usePortfolioCertificate = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: vaultKeys.portfolio(userId),
    queryFn: () => getPortfolioCertificate(userId),
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

export const usePortfolioCertificateTxId = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: vaultKeys.portfolioTxId(userId),
    queryFn: () => getPortfolioCertificateTxId(userId),
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 2,
  });
};

// ==================== LOAN MUTATIONS ====================

export const useCreateLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ privateKey, loanData }: { privateKey: string; loanData: CreateLoanRequest }) =>
      createLoan(privateKey, loanData),
    onSuccess: (_, variables) => {
      toast.success(`Loan ${variables.loanData.ID} created successfully`);

      queryClient.invalidateQueries({ queryKey: vaultKeys.allLoans() });
      queryClient.invalidateQueries({ queryKey: vaultKeys.myLoans(variables.loanData.UserID) });
      queryClient.invalidateQueries({ queryKey: vaultKeys.loan(variables.loanData.ID) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create loan');
    },
  });
};

export const useUpdateLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      loanId,
      privateKey,
      loanData
    }: {
      loanId: string;
      privateKey: string;
      loanData: CreateLoanRequest;
    }) => updateLoan(loanId, privateKey, loanData),
    onSuccess: (_, variables) => {
      toast.success(`Loan ${variables.loanId} updated successfully`);

      queryClient.invalidateQueries({ queryKey: vaultKeys.allLoans() });
      queryClient.invalidateQueries({ queryKey: vaultKeys.myLoans(variables.loanData.UserID) });
      queryClient.invalidateQueries({ queryKey: vaultKeys.loan(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: vaultKeys.loanHistory(variables.loanId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update loan');
    },
  });
};

export const useDeleteLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ loanId, privateKey }: { loanId: string; privateKey: string }) =>
      deleteLoan(loanId, privateKey),
    onSuccess: (_, variables) => {
      toast.success(`Loan ${variables.loanId} deleted successfully`);

      queryClient.invalidateQueries({ queryKey: vaultKeys.loans() });
      queryClient.removeQueries({ queryKey: vaultKeys.loan(variables.loanId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete loan');
    },
  });
};

// ==================== PORTFOLIO CERTIFICATE MUTATIONS ====================

export const useCreatePortfolioCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePortfolioCertificateRequest) => createPortfolioCertificate(data),
    onSuccess: (response, variables) => {
      toast.success(`Portfolio certificate created for user ${variables.userId}`);

      queryClient.invalidateQueries({ queryKey: vaultKeys.portfolio(variables.userId) });
      queryClient.invalidateQueries({ queryKey: vaultKeys.portfolioTxId(variables.userId) });
      queryClient.invalidateQueries({ queryKey: vaultKeys.portfolios() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create portfolio certificate');
    },
  });
};

export const useUpdatePortfolioCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePortfolioCertificateRequest) => updatePortfolioCertificate(data),
    onSuccess: (response, variables) => {
      toast.success(`Portfolio certificate updated for user ${variables.userId}`);

      queryClient.invalidateQueries({ queryKey: vaultKeys.portfolio(variables.userId) });
      queryClient.invalidateQueries({ queryKey: vaultKeys.portfolioTxId(variables.userId) });
      queryClient.invalidateQueries({ queryKey: vaultKeys.portfolios() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update portfolio certificate');
    },
  });
};