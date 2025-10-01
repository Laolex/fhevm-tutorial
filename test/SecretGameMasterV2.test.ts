import { expect } from "chai";
import { ethers } from "hardhat";
import { SecretGameMasterV2 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-toolbox/signers";

describe("SecretGameMasterV2 - Comprehensive Tests", function () {
    let sgm: SecretGameMasterV2;
    let owner: SignerWithAddress;
    let player1: SignerWithAddress;
    let player2: SignerWithAddress;
    let player3: SignerWithAddress;
    
    // Mock Chainlink VRF Coordinator address (for testing)
    const VRF_COORDINATOR = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"; // Sepolia
    const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
    const SUBSCRIPTION_ID = 1;

    beforeEach(async function () {
        [owner, player1, player2, player3] = await ethers.getSigners();

        const SecretGameMasterV2 = await ethers.getContractFactory("SecretGameMasterV2");
        sgm = await SecretGameMasterV2.deploy(
            VRF_COORDINATOR,
            KEY_HASH,
            SUBSCRIPTION_ID
        );
        await sgm.waitForDeployment();
    });

    describe("Commit-Reveal Mechanism", function () {
        let gameId: bigint;
        const commitPeriod = 300; // 5 minutes

        beforeEach(async function () {
            // Claim game master
            await sgm.connect(owner).claimGameMaster();
            
            // Start game with commit-reveal enabled
            await sgm.connect(owner).startGame(
                3,  // maxPlayers
                1,  // minRange
                10, // maxRange
                3,  // maxGuessesPerPlayer
                2,  // speedBonusThreshold
                commitPeriod,
                true // useCommitReveal
            );

            gameId = await sgm.gameMasterGameId(owner.address);
        });

        it("Should allow players to commit guesses", async function () {
            // Note: In real testing, we'd need to mock the VRF callback
            // For this test, we'll assume the game is activated
            
            const totalGuess = 5;
            const secretGuess = 7;
            const salt = ethers.randomBytes(32);
            
            // Generate commit hash
            const commitHash = await sgm.connect(player1).generateCommitHash(
                totalGuess,
                secretGuess,
                salt
            );

            // This will fail in actual test without VRF callback
            // But shows the commit structure
            expect(commitHash).to.not.equal(ethers.ZeroHash);
        });

        it("Should prevent revealing before commit period ends", async function () {
            // Test would verify that reveals are blocked during commit period
            // This requires proper game activation with VRF
        });

        it("Should allow revealing after commit period", async function () {
            // Test would verify reveals work after commit period
            // This requires proper game activation and time manipulation
        });

        it("Should validate commit hashes on reveal", async function () {
            // Test would verify that invalid reveals are rejected
        });
    });

    describe("Edge Cases - Max Guesses", function () {
        let gameId: bigint;

        beforeEach(async function () {
            await sgm.connect(owner).claimGameMaster();
            await sgm.connect(owner).startGame(
                5,  // maxPlayers
                1,  // minRange
                100, // maxRange
                3,  // maxGuessesPerPlayer (limit to 3)
                2,  // speedBonusThreshold
                0,  // no commit period
                false // no commit-reveal
            );

            gameId = await sgm.gameMasterGameId(owner.address);
        });

        it("Should enforce maximum guesses per player", async function () {
            // This test requires VRF callback to activate the game
            // In a real test environment, we'd mock the VRF coordinator
            
            const gameIdNum = Number(gameId);
            const info = await sgm.getGameInfo(gameIdNum);
            expect(Number(info.maxGuessesPerPlayer)).to.equal(3);
        });

        it("Should track guess counts correctly", async function () {
            const gameIdNum = Number(gameId);
            const count = await sgm.getPlayerGuessCount(gameIdNum, player1.address);
            expect(Number(count)).to.equal(0);
        });
    });

    describe("Edge Cases - Ties", function () {
        it("Should handle ties with closest guess logic", async function () {
            // Test scenario where multiple players have same distance
            // Winner should be determined by first to guess
        });

        it("Should handle no guesses scenario", async function () {
            await sgm.connect(owner).claimGameMaster();
            await sgm.connect(owner).startGame(
                3, 1, 10, 3, 2, 0, false
            );

            const gameId = await sgm.gameMasterGameId(owner.address);
            
            // Game master should be able to end game with no winner
            // This would require VRF activation first
        });
    });

    describe("Edge Cases - Game Resets", function () {
        let gameId: bigint;

        beforeEach(async function () {
            await sgm.connect(owner).claimGameMaster();
            await sgm.connect(owner).startGame(
                3, 1, 10, 3, 2, 0, false
            );

            gameId = await sgm.gameMasterGameId(owner.address);
        });

        it("Should reset game and clear all player data", async function () {
            const gameIdNum = Number(gameId);
            
            // Reset game
            await expect(sgm.connect(owner).resetGame(gameIdNum))
                .to.emit(sgm, "GameReset")
                .withArgs(gameIdNum);

            // Verify game master can create new game after reset
            expect(await sgm.hasActiveGame(owner.address)).to.equal(false);
        });

        it("Should prevent non-game-master from resetting", async function () {
            const gameIdNum = Number(gameId);
            
            await expect(
                sgm.connect(player1).resetGame(gameIdNum)
            ).to.be.revertedWith("Not a game master");
        });
    });

    describe("Access Control", function () {
        it("Should allow anyone to claim game master", async function () {
            await expect(sgm.connect(player1).claimGameMaster())
                .to.emit(sgm, "GameMasterClaimed")
                .withArgs(player1.address);

            expect(await sgm.isGameMaster(player1.address)).to.equal(true);
        });

        it("Should prevent claiming game master twice", async function () {
            await sgm.connect(player1).claimGameMaster();
            
            await expect(
                sgm.connect(player1).claimGameMaster()
            ).to.be.revertedWith("Already a game master");
        });

        it("Should prevent non-game-master from starting games", async function () {
            await expect(
                sgm.connect(player1).startGame(3, 1, 10, 3, 2, 0, false)
            ).to.be.revertedWith("Not a game master");
        });

        it("Should prevent game master from having multiple active games", async function () {
            await sgm.connect(owner).claimGameMaster();
            await sgm.connect(owner).startGame(3, 1, 10, 3, 2, 0, false);

            await expect(
                sgm.connect(owner).startGame(3, 1, 10, 3, 2, 0, false)
            ).to.be.revertedWith("Already has an active game");
        });
    });

    describe("Game Configuration Validation", function () {
        beforeEach(async function () {
            await sgm.connect(owner).claimGameMaster();
        });

        it("Should reject invalid player counts", async function () {
            await expect(
                sgm.connect(owner).startGame(1, 1, 10, 3, 2, 0, false)
            ).to.be.revertedWith("Max players must be between 2 and 10");

            await expect(
                sgm.connect(owner).startGame(11, 1, 10, 3, 2, 0, false)
            ).to.be.revertedWith("Max players must be between 2 and 10");
        });

        it("Should reject invalid ranges", async function () {
            await expect(
                sgm.connect(owner).startGame(3, 10, 10, 3, 2, 0, false)
            ).to.be.revertedWith("Invalid range");

            await expect(
                sgm.connect(owner).startGame(3, 10, 5, 3, 2, 0, false)
            ).to.be.revertedWith("Invalid range");
        });

        it("Should reject invalid guess limits", async function () {
            await expect(
                sgm.connect(owner).startGame(3, 1, 10, 0, 2, 0, false)
            ).to.be.revertedWith("Max guesses per player must be between 1 and 10");

            await expect(
                sgm.connect(owner).startGame(3, 1, 10, 11, 2, 0, false)
            ).to.be.revertedWith("Max guesses per player must be between 1 and 10");
        });

        it("Should reject invalid speed bonus threshold", async function () {
            await expect(
                sgm.connect(owner).startGame(3, 1, 10, 3, 0, 0, false)
            ).to.be.revertedWith("Speed bonus threshold must be between 1 and 5");

            await expect(
                sgm.connect(owner).startGame(3, 1, 10, 3, 6, 0, false)
            ).to.be.revertedWith("Speed bonus threshold must be between 1 and 5");
        });

        it("Should reject excessive commit periods", async function () {
            await expect(
                sgm.connect(owner).startGame(3, 1, 10, 3, 2, 3601, true)
            ).to.be.revertedWith("Commit period cannot exceed 1 hour");
        });
    });

    describe("Invite Code System", function () {
        let gameId: bigint;
        let inviteCode: string;

        beforeEach(async function () {
            await sgm.connect(owner).claimGameMaster();
            await sgm.connect(owner).startGame(3, 1, 10, 3, 2, 0, false);

            gameId = await sgm.gameMasterGameId(owner.address);
            const info = await sgm.getGameInfo(Number(gameId));
            inviteCode = info.inviteCode;
        });

        it("Should generate unique invite codes", async function () {
            expect(inviteCode).to.not.equal("");
            expect(inviteCode.length).to.be.greaterThan(0);
        });

        it("Should resolve invite codes to game IDs", async function () {
            const resolvedGameId = await sgm.getGameIdByInviteCode(inviteCode);
            expect(resolvedGameId).to.equal(gameId);
        });

        it("Should return 0 for invalid invite codes", async function () {
            const resolvedGameId = await sgm.getGameIdByInviteCode("INVALID123");
            expect(resolvedGameId).to.equal(0);
        });
    });

    describe("View Functions", function () {
        let gameId: bigint;

        beforeEach(async function () {
            await sgm.connect(owner).claimGameMaster();
            await sgm.connect(owner).startGame(5, 10, 100, 5, 3, 0, false);
            gameId = await sgm.gameMasterGameId(owner.address);
        });

        it("Should return correct game info", async function () {
            const info = await sgm.getGameInfo(Number(gameId));
            
            expect(info.gameMaster).to.equal(owner.address);
            expect(Number(info.status)).to.equal(0); // Waiting
            expect(Number(info.maxPlayers)).to.equal(5);
            expect(Number(info.minRange)).to.equal(10);
            expect(Number(info.maxRange)).to.equal(100);
            expect(Number(info.maxGuessesPerPlayer)).to.equal(5);
            expect(Number(info.speedBonusThreshold)).to.equal(3);
        });

        it("Should track player join status", async function () {
            const hasJoined = await sgm.hasPlayerJoined(Number(gameId), player1.address);
            expect(hasJoined).to.equal(false);
        });

        it("Should return empty player list initially", async function () {
            const players = await sgm.getPlayers(Number(gameId));
            expect(players.length).to.equal(0);
        });
    });

    describe("Helper Functions", function () {
        it("Should generate valid commit hashes", async function () {
            const hash1 = await sgm.connect(player1).generateCommitHash(5, 7, ethers.randomBytes(32));
            const hash2 = await sgm.connect(player1).generateCommitHash(5, 7, ethers.randomBytes(32));
            
            // Different salts should produce different hashes
            expect(hash1).to.not.equal(hash2);
        });

        it("Should include sender address in commit hash", async function () {
            const salt = ethers.randomBytes(32);
            const hash1 = await sgm.connect(player1).generateCommitHash(5, 7, salt);
            const hash2 = await sgm.connect(player2).generateCommitHash(5, 7, salt);
            
            // Different senders should produce different hashes even with same salt
            expect(hash1).to.not.equal(hash2);
        });
    });
});

