import React from 'react'

export const MarketplaceExplorer = () => {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-6xl w-full flex flex-col items-center px-6 py-10
                  overflow-y-auto h-screen">
                <h1 className="text-3xl font-bold text-[#0280CC] mb-2 text-center">
                    FCI Marketplace Loans Explorer
                </h1>

                {/* Subtítulo */}
                <p className="text-gray-600 text-sm mb-6 text-center">
                    Friendly Search Engine that decrypts transactions of your financial Assets.
                </p>
            </div>

        </div>
    )
}
