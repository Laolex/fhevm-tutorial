# Building the Smart Contract 🏗️

## Overview

Our Secret Number Guessing Game smart contract demonstrates the core concepts of FHEVM. Let's break down how it works and why it's perfect for learning.

## Contract Structure

```solidity
contract SecretGame is EIP712WithFHE {
    // Encrypted game state
    euint8 private secretNumber;
    euint8 private gameStatus;
    
    // Player management
    mapping(address => euint8) private playerGuesses;
    mapping(address => bool) private hasGuessed;
    address[] private players;
}
```

## Key FHEVM Concepts

### 1. **Encrypted Types**

In FHEVM, we use encrypted types instead of regular Solidity types:

```solidity
// Traditional Solidity
uint8 public number = 42;  // Public, visible to everyone

// FHEVM
euint8 private secretNumber;  // Encrypted, private
```

**Available encrypted types:**
- `euint8` - Encrypted 8-bit unsigned integer
- `euint16` - Encrypted 16-bit unsigned integer
- `euint32` - Encrypted 32-bit unsigned integer
- `ebool` - Encrypted boolean

### 2. **Encrypted Operations**

FHEVM supports operations on encrypted data:

```solidity
// Create encrypted values
euint8 encryptedA = TFHE.asEuint8(10);
euint8 encryptedB = TFHE.asEuint8(20);

// Perform operations (all encrypted)
ebool isEqual = TFHE.eq(encryptedA, encryptedB);
ebool isGreater = TFHE.gt(encryptedA, encryptedB);
euint8 sum = TFHE.add(encryptedA, encryptedB);
```

### 3. **Selective Decryption**

You can decrypt values when needed:

```solidity
// Decrypt to reveal the result
bool result = TFHE.decrypt(isEqual);
uint8 plainSum = TFHE.decrypt(sum);
```

## Contract Functions Explained

### Game Initialization

```solidity
constructor() EIP712WithFHE("SecretGame", "1") {
    gameMaster = msg.sender;
    gameId = block.timestamp;
    gameStatus = TFHE.asEuint8(0);  // Encrypted 0
}
```

**Key points:**
- Inherits from `EIP712WithFHE` for FHEVM functionality
- Initializes encrypted game status
- Sets up game master and unique game ID

### Starting the Game

```solidity
function startGame(euint8 _secretNumber) external {
    require(msg.sender == gameMaster, "Only game master can start");
    require(TFHE.decrypt(gameStatus) == 0, "Game already started");
    
    // Validate range (encrypted comparison)
    ebool isValidRange = TFHE.and(
        TFHE.gte(_secretNumber, TFHE.asEuint8(MIN_NUMBER)),
        TFHE.lte(_secretNumber, TFHE.asEuint8(MAX_NUMBER))
    );
    require(TFHE.decrypt(isValidRange), "Secret number must be 1-100");
    
    secretNumber = _secretNumber;
    gameStatus = TFHE.asEuint8(1);  // Set to active
}
```

**FHEVM Magic:**
- Validates encrypted input without revealing the number
- Uses encrypted comparisons (`gte`, `lte`, `and`)
- Only decrypts the validation result, not the secret number

### Making Guesses

```solidity
function makeGuess(euint8 _guess) external {
    require(TFHE.decrypt(gameStatus) == 1, "Game not active");
    require(hasGuessed[msg.sender], "Must join game first");
    
    // Validate guess range
    ebool isValidGuess = TFHE.and(
        TFHE.gte(_guess, TFHE.asEuint8(MIN_NUMBER)),
        TFHE.lte(_guess, TFHE.asEuint8(MAX_NUMBER))
    );
    require(TFHE.decrypt(isValidGuess), "Guess must be 1-100");
    
    // Store encrypted guess
    playerGuesses[msg.sender] = _guess;
    
    // Check if this is a winning guess (encrypted comparison!)
    ebool isWinner = TFHE.eq(_guess, secretNumber);
    
    // End game if someone won
    if (TFHE.decrypt(isWinner)) {
        gameStatus = TFHE.asEuint8(2);
        emit GameFinished(msg.sender, TFHE.decrypt(secretNumber));
    }
}
```

**The Magic Moment:**
- Compares encrypted guess with encrypted secret number
- Only reveals the result (win/lose), not the actual values
- Secret number is only revealed when game ends

## FHEVM Operations Reference

### Comparison Operations
```solidity
TFHE.eq(a, b)    // Encrypted equality check
TFHE.ne(a, b)    // Encrypted not equal
TFHE.gt(a, b)    // Encrypted greater than
TFHE.gte(a, b)   // Encrypted greater than or equal
TFHE.lt(a, b)    // Encrypted less than
TFHE.lte(a, b)   // Encrypted less than or equal
```

### Arithmetic Operations
```solidity
TFHE.add(a, b)   // Encrypted addition
TFHE.sub(a, b)   // Encrypted subtraction
TFHE.mul(a, b)   // Encrypted multiplication
TFHE.div(a, b)   // Encrypted division
```

### Logical Operations
```solidity
TFHE.and(a, b)   // Encrypted AND
TFHE.or(a, b)    // Encrypted OR
TFHE.not(a)      // Encrypted NOT
```

### Type Conversions
```solidity
TFHE.asEuint8(42)     // Convert to encrypted uint8
TFHE.asEbool(true)    // Convert to encrypted bool
TFHE.decrypt(value)   // Decrypt to reveal value
```

## Security Considerations

### 1. **Input Validation**
Always validate encrypted inputs:
```solidity
ebool isValid = TFHE.and(
    TFHE.gte(input, TFHE.asEuint8(minValue)),
    TFHE.lte(input, TFHE.asEuint8(maxValue))
);
require(TFHE.decrypt(isValid), "Invalid input");
```

### 2. **Access Control**
Use traditional Solidity access control:
```solidity
require(msg.sender == gameMaster, "Only game master");
```

### 3. **Event Emissions**
Be careful what you emit - events are public:
```solidity
// Good: Only emit what should be public
emit GameFinished(winner, TFHE.decrypt(secretNumber));

// Bad: Don't emit encrypted values
emit GuessMade(msg.sender, _guess);  // This would be encrypted!
```

## Testing the Contract

### Basic Test Structure
```typescript
describe("SecretGame", function () {
  it("Should initialize correctly", async function () {
    expect(await secretGame.getGameStatus()).to.equal(0);
    expect(await secretGame.gameMaster()).to.equal(owner.address);
  });
});
```

**Note**: Full FHEVM testing requires:
1. FHEVM test environment setup
2. Encrypting test values
3. Testing the full encryption/decryption flow

## Common Patterns

### 1. **Encrypted State Management**
```solidity
euint8 private state;
ebool private flag;

function updateState(euint8 newState) external {
    state = newState;
    flag = TFHE.eq(state, TFHE.asEuint8(42));
}
```

### 2. **Conditional Logic**
```solidity
ebool condition = TFHE.gt(value, TFHE.asEuint8(threshold));
if (TFHE.decrypt(condition)) {
    // Execute logic
}
```

### 3. **Range Validation**
```solidity
ebool inRange = TFHE.and(
    TFHE.gte(value, TFHE.asEuint8(min)),
    TFHE.lte(value, TFHE.asEuint8(max))
);
require(TFHE.decrypt(inRange), "Value out of range");
```

## Next Steps

Now that you understand the smart contract, let's build the frontend that will interact with it!

**Ready for the frontend?** Let's move to [Creating the Frontend](04-frontend.md) 🚀
