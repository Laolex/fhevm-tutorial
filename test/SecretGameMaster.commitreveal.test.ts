import { expect } from "chai";
import { ethers } from "hardhat";

function makeCommitment(secret: number, nonce: string) {
    return ethers.keccak256(ethers.concat([ethers.toBeHex(secret, 1), ethers.toUtf8Bytes(nonce)]));
}

describe("SecretGameMaster - commit-reveal tests", function () {
    it("commit, activate, play, end, and reveal", async function () {
        const [owner, player1, player2] = await ethers.getSigners();

        const SecretGameMaster = await ethers.getContractFactory("SecretGameMaster");
        const sgm = await SecretGameMaster.deploy();
        await sgm.waitForDeployment();

        await sgm.connect(owner).claimGameMaster();
        await sgm.connect(owner).startGame(3, 1, 50, 3, 2);

        const gidRaw = await sgm.gameMasterGameId(owner.address);
        const gameId = Number(gidRaw.toString());

        // Create a secret and nonce
        const secret = 13;
        const nonce = "hunter2";
        const commitment = makeCommitment(secret, nonce);

        // Set commitment
        await expect(sgm.connect(owner).setSecretCommitment(gameId, commitment)).to.not.be.reverted;

        // Activate (should not set plaintext secret)
        await expect(sgm.connect(owner).activateGame()).to.not.be.reverted;

        // Players join
        const info = await sgm.getGameInfo(gameId);
        const invite = info.inviteCode;
        await sgm.connect(player1).joinGameWithInvite(invite);
        await sgm.connect(player2).joinGame(gameId);

        // Players make guesses
        await sgm.connect(player1).makeGuess(gameId, 2, 10);
        await sgm.connect(player2).makeGuess(gameId, 1, 12);

        // End game - should pick closest (player2 is closer to 13)
        await sgm.connect(owner).endGame(gameId);

        const final = await sgm.getGameInfo(gameId);
        expect(final.gameWon).to.equal(true);

        // Now reveal
        await expect(sgm.connect(owner).revealSecret(gameId, secret, nonce)).to.not.be.reverted;
        const infoAfter = await sgm.getGameInfo(gameId);
        expect(Number(infoAfter.secretNumber)).to.equal(secret);
        expect(infoAfter.secretRevealed).to.equal(true);
    });
});
