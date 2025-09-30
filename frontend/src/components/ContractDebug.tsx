'use client';

import { useAccount } from 'wagmi';

export function ContractDebug() {
    const { address, isConnected } = useAccount();

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const expectedAddress = '0x262512de845F01Db2B94f4CA1883113dAa4EAe22';

    return (
        <div className="card bg-yellow-50 border-yellow-200">
            <h3 className="text-lg font-semibold mb-4 text-yellow-800">🔧 Contract Debug Info</h3>

            <div className="space-y-3 text-sm">
                <div>
                    <strong>Current Contract Address:</strong>
                    <p className="font-mono text-xs break-all mt-1">
                        {contractAddress || 'Not set'}
                    </p>
                    {contractAddress !== expectedAddress && (
                        <p className="text-red-600 mt-1">
                            ⚠️ Should be: {expectedAddress}
                        </p>
                    )}
                </div>

                <div>
                    <strong>Wallet Status:</strong>
                    <p className={isConnected ? 'text-green-600' : 'text-red-600'}>
                        {isConnected ? '✅ Connected' : '❌ Not connected'}
                    </p>
                    {address && (
                        <p className="font-mono text-xs break-all mt-1">
                            {address}
                        </p>
                    )}
                </div>

                <div>
                    <strong>Network:</strong>
                    <p>Sepolia Testnet (Chain ID: 11155111)</p>
                </div>

                {contractAddress !== expectedAddress && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">⚠️ Action Required</h4>
                        <p className="text-red-700 text-sm mb-2">
                            Please update your .env file with the correct contract address:
                        </p>
                        <code className="block bg-white p-2 rounded border text-xs">
                            NEXT_PUBLIC_CONTRACT_ADDRESS={expectedAddress}
                        </code>
                        <p className="text-red-700 text-sm mt-2">
                            Then restart your development server.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
