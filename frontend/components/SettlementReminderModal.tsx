"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertCircle } from "lucide-react"; // Assuming lucide-react is used for icons

interface SettlementReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        totalBalance: number;
        pendingSettlements: number;
    };
}

const SettlementReminderModal: React.FC<SettlementReminderModalProps> = ({
    isOpen,
    onClose,
    data,
}) => {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-2 text-amber-500">
                            <AlertCircle size={28} />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Pending Settlements
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300">
                            You have pending dues that need your attention.
                        </p>

                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600 dark:text-gray-400">Total Pending Amount</span>
                                <span className="text-2xl font-bold text-red-500">₹{Math.abs(data.totalBalance)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Groups involved</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{data.pendingSettlements}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                onClose();
                                // Redirect to a settlements page? for now just close or maybe go to activity/groups
                                // Assuming maybe dashboard is fine, but UX says "View Settlements"
                            }}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-300"
                        >
                            View Settlements
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettlementReminderModal;
