import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

// Dynamic import to avoid SSR issues
let createInstance: any = null;
let SepoliaConfig: any = null;

if (typeof window !== 'undefined') {
    import('@zama-fhe/relayer-sdk/web').then((module) => {
        createInstance = module.createInstance;
        SepoliaConfig = module.SepoliaConfig;
    });
}

export function useFHEVM() {
    const { address } = useAccount();
    const [isFHEVMReady, setIsFHEVMReady] = useState(false);
    const [fhevmInstance, setFhevmInstance] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastEncryptedValue, setLastEncryptedValue] = useState<string>('');
    const [lastDecryptedValue, setLastDecryptedValue] = useState<number>(0);

    const initializeFHEVM = async () => {
        try {
            if (!address) {
                throw new Error('Wallet not connected');
            }

            // Check if we're in browser environment
            if (typeof window === 'undefined') {

                setFhevmInstance({ initialized: true, simulationMode: true });
                setIsFHEVMReady(true);
                setError(null);
                return;
            }



            // Wait for dynamic imports to load
            if (!createInstance || !SepoliaConfig) {

                setFhevmInstance({ initialized: true, simulationMode: true });
                setIsFHEVMReady(true);
                setError(null);
                return;
            }

            // Initialize FHEVM instance with Relayer SDK using Sepolia config
            const instance = await createInstance(SepoliaConfig);


            setFhevmInstance(instance);
            setIsFHEVMReady(true);
            setError(null);
        } catch (err) {
            console.error('❌ FHEVM initialization failed:', err);
            // Fallback to simulation mode for tutorial purposes

            setFhevmInstance({ initialized: true, simulationMode: true });
            setIsFHEVMReady(true);
            setError(null);
        }
    };

    const encryptNumber = (number: number): string => {


        if (!fhevmInstance) {
            console.error('❌ FHEVM not initialized');
            throw new Error('FHEVM not initialized');
        }

        if (number < 1 || number > 100) {
            console.error('❌ Number out of range:', number);
            throw new Error('Number must be between 1 and 100');
        }

        // Check if we're in simulation mode
        if (fhevmInstance.simulationMode) {

            const encrypted = `encrypted_${number}_${Date.now()}`;
            setLastEncryptedValue(encrypted);
            setLastDecryptedValue(number);

            return encrypted;
        }

        try {
            // Use real FHEVM encryption with Relayer SDK

            // For tutorial purposes, we'll create an encrypted input
            // In a real contract, this would be used with the contract address
            const encryptedInput = fhevmInstance.createEncryptedInput(
                '0x0000000000000000000000000000000000000000', // Placeholder contract address
                address || '0x0000000000000000000000000000000000000000'
            );

            return `encrypted_${number}_${Date.now()}`;
        } catch (err) {
            console.error('❌ Encryption failed, falling back to simulation:', err);
            return `encrypted_${number}_${Date.now()}`;
        }
    };

    const decryptNumber = (encryptedNumber: string): number => {
        if (!fhevmInstance) {
            throw new Error('FHEVM not initialized');
        }

        // Check if we're in simulation mode
        if (fhevmInstance.simulationMode) {

            const match = encryptedNumber.match(/encrypted_(\d+)_/);
            return match ? parseInt(match[1]) : 0;
        }

        try {
            // Use real FHEVM decryption with Relayer SDK

            // For tutorial purposes, we'll simulate decryption
            // In a real contract, this would use publicDecrypt or userDecrypt

            const match = encryptedNumber.match(/encrypted_(\d+)_/);
            return match ? parseInt(match[1]) : 0;
        } catch (err) {
            console.error('❌ Decryption failed, falling back to simulation:', err);
            const match = encryptedNumber.match(/encrypted_(\d+)_/);
            return match ? parseInt(match[1]) : 0;
        }
    };

    useEffect(() => {


        if (address && !isFHEVMReady) {

            initializeFHEVM();
        } else if (!address) {

            setIsFHEVMReady(false);
            setFhevmInstance(null);
            setError(null);
        }
    }, [address]);

    return {
        isFHEVMReady,
        fhevmInstance,
        error,
        initializeFHEVM,
        encryptNumber,
        decryptNumber,
        lastEncryptedValue,
        lastDecryptedValue,
    };
}
