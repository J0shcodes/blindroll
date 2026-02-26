# Blindroll 🔐

> **Confidential onchain payroll powered by Fully Homomorphic Encryption.**  
> Pay your team on a public blockchain — salaries stay completely private.

<div align="center">

![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)
![Zama fhEVM](https://img.shields.io/badge/Zama-fhEVM%20v0.9-6C3BDE)
![Network](https://img.shields.io/badge/Network-Ethereum%20Sepolia-627EEA?logo=ethereum)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?logo=next.js)
![License](https://img.shields.io/badge/License-BSD--3--Clause--Clear-blue)

</div>

---

## The Problem

Public blockchains are transparent by design. Every transaction — including payroll — is visible to anyone with a block explorer. For organizations paying contributors or employees onchain, this means:

- Salary structures are exposed company-wide and to competitors
- Employees can see each other's compensation
- Regulatory compliance (GDPR, CCPA) becomes impossible with fully public salary records
- Real-world payroll adoption on public chains is a non-starter

## The Solution

Blindroll uses **Fully Homomorphic Encryption (FHE)** via [Zama's fhEVM](https://docs.zama.org/protocol) to perform payroll computations directly on encrypted data. Salary amounts are encrypted on the client side and **never appear in plaintext on-chain** — not in transactions, not in contract storage, not in event logs.

```
Employer sets salary → encrypted client-side → stored on-chain as ciphertext
Payroll runs         → FHE arithmetic on ciphertexts → balances updated, nothing revealed
Employee views pay   → decryption happens client-side → only they see their number
```

**What's private:** Individual salaries, accumulated employee balances, total treasury balance.  
**What's public:** That payroll ran, when it ran, and employee wallet addresses.

---

## Features

**For Employers**
- Add employees with fully encrypted salary amounts
- Update salaries at any time — old ciphertext is discarded
- Fund a confidential payroll treasury
- Execute payroll in one transaction — all arithmetic is homomorphic
- View encrypted treasury balance (only you can decrypt it)
- Deactivate / reactivate employees without touching their encrypted data

**For Employees**
- View and decrypt your own salary — no one else can
- View and decrypt your accumulated balance after each payroll cycle
- Withdraw accumulated ETH balance on demand
- Receive encrypted error feedback (e.g. if treasury ran short) without leaking any balance data

**Security**
- ACL-enforced access: every ciphertext grants decrypt permission only to the contract, the employer, and the specific employee
- Inference attack prevention via `FHE.isSenderAllowed()` on all encrypted inputs
- Safe payroll execution: `FHE.select()` prevents silent underflow if treasury is insufficient
- Checks-effects-interactions pattern on all ETH transfers

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│                                                                     │
│  Employer UI             │              Employee UI                 │
│  ─────────────           │              ────────────                │
│  • Set salary            │              • View salary (decrypt)     │
│  • Fund treasury         │              • View balance (decrypt)    │
│  • Run payroll           │              • Withdraw ETH              │
│                          │                                          │
│         @zama-fhe/relayer-sdk  (encrypt / decrypt client-side)      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │  ethers.js v6
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ETHEREUM SEPOLIA (fhEVM-enabled)                  │
│                                                                     │
│   Blindroll.sol                                                     │
│   ──────────────────────────────────────────────────────            │
│   addEmployee(address, externalEuint64, proof)                      │
│   executePayroll()   → FHE.le + FHE.select + FHE.sub + FHE.add     │
│   getMyEncryptedSalary() → euint64 handle                           │
│   withdraw()                                                        │
│                                                                     │
│   State: euint64 salaries + euint64 balances (all ciphertexts)      │
│   ACL:   FHE.allow() per employee per ciphertext                    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │  ACL verification
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ZAMA PROTOCOL LAYER                            │
│                                                                     │
│   KMS Verifier  │  Input Verifier  │  Relayer (decryption gateway)  │
│   ACL Contract  │  fhEVM Executor                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Contract: `Blindroll.sol`

| Function | Who | Description |
|---|---|---|
| `addEmployee(emp, encryptedSalary, proof)` | Employer | Adds employee with encrypted salary. Verifies ZK proof, sets ACL grants. |
| `updateSalary(emp, encryptedSalary, proof)` | Employer | Replaces salary ciphertext with fresh encrypted value. |
| `depositToTreasury(encryptedAmount, proof)` | Employer | Funds the confidential payroll treasury. |
| `executePayroll()` | Employer | Runs payroll for all active employees using homomorphic arithmetic. |
| `deactivateEmployee(emp)` | Employer | Pauses an employee from receiving payroll. |
| `getMyEncryptedSalary()` | Employee | Returns ciphertext handle — employee decrypts client-side. |
| `getMyEncryptedBalance()` | Employee | Returns accumulated pay handle — employee decrypts client-side. |
| `withdraw()` | Employee | Transfers accumulated ETH balance to the caller. |
| `getLastError(addr)` | Any | Returns encrypted error code + timestamp for frontend feedback. |

### Privacy Guarantees

| Data | Visible On-Chain? | Who Can Decrypt? |
|---|---|---|
| Individual salary amount | ❌ No | Employer + that employee only |
| Employee accumulated balance | ❌ No | Employer + that employee only |
| Payroll treasury total | ❌ No | Employer only |
| That payroll was executed | ✅ Yes (event) | Public |
| Employee wallet addresses | ✅ Yes | Public |
| Whether an employee is active | ✅ Yes | Public |

### The Safe Payroll Pattern

Standard Solidity would revert on underflow, leaking information about the treasury balance. Blindroll uses `FHE.select()` to handle this confidentially:

```solidity
// Is there enough in the treasury for this salary? (result is encrypted ebool)
ebool hasFunds = FHE.le(salary, _encryptedTreasuryBalance);

// If not: actualPayment = 0. No revert. No information leaked.
euint64 actualPayment = FHE.select(hasFunds, salary, FHE.asEuint64(0));

// Safe subtraction — never underflows
_encryptedTreasuryBalance = FHE.sub(_encryptedTreasuryBalance, actualPayment);

// Safe credit — employee gets 0 if treasury was short
_initOrAddBalance(emp, actualPayment);
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity ^0.8.24 |
| FHE Library | `@fhevm/solidity` v0.9.1 |
| Contract Config | `ZamaEthereumConfig` (Sepolia) |
| Dev & Testing | Hardhat + `@fhevm/hardhat-plugin` |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Blockchain Client | ethers.js v6 |
| FHE Client SDK | `@zama-fhe/relayer-sdk` v0.3.0+ |
| Wallet | MetaMask / WalletConnect |
| Styling | Tailwind CSS |
| Network | Ethereum Sepolia Testnet |

---

## Getting Started

### Prerequisites

- Node.js **LTS v18.x or v20.x** (even-numbered only — Hardhat requirement)
- npm v9+
- MetaMask browser extension configured for Sepolia
- Sepolia ETH — get some from [sepoliafaucet.com](https://sepoliafaucet.com)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/blindroll.git
cd blindroll

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
```

Open `.env` and fill in:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0xYOUR_DEPLOYER_WALLET_PRIVATE_KEY
```

### Compile

```bash
npx hardhat compile
```

---

## Testing

Blindroll follows Zama's recommended three-stage testing progression:

### Stage 1 — Unit Tests (fast, mock FHE)

Use during active development. Mock encryption means no real FHE computation — tests run in seconds.

```bash
npx hardhat test --network hardhat
```

### Stage 2 — Local Integration (mock FHE, persistent state)

Use when testing frontend flows locally. Contract state persists across sessions.

```bash
# Terminal 1 — start local node
npx hardhat node

# Terminal 2 — run tests against it
npx hardhat test --network localhost
```

### Stage 3 — Sepolia (real FHE)

Use for final validation before submission. Slow and costs Sepolia ETH — reserve for pre-submission checks.

```bash
npx hardhat test --network sepolia
```

---

## Deployment

```bash
# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Verify fhEVM compatibility of deployed contract
npx hardhat fhevm check-fhevm-compatibility \
  --network sepolia \
  --address <deployed-contract-address>
```

After deployment, copy the contract address into `frontend/lib/contract.ts`:

```typescript
export const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";
```

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser with MetaMask connected to Sepolia.

- **Employer wallet** → navigate to `/employer`
- **Employee wallet** → navigate to `/employee`

### Employer Quickstart

1. Connect your wallet (the deployer address is automatically recognized as employer)
2. Deposit ETH into the treasury via **Fund Treasury**
3. Add an employee: enter their wallet address + salary amount — the app encrypts the amount before it leaves your browser
4. Click **Run Payroll** to disburse to all active employees

### Employee Quickstart

1. Connect your wallet
2. Click **View My Salary** — the app decrypts your salary from the contract and displays it only to you
3. After payroll runs, click **View My Balance** to see accumulated pay
4. Click **Withdraw** to claim your ETH

---

## Project Structure

```
blindroll/
├── contracts/
│   ├── Blindroll.sol              # Core payroll contract
│   └── interfaces/
│       └── IBlindroll.sol         # Contract interface
├── test/
│   ├── Blindroll.unit.ts          # Unit tests (Hardhat mock mode)
│   └── Blindroll.sepolia.ts       # Integration tests (Sepolia)
├── deploy/
│   └── 01_deploy_blindroll.ts     # Hardhat deploy script
├── frontend/
│   ├── app/
│   │   ├── employer/
│   │   │   └── page.tsx           # Employer dashboard
│   │   ├── employee/
│   │   │   └── page.tsx           # Employee salary view
│   │   └── layout.tsx
│   ├── components/
│   │   ├── AddEmployeeForm.tsx    # Salary encryption + submission
│   │   ├── PayrollRunner.tsx      # Execute payroll UI
│   │   ├── SalaryViewer.tsx       # Employee decrypt + display
│   │   └── WalletConnect.tsx
│   ├── hooks/
│   │   ├── useContract.ts         # Contract instance hook
│   │   └── useFhevm.ts            # fhEVM SDK initialization
│   └── lib/
│       ├── contract.ts            # ABI and deployed address
│       └── fhevm.ts               # Encryption utilities
├── hardhat.config.ts
├── .env.example
└── README.md
```

---

## Zama fhEVM Reference

### Sepolia Contract Addresses

| Contract | Address |
|---|---|
| ACL_CONTRACT | `0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D` |
| FHEVM_EXECUTOR_CONTRACT | `0x92C920834Ec8941d2C77D188936E1f7A6f49c127` |
| KMS_VERIFIER_CONTRACT | `0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A` |
| INPUT_VERIFIER_CONTRACT | `0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0` |
| RELAYER_URL | `https://relayer.testnet.zama.org` |

### Key fhEVM Patterns Used

```solidity
// Accepting encrypted input from client
euint64 salary = FHE.fromExternal(encryptedSalary, inputProof);

// Granting decrypt access (must do after every write)
FHE.allowThis(salary);      // contract can reuse handle in future txs
FHE.allow(salary, employer); // employer can decrypt
FHE.allow(salary, emp);      // employee can decrypt their own

// Preventing inference attacks on input
require(FHE.isSenderAllowed(encryptedInput), "Unauthorized");

// Conditional encrypted arithmetic (no plaintext branching)
ebool hasFunds = FHE.le(salary, treasury);
euint64 payment = FHE.select(hasFunds, salary, FHE.asEuint64(0));

// Client-side decryption (TypeScript)
const clearSalary = await fhevm.userDecryptEuint(
  FhevmType.euint64,
  encryptedHandle,
  contractAddress,
  signer
);
```

---

## Known Limitations (V1)

These are deliberate V1 trade-offs, documented transparently:

**Plaintext salary mirror** — V1 uses a parallel plaintext mapping (`_plainSalaryMirror`) to track ETH amounts for withdrawal. This means the ETH-equivalent salary *is* readable in contract state. The full V2 solution replaces this with a `FHE.checkSignatures()` withdrawal proof flow where the employee decrypts their balance off-chain and submits the proof on-chain for verification.

**No reorg protection** — For production mainnet deployment, salary ACL grants should use a two-step timelock (set employee → wait 96 blocks → grant ACL) to guard against blockchain reorganizations. Omitted here as Sepolia reorgs are rare and no real funds are at stake in the demo.

**Single employer per deployment** — V1 is one contract per organization. Multi-org support with role hierarchies is planned for V2.

**Gas scaling** — Each FHE operation costs significantly more gas than standard Solidity. The demo runs smoothly with ≤10 employees. Production deployments would batch payroll across multiple transactions.

---

## Roadmap

- [ ] `FHE.checkSignatures()` withdrawal proof flow (eliminates plaintext salary mirror)
- [ ] Multi-organization support with role-based access control
- [ ] Variable pay / bonus disbursement per payroll cycle
- [ ] Payroll scheduling via Chainlink Automation
- [ ] Reorg protection (block-delay ACL pattern)
- [ ] ERC-7984 confidential token integration
- [ ] Formal security audit

---

## Hackathon Submissions

Blindroll was built for:

- **[PL_Genesis: Frontiers of Collaboration Hackathon](https://pl-genesis.devfolio.co)**
  - Fresh Code Track
  - Crypto Track  
  - Zama: Confidential Onchain Finance Bounty

- **[Zama Confidential Onchain Payroll Special Bounty](https://www.zama.ai)**

---

## Resources

- [Zama Protocol Documentation](https://docs.zama.org/protocol)
- [fhEVM Solidity Library](https://github.com/zama-ai/fhevm)
- [fhEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
- [Zama ACL Documentation](https://docs.zama.org/protocol/solidity-guides/smart-contract/acl)
- [Sepolia Faucet](https://sepoliafaucet.com)

---

## License

[BSD-3-Clause-Clear](./LICENSE)

---

<div align="center">
  Built with <a href="https://www.zama.ai">Zama fhEVM</a> — computation on encrypted data, on a public blockchain.
</div>