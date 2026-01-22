import { useState, Fragment } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
} from "@headlessui/react";
import { DollarSign, TrendingUp, Store } from "lucide-react";
import { IoClose } from "react-icons/io5";
import { useApproveLoanForSale } from "../../../../services/apiMarketplace";
import type { CompactLoan } from "../../../../types/vaultTypes";
import { ConfirmendMarketplace } from "./ConfirmendMarketplace";

interface DetailMarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
  loan: CompactLoan;
}

export const DetailMarketplace = ({ isOpen, onClose, loan }: DetailMarketplaceProps) => {
  const [askingPrice, setAskingPrice] = useState("");
  const [modifiedInterestRate, setModifiedInterestRate] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);

  const approveMutation = useApproveLoanForSale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!privateKey || !askingPrice || !modifiedInterestRate) {
      return;
    }

    try {
      const result = await approveMutation.mutateAsync({
        loanId: loan.ID,
        data: {
          privateKey,
          askingPrice,
          modifiedInterestRate: Number(modifiedInterestRate)
        }
      });

      // Guardar datos de confirmación y mostrar modal
      setConfirmationData(result);
      setShowConfirmation(true);

      // Resetear formulario
      setAskingPrice("");
      setModifiedInterestRate("");
      setPrivateKey("");
    } catch (error) {
      console.error("Error approving loan:", error);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setConfirmationData(null);
    onClose(); // Cerrar también el modal principal
  };

  if (showConfirmation && confirmationData) {
    return (
      <ConfirmendMarketplace
        isOpen={showConfirmation}
        onClose={handleCloseConfirmation}
        data={confirmationData}
        loan={loan}
      />
    );
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/70 transition-opacity data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-2xl data-closed:opacity-0 data-closed:translate-y-4 sm:data-closed:translate-y-0 sm:data-closed:scale-95"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Store className="w-8 h-8" />
                  <div className="text-left">
                    <Dialog.Title className="text-2xl font-bold">
                      Publish to Marketplace
                    </Dialog.Title>
                    <p className="text-green-100 text-sm">Loan ID: {loan.ID}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-green-800 p-2 rounded-full transition"
                >
                  <IoClose size={28} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Loan Summary */}
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-900 mb-3">Loan Summary</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Borrower:</span>
                      <p className="font-medium">{loan.BorrowerFullName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Current Balance:</span>
                      <p className="font-medium text-green-600">
                        ${Number(loan.CurrentPrincipalBal || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Property:</span>
                      <p className="font-medium">{loan.BorrowerPropertyAddress}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <p className="font-medium">{loan.Status}</p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Asking Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Asking Price (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={askingPrice}
                      onChange={(e) => setAskingPrice(e.target.value)}
                      placeholder="e.g., 0.5"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Set the price in ETH for tokenization
                    </p>
                  </div>

                  {/* Modified Interest Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      Modified Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={modifiedInterestRate}
                      onChange={(e) => setModifiedInterestRate(e.target.value)}
                      placeholder="e.g., 5.5"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Set the interest rate for the tokenized loan
                    </p>
                  </div>

                  {/* Private Key */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Private Key
                    </label>
                    <input
                      type="password"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      placeholder="Enter your private key"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-red-500 mt-1">
                      ⚠️ Never share your private key. It will be used only for this transaction.
                    </p>
                  </div>

                  {/* Info Alert */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Once approved, your loan will be queued for tokenization.
                      The relayer will process it and mint an NFT on Avalanche.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={approveMutation.isPending}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {approveMutation.isPending ? "Processing..." : "Approve for Sale"}
                    </button>
                  </div>
                </form>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};