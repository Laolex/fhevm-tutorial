// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

/**
 * @title SecretGameMaster V2
 * @dev Enhanced Secret Number Guessing Game with Commit-Reveal and Chainlink VRF
 *
 * New Features:
 * - Commit-Reveal mechanism to prevent front-running
 * - Chainlink VRF for verifiable randomness
 * - Enhanced security and fairness
 */
contract SecretGameMasterV2 is VRFConsumerBaseV2 {
    // Chainlink VRF Configuration
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    bytes32 private immutable keyHash;
    uint64 private immutable subscriptionId;
    uint32 private constant CALLBACK_GAS_LIMIT = 100000;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Mapping from VRF request ID to game ID
    mapping(uint256 => uint256) private requestIdToGameId;

    // Game state
    enum GameStatus {
        Waiting,
        Active,
        Finished
    }

    // Game Master data
    mapping(address => bool) public isGameMaster;
    mapping(address => uint256) public gameMasterGameId;
    mapping(address => bool) public hasActiveGame;

    // Commit-Reveal structures
    struct GuessCommit {
        bytes32 commitHash;
        uint256 timestamp;
        bool revealed;
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
        uint8 winType;
        address closestGuesser;
        uint8 closestGuess;
        uint8 speedBonusThreshold;
        uint8 hintsGiven;
        uint256 gameStartTime;
        // Commit-Reveal
        mapping(address => GuessCommit[]) playerCommits;
        uint256 revealDeadline;
        uint256 commitPeriod;
        bool useCommitReveal;
        // Chainlink VRF
        uint256 vrfRequestId;
        bool randomnessRequested;
    }

    // Games storage
    mapping(uint256 => Game) internal games;
    uint256 public nextGameId = 1;
    mapping(bytes32 => uint256) private inviteCodeToGameId;

    // Events
    event GameMasterClaimed(address indexed gameMaster);
    event GameCreated(
        uint256 indexed gameId,
        address indexed gameMaster,
        string inviteCode
    );
    event PlayerJoined(address indexed player, uint256 indexed gameId);
    event GuessMade(
        address indexed player,
        uint8 totalGuess,
        uint8 secretGuess,
        uint256 totalGuesses
    );
    event GameWon(
        address indexed winner,
        uint8 secretNumber,
        uint8 totalGuesses
    );
    event GameReset(uint256 indexed gameId);
    event GameEnded(uint256 indexed gameId, address indexed gameMaster);
    event ClosestGuessWinner(
        uint256 indexed gameId,
        address indexed winner,
        uint8 guess,
        uint8 secretNumber
    );
    event SpeedBonus(
        uint256 indexed gameId,
        address indexed winner,
        uint8 guessNumber
    );
    event HintGiven(uint256 indexed gameId, string hint, uint8 hintNumber);
    event GameWonWithType(
        uint256 indexed gameId,
        address indexed winner,
        uint8 winType
    );
    event GuessCommitted(
        uint256 indexed gameId,
        address indexed player,
        bytes32 commitHash,
        uint256 commitIndex
    );
    event GuessRevealed(
        uint256 indexed gameId,
        address indexed player,
        uint8 secretGuess,
        uint8 totalGuess
    );
    event GameStarted(
        uint256 indexed gameId,
        address indexed gameMaster,
        uint8 maxPlayers,
        uint8 minRange,
        uint8 maxRange
    );
    event RandomnessRequested(uint256 indexed gameId, uint256 requestId);
    event RandomnessFulfilled(uint256 indexed gameId, uint256 randomNumber);

    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _subscriptionId
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
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
     * @dev Start a new game with optional commit-reveal
     */
    function startGame(
        uint8 _maxPlayers,
        uint8 _minRange,
        uint8 _maxRange,
        uint8 _maxGuessesPerPlayer,
        uint8 _speedBonusThreshold,
        uint256 _commitPeriod,
        bool _useCommitReveal
    ) external {
        require(isGameMaster[msg.sender], "Not a game master");
        require(!hasActiveGame[msg.sender], "Already has an active game");
        require(
            _maxPlayers >= 2 && _maxPlayers <= 10,
            "Max players must be between 2 and 10"
        );
        require(_minRange < _maxRange && _maxRange <= 255, "Invalid range");
        require(
            _maxGuessesPerPlayer >= 1 && _maxGuessesPerPlayer <= 10,
            "Max guesses per player must be between 1 and 10"
        );
        require(
            _speedBonusThreshold >= 1 && _speedBonusThreshold <= 5,
            "Speed bonus threshold must be between 1 and 5"
        );
        require(
            _commitPeriod <= 3600,
            "Commit period cannot exceed 1 hour"
        );

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
        game.commitPeriod = _commitPeriod;
        game.useCommitReveal = _useCommitReveal;
        game.randomnessRequested = false;

        game.inviteCode = string(
            abi.encodePacked(
                "GM",
                uint2str(uint160(msg.sender) % 10000),
                uint2str(gameId)
            )
        );

        hasActiveGame[msg.sender] = true;
        gameMasterGameId[msg.sender] = gameId;
        inviteCodeToGameId[keccak256(bytes(game.inviteCode))] = gameId;

        emit GameCreated(gameId, msg.sender, game.inviteCode);
    }

    /**
     * @dev Activate the game with Chainlink VRF randomness
     */
    function activateGame() external {
        require(isGameMaster[msg.sender], "Not a game master");
        require(hasActiveGame[msg.sender], "No active game");

        uint256 gameId = gameMasterGameId[msg.sender];
        Game storage game = games[gameId];

        require(game.status == GameStatus.Waiting, "Game not in waiting state");
        require(!game.randomnessRequested, "Randomness already requested");

        // Request randomness from Chainlink VRF
        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );

        game.vrfRequestId = requestId;
        game.randomnessRequested = true;
        requestIdToGameId[requestId] = gameId;

        emit RandomnessRequested(gameId, requestId);
    }

    /**
     * @dev Chainlink VRF callback
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 gameId = requestIdToGameId[requestId];
        require(gameId > 0, "Invalid request ID");

        Game storage game = games[gameId];
        require(game.status == GameStatus.Waiting, "Game not in waiting state");

        uint8 randomNumber = uint8(
            (randomWords[0] % (game.maxRange - game.minRange + 1)) + game.minRange
        );

        game.secretNumber = randomNumber;
        game.status = GameStatus.Active;
        game.gameStartTime = block.timestamp;

        // Set reveal deadline if commit-reveal is enabled
        if (game.useCommitReveal && game.commitPeriod > 0) {
            game.revealDeadline = block.timestamp + game.commitPeriod;
        }

        emit RandomnessFulfilled(gameId, randomNumber);
        emit GameStarted(
            gameId,
            game.gameMaster,
            game.maxPlayers,
            game.minRange,
            game.maxRange
        );
    }

    /**
     * @dev Commit a guess (commit phase)
     */
    function commitGuess(
        uint256 _gameId,
        bytes32 _commitHash
    ) external {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");

        Game storage game = games[_gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(game.hasJoined[msg.sender], "Must join game first");
        require(game.useCommitReveal, "Commit-reveal not enabled");
        require(block.timestamp < game.revealDeadline, "Commit period ended");
        require(
            game.playerCommits[msg.sender].length < game.maxGuessesPerPlayer,
            "Maximum commits exceeded"
        );

        GuessCommit memory newCommit = GuessCommit({
            commitHash: _commitHash,
            timestamp: block.timestamp,
            revealed: false
        });

        game.playerCommits[msg.sender].push(newCommit);

        emit GuessCommitted(
            _gameId,
            msg.sender,
            _commitHash,
            game.playerCommits[msg.sender].length - 1
        );
    }

    /**
     * @dev Reveal a committed guess
     */
    function revealGuess(
        uint256 _gameId,
        uint256 _commitIndex,
        uint8 _totalGuessPrediction,
        uint8 _secretNumberGuess,
        bytes32 _salt
    ) external {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");

        Game storage game = games[_gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(game.hasJoined[msg.sender], "Must join game first");
        require(game.useCommitReveal, "Commit-reveal not enabled");
        require(block.timestamp >= game.revealDeadline, "Reveal period not started");
        require(
            _commitIndex < game.playerCommits[msg.sender].length,
            "Invalid commit index"
        );
        require(
            !game.playerCommits[msg.sender][_commitIndex].revealed,
            "Already revealed"
        );

        // Verify the commit
        bytes32 computedHash = keccak256(
            abi.encodePacked(_totalGuessPrediction, _secretNumberGuess, _salt, msg.sender)
        );
        require(
            computedHash == game.playerCommits[msg.sender][_commitIndex].commitHash,
            "Invalid reveal"
        );

        // Mark as revealed
        game.playerCommits[msg.sender][_commitIndex].revealed = true;

        // Process the guess (same logic as makeGuess)
        _processGuess(_gameId, _totalGuessPrediction, _secretNumberGuess);

        emit GuessRevealed(_gameId, msg.sender, _secretNumberGuess, _totalGuessPrediction);
    }

    /**
     * @dev Make a guess (direct mode, no commit-reveal)
     */
    function makeGuess(
        uint256 _gameId,
        uint8 _totalGuessPrediction,
        uint8 _secretNumberGuess
    ) external {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");

        Game storage game = games[_gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(!game.useCommitReveal, "Must use commit-reveal");
        require(game.hasJoined[msg.sender], "Must join game first");

        _processGuess(_gameId, _totalGuessPrediction, _secretNumberGuess);
    }

    /**
     * @dev Internal function to process a guess
     */
    function _processGuess(
        uint256 _gameId,
        uint8 _totalGuessPrediction,
        uint8 _secretNumberGuess
    ) internal {
        Game storage game = games[_gameId];

        require(
            _secretNumberGuess >= game.minRange &&
                _secretNumberGuess <= game.maxRange,
            "Guess out of range"
        );
        require(
            game.playerSecretGuesses[msg.sender].length <
                game.maxGuessesPerPlayer,
            "Maximum guesses exceeded"
        );

        game.playerSecretGuesses[msg.sender].push(_secretNumberGuess);
        game.playerTotalGuesses[msg.sender].push(_totalGuessPrediction);
        game.totalGuesses++;

        emit GuessMade(
            msg.sender,
            _totalGuessPrediction,
            _secretNumberGuess,
            game.totalGuesses
        );

        // Track closest guess
        if (!game.gameWon) {
            uint8 currentDistance = _secretNumberGuess > game.secretNumber
                ? _secretNumberGuess - game.secretNumber
                : game.secretNumber - _secretNumberGuess;

            if (
                game.closestGuesser == address(0) ||
                currentDistance < game.closestGuess
            ) {
                game.closestGuesser = msg.sender;
                game.closestGuess = currentDistance;
            }
        }

        // Check for winning guess
        if (_secretNumberGuess == game.secretNumber && !game.gameWon) {
            game.gameWon = true;
            game.winner = msg.sender;
            game.status = GameStatus.Finished;

            if (game.totalGuesses <= game.speedBonusThreshold) {
                game.winType = 3;
                emit SpeedBonus(_gameId, msg.sender, game.totalGuesses);
            } else {
                game.winType = 1;
            }

            emit GameWonWithType(_gameId, msg.sender, game.winType);
            emit GameWon(msg.sender, game.secretNumber, game.totalGuesses);
        }
    }

    /**
     * @dev Join a game using invite code
     */
    function joinGameWithInvite(string memory _inviteCode) external {
        uint256 gameId = findGameByInviteCode(_inviteCode);
        require(gameId > 0, "Invalid invite code");

        Game storage game = games[gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(!game.hasJoined[msg.sender], "Already joined");
        require(game.players.length < game.maxPlayers, "Game is full");

        game.hasJoined[msg.sender] = true;
        game.players.push(msg.sender);

        emit PlayerJoined(msg.sender, gameId);
    }

    /**
     * @dev Join a game by ID
     */
    function joinGame(uint256 _gameId) external {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");

        Game storage game = games[_gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(!game.hasJoined[msg.sender], "Already joined");
        require(game.players.length < game.maxPlayers, "Game is full");

        game.hasJoined[msg.sender] = true;
        game.players.push(msg.sender);

        emit PlayerJoined(msg.sender, _gameId);
    }

    /**
     * @dev End the game
     */
    function endGame(uint256 _gameId) external {
        require(isGameMaster[msg.sender], "Not a game master");
        require(hasActiveGame[msg.sender], "No active game");
        require(gameMasterGameId[msg.sender] == _gameId, "Not your game");

        Game storage game = games[_gameId];
        require(game.status == GameStatus.Active, "Game not active");

        game.status = GameStatus.Finished;

        if (!game.gameWon) {
            if (game.closestGuesser != address(0)) {
                game.gameWon = true;
                game.winner = game.closestGuesser;
                game.winType = 2;
                emit ClosestGuessWinner(
                    _gameId,
                    game.closestGuesser,
                    game.closestGuess,
                    game.secretNumber
                );
            } else {
                game.gameWon = true;
                game.winner = msg.sender;
                game.winType = 0;
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
        require(hasActiveGame[msg.sender], "No active game");
        require(gameMasterGameId[msg.sender] == _gameId, "Not your game");

        Game storage game = games[_gameId];

        game.status = GameStatus.Waiting;
        game.totalGuesses = 0;
        game.gameWon = false;
        game.winner = address(0);
        game.secretNumber = 0;

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
        require(hasActiveGame[msg.sender], "No active game");
        require(gameMasterGameId[msg.sender] == _gameId, "Not your game");

        Game storage game = games[_gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(game.hintsGiven < 3, "Maximum hints given");

        game.hintsGiven++;
        string memory hint;

        if (game.hintsGiven == 1) {
            hint = string(
                abi.encodePacked(
                    "The number is between ",
                    uint2str(game.minRange),
                    " and ",
                    uint2str(game.maxRange)
                )
            );
        } else if (game.hintsGiven == 2) {
            if (game.secretNumber > (game.minRange + game.maxRange) / 2) {
                hint = "The number is in the upper half of the range";
            } else {
                hint = "The number is in the lower half of the range";
            }
        } else {
            if (game.secretNumber % 2 == 0) {
                hint = "The number is even";
            } else {
                hint = "The number is odd";
            }
        }

        emit HintGiven(_gameId, hint, game.hintsGiven);
    }

    // View functions
    function getGameInfo(
        uint256 _gameId
    )
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
            uint8 maxGuessesPerPlayer,
            uint8 winType,
            address closestGuesser,
            uint8 closestGuess,
            uint8 speedBonusThreshold,
            uint8 hintsGiven,
            uint256 gameStartTime
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
            game.maxGuessesPerPlayer,
            game.winType,
            game.closestGuesser,
            game.closestGuess,
            game.speedBonusThreshold,
            game.hintsGiven,
            game.gameStartTime
        );
    }

    function getPlayers(
        uint256 _gameId
    ) external view returns (address[] memory) {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        return games[_gameId].players;
    }

    function hasPlayerJoined(
        uint256 _gameId,
        address _player
    ) external view returns (bool) {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        return games[_gameId].hasJoined[_player];
    }

    function canJoinGame(uint256 _gameId) external view returns (bool) {
        if (_gameId == 0 || _gameId >= nextGameId) return false;
        Game storage game = games[_gameId];
        return
            game.status == GameStatus.Active &&
            !game.hasJoined[msg.sender] &&
            game.players.length < game.maxPlayers;
    }

    function canMakeGuess(uint256 _gameId) external view returns (bool) {
        if (_gameId == 0 || _gameId >= nextGameId) return false;
        Game storage game = games[_gameId];
        return
            game.status == GameStatus.Active &&
            game.hasJoined[msg.sender] &&
            !game.gameWon;
    }

    function getGameIdByInviteCode(
        string memory _inviteCode
    ) external view returns (uint256) {
        return findGameByInviteCode(_inviteCode);
    }

    function getPlayerGuessCount(
        uint256 _gameId,
        address _player
    ) external view returns (uint256) {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        return games[_gameId].playerSecretGuesses[_player].length;
    }

    function getPlayerCommitCount(
        uint256 _gameId,
        address _player
    ) external view returns (uint256) {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        return games[_gameId].playerCommits[_player].length;
    }

    function getCommitInfo(
        uint256 _gameId,
        address _player,
        uint256 _index
    ) external view returns (bytes32, uint256, bool) {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        require(
            _index < games[_gameId].playerCommits[_player].length,
            "Invalid index"
        );
        GuessCommit storage commit = games[_gameId].playerCommits[_player][_index];
        return (commit.commitHash, commit.timestamp, commit.revealed);
    }

    function getSecretNumber(uint256 _gameId) external view returns (uint8) {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        Game storage game = games[_gameId];
        require(
            msg.sender == game.gameMaster,
            "Only game master can access secret number"
        );
        require(
            game.status == GameStatus.Finished,
            "Game must be finished to reveal secret number"
        );
        return game.secretNumber;
    }

    // Helper functions
    function findGameByInviteCode(
        string memory _inviteCode
    ) internal view returns (uint256) {
        bytes32 key = keccak256(bytes(_inviteCode));
        return inviteCodeToGameId[key];
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
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    /**
     * @dev Generate a commit hash for commit-reveal
     */
    function generateCommitHash(
        uint8 _totalGuess,
        uint8 _secretGuess,
        bytes32 _salt
    ) external view returns (bytes32) {
        return keccak256(abi.encodePacked(_totalGuess, _secretGuess, _salt, msg.sender));
    }
}

