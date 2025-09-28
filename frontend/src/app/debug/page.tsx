'use client';

import { useAccount, usePublicClient } from 'wagmi';

export default function DebugPage() {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

    const testContract = async () => {
        if (!publicClient || !contractAddress) {
            console.log('No public client or contract address');
            return;
        }

        try {
            console.log('Testing contract access...');
            const gameMaster = await publicClient.readContract({
                address: contractAddress,
                abi: ['function gameMaster() view returns (address)'],
                functionName: 'gameMaster'
            });
            console.log('Game Master:', gameMaster);
        } catch (error) {
            console.error('Contract access error:', error);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">🔧 Debug Page</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Connection Status */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">🔗 Connection Status</h2>
                        <div className="space-y-2">
                            <p><strong>Wallet Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}</p>
                            <p><strong>Address:</strong> {address || 'Not connected'}</p>
                            <p><strong>Public Client:</strong> {publicClient ? '✅ Yes' : '❌ No'}</p>
                            <p><strong>Contract Address:</strong> {contractAddress || 'Not set'}</p>
                        </div>
                    </div>

                    {/* Test Actions */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">🧪 Test Actions</h2>
                        <div className="space-y-4">
                            <button
                                onClick={testContract}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                            >
                                Test Contract Access
                            </button>

                            <a
                                href="/"
                                className="block w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 text-center"
                            >
                                ← Back to Main Game
                            </a>
                        </div>
                    </div>
                </div>

                {/* Environment Info */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">🌍 Environment Info</h2>
                    <div className="text-sm space-y-1 text-gray-600">
                        <p>NODE_ENV: {process.env.NODE_ENV}</p>
                        <p>NEXT_PUBLIC_CONTRACT_ADDRESS: {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}</p>
                        <p>Contract Address Type: {typeof contractAddress}</p>
                        <p>Contract Address Length: {contractAddress?.length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
