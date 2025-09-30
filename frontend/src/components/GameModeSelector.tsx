'use client';

import React, { useState } from 'react';
import { Crown, Users, Share2, Gamepad2, Plus, UserPlus } from 'lucide-react';

interface GameModeSelectorProps {
    onStartAsGameMaster: () => void;
    onJoinGame: () => void;
    onJoinWithInvite: (inviteCode: string) => void;
}

export function GameModeSelector({ onStartAsGameMaster, onJoinGame, onJoinWithInvite }: GameModeSelectorProps) {
    const [inviteCode, setInviteCode] = useState<string>('');
    const [showInviteInput, setShowInviteInput] = useState<boolean>(false);

    const handleInviteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inviteCode.trim()) {
            onJoinWithInvite(inviteCode.trim());
        }
    };

    return (
        <div className="card-glass animate-slide-up">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gradient mb-3 flex items-center justify-center space-x-3">
                    <Gamepad2 className="w-10 h-10 animate-pulse-slow" />
                    <span>Choose Your Game Mode</span>
                </h2>
                <p className="text-lg text-gray-600">
                    Select how you want to participate in the Secret Number Game
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Start as Game Master */}
                <div className="border-2 border-blue-200 rounded-xl p-6 hover:border-blue-300 transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl hover:scale-105">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Crown className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-blue-900 mb-2">Start as Game Master</h3>
                        <p className="text-blue-700 mb-4">
                            Create a new game and set the secret number. You'll be the host and can invite others to join.
                        </p>
                        <button
                            onClick={onStartAsGameMaster}
                            className="btn-primary w-full flex items-center justify-center space-x-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Start New Game</span>
                        </button>
                    </div>
                </div>

                {/* Join Existing Game */}
                <div className="border-2 border-green-200 rounded-xl p-6 hover:border-green-300 transition-all duration-300 cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl hover:scale-105">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-green-900 mb-2">Join Existing Game</h3>
                        <p className="text-green-700 mb-4">
                            Join a game that's already in progress. You can browse public games or use an invite code.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={onJoinGame}
                                className="btn-secondary w-full flex items-center justify-center space-x-2"
                            >
                                <UserPlus className="w-5 h-5" />
                                <span>Browse Public Games</span>
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setShowInviteInput(!showInviteInput)}
                                    className="btn-outline w-full flex items-center justify-center space-x-2"
                                >
                                    <Share2 className="w-5 h-5" />
                                    <span>Use Invite Code</span>
                                </button>

                                {showInviteInput && (
                                    <form onSubmit={handleInviteSubmit} className="mt-3 space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Enter invite code..."
                                            value={inviteCode}
                                            onChange={(e) => setInviteCode(e.target.value)}
                                            className="input w-full"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inviteCode.trim()}
                                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Join with Invite
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Game Mode Explanation */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">How It Works:</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                        <strong className="text-blue-600">Game Master:</strong>
                        <ul className="mt-1 space-y-1">
                            <li>• Sets a secret number (1-100)</li>
                            <li>• Invites players to join</li>
                            <li>• Manages the game flow</li>
                            <li>• Can reset the game</li>
                        </ul>
                    </div>
                    <div>
                        <strong className="text-green-600">Player:</strong>
                        <ul className="mt-1 space-y-1">
                            <li>• Makes guesses at the secret number</li>
                            <li>• Receives hints (higher/lower)</li>
                            <li>• Wins by guessing correctly</li>
                            <li>• Can join multiple games</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* FHEVM Privacy Note */}
            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-bold text-sm">🔐</span>
                    </div>
                    <div>
                        <h4 className="font-semibold text-purple-800 mb-1">Privacy Protected by FHEVM</h4>
                        <p className="text-purple-700 text-sm">
                            Your secret numbers and guesses are encrypted using Fully Homomorphic Encryption.
                            The smart contract can perform computations on encrypted data without ever seeing the actual values.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
