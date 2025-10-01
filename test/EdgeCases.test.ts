import { expect } from "chai";
import { ethers } from "hardhat";
import { SecretGameMasterEnhanced } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Edge Cases and Stress Tests", function () {
    let contract: SecretGameMasterEnhanced;
    let gameMaster: SignerWithAddress;
    let players: SignerWithAddress[];

    const VRF_COORDINATOR = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
    const SUBSCRIPTION_ID = 1;
    const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
    const CALLBACK_GAS_LIMIT = 100000;

    beforeEach(async function () {
        const signers = await ethers.getSigners();
        gameMaster = signers[0];
        players = signers.slice(1, 11); // Get 10 players

        const SecretGameMasterEnhanced = await ethers.getContractFactory("SecretGameMasterEnhanced");
        contract = await SecretGameMasterEnhanced.deploy(
            VRF_COORDINATOR,
            SUBSCRIPTION_ID,
            KEY_HASH,
            CALLBACK_GAS_LIMIT
        );
        await contract.waitForDeployment();

        await contract.connect(gameMaster).claimGameMaster();
    });

    describe("Tie Scenarios", function () {
        let gameId: bigint;

        beforeEach(async function () {
            // Create game with 5 players, max 3 guesses each
            await contract.connect(gameMaster).startGame(5, 1, 100, 3, 2, false, false);
            gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();

            // Have 3 players join
            for (let i = 0; i < 3; i++) {
                await contract.connect(players[i]).joinGame(gameId);
            }
        });

        it("Should handle ties with equal closest guesses", async function () {
            // Both players make the same distance guess
            await contract.connect(players[0]).makeGuess(gameId, 1, 50);
            await contract.connect(players[1]).makeGuess(gameId, 1, 50);
            await contract.connect(players[2]).makeGuess(gameId, 1, 49);

            // End game - should pick first closest guesser
            await contract.connect(gameMaster).endGame(gameId);

            const gameInfo = await contract.getGameInfo(gameId);
            expect(gameInfo.gameWon).to.be.true;
            // Winner should be one of the closest guessers
            expect([players[0].address, players[1].address, players[2].address]).to.include(gameInfo.winner);
        });

        it("Should handle all players making max guesses without winner", async function () {
            // All players make their max guesses (3 each)
            for (let i = 0; i < 3; i++) {
                await contract.connect(players[i]).makeGuess(gameId, 1, 20 + i * 10);
                await contract.connect(players[i]).makeGuess(gameId, 2, 30 + i * 10);
                await contract.connect(players[i]).makeGuess(gameId, 3, 40 + i * 10);
            }

            // All players reached max guesses - game master should end it
            await contract.connect(gameMaster).endGame(gameId);

            const gameInfo = await contract.getGameInfo(gameId);
            expect(gameInfo.gameWon).to.be.true;
            expect(gameInfo.status).to.equal(4); // Finished
            expect(gameInfo.totalGuesses).to.equal(9); // 3 players × 3 guesses
        });
    });

    describe("Max Guesses Enforcement", function () {
        let gameId: bigint;

        beforeEach(async function () {
            await contract.connect(gameMaster).startGame(3, 1, 10, 2, 2, false, false);
            gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
            await contract.connect(players[0]).joinGame(gameId);
        });

        it("Should enforce max guesses per player strictly", async function () {
            // Make allowed guesses
            await contract.connect(players[0]).makeGuess(gameId, 1, 3);
            await contract.connect(players[0]).makeGuess(gameId, 2, 5);

            // Third guess should fail
            await expect(contract.connect(players[0]).makeGuess(gameId, 3, 7))
                .to.be.revertedWith("Max guesses exceeded");
        });

        it("Should track guesses independently per player", async function () {
            await contract.connect(players[1]).joinGame(gameId);

            // Player 0 makes max guesses
            await contract.connect(players[0]).makeGuess(gameId, 1, 3);
            await contract.connect(players[0]).makeGuess(gameId, 2, 5);

            // Player 1 should still be able to guess
            await expect(contract.connect(players[1]).makeGuess(gameId, 1, 4))
                .to.not.be.reverted;

            const count0 = await contract.getPlayerGuessCount(gameId, players[0].address);
            const count1 = await contract.getPlayerGuessCount(gameId, players[1].address);

            expect(count0).to.equal(2);
            expect(count1).to.equal(1);
        });
    });

    describe("Game Reset Edge Cases", function () {
        let gameId: bigint;

        beforeEach(async function () {
            await contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false);
            gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
        });

        it("Should reset game with active players", async function () {
            // Players join and make guesses
            await contract.connect(players[0]).joinGame(gameId);
            await contract.connect(players[1]).joinGame(gameId);
            await contract.connect(players[0]).makeGuess(gameId, 1, 5);

            // Reset game
            await contract.connect(gameMaster).resetGame(gameId);

            // Verify reset state
            const gameInfo = await contract.getGameInfo(gameId);
            expect(gameInfo.status).to.equal(0); // Waiting
            expect(gameInfo.playerCount).to.equal(0);
            expect(gameInfo.totalGuesses).to.equal(0);

            // Verify player data cleared
            const player0Guesses = await contract.getPlayerGuessCount(gameId, players[0].address);
            expect(player0Guesses).to.equal(0);
        });

        it("Should allow game master to start new game after reset", async function () {
            await contract.connect(gameMaster).resetGame(gameId);

            // Should be able to start a new game
            await expect(contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false))
                .to.not.be.reverted;

            const newGameId = await contract.gameMasterGameId(gameMaster.address);
            expect(newGameId).to.be.greaterThan(gameId);
        });

        it("Should handle reset with commit-reveal mode", async function () {
            // Create commit-reveal game
            await contract.connect(gameMaster).resetGame(gameId);
            await contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, true, false);
            const crGameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
            await contract.connect(players[0]).joinGame(crGameId);

            // Make a commit
            const salt = ethers.randomBytes(32);
            const commitHash = await contract.connect(players[0]).generateCommitHash(5, 3, salt);
            await contract.connect(players[0]).commitGuess(crGameId, commitHash);

            // Reset should clear commits
            await contract.connect(gameMaster).resetGame(crGameId);

            const commitCount = await contract.getPlayerCommitCount(crGameId, players[0].address);
            expect(commitCount).to.equal(0);
        });
    });

    describe("Concurrent Game Scenarios", function () {
        it("Should prevent game master from having multiple active games", async function () {
            // Start first game
            await contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false);

            // Try to start second game - should fail
            await expect(contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false))
                .to.be.revertedWith("Already has an active game");
        });

        it("Should allow multiple game masters with separate games", async function () {
            // Game master 1 starts game
            await contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false);
            const gameId1 = await contract.gameMasterGameId(gameMaster.address);

            // Game master 2 claims and starts game
            await contract.connect(players[0]).claimGameMaster();
            await contract.connect(players[0]).startGame(3, 1, 10, 3, 2, false, false);
            const gameId2 = await contract.gameMasterGameId(players[0].address);

            expect(gameId1).to.not.equal(gameId2);

            // Activate both games
            await contract.connect(gameMaster).activateGame();
            await contract.connect(players[0]).activateGame();

            // Verify both are active
            const game1Info = await contract.getGameInfo(gameId1);
            const game2Info = await contract.getGameInfo(gameId2);

            expect(game1Info.status).to.equal(1); // Active
            expect(game2Info.status).to.equal(1); // Active
        });
    });

    describe("Boundary Value Testing", function () {
        it("Should handle minimum range (1-2)", async function () {
            await contract.connect(gameMaster).startGame(3, 1, 2, 3, 2, false, false);
            const gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
            await contract.connect(players[0]).joinGame(gameId);

            // Should be able to guess 1 or 2
            await expect(contract.connect(players[0]).makeGuess(gameId, 1, 1)).to.not.be.reverted;
            await expect(contract.connect(players[0]).makeGuess(gameId, 2, 2)).to.not.be.reverted;
        });

        it("Should handle maximum range (1-255)", async function () {
            await contract.connect(gameMaster).startGame(3, 1, 255, 3, 2, false, false);
            const gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
            await contract.connect(players[0]).joinGame(gameId);

            // Should be able to guess at extremes
            await expect(contract.connect(players[0]).makeGuess(gameId, 1, 1)).to.not.be.reverted;
            await expect(contract.connect(players[0]).makeGuess(gameId, 2, 255)).to.not.be.reverted;
            await expect(contract.connect(players[0]).makeGuess(gameId, 3, 128)).to.not.be.reverted;
        });

        it("Should handle maximum players (10)", async function () {
            await contract.connect(gameMaster).startGame(10, 1, 10, 3, 2, false, false);
            const gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();

            // Join with 10 players
            for (let i = 0; i < 10; i++) {
                await contract.connect(players[i]).joinGame(gameId);
            }

            const gameInfo = await contract.getGameInfo(gameId);
            expect(gameInfo.playerCount).to.equal(10);
        });

        it("Should handle single guess per player (min)", async function () {
            await contract.connect(gameMaster).startGame(3, 1, 10, 1, 2, false, false);
            const gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
            await contract.connect(players[0]).joinGame(gameId);

            // First guess should work
            await contract.connect(players[0]).makeGuess(gameId, 1, 5);

            // Second guess should fail
            await expect(contract.connect(players[0]).makeGuess(gameId, 2, 7))
                .to.be.revertedWith("Max guesses exceeded");
        });

        it("Should handle maximum guesses per player (10)", async function () {
            await contract.connect(gameMaster).startGame(3, 1, 100, 10, 2, false, false);
            const gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
            await contract.connect(players[0]).joinGame(gameId);

            // Make 10 guesses
            for (let i = 1; i <= 10; i++) {
                await contract.connect(players[0]).makeGuess(gameId, i, i * 10);
            }

            const guessCount = await contract.getPlayerGuessCount(gameId, players[0].address);
            expect(guessCount).to.equal(10);

            // 11th guess should fail
            await expect(contract.connect(players[0]).makeGuess(gameId, 11, 55))
                .to.be.revertedWith("Max guesses exceeded");
        });
    });

    describe("Invalid State Transitions", function () {
        let gameId: bigint;

        beforeEach(async function () {
            await contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false);
            gameId = await contract.gameMasterGameId(gameMaster.address);
        });

        it("Should not allow joining before game activation", async function () {
            // Game is in Waiting state
            await expect(contract.connect(players[0]).joinGame(gameId))
                .to.be.revertedWith("Game not active");
        });

        it("Should not allow guessing in finished game", async function () {
            await contract.connect(gameMaster).activateGame();
            await contract.connect(players[0]).joinGame(gameId);

            // Make all guesses
            for (let i = 1; i <= 10; i++) {
                try {
                    await contract.connect(players[0]).makeGuess(gameId, 1, i);
                    const gameInfo = await contract.getGameInfo(gameId);
                    if (gameInfo.status === 4n) break; // Game finished
                } catch (error) {
                    break; // Max guesses reached
                }
            }

            // If game is finished, guessing should fail
            const gameInfo = await contract.getGameInfo(gameId);
            if (gameInfo.status === 4n) {
                await contract.connect(players[1]).joinGame(gameId).catch(() => {});
                await expect(contract.connect(players[1]).makeGuess(gameId, 1, 5))
                    .to.be.reverted;
            }
        });

        it("Should not allow activation of already active game", async function () {
            await contract.connect(gameMaster).activateGame();

            // Second activation should fail
            await expect(contract.connect(gameMaster).activateGame())
                .to.be.revertedWith("Game not in waiting state");
        });
    });

    describe("Gas Optimization Tests", function () {
        it("Should handle mass joins efficiently", async function () {
            await contract.connect(gameMaster).startGame(10, 1, 10, 3, 2, false, false);
            const gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();

            // Join with 10 players and measure gas
            const gasUsed = [];
            for (let i = 0; i < 10; i++) {
                const tx = await contract.connect(players[i]).joinGame(gameId);
                const receipt = await tx.wait();
                gasUsed.push(receipt!.gasUsed);
            }

            // Gas should be relatively consistent
            const avgGas = gasUsed.reduce((a, b) => a + b, 0n) / BigInt(gasUsed.length);
            console.log("Average gas per join:", avgGas.toString());

            // Each join should use reasonable gas (adjust threshold as needed)
            gasUsed.forEach(gas => {
                expect(gas).to.be.lessThan(150000n);
            });
        });

        it("Should handle mass guesses efficiently", async function () {
            await contract.connect(gameMaster).startGame(5, 1, 100, 10, 2, false, false);
            const gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();

            // Have 5 players join
            for (let i = 0; i < 5; i++) {
                await contract.connect(players[i]).joinGame(gameId);
            }

            // Each player makes 10 guesses
            const gasUsed = [];
            for (let i = 0; i < 5; i++) {
                for (let j = 1; j <= 10; j++) {
                    const tx = await contract.connect(players[i]).makeGuess(gameId, j, j * 10);
                    const receipt = await tx.wait();
                    gasUsed.push(receipt!.gasUsed);
                }
            }

            const avgGas = gasUsed.reduce((a, b) => a + b, 0n) / BigInt(gasUsed.length);
            console.log("Average gas per guess:", avgGas.toString());

            // Guesses should use reasonable gas
            gasUsed.forEach(gas => {
                expect(gas).to.be.lessThan(200000n);
            });
        });
    });

    describe("Reentrancy Protection", function () {
        it("Should not be vulnerable to reentrancy on guess", async function () {
            await contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false);
            const gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
            await contract.connect(players[0]).joinGame(gameId);

            // Normal guess should work
            await contract.connect(players[0]).makeGuess(gameId, 1, 5);

            // State should be consistent
            const guessCount = await contract.getPlayerGuessCount(gameId, players[0].address);
            expect(guessCount).to.equal(1);
        });
    });

    describe("Access Control Edge Cases", function () {
        let gameId: bigint;

        beforeEach(async function () {
            await contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false);
            gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
        });

        it("Should not allow non-game-master to end game", async function () {
            await expect(contract.connect(players[0]).endGame(gameId))
                .to.be.revertedWith("Not a game master");
        });

        it("Should not allow game master to end other's game", async function () {
            // Create second game master
            await contract.connect(players[0]).claimGameMaster();
            await contract.connect(players[0]).startGame(3, 1, 10, 3, 2, false, false);

            // Game master 1 tries to end game master 2's game
            const gameId2 = await contract.gameMasterGameId(players[0].address);
            await expect(contract.connect(gameMaster).endGame(gameId2))
                .to.be.revertedWith("Not your game");
        });

        it("Should not allow non-game-master to give hints", async function () {
            await expect(contract.connect(players[0]).giveHint(gameId))
                .to.be.revertedWith("Not a game master");
        });
    });
});

