// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SecretGameMaster
 * @dev Enhanced Secret Number Guessing Game with Game Master Assignment
 *
 * This contract allows users to become game masters and create their own games.
 * Features:
 * - Users can claim game master status
 * - Each game master can create one active game
 * - Game master can set game rules and invite players
 * - Blockchain-random secret number selection
 * - Invite code system for easy game joining
 */
contract SecretGameMaster {
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
        uint8 maxGuessesPerPlayer; // Custom guess limit per player
        uint8 winType; // 1=correct guess, 2=closest guess, 3=speed bonus
        address closestGuesser; // Player with closest guess
        uint8 closestGuess; // The closest guess value
        uint8 speedBonusThreshold; // First X correct guesses get speed bonus
        uint8 hintsGiven; // Number of hints given
        uint256 gameStartTime; // When game was activated
        // Commit-reveal support
        bytes32 secretCommitment; // keccak256(abi.encodePacked(secretNumber, nonce))
        bool secretRevealed;
    }

    // Games storage (internal to avoid auto-generated getters exposing nested mappings)
    mapping(uint256 => Game) internal games;
    uint256 public nextGameId = 1;
    // Invite code lookup for O(1) game id resolution
    mapping(bytes32 => uint256) private inviteCodeToGameId;
    // Optional VRF coordinator (for real randomness integration)
    address public vrfCoordinator;
    // Deployer (optional)
    address public deployer;

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

    // Enhanced events
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

    /**
     * @dev Claim game master status
     * Anyone can become a game master by calling this function
     */
    function claimGameMaster() external {
        require(!isGameMaster[msg.sender], "Already a game master");
        require(!hasActiveGame[msg.sender], "Already has an active game");

        isGameMaster[msg.sender] = true;
        emit GameMasterClaimed(msg.sender);
    }

    /**
     * @dev Start a new game (only game masters)
     * @param _maxPlayers Maximum number of players
     * @param _minRange Minimum value for secret number range
     * @param _maxRange Maximum value for secret number range
     * @param _maxGuessesPerPlayer Maximum guesses per player (1-10)
     * @param _speedBonusThreshold First X correct guesses get speed bonus
     */
    function startGame(
        uint8 _maxPlayers,
        uint8 _minRange,
        uint8 _maxRange,
        uint8 _maxGuessesPerPlayer,
        uint8 _speedBonusThreshold
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

        uint256 gameId = nextGameId++;
        Game storage game = games[gameId];

        // Set game master and basic info
        game.gameMaster = msg.sender;
        game.gameId = gameId;
        game.status = GameStatus.Waiting;
        game.maxPlayers = _maxPlayers;
        game.minRange = _minRange;
        game.maxRange = _maxRange;
        game.totalGuesses = 0;
        game.gameWon = false;
        game.winner = address(0);

        // Enhanced features initialization
        game.maxGuessesPerPlayer = _maxGuessesPerPlayer;
        game.winType = 0;
        game.closestGuesser = address(0);
        game.closestGuess = 0;
        game.speedBonusThreshold = _speedBonusThreshold;
        game.hintsGiven = 0;
        game.gameStartTime = 0;

        // Generate invite code (simple hash-based)
        game.inviteCode = string(
            abi.encodePacked(
                "GM",
                uint2str(uint160(msg.sender) % 10000),
                uint2str(gameId)
            )
        );

        // Mark game master as having active game
        hasActiveGame[msg.sender] = true;
        gameMasterGameId[msg.sender] = gameId;

        // Register invite code mapping for O(1) lookup
        inviteCodeToGameId[keccak256(bytes(game.inviteCode))] = gameId;

        emit GameCreated(gameId, msg.sender, game.inviteCode);
    }

    /**
     * @dev Activate the game (start with random secret number)
     */
    function activateGame() external {
        require(isGameMaster[msg.sender], "Not a game master");
        require(hasActiveGame[msg.sender], "No active game");

        uint256 gameId = gameMasterGameId[msg.sender];
        Game storage game = games[gameId];

        require(game.status == GameStatus.Waiting, "Game not in waiting state");

        // If commit-reveal was used, do not set plaintext secret here
        if (game.secretCommitment != bytes32(0)) {
            // secret will be revealed later; mark active without exposing secret
            game.status = GameStatus.Active;
            game.gameStartTime = block.timestamp;

            emit GameStarted(
                gameId,
                msg.sender,
                game.maxPlayers,
                game.minRange,
                game.maxRange
            );
            return;
        }

        // Legacy behavior: Generate blockchain-random secret number (not private)
        uint256 randomSeed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    block.coinbase,
                    blockhash(block.number - 1),
                    blockhash(block.number - 2),
                    msg.sender,
                    gameId
                )
            )
        );
        uint8 randomNumber = uint8(
            (randomSeed % (game.maxRange - game.minRange + 1)) + game.minRange
        );

        game.secretNumber = randomNumber;
        game.status = GameStatus.Active;
        game.gameStartTime = block.timestamp;

        emit GameStarted(
            gameId,
            msg.sender,
            game.maxPlayers,
            game.minRange,
            game.maxRange
        );
    }

    /**
     * @dev Set a secret commitment (commit-reveal). Commitment = keccak256(abi.encodePacked(secretNumber, nonce))
     * Must be set by game master before activating the game. Optional: if not set, legacy behavior uses on-chain randomness.
     */
    function setSecretCommitment(uint256 _gameId, bytes32 _commitment) external {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        Game storage game = games[_gameId];
        require(game.gameMaster == msg.sender, "Not game master");
        require(game.status == GameStatus.Waiting, "Game not in waiting state");
        require(game.secretCommitment == bytes32(0), "Commitment already set");

        game.secretCommitment = _commitment;
    }

    /**
     * @dev Reveal the secret after the game is finished. Game master provides secret and nonce.
     */
    function revealSecret(uint256 _gameId, uint8 _secretNumber, string memory _nonce) external {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");
        Game storage game = games[_gameId];
        require(game.gameMaster == msg.sender, "Not game master");
        require(game.status == GameStatus.Finished, "Game must be finished to reveal secret");
        require(game.secretCommitment != bytes32(0), "No commitment set");
        require(!game.secretRevealed, "Secret already revealed");

        bytes32 expected = keccak256(abi.encodePacked(_secretNumber, _nonce));
        require(expected == game.secretCommitment, "Commitment mismatch");

        game.secretNumber = _secretNumber;
        game.secretRevealed = true;
    }

    /**
     * @dev Join a game using invite code
     * @param _inviteCode The invite code for the game
     */
    function joinGameWithInvite(string memory _inviteCode) external {
        // Find game by invite code using mapping
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
     * @dev Join a game by game ID (for direct access)
     * @param _gameId The game ID to join
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
     * @dev Make a guess in the game
     * @param _gameId The game ID
     * @param _totalGuessPrediction Prediction for total number of guesses
     * @param _secretNumberGuess Guess for the secret number
     */
    function makeGuess(
        uint256 _gameId,
        uint8 _totalGuessPrediction,
        uint8 _secretNumberGuess
    ) external {
        require(_gameId > 0 && _gameId < nextGameId, "Invalid game ID");

        Game storage game = games[_gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(game.hasJoined[msg.sender], "Must join game first");
        require(
            _secretNumberGuess >= game.minRange &&
                _secretNumberGuess <= game.maxRange,
            "Guess out of range"
        );

        // Check if player has made too many guesses (custom limit)
        require(
            game.playerSecretGuesses[msg.sender].length <
                game.maxGuessesPerPlayer,
            "Maximum guesses per player exceeded"
        );

        // Store guesses
        game.playerSecretGuesses[msg.sender].push(_secretNumberGuess);
        game.playerTotalGuesses[msg.sender].push(_totalGuessPrediction);
        game.totalGuesses++;

        emit GuessMade(
            msg.sender,
            _totalGuessPrediction,
            _secretNumberGuess,
            game.totalGuesses
        );

        // Track closest guess for fallback winner
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

        // Check if this is a winning guess
        if (_secretNumberGuess == game.secretNumber && !game.gameWon) {
            game.gameWon = true;
            game.winner = msg.sender;
            game.status = GameStatus.Finished;

            // Determine win type
            if (game.totalGuesses <= game.speedBonusThreshold) {
                game.winType = 3; // Speed bonus
                emit SpeedBonus(_gameId, msg.sender, game.totalGuesses);
            } else {
                game.winType = 1; // Correct guess
            }

            emit GameWonWithType(_gameId, msg.sender, game.winType);
            emit GameWon(msg.sender, game.secretNumber, game.totalGuesses);
        }
    }

    /**
     * @dev Reset the game (only game master)
     * @param _gameId The ID of the game to reset
     */
    function resetGame(uint256 _gameId) external {
        require(isGameMaster[msg.sender], "Not a game master");
        require(hasActiveGame[msg.sender], "No active game");
        require(gameMasterGameId[msg.sender] == _gameId, "Not your game");

        Game storage game = games[_gameId];

        // Reset game state
        game.status = GameStatus.Waiting;
        game.totalGuesses = 0;
        game.gameWon = false;
        game.winner = address(0);
        game.secretNumber = 0;

        // Clear players
        for (uint256 i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            game.hasJoined[player] = false;
            delete game.playerSecretGuesses[player];
            delete game.playerTotalGuesses[player];
        }
        delete game.players;

        // Reset game master status
        hasActiveGame[msg.sender] = false;
        gameMasterGameId[msg.sender] = 0;

        emit GameReset(_gameId);
    }

    /**
     * @dev End the game (only game master)
     * @param _gameId The ID of the game to end
     */
    function endGame(uint256 _gameId) external {
        require(isGameMaster[msg.sender], "Not a game master");
        require(hasActiveGame[msg.sender], "No active game");
        require(gameMasterGameId[msg.sender] == _gameId, "Not your game");

        Game storage game = games[_gameId];
        require(game.status == GameStatus.Active, "Game not active");

        // End the game
        game.status = GameStatus.Finished;

        // If no winner, determine winner based on closest guess
        if (!game.gameWon) {
            if (game.closestGuesser != address(0)) {
                // Closest guess winner
                game.gameWon = true;
                game.winner = game.closestGuesser;
                game.winType = 2; // Closest guess
                emit ClosestGuessWinner(
                    _gameId,
                    game.closestGuesser,
                    game.closestGuess,
                    game.secretNumber
                );
            } else {
                // No guesses made, game master wins
                game.gameWon = true;
                game.winner = msg.sender;
                game.winType = 0; // Game master default
            }
        }

        // Reset game master status
        hasActiveGame[msg.sender] = false;
        gameMasterGameId[msg.sender] = 0;

        emit GameEnded(_gameId, msg.sender);
    }

    /**
     * @dev Give a hint to players (only game master)
     * @param _gameId The ID of the game
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
            // Commit-reveal support
            bytes32 secretCommitment; // keccak256(abi.encodePacked(secretNumber, nonce))
            bool secretRevealed;
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

    /**
     * @dev Get the secret number (only for game master after game ends)
     * @param _gameId The game ID
     */
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
        // Use mapping for O(1) lookup. Returns 0 if not found.
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

    // Additional event for game activation
    event GameStarted(
        uint256 indexed gameId,
        address indexed gameMaster,
        uint8 maxPlayers,
        uint8 minRange,
        uint8 maxRange
    );
}
