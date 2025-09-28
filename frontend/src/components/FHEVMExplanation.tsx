'use client';

import { useState } from 'react';

interface FHEVMExplanationProps {
    isSimulationMode?: boolean;
    lastEncryptedValue?: string;
    lastDecryptedValue?: number;
}

export function FHEVMExplanation({
    isSimulationMode = true,
    lastEncryptedValue,
    lastDecryptedValue
}: FHEVMExplanationProps) {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">🔐 FHEVM in Action</h3>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
            </div>

            {/* Current Mode */}
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">
                        {isSimulationMode ? '🎭' : '🔒'}
                    </span>
                    <div>
                        <p className="font-semibold text-blue-800">
                            {isSimulationMode ? 'Simulation Mode' : 'Real FHEVM Mode'}
                        </p>
                        <p className="text-sm text-blue-600">
                            {isSimulationMode
                                ? 'Demonstrating FHEVM concepts with simulated encryption'
                                : 'Using actual FHEVM for confidential computing'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Live Encryption Demo */}
            {lastEncryptedValue && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">🎯 Latest Encryption</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Original:</span>
                            <span className="font-mono bg-white px-2 py-1 rounded">
                                {lastDecryptedValue}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Encrypted:</span>
                            <span className="font-mono bg-white px-2 py-1 rounded text-xs">
                                {lastEncryptedValue}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* What FHEVM Does */}
            <div className="space-y-3">
                <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                    <div>
                        <p className="font-semibold">Encrypted Input</p>
                        <p className="text-sm text-gray-600">
                            Your secret number is encrypted before being sent to the smart contract
                        </p>
                    </div>
                </div>

                <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                    <div>
                        <p className="font-semibold">Confidential Computing</p>
                        <p className="text-sm text-gray-600">
                            The contract compares encrypted guesses without seeing the actual numbers
                        </p>
                    </div>
                </div>

                <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                    <div>
                        <p className="font-semibold">Private Results</p>
                        <p className="text-sm text-gray-600">
                            Only the winner is revealed publicly, keeping all guesses private
                        </p>
                    </div>
                </div>
            </div>

            {/* Detailed Explanation */}
            {showDetails && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold mb-3">🔍 Technical Details</h4>
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="font-semibold text-gray-700">FHEVM (Fully Homomorphic Encryption Virtual Machine):</p>
                            <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                                <li>Enables computation on encrypted data</li>
                                <li>No need to decrypt data for processing</li>
                                <li>Maintains privacy throughout the computation</li>
                                <li>Perfect for confidential smart contracts</li>
                            </ul>
                        </div>

                        <div>
                            <p className="font-semibold text-gray-700">In This Game:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                                <li>Secret numbers are encrypted using FHEVM</li>
                                <li>Guesses are compared in encrypted form</li>
                                <li>Smart contract never sees actual numbers</li>
                                <li>Only final winner is revealed</li>
                            </ul>
                        </div>

                        {isSimulationMode && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="font-semibold text-yellow-800">⚠️ Simulation Mode</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    This tutorial uses simulated encryption for demonstration.
                                    In production, real FHEVM would encrypt your data using
                                    advanced cryptographic techniques.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
