import { expect } from "chai";
import { ethers } from "hardhat";

describe("SecretGameMaster - unit tests", function () {
    it("full game lifecycle: claim, start, activate, join, guess, end", async function () {
        const [owner, player1, player2] = await ethers.getSigners();

        const SecretGameMaster = await ethers.getContractFactory("SecretGameMaster");
        const sgm = await SecretGameMaster.deploy();
        await sgm.waitForDeployment();

        // Claim game master
        await expect(sgm.connect(owner).claimGameMaster()).to.not.be.reverted;
        expect(await sgm.isGameMaster(owner.address)).to.equal(true);

        // Start game
        await expect(
            sgm.connect(owner).startGame(3, 1, 10, 3, 2)
        ).to.not.be.reverted;

        const gameIdRaw = await sgm.gameMasterGameId(owner.address);
        const gameId = Number(gameIdRaw.toString());
        expect(gameId).to.be.greaterThan(0);

        // Activate game (randomness is on-chain; we check status and range)
        await expect(sgm.connect(owner).activateGame()).to.not.be.reverted;

        const gameInfo = await sgm.getGameInfo(gameId);
        expect(Number(gameInfo.status)).to.equal(1); // Active
        expect(Number(gameInfo.minRange)).to.equal(1);
        expect(Number(gameInfo.maxRange)).to.equal(10);

        // Players join
        const inviteCode = gameInfo.inviteCode;
        const resolvedIdRaw = await sgm.getGameIdByInviteCode(inviteCode);
        const resolvedId = Number(resolvedIdRaw.toString());
        expect(resolvedId).to.equal(gameId);

        await expect(sgm.connect(player1).joinGameWithInvite(inviteCode)).to.not.be.reverted;
        await expect(sgm.connect(player2).joinGame(gameId)).to.not.be.reverted;

        // Make a guess from player1
        await expect(sgm.connect(player1).makeGuess(gameId, 2, 5)).to.not.be.reverted;
        const guessCountRaw = await sgm.getPlayerGuessCount(gameId, player1.address);
        const guessCount = Number(guessCountRaw.toString());
        expect(guessCount).to.equal(1);

        // Make a guess from player2 — guess the right number if we can read it (not ideal for privacy but allowed here)
        const secretNumber = await sgm.getSecretNumber(gameId).catch(() => {
            // If getSecretNumber reverts because not allowed, skip direct read
            return null;
        });

        if (secretNumber) {
            // If visible (in current implementation it may not be), make winning guess
            const secretNum = Number(secretNumber.toString());
            await expect(sgm.connect(player2).makeGuess(gameId, 1, secretNum)).to.not.be.reverted;
            const infoAfter = await sgm.getGameInfo(gameId);
            expect(infoAfter.gameWon).to.equal(true);
        } else {
            // If secret isn't readable, just make another guess and then end game to pick closest winner
            await expect(sgm.connect(player2).makeGuess(gameId, 1, 7)).to.not.be.reverted;
            await expect(sgm.connect(owner).endGame(gameId)).to.not.be.reverted;
            const finalInfo = await sgm.getGameInfo(gameId);
            expect(Number(finalInfo.status)).to.equal(2); // Finished
            expect(finalInfo.gameWon).to.equal(true);
            expect(finalInfo.winner).to.not.equal(ethers.ZeroAddress);
        }
    });
});
