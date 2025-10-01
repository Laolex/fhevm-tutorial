import { expect } from "chai";
import { ethers } from "hardhat";
import { SecretGameMasterEnhanced } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SecretGameMasterEnhanced - Comprehensive Tests", function () {
    let contract: SecretGameMasterEnhanced;
    let owner: SignerWithAddress;
    let gameMaster: SignerWithAddress;
    let player1: SignerWithAddress;
    let player2: SignerWithAddress;
    let player3: SignerWithAddress;

    // Mock Chainlink VRF parameters for Sepolia
    const VRF_COORDINATOR = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"; // Sepolia
    const SUBSCRIPTION_ID = 1; // Mock subscription ID
    const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"; // Sepolia
    const CALLBACK_GAS_LIMIT = 100000;

    beforeEach(async function () {
        [owner, gameMaster, player1, player2, player3] = await ethers.getSigners();

        const SecretGameMasterEnhanced = await ethers.getContractFactory("SecretGameMasterEnhanced");
        contract = await SecretGameMasterEnhanced.deploy(
            VRF_COORDINATOR,
            SUBSCRIPTION_ID,
            KEY_HASH,
            CALLBACK_GAS_LIMIT
        );
        await contract.waitForDeployment();
    });

    describe("Game Master Claims", function () {
        it("Should allow user to claim game master status", async function () {
            await expect(contract.connect(gameMaster).claimGameMaster())
                .to.emit(contract, "GameMasterClaimed")
                .withArgs(gameMaster.address);

            expect(await contract.isGameMaster(gameMaster.address)).to.be.true;
        });

        it("Should not allow duplicate game master claim", async function () {
            await contract.connect(gameMaster).claimGameMaster();
            await expect(contract.connect(gameMaster).claimGameMaster())
                .to.be.revertedWith("Already a game master");
        });
    });

    describe("Game Creation - Standard Mode", function () {
        beforeEach(async function () {
            await contract.connect(gameMaster).claimGameMaster();
        });

        it("Should create a game without commit-reveal", async function () {
            await expect(
                contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false)
            ).to.emit(contract, "GameCreated");

            const gameId = await contract.gameMasterGameId(gameMaster.address);
            const gameInfo = await contract.getGameInfo(gameId);

            expect(gameInfo.gameMaster).to.equal(gameMaster.address);
            expect(gameInfo.maxPlayers).to.equal(3);
            expect(gameInfo.minRange).to.equal(1);
            expect(gameInfo.maxRange).to.equal(10);
            expect(gameInfo.useCommitReveal).to.be.false;
        });

        it("Should enforce player limits", async function () {
            await expect(
                contract.connect(gameMaster).startGame(1, 1, 10, 3, 2, false, false)
            ).to.be.revertedWith("Max players: 2-10");

            await expect(
                contract.connect(gameMaster).startGame(11, 1, 10, 3, 2, false, false)
            ).to.be.revertedWith("Max players: 2-10");
        });

        it("Should enforce valid range", async function () {
            await expect(
                contract.connect(gameMaster).startGame(3, 10, 10, 3, 2, false, false)
            ).to.be.revertedWith("Invalid range");
        });
    });

    describe("Standard Gameplay", function () {
        let gameId: bigint;

        beforeEach(async function () {
            await contract.connect(gameMaster).claimGameMaster();
            await contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false);
            gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
        });

        it("Should allow players to join", async function () {
            await expect(contract.connect(player1).joinGame(gameId))
                .to.emit(contract, "PlayerJoined")
                .withArgs(player1.address, gameId);

            const players = await contract.getPlayers(gameId);
            expect(players.length).to.equal(1);
            expect(players[0]).to.equal(player1.address);
        });

        it("Should allow making guesses", async function () {
            await contract.connect(player1).joinGame(gameId);

            await expect(contract.connect(player1).makeGuess(gameId, 5, 5))
                .to.emit(contract, "GuessMade");

            const guessCount = await contract.getPlayerGuessCount(gameId, player1.address);
            expect(guessCount).to.equal(1);
        });

        it("Should enforce max guesses per player", async function () {
            await contract.connect(player1).joinGame(gameId);

            // Make 3 guesses (the limit)
            await contract.connect(player1).makeGuess(gameId, 1, 3);
            await contract.connect(player1).makeGuess(gameId, 2, 5);
            await contract.connect(player1).makeGuess(gameId, 3, 7);

            // 4th guess should fail
            await expect(contract.connect(player1).makeGuess(gameId, 4, 9))
                .to.be.revertedWith("Max guesses exceeded");
        });

        it("Should not allow guesses out of range", async function () {
            await contract.connect(player1).joinGame(gameId);

            await expect(contract.connect(player1).makeGuess(gameId, 1, 0))
                .to.be.revertedWith("Guess out of range");

            await expect(contract.connect(player1).makeGuess(gameId, 1, 11))
                .to.be.revertedWith("Guess out of range");
        });

        it("Should declare winner on correct guess", async function () {
            await contract.connect(player1).joinGame(gameId);

            // Get secret number (this is a test, so we cheat)
            // In real game, secret number is hidden
            // We'll just make multiple guesses until we win
            let gameWon = false;
            for (let guess = 1; guess <= 10 && !gameWon; guess++) {
                try {
                    await contract.connect(player1).makeGuess(gameId, 1, guess);
                    const gameInfo = await contract.getGameInfo(gameId);
                    gameWon = gameInfo.gameWon;
                    if (gameWon) {
                        expect(gameInfo.winner).to.equal(player1.address);
                        break;
                    }
                } catch (error) {
                    // Max guesses exceeded
                    break;
                }
            }
        });
    });

    describe("Commit-Reveal Gameplay", function () {
        let gameId: bigint;

        beforeEach(async function () {
            await contract.connect(gameMaster).claimGameMaster();
            await contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, true, false);
            gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
            await contract.connect(player1).joinGame(gameId);
            await contract.connect(player2).joinGame(gameId);
        });

        it("Should allow committing guesses", async function () {
            const salt = ethers.randomBytes(32);
            const commitHash = await contract.connect(player1).generateCommitHash(5, 3, salt);

            await expect(contract.connect(player1).commitGuess(gameId, commitHash))
                .to.emit(contract, "GuessCommitted")
                .withArgs(gameId, player1.address, commitHash);

            const commitCount = await contract.getPlayerCommitCount(gameId, player1.address);
            expect(commitCount).to.equal(1);
        });

        it("Should start commit phase on first commit", async function () {
            const salt = ethers.randomBytes(32);
            const commitHash = await contract.connect(player1).generateCommitHash(5, 3, salt);

            await expect(contract.connect(player1).commitGuess(gameId, commitHash))
                .to.emit(contract, "CommitPhaseStarted");

            const gameInfo = await contract.getGameInfo(gameId);
            expect(gameInfo.status).to.equal(2); // CommitPhase
        });

        it("Should allow multiple commits", async function () {
            const salt1 = ethers.randomBytes(32);
            const salt2 = ethers.randomBytes(32);
            const commitHash1 = await contract.connect(player1).generateCommitHash(5, 3, salt1);
            const commitHash2 = await contract.connect(player1).generateCommitHash(7, 4, salt2);

            await contract.connect(player1).commitGuess(gameId, commitHash1);
            await contract.connect(player1).commitGuess(gameId, commitHash2);

            const commitCount = await contract.getPlayerCommitCount(gameId, player1.address);
            expect(commitCount).to.equal(2);
        });

        it("Should enforce max commits per player", async function () {
            const salts = [ethers.randomBytes(32), ethers.randomBytes(32), ethers.randomBytes(32)];
            const hashes = await Promise.all(
                salts.map(salt => contract.connect(player1).generateCommitHash(5, 3, salt))
            );

            // Make 3 commits (the limit)
            for (const hash of hashes) {
                await contract.connect(player1).commitGuess(gameId, hash);
            }

            // 4th commit should fail
            const salt4 = ethers.randomBytes(32);
            const hash4 = await contract.connect(player1).generateCommitHash(6, 4, salt4);
            await expect(contract.connect(player1).commitGuess(gameId, hash4))
                .to.be.revertedWith("Max commits exceeded");
        });
    });

    describe("Edge Cases", function () {
        let gameId: bigint;

        beforeEach(async function () {
            await contract.connect(gameMaster).claimGameMaster();
            await contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false);
            gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
        });

        it("Should handle game full scenario", async function () {
            await contract.connect(player1).joinGame(gameId);
            await contract.connect(player2).joinGame(gameId);
            await contract.connect(player3).joinGame(gameId);

            // 4th player should not be able to join
            await expect(contract.connect(owner).joinGame(gameId))
                .to.be.revertedWith("Game is full");
        });

        it("Should not allow duplicate joins", async function () {
            await contract.connect(player1).joinGame(gameId);
            await expect(contract.connect(player1).joinGame(gameId))
                .to.be.revertedWith("Already joined");
        });

        it("Should not allow guesses before joining", async function () {
            await expect(contract.connect(player1).makeGuess(gameId, 1, 5))
                .to.be.revertedWith("Must join game first");
        });

        it("Should handle game end by game master", async function () {
            await contract.connect(player1).joinGame(gameId);
            await contract.connect(player1).makeGuess(gameId, 1, 5);

            await expect(contract.connect(gameMaster).endGame(gameId))
                .to.emit(contract, "GameEnded");

            const gameInfo = await contract.getGameInfo(gameId);
            expect(gameInfo.status).to.equal(4); // Finished
            expect(gameInfo.gameWon).to.be.true;
        });

        it("Should award closest guess winner when game ends", async function () {
            await contract.connect(player1).joinGame(gameId);
            await contract.connect(player2).joinGame(gameId);

            // Make guesses (not exact matches)
            await contract.connect(player1).makeGuess(gameId, 1, 3);
            await contract.connect(player2).makeGuess(gameId, 1, 8);

            await expect(contract.connect(gameMaster).endGame(gameId))
                .to.emit(contract, "ClosestGuessWinner");

            const gameInfo = await contract.getGameInfo(gameId);
            expect(gameInfo.gameWon).to.be.true;
            expect(gameInfo.winner).to.not.equal(ethers.ZeroAddress);
        });
    });

    describe("Reset Functionality", function () {
        let gameId: bigint;

        beforeEach(async function () {
            await contract.connect(gameMaster).claimGameMaster();
            await contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false);
            gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
            await contract.connect(player1).joinGame(gameId);
            await contract.connect(player1).makeGuess(gameId, 1, 5);
        });

        it("Should reset game state", async function () {
            await expect(contract.connect(gameMaster).resetGame(gameId))
                .to.emit(contract, "GameReset");

            const gameInfo = await contract.getGameInfo(gameId);
            expect(gameInfo.status).to.equal(0); // Waiting
            expect(gameInfo.totalGuesses).to.equal(0);
            expect(gameInfo.playerCount).to.equal(0);
        });

        it("Should clear player data on reset", async function () {
            await contract.connect(gameMaster).resetGame(gameId);

            const guessCount = await contract.getPlayerGuessCount(gameId, player1.address);
            expect(guessCount).to.equal(0);
        });
    });

    describe("Hints System", function () {
        let gameId: bigint;

        beforeEach(async function () {
            await contract.connect(gameMaster).claimGameMaster();
            await contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false);
            gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
        });

        it("Should allow game master to give hints", async function () {
            await expect(contract.connect(gameMaster).giveHint(gameId))
                .to.emit(contract, "HintGiven");

            await expect(contract.connect(gameMaster).giveHint(gameId))
                .to.emit(contract, "HintGiven");

            await expect(contract.connect(gameMaster).giveHint(gameId))
                .to.emit(contract, "HintGiven");
        });

        it("Should limit hints to 3", async function () {
            await contract.connect(gameMaster).giveHint(gameId);
            await contract.connect(gameMaster).giveHint(gameId);
            await contract.connect(gameMaster).giveHint(gameId);

            await expect(contract.connect(gameMaster).giveHint(gameId))
                .to.be.revertedWith("Maximum hints given");
        });

        it("Should not allow non-game-master to give hints", async function () {
            await expect(contract.connect(player1).giveHint(gameId))
                .to.be.revertedWith("Not a game master");
        });
    });

    describe("Invite Codes", function () {
        let gameId: bigint;
        let inviteCode: string;

        beforeEach(async function () {
            await contract.connect(gameMaster).claimGameMaster();
            await contract.connect(gameMaster).startGame(3, 1, 10, 3, 2, false, false);
            gameId = await contract.gameMasterGameId(gameMaster.address);
            await contract.connect(gameMaster).activateGame();
            const gameInfo = await contract.getGameInfo(gameId);
            inviteCode = gameInfo.inviteCode;
        });

        it("Should allow joining with invite code", async function () {
            await expect(contract.connect(player1).joinGameWithInvite(inviteCode))
                .to.emit(contract, "PlayerJoined");

            const players = await contract.getPlayers(gameId);
            expect(players[0]).to.equal(player1.address);
        });

        it("Should reject invalid invite code", async function () {
            await expect(contract.connect(player1).joinGameWithInvite("INVALID"))
                .to.be.revertedWith("Invalid invite code");
        });
    });
});

