# Blindroll 🔐

> **Confidential onchain payroll powered by Fully Homomorphic Encryption.**  
> Pay your team on a public blockchain, salaries stay completely private.

<div align="center">

![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)
![Zama fhEVM](https://img.shields.io/badge/Zama-fhEVM%20v0.9-6C3BDE)
![Network](https://img.shields.io/badge/Network-Ethereum%20Sepolia-627EEA?logo=ethereum)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?logo=next.js)
![License](https://img.shields.io/badge/License-BSD--3--Clause--Clear-blue)

</div>

---

## The Problem

Public blockchains are transparent by design. Every transaction, including payroll, is visible to anyone with a block explorer. For organizations paying contributors or employees onchain, this means:

- Salary structures are exposed company-wide and to competitors
- Employees can see each other's compensation
- Regulatory compliance (GDPR, CCPA) becomes impossible with fully public salary records
- Real-world payroll adoption on public chains is a non-starter

## The Solution

Blindroll uses **Fully Homomorphic Encryption (FHE)** via [Zama's fhEVM](https://docs.zama.org/protocol) to perform payroll computations directly on encrypted data. Salary amounts are encrypted in the browser and **never appear in plaintext on-chain**, not in transactions, not in contract storage, not in event logs.

```
Employer sets salary → encrypted client-side → stored on-chain as ciphertext handle
Payroll runs         → FHE arithmetic on ciphertexts → balances updated, nothing revealed
Employee views pay   → decryption happens client-side → only they see their number
```

**What's private:** Individual salary amounts, accumulated employee balances, total treasury balance.  
**What's public:** That payroll ran, when it ran, and employee wallet addresses.

---

## Live Demo

**Deployed contract (Sepolia):** `0x5917b72E064d3Ac2A3148100f217C3B5a3359aC1`  
[View on Etherscan ↗](https://sepolia.etherscan.io/address/0x5917b72E064d3Ac2A3148100f217C3B5a3359aC1)

---

## Features

**For Employers**
- Deploy a personal payroll contract directly from the browser, no CLI required
- Add employees with fully encrypted salary amounts (ZK proof verified on-chain)
- Update salaries at any time, old ciphertext is replaced atomically
- Fund a confidential payroll treasury
- Execute payroll in one transaction, all arithmetic is homomorphic
- Decrypt and view the treasury balance and any employee salary directly in the UI
- Deactivate / reactivate employees without touching their encrypted data

**For Employees**
- Connect wallet and enter the employer's contract address to join
- Decrypt and view your own salary, no one else can, not even the app
- View and decrypt your accumulated balance after each payroll cycle
- Withdraw accumulated ETH balance in one click
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
│  Employer UI                  │         Employee UI                 │
│  ────────────────────         │         ────────────────────        │
│  • Deploy contract            │         • Enter contract address    │
│  • Encrypt + set salary       │         • Decrypt own salary        │
│  • Fund treasury              │         • Decrypt own balance       │
│  • Run payroll                │         • Withdraw ETH              │
│  • Decrypt salary / balance   │                                     │
│                                                                     │
│         @zama-fhe/relayer-sdk  (encrypt / userDecrypt client-side)  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │  wagmi + ethers.js v6
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ETHEREUM SEPOLIA (fhEVM-enabled)                  │
│                                                                     │
│   Blindroll.sol                                                     │
│   ──────────────────────────────────────────────────────            │
│   addEmployee(address, externalEuint64, proof)                      │
│   depositToTreasury(externalEuint64, proof) payable                 │
│   executePayroll()  → FHE.le + FHE.select + FHE.sub + FHE.add      │
│   getMyEncryptedSalary()  → euint64 handle (employee only)          │
│   getEmployeeEncryptedSalary(addr) → euint64 handle (employer only) │
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
| `depositToTreasury(encryptedAmount, proof)` | Employer | Funds the confidential payroll treasury. Payable — ETH sent alongside encrypted accounting value. |
| `executePayroll()` | Employer | Runs payroll for all active employees using homomorphic arithmetic. |
| `deactivateEmployee(emp)` | Employer | Pauses an employee from receiving payroll. |
| `getEmployeeEncryptedSalary(emp)` | Employer | Returns a specific employee's salary ciphertext handle for client-side decryption. |
| `getEncryptedTreasuryBalance()` | Employer | Returns treasury ciphertext handle for client-side decryption. |
| `getMyEncryptedSalary()` | Employee | Returns caller's salary handle — employee decrypts client-side. |
| `getMyEncryptedBalance()` | Employee | Returns accumulated pay handle — employee decrypts client-side. |
| `withdraw()` | Employee | Transfers accumulated ETH balance to the caller. |
| `getLastError(addr)` | Any | Returns encrypted error code + timestamp for frontend feedback. |

### Privacy Guarantees

| Data | Visible On-Chain? | Who Can Decrypt? |
|---|---|---|
| Individual salary amount | ❌ No | Employer + that employee only |
| Employee accumulated balance | ❌ No | Employer + that employee only |
| Payroll treasury total | ❌ No | Employer only |
| Treasury deposit amount | ⚠️ Partially — see Known Limitations | — |
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
| Contract Config | `ZamaEthereumConfig` (Sepolia preset) |
| Dev & Testing | Hardhat + `@fhevm/hardhat-plugin` |
| Frontend | Next.js 16 (App Router) + TypeScript |
| Wallet / Chain | wagmi v2 + viem + Reown AppKit |
| Blockchain Client | ethers.js v6 (for FHE signing) |
| FHE Client SDK | `@zama-fhe/relayer-sdk` |
| Styling | Tailwind CSS |
| Network | Ethereum Sepolia Testnet |

---

## Getting Started

### Prerequisites

- Node.js **v20.x** (even-numbered LTS — Hardhat requirement)
- npm v9+
- MetaMask browser extension configured for **Sepolia**
- Sepolia ETH — get some from [sepoliafaucet.com](https://sepoliafaucet.com)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/blindroll.git
cd blindroll

# 2. Install contract dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
```

Fill in `.env`:

```env
# Required for Hardhat Sepolia deployment and testing
MNEMONIC="your twelve word seed phrase here"
INFURA_API_KEY=your_infura_project_key
```

> **Note:** The frontend does not use these variables. Contract deployment for the live app is done via the browser UI (see [Running the Frontend](#running-the-frontend)).

### Compile

```bash
npx hardhat compile
```

---

## Testing

Blindroll follows Zama's recommended three-stage testing progression:

### Stage 1 — Unit Tests (fast, mock FHE)

Use during active development. Mock encryption means instant test runs, no real FHE computation.

```bash
npx hardhat test --network hardhat
```

### Stage 2 — Local Integration (mock FHE, persistent state)

Use when testing frontend flows locally against a running node.

```bash
# Terminal 1
npx hardhat node

# Terminal 2
npx hardhat test --network localhost
```

### Stage 3 — Sepolia (real FHE)

Final validation before submission. Uses real encryption, slower and costs Sepolia ETH.

```bash
npx hardhat test --network sepolia
```

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with MetaMask connected to Sepolia.

### Employer Quickstart

1. Go to [http://localhost:3000](http://localhost:3000) and click **Launch App**
2. Select **Employer** and connect your wallet
3. If this is your first time, you will be taken to `/deploy` — click **Deploy Contract** to deploy your personal Blindroll contract to Sepolia. The contract address is saved automatically.
4. From the dashboard, go to **Treasury** → deposit ETH to fund payroll
5. Go to **Employees** → add an employee by entering their wallet address and monthly salary. The app encrypts the salary in your browser before it ever touches the chain.
6. Go to **Payroll** → click **Execute Payroll** to disburse to all active employees
7. On the **Overview**, click **Decrypt** next to any employee row to view their salary, or decrypt the treasury balance inline

### Employee Quickstart

1. Click **Launch App** → select **Employee** → connect your wallet
2. Enter the contract address your employer shared with you
3. On the dashboard, click **Decrypt Salary**, your wallet signs a message (no gas) and your salary is revealed only in your browser
4. After payroll runs, click **Decrypt Balance** to see accumulated pay
5. Click **Withdraw** to claim your ETH

---

## Project Structure

```
blindroll/
├── contracts/
│   └── Blindroll.sol                     # Core payroll contract
├── test/
│   └── Blindroll.test.ts                 # Full test suite (unit + integration)
├── frontend/
│   ├── app/
│   │   ├── page.tsx                      # Landing page
│   │   ├── connect/
│   │   │   └── page.tsx                  # Role selection + wallet connect flow
│   │   ├── deploy/
│   │   │   └── page.tsx                  # Browser-based contract deployment
│   │   └── dashboard/
│   │       ├── layout.tsx                # Auth guard + sidebar
│   │       ├── employer/
│   │       │   ├── page.tsx              # Employer overview (roster + treasury decrypt)
│   │       │   ├── employees/
│   │       │   │   └── page.tsx          # Add / remove employees
│   │       │   ├── payroll/
│   │       │   │   └── page.tsx          # Execute payroll
│   │       │   └── treasury/
│   │       │       └── page.tsx          # Fund treasury + decrypt balance
│   │       └── employee/
│   │           ├── page.tsx              # Employee overview
│   │           ├── salary/
│   │           │   └── page.tsx          # Decrypt salary
│   │           └── balance/
│   │               └── page.tsx          # Decrypt balance + withdraw
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── AddEmployeeModal.tsx      # Encrypt salary + submit transaction
│   │   │   ├── RemoveEmployeeModal.tsx   # Deactivate employee
│   │   │   └── DecryptSalaryButton.tsx   # Per-row employer salary decrypt
│   │   └── ui/                           # Shared UI primitives
│   ├── hooks/
│   │   ├── useFhevm.ts                   # fhEVM SDK init, encryptUint64, userDecrypt
│   │   ├── useContract.ts                # wagmi read/write wrappers + role detection
│   │   ├── useWallet.ts                  # Connection state + network check
│   │   └── useEthersSigner.ts            # ethers.js signer for EIP-712 signing
│   ├── lib/
│   │   ├── contractConfig.ts             # Address resolution: URL param → localStorage → env
│   │   └── deploy.ts                     # Contract bytecode for browser deployment
│   ├── abi/
│   │   └── abi.ts                        # Blindroll ABI
│   └── context/
│       └── index.tsx                     # Reown AppKit + wagmi provider setup
├── hardhat.config.ts
├── .env.example
└── README.md
```

---

## Zama fhEVM Reference

### Sepolia Protocol Addresses

| Contract | Address |
|---|---|
| ACL_CONTRACT | `0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D` |
| FHEVM_EXECUTOR_CONTRACT | `0x92C920834Ec8941d2C77D188936E1f7A6f49c127` |
| KMS_VERIFIER_CONTRACT | `0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A` |
| INPUT_VERIFIER_CONTRACT | `0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0` |
| RELAYER_URL | `https://relayer.testnet.zama.org` |

### Key fhEVM Patterns Used

```solidity
// Accepting encrypted input from the client
euint64 salary = FHE.fromExternal(encryptedSalary, inputProof);

// Three required ACL grants after every encrypted write
FHE.allowThis(salary);       // contract can reuse handle in future txs (payroll loop)
FHE.allow(salary, employer); // employer can decrypt for verification
FHE.allow(salary, emp);      // employee can decrypt their own salary

// Preventing inference attacks — required on all encrypted inputs
require(FHE.isSenderAllowed(encryptedSalary), "Unauthorized encrypted input");

// Conditional encrypted arithmetic — no plaintext branching, no information leak
ebool hasFunds = FHE.le(salary, treasury);
euint64 payment = FHE.select(hasFunds, salary, FHE.asEuint64(0));

// Client-side decryption via relayer SDK (TypeScript)
// Triggers an EIP-712 wallet signature — no gas, no transaction
const keypair = instance.generateKeypair();
const eip712 = instance.createEIP712(keypair.publicKey, [contractAddress], startTs, 10);
const signature = await signer.signTypedData(eip712.domain, eip712.types, eip712.message);
const result = await instance.userDecrypt(
  [{ handle, contractAddress }],
  keypair.privateKey,
  keypair.publicKey,
  signature.replace("0x", ""),
  [contractAddress],
  signer.address,
  startTs,
  10
);
// result[handle] → bigint (the plaintext salary in wei)
```

---

## Known Limitations (V1)

These are deliberate V1 trade-offs, documented transparently:

**Treasury deposit amount is partially visible** — `msg.value` on a `payable` function is always recorded at the EVM protocol level before contract code executes. An observer can see how much ETH was deposited in each `depositToTreasury` call. However, the *running encrypted treasury balance* remains fully confidential — the accumulation of deposits is only readable by the employer via `userDecrypt`. A V2 solution would use confidential token transfers (ERC-7984) to eliminate this leak entirely.

**Plaintext salary mirror** — V1 uses a parallel plaintext mapping (`_plainSalaryMirror`) to track ETH amounts for withdrawal accounting. This means the ETH-equivalent of each salary is readable in contract state by anyone who knows to look. The full V2 solution replaces this with a `FHE.checkSignatures()` withdrawal proof flow where the employee decrypts their balance off-chain and submits the proof on-chain for verification.

**No reorg protection** — For production mainnet deployment, salary ACL grants should use a two-step timelock (set employee → wait 96 blocks → grant ACL) to guard against blockchain reorganisations. Omitted here as Sepolia reorgs are rare and no real funds are at stake.

**Single employer per deployment** — V1 is one contract per organisation. Multi-org support with role hierarchies is planned for V2.

**Gas scaling** — Each FHE operation costs significantly more gas than standard Solidity. The demo runs smoothly with ≤10 employees. Production deployments would batch payroll across multiple transactions.

---

## Roadmap

- [ ] `FHE.checkSignatures()` withdrawal proof flow (eliminates plaintext salary mirror)
- [ ] ERC-7984 confidential token integration (eliminates `msg.value` treasury leak)
- [ ] Multi-organisation support with role-based access control
- [ ] Variable pay / bonus disbursement per payroll cycle
- [ ] Payroll scheduling via Chainlink Automation
- [ ] Reorg protection (block-delay ACL pattern)
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
