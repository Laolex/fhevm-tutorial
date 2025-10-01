// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Import Chainlink VRF
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

/**
 * @title SecretGameMasterEnhanced
 * @dev Enhanced Secret Number Guessing Game with:
 * - Commit-Reveal pattern for fair play
 * - Chainlink VRF for provably random numbers
 * - Game Master Assignment system
 * - Multiple game modes and features
 */
contract SecretGameMasterEnhanced is VRFConsumerBaseV2 {
    // Chainlink VRF variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_keyHash;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Game state
    enum GameStatus {
        Waiting,
        Active,
        CommitPhase,
        RevealPhase,
        Finished
    }

    // Game Master data
    mapping(address => bool) public isGameMaster;
    mapping(address => uint256) public gameMasterGameId;
    mapping(address => bool) public hasActiveGame;

    // Commit-Reveal structure
    struct GuessCommit {
        bytes32 commitHash;
        uint256 timestamp;
        bool revealed;
        uint8 revealedSecretGuess;
        uint8 revealedTotalGuess;
    }

    // Game data structure
    struct Game {
        address gameMaster;
        uint256 gameId;
        GameStatus status;
        uint8 maxPlayers;
        uint8 minRange;
        uint8 maxRange;
        uint8 secretNumber;
        uint8 totalGuesses;
        address winner;
        bool gameWon;
        string inviteCode;
        address[] players;
        mapping(address => bool) hasJoined;
        mapping(address => uint8[]) playerSecretGuesses;
        mapping(address => uint8[]) playerTotalGuesses;
        // Enhanced features
        uint8 maxGuessesPerPlayer;
        uint8 winType; // 0=default, 1=correct, 2=closest, 3=speed
        address closestGuesser;
        uint8 closestGuess;
        uint8 speedBonusThreshold;
        uint8 hintsGiven;
        uint256 gameStartTime;
        // Commit-Reveal
        mapping(address => GuessCommit[]) playerCommits;
        uint256 commitDeadline;
        uint256 revealDeadline;
        bool useCommitReveal;
        // VRF
        uint256 vrfRequestId;
        bool vrfFulfilled;
    }

    // Games storage
    mapping(uint256 => Game) internal games;
    uint256 public nextGameId = 1;
    mapping(bytes32 => uint256) private inviteCodeToGameId;
    mapping(uint256 => uint256) private vrfRequestToGameId;

    // Events
    event GameMasterClaimed(address indexed gameMaster);
    event GameCreated(uint256 indexed gameId, address indexed gameMaster, string inviteCode);
    event GameStarted(uint256 indexed gameId, address indexed gameMaster);
    event PlayerJoined(address indexed player, uint256 indexed gameId);
    event GuessMade(address indexed player, uint8 totalGuess, uint8 secretGuess, uint256 totalGuesses);
    event GameWon(address indexed winner, uint8 secretNumber, uint8 totalGuesses);
    event GameReset(uint256 indexed gameId);
    event GameEnded(uint256 indexed gameId, address indexed gameMaster);
    event ClosestGuessWinner(uint256 indexed gameId, address indexed winner, uint8 guess, uint8 secretNumber);
    event SpeedBonus(uint256 indexed gameId, address indexed winner, uint8 guessNumber);
    event HintGiven(uint256 indexed gameId, string hint, uint8 hintNumber);
    event GameWonWithType(uint256 indexed gameId, address indexed winner, uint8 winType);
    event GuessCommitted(uint256 indexed gameId, address indexed player, bytes32 commitHash);
    event GuessRevealed(uint256 indexed gameId, address indexed player, uint8 secretGuess, uint8 totalGuess);
    event CommitPhaseStarted(uint256 indexed gameId, uint256 commitDeadline);
    event RevealPhaseStarted(uint256 indexed gameId, uint256 revealDeadline);
    event VRFRequested(uint256 indexed gameId, uint256 requestId);
    event VRFFulfilled(uint256 indexed gameId, uint256 randomNumber);

    constructor(
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinator) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_subscriptionId = subscriptionId;
        i_keyHash = keyHash;
        i_callbackGasLimit = callbackGasLimit;
    }

    /**
     * @dev Claim game master status
     */
    function claimGameMaster() external {
        require(!isGameMaster[msg.sender], "Already a game master");
        require(!hasActiveGame[msg.sender], "Already has an active game");

        isGameMaster[msg.sender] = true;
        emit GameMasterClaimed(msg.sender);
    }

    /**
     * @dev Start a new game
     */
    function startGame(
        uint8 _maxPlayers,
        uint8 _minRange,
        uint8 _maxRange,
        uint8 _maxGuessesPerPlayer,
        uint8 _speedBonusThreshold,
        bool _useCommitReveal,
        bool _useVRF
    ) external {
        require(isGameMaster[msg.sender], "Not a game master");
        require(!hasActiveGame[msg.sender], "Already has an active game");
        require(_maxPlayers >= 2 && _maxPlayers <= 10, "Max players: 2-10");
        require(_minRange < _maxRange && _maxRange <= 255, "Invalid range");
        require(_maxGuessesPerPlayer >= 1 && _maxGuessesPerPlayer <= 10, "Max guesses: 1-10");
        require(_speedBonusThreshold >= 1 && _speedBonusThreshold <= 5, "Speed bonus: 1-5");

        uint256 gameId = nextGameId++;
        Game storage game = games[gameId];

        game.gameMaster = msg.sender;
        game.gameId = gameId;
        game.status = GameStatus.Waiting;
        game.maxPlayers = _maxPlayers;
        game.minRange = _minRange;
        game.maxRange = _maxRange;
        game.totalGuesses = 0;
        game.gameWon = false;
        game.winner = address(0);
        game.maxGuessesPerPlayer = _maxGuessesPerPlayer;
        game.winType = 0;
        game.closestGuesser = address(0);
        game.closestGuess = 0;
        game.speedBonusThreshold = _speedBonusThreshold;
        game.hintsGiven = 0;
        game.gameStartTime = 0;
        game.useCommitReveal = _useCommitReveal;
        game.vrfFulfilled = !_useVRF;

        game.inviteCode = string(abi.encodePacked("GM", uint2str(uint160(msg.sender) % 10000), uint2str(gameId)));

        hasActiveGame[msg.sender] = true;
        gameMasterGameId[msg.sender] = gameId;
        inviteCodeToGameId[keccak256(bytes(game.inviteCode))] = gameId;

        emit GameCreated(gameId, msg.sender, game.inviteCode);
    }

    /**
     * @dev Activate game - request VRF or use block-based randomness
     */
    function activateGame() external {
        require(isGameMaster[msg.sender], "Not a game master");
        require(hasActiveGame[msg.sender], "No active game");

        uint256 gameId = gameMasterGameId[msg.sender];
        Game storage game = games[gameId];

        require(game.status == GameStatus.Waiting, "Game not in waiting state");

        if (!game.vrfFulfilled) {
            // Request VRF randomness
            uint256 requestId = i_vrfCoordinator.requestRandomWords(
                i_keyHash,
                i_subscriptionId,
                REQUEST_CONFIRMATIONS,
                i_callbackGasLimit,
                NUM_WORDS
            );
            game.vrfRequestId = requestId;
            vrfRequestToGameId[requestId] = gameId;
            emit VRFRequested(gameId, requestId);
        } else {
            // Use block-based randomness
            uint256 randomSeed = uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        block.coinbase,
                        blockhash(block.number - 1),
                        msg.sender,
                        gameId
                    )
                )
            );
            game.secretNumber = uint8((randomSeed % (game.maxRange - game.minRange + 1)) + game.minRange);
            game.status = GameStatus.Active;
            game.gameStartTime = block.timestamp;
            emit GameStarted(gameId, msg.sender);
        }
    }

    /**
     * @dev Chainlink VRF callback
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 gameId = vrfRequestToGameId[requestId];
        require(gameId > 0, "Invalid request ID");

        Game storage game = games[gameId];
        require(!game.vrfFulfilled, "VRF already fulfilled");

        uint256 randomNumber = randomWords[0];
        game.secretNumber = uint8((randomNumber % (game.maxRange - game.minRange + 1)) + game.minRange);
        game.vrfFulfilled = true;
        game.status = GameStatus.Active;
        game.gameStartTime = block.timestamp;

        emit VRFFulfilled(gameId, randomNumber);
        emit GameStarted(gameId, game.gameMaster);
    }

    /**
     * @dev Join game with invite code
     */
    function joinGameWithInvite(string memory _inviteCode) external {
        uint256 gameId = findGameByInviteCode(_inviteCode);
        require(gameId > 0, "Invalid invite code");
        _joinGame(gameId);
    }

    /**
     * @dev Join game by ID
     */
    function joinGame(uint256 _gameId) external {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        _joinGame(_gameId);
    }

    function _joinGame(uint256 _gameId) internal {
        Game storage game = games[_gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(!game.hasJoined[msg.sender], "Already joined");
        require(game.players.length < game.maxPlayers, "Game is full");

        game.hasJoined[msg.sender] = true;
        game.players.push(msg.sender);

        emit PlayerJoined(msg.sender, _gameId);
    }

    /**
     * @dev Commit a guess (commit-reveal mode)
     */
    function commitGuess(uint256 _gameId, bytes32 _commitHash) external {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        Game storage game = games[_gameId];

        require(game.useCommitReveal, "Game not using commit-reveal");
        require(game.status == GameStatus.Active || game.status == GameStatus.CommitPhase, "Not in commit phase");
        require(game.hasJoined[msg.sender], "Must join game first");
        require(game.playerCommits[msg.sender].length < game.maxGuessesPerPlayer, "Max commits exceeded");

        if (game.status == GameStatus.Active && game.commitDeadline == 0) {
            // Start commit phase
            game.status = GameStatus.CommitPhase;
            game.commitDeadline = block.timestamp + 5 minutes;
            emit CommitPhaseStarted(_gameId, game.commitDeadline);
        }

        require(block.timestamp < game.commitDeadline, "Commit phase ended");

        GuessCommit memory newCommit = GuessCommit({
            commitHash: _commitHash,
            timestamp: block.timestamp,
            revealed: false,
            revealedSecretGuess: 0,
            revealedTotalGuess: 0
        });

        game.playerCommits[msg.sender].push(newCommit);
        emit GuessCommitted(_gameId, msg.sender, _commitHash);
    }

    /**
     * @dev Start reveal phase
     */
    function startRevealPhase(uint256 _gameId) external {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        Game storage game = games[_gameId];

        require(game.gameMaster == msg.sender, "Not game master");
        require(game.status == GameStatus.CommitPhase, "Not in commit phase");
        require(block.timestamp >= game.commitDeadline, "Commit phase not ended");

        game.status = GameStatus.RevealPhase;
        game.revealDeadline = block.timestamp + 5 minutes;
        emit RevealPhaseStarted(_gameId, game.revealDeadline);
    }

    /**
     * @dev Reveal a committed guess
     */
    function revealGuess(
        uint256 _gameId,
        uint256 _commitIndex,
        uint8 _secretGuess,
        uint8 _totalGuess,
        bytes32 _salt
    ) external {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        Game storage game = games[_gameId];

        require(game.useCommitReveal, "Game not using commit-reveal");
        require(game.status == GameStatus.RevealPhase, "Not in reveal phase");
        require(block.timestamp < game.revealDeadline, "Reveal phase ended");
        require(_commitIndex < game.playerCommits[msg.sender].length, "Invalid commit index");

        GuessCommit storage commit = game.playerCommits[msg.sender][_commitIndex];
        require(!commit.revealed, "Already revealed");

        // Verify commit
        bytes32 computedHash = keccak256(abi.encodePacked(_secretGuess, _totalGuess, _salt, msg.sender));
        require(computedHash == commit.commitHash, "Invalid reveal");

        require(_secretGuess >= game.minRange && _secretGuess <= game.maxRange, "Guess out of range");

        commit.revealed = true;
        commit.revealedSecretGuess = _secretGuess;
        commit.revealedTotalGuess = _totalGuess;

        game.playerSecretGuesses[msg.sender].push(_secretGuess);
        game.playerTotalGuesses[msg.sender].push(_totalGuess);
        game.totalGuesses++;

        emit GuessRevealed(_gameId, msg.sender, _secretGuess, _totalGuess);

        _checkWinCondition(_gameId, msg.sender, _secretGuess);
    }

    /**
     * @dev Make a direct guess (non-commit-reveal mode)
     */
    function makeGuess(uint256 _gameId, uint8 _totalGuessPrediction, uint8 _secretNumberGuess) external {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        Game storage game = games[_gameId];

        require(!game.useCommitReveal, "Use commit-reveal functions");
        require(game.status == GameStatus.Active, "Game not active");
        require(game.hasJoined[msg.sender], "Must join game first");
        require(_secretNumberGuess >= game.minRange && _secretNumberGuess <= game.maxRange, "Guess out of range");
        require(game.playerSecretGuesses[msg.sender].length < game.maxGuessesPerPlayer, "Max guesses exceeded");

        game.playerSecretGuesses[msg.sender].push(_secretNumberGuess);
        game.playerTotalGuesses[msg.sender].push(_totalGuessPrediction);
        game.totalGuesses++;

        emit GuessMade(msg.sender, _totalGuessPrediction, _secretNumberGuess, game.totalGuesses);

        _checkWinCondition(_gameId, msg.sender, _secretNumberGuess);
    }

    function _checkWinCondition(uint256 _gameId, address _player, uint8 _guess) internal {
        Game storage game = games[_gameId];

        if (game.gameWon) return;

        // Track closest guess
        uint8 distance = _guess > game.secretNumber ? _guess - game.secretNumber : game.secretNumber - _guess;

        if (game.closestGuesser == address(0) || distance < game.closestGuess) {
            game.closestGuesser = _player;
            game.closestGuess = distance;
        }

        // Check for exact match
        if (_guess == game.secretNumber) {
            game.gameWon = true;
            game.winner = _player;
            game.status = GameStatus.Finished;

            if (game.totalGuesses <= game.speedBonusThreshold) {
                game.winType = 3; // Speed bonus
                emit SpeedBonus(_gameId, _player, game.totalGuesses);
            } else {
                game.winType = 1; // Correct guess
            }

            emit GameWonWithType(_gameId, _player, game.winType);
            emit GameWon(_player, game.secretNumber, game.totalGuesses);
        }
    }

    /**
     * @dev End game manually
     */
    function endGame(uint256 _gameId) external {
        require(isGameMaster[msg.sender], "Not a game master");
        require(hasActiveGame[msg.sender], "No active game");
        require(gameMasterGameId[msg.sender] == _gameId, "Not your game");

        Game storage game = games[_gameId];
        require(game.status != GameStatus.Finished, "Game already finished");

        game.status = GameStatus.Finished;

        if (!game.gameWon) {
            if (game.closestGuesser != address(0)) {
                game.gameWon = true;
                game.winner = game.closestGuesser;
                game.winType = 2; // Closest guess
                emit ClosestGuessWinner(_gameId, game.closestGuesser, game.closestGuess, game.secretNumber);
            } else {
                game.gameWon = true;
                game.winner = msg.sender;
                game.winType = 0; // Game master default
            }
        }

        hasActiveGame[msg.sender] = false;
        gameMasterGameId[msg.sender] = 0;

        emit GameEnded(_gameId, msg.sender);
    }

    /**
     * @dev Reset game
     */
    function resetGame(uint256 _gameId) external {
        require(isGameMaster[msg.sender], "Not a game master");
        require(gameMasterGameId[msg.sender] == _gameId, "Not your game");

        Game storage game = games[_gameId];

        game.status = GameStatus.Waiting;
        game.totalGuesses = 0;
        game.gameWon = false;
        game.winner = address(0);
        game.secretNumber = 0;
        game.commitDeadline = 0;
        game.revealDeadline = 0;

        for (uint256 i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            game.hasJoined[player] = false;
            delete game.playerSecretGuesses[player];
            delete game.playerTotalGuesses[player];
            delete game.playerCommits[player];
        }
        delete game.players;

        hasActiveGame[msg.sender] = false;
        gameMasterGameId[msg.sender] = 0;

        emit GameReset(_gameId);
    }

    /**
     * @dev Give hint
     */
    function giveHint(uint256 _gameId) external {
        require(isGameMaster[msg.sender], "Not a game master");
        require(gameMasterGameId[msg.sender] == _gameId, "Not your game");

        Game storage game = games[_gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(game.hintsGiven < 3, "Maximum hints given");

        game.hintsGiven++;
        string memory hint;

        if (game.hintsGiven == 1) {
            hint = string(abi.encodePacked("Between ", uint2str(game.minRange), "-", uint2str(game.maxRange)));
        } else if (game.hintsGiven == 2) {
            hint = game.secretNumber > (game.minRange + game.maxRange) / 2 ? "Upper half" : "Lower half";
        } else {
            hint = game.secretNumber % 2 == 0 ? "Even" : "Odd";
        }

        emit HintGiven(_gameId, hint, game.hintsGiven);
    }

    // View functions
    function getGameInfo(uint256 _gameId)
        external
        view
        returns (
            address gameMaster,
            GameStatus status,
            uint8 maxPlayers,
            uint8 minRange,
            uint8 maxRange,
            uint8 totalGuesses,
            address winner,
            bool gameWon,
            string memory inviteCode,
            uint256 playerCount,
            bool useCommitReveal
        )
    {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        Game storage game = games[_gameId];

        return (
            game.gameMaster,
            game.status,
            game.maxPlayers,
            game.minRange,
            game.maxRange,
            game.totalGuesses,
            game.winner,
            game.gameWon,
            game.inviteCode,
            game.players.length,
            game.useCommitReveal
        );
    }

    function getPlayers(uint256 _gameId) external view returns (address[] memory) {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        return games[_gameId].players;
    }

    function getPlayerGuessCount(uint256 _gameId, address _player) external view returns (uint256) {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        return games[_gameId].playerSecretGuesses[_player].length;
    }

    function getPlayerCommitCount(uint256 _gameId, address _player) external view returns (uint256) {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        return games[_gameId].playerCommits[_player].length;
    }

    function getSecretNumber(uint256 _gameId) external view returns (uint8) {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        Game storage game = games[_gameId];
        require(msg.sender == game.gameMaster, "Only game master");
        require(game.status == GameStatus.Finished, "Game must be finished");
        return game.secretNumber;
    }

    function generateCommitHash(uint8 _secretGuess, uint8 _totalGuess, bytes32 _salt) external view returns (bytes32) {
        return keccak256(abi.encodePacked(_secretGuess, _totalGuess, _salt, msg.sender));
    }

    // Helper functions
    function findGameByInviteCode(string memory _inviteCode) internal view returns (uint256) {
        return inviteCodeToGameId[keccak256(bytes(_inviteCode))];
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            bstr[k] = bytes1(uint8(48 + (_i % 10)));
            _i /= 10;
        }
        return string(bstr);
    }
}

