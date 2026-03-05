import { expect } from "chai";
import { ethers } from "hardhat";
import { fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import type { Blindroll } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// TEST HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encrypts a uint64 salary value for a given signer and contract.
 * Returns the encrypted handle and ZK proof ready to pass to the contract.
 */
async function encryptSalary(
  contractAddress: string,
  signer: SignerWithAddress,
  salaryAmount: bigint
): Promise<{ handle: string; proof: string }> {
  const input = fhevm.createEncryptedInput(contractAddress, signer.address);
  input.add64(salaryAmount);
  // const encrypted = await input.encrypt();
  const {handles, inputProof} = await input.encrypt()

  return {
    handle: ethers.hexlify(handles[0]),
    proof: ethers.hexlify(inputProof),
  };
}

/**
 * Decrypts a euint64 handle on behalf of a signer.
 * Signer must have ACL permission on the ciphertext or this will throw.
 */
async function decryptSalary(
  contractAddress: string,
  signer: SignerWithAddress,
  handle: string
): Promise<bigint> {
  return fhevm.userDecryptEuint(
    FhevmType.euint64,
    handle,
    contractAddress,
    signer
  );
}

/**
 * Decrypts a euint8 handle on behalf of a signer.
 * Used to read encrypted error codes.
 */
async function decryptErrorCode(
  contractAddress: string,
  signer: SignerWithAddress,
  handle: string
): Promise<bigint> {
  return fhevm.userDecryptEuint(
    FhevmType.euint8,
    handle,
    contractAddress,
    signer
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// Salary amounts in "micro-units" (6 decimal places, like USDC).
// $5,000/month = 5_000_000_000 units
const SALARY_ALICE  = 5_000_000_000n; // $5,000
const SALARY_BOB    = 8_500_000_000n; // $8,500
const SALARY_CAROL  = 3_200_000_000n; // $3,200

// ETH amounts for the plaintext mirror (withdrawal accounting)
const SALARY_ALICE_ETH  = ethers.parseEther("1.0");
const SALARY_BOB_ETH    = ethers.parseEther("1.7");
const SALARY_CAROL_ETH  = ethers.parseEther("0.64");

// Treasury deposit — enough to cover 2 full payroll cycles for all 3 employees
const TREASURY_DEPOSIT_ETH = ethers.parseEther("10.0");
const TREASURY_DEPOSIT_UNITS = 50_000_000_000n; // Encrypted mirror amount

// Error codes (must match Blindroll.sol constructor)
const ERROR_NONE                 = 0n;
const ERROR_INSUFFICIENT_TREASURY = 1n;
const ERROR_ZERO_BALANCE         = 2n;

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────

describe("Blindroll", function () {
  let blindroll: Blindroll;
  let contractAddress: string;

  // Signers
  let employer: SignerWithAddress;   // deployer → employer
  let alice: SignerWithAddress;      // employee 1
  let bob: SignerWithAddress;        // employee 2
  let carol: SignerWithAddress;      // employee 3
  let stranger: SignerWithAddress;   // not employer, not employee

  // ── SETUP ──────────────────────────────────────────────────────────────────

  beforeEach(async function () {
    [employer, alice, bob, carol, stranger] = await ethers.getSigners();

    const BlindrollFactory = await ethers.getContractFactory("Blindroll", employer);
    blindroll = (await BlindrollFactory.deploy()) as Blindroll;
    await blindroll.waitForDeployment();

    contractAddress = await blindroll.getAddress();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. DEPLOYMENT
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Deployment", function () {
    it("sets the deployer as the employer", async function () {
      expect(await blindroll.employer()).to.equal(employer.address);
    });

    it("starts with zero employees", async function () {
      expect(await blindroll.getEmployeeCount()).to.equal(0n);
    });

    it("starts with treasury uninitialized", async function () {
      await expect(
        blindroll.connect(employer).getEncryptedTreasuryBalance()
      ).to.be.revertedWith("Treasury not funded");
    });

    it("employer address is immutable — cannot be changed", async function () {
      // There is no setter for employer — this is enforced at the type level.
      // We verify by checking the value stays the same after other operations.
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);
      expect(await blindroll.employer()).to.equal(employer.address);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ADD EMPLOYEE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("addEmployee", function () {
    it("employer can add an employee with an encrypted salary", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);

      await expect(
        blindroll.connect(employer).addEmployee(alice.address, handle, proof)
      )
        .to.emit(blindroll, "EmployeeAdded")
        .withArgs(alice.address, await getBlockTimestamp());

      expect(await blindroll.getEmployeeCount()).to.equal(1n);
      expect(await blindroll.getIsEmployeeActive(alice.address)).to.be.true
    });

    it("employer can decrypt the employee's salary after adding", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);

      const salaryHandle = await blindroll
        .connect(alice)
        .getMyEncryptedSalary();

      // Employer can decrypt
      const employerDecrypted = await decryptSalary(contractAddress, employer, salaryHandle);
      expect(employerDecrypted).to.equal(SALARY_ALICE);
    });

    it("employee can decrypt their own salary after being added", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);

      const salaryHandle = await blindroll.connect(alice).getMyEncryptedSalary();

      // Employee decrypts their own salary
      const aliceDecrypted = await decryptSalary(contractAddress, alice, salaryHandle);
      expect(aliceDecrypted).to.equal(SALARY_ALICE);
    });

    it("an unauthorized address cannot decrypt another employee's salary", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);

      const salaryHandle = await blindroll.connect(alice).getMyEncryptedSalary();

      // Bob (another employee) should NOT be able to decrypt Alice's salary
      await expect(
        decryptSalary(contractAddress, bob, salaryHandle)
      ).to.be.rejected;
    });

    it("stranger cannot decrypt an employee's salary", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);

      const salaryHandle = await blindroll.connect(alice).getMyEncryptedSalary();

      await expect(
        decryptSalary(contractAddress, stranger, salaryHandle)
      ).to.be.rejected;
    });

    it("multiple employees can be added with different salaries", async function () {
      const aliceInput = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      const bobInput   = await encryptSalary(contractAddress, employer, SALARY_BOB);
      const carolInput = await encryptSalary(contractAddress, employer, SALARY_CAROL);

      await blindroll.connect(employer).addEmployee(alice.address, aliceInput.handle, aliceInput.proof);
      await blindroll.connect(employer).addEmployee(bob.address,   bobInput.handle,   bobInput.proof);
      await blindroll.connect(employer).addEmployee(carol.address, carolInput.handle, carolInput.proof);

      expect(await blindroll.getEmployeeCount()).to.equal(3n);

      // Each employee decrypts only their own salary — values are independent
      const aliceHandle = await blindroll.connect(alice).getMyEncryptedSalary();
      const bobHandle   = await blindroll.connect(bob).getMyEncryptedSalary();
      const carolHandle = await blindroll.connect(carol).getMyEncryptedSalary();

      expect(await decryptSalary(contractAddress, alice, aliceHandle)).to.equal(SALARY_ALICE);
      expect(await decryptSalary(contractAddress, bob,   bobHandle)).to.equal(SALARY_BOB);
      expect(await decryptSalary(contractAddress, carol, carolHandle)).to.equal(SALARY_CAROL);
    });

    it("reverts if the same employee is added twice", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);

      const { handle: h2, proof: p2 } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await expect(
        blindroll.connect(employer).addEmployee(alice.address, h2, p2)
      ).to.be.revertedWithCustomError(blindroll, "AlreadyEmployee")
        .withArgs(alice.address);
    });

    it("reverts if address is zero", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await expect(
        blindroll.connect(employer).addEmployee(ethers.ZeroAddress, handle, proof)
      ).to.be.revertedWithCustomError(blindroll, "InvalidAddress");
    });

    it("reverts if called by a non-employer", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await expect(
        blindroll.connect(stranger).addEmployee(alice.address, handle, proof)
      ).to.be.revertedWithCustomError(blindroll, "NotEmployer");
    });

    it("records correct addedAt timestamp", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      const tx = await blindroll.connect(employer).addEmployee(alice.address, handle, proof);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      expect(await blindroll.getEmployeeAddedAt(alice.address)).to.equal(block!.timestamp);
    });

    it("new employee is active by default", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);
      expect(await blindroll.getIsEmployeeActive(alice.address)).to.be.true;
    });

    it("getEmployeeList returns correct addresses", async function () {
      const aliceInput = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      const bobInput   = await encryptSalary(contractAddress, employer, SALARY_BOB);

      await blindroll.connect(employer).addEmployee(alice.address, aliceInput.handle, aliceInput.proof);
      await blindroll.connect(employer).addEmployee(bob.address,   bobInput.handle,   bobInput.proof);

      const list = await blindroll.getEmployeeList();
      expect(list).to.deep.equal([alice.address, bob.address]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. UPDATE SALARY
  // ═══════════════════════════════════════════════════════════════════════════

  describe("updateSalary", function () {
    beforeEach(async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);
    });

    it("employer can update an employee's salary", async function () {
      const newSalary = 6_000_000_000n; // $6,000 raise
      const { handle, proof } = await encryptSalary(contractAddress, employer, newSalary);

      await expect(
        blindroll.connect(employer).updateSalary(alice.address, handle, proof)
      ).to.emit(blindroll, "SalaryUpdated").withArgs(alice.address, await getBlockTimestamp());
    });

    it("updated salary is correctly decryptable by employee", async function () {
      const newSalary = 6_000_000_000n;
      const { handle, proof } = await encryptSalary(contractAddress, employer, newSalary);
      await blindroll.connect(employer).updateSalary(alice.address, handle, proof);

      const salaryHandle = await blindroll.connect(alice).getMyEncryptedSalary();
      const decrypted = await decryptSalary(contractAddress, alice, salaryHandle);
      expect(decrypted).to.equal(newSalary);
    });

    it("updated salary is correctly decryptable by employer", async function () {
      const newSalary = 6_000_000_000n;
      const { handle, proof } = await encryptSalary(contractAddress, employer, newSalary);
      await blindroll.connect(employer).updateSalary(alice.address, handle, proof);

      const salaryHandle = await blindroll.connect(alice).getMyEncryptedSalary();
      const decrypted = await decryptSalary(contractAddress, employer, salaryHandle);
      expect(decrypted).to.equal(newSalary);
    });

    it("old salary value is no longer accessible after update", async function () {
      // Get the old handle before the update
      const oldHandle = await blindroll.connect(alice).getMyEncryptedSalary();

      const newSalary = 6_000_000_000n;
      const { handle, proof } = await encryptSalary(contractAddress, employer, newSalary);
      await blindroll.connect(employer).updateSalary(alice.address, handle, proof);

      // The new handle should reflect the new salary
      const newHandle = await blindroll.connect(alice).getMyEncryptedSalary();
      expect(newHandle).to.not.equal(oldHandle);

      const decrypted = await decryptSalary(contractAddress, alice, newHandle);
      expect(decrypted).to.equal(newSalary);
    });

    it("reverts if employee does not exist", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_BOB);
      await expect(
        blindroll.connect(employer).updateSalary(bob.address, handle, proof)
      ).to.be.revertedWithCustomError(blindroll, "EmployeeNotFound")
        .withArgs(bob.address);
    });

    it("reverts if called by non-employer", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_BOB);
      await expect(
        blindroll.connect(stranger).updateSalary(alice.address, handle, proof)
      ).to.be.revertedWithCustomError(blindroll, "NotEmployer");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. DEACTIVATE / REACTIVATE EMPLOYEE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("deactivateEmployee / reactivateEmployee", function () {
    beforeEach(async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);
    });

    it("employer can deactivate an employee", async function () {
      await expect(blindroll.connect(employer).deactivateEmployee(alice.address))
        .to.emit(blindroll, "EmployeeDeactivated")
        .withArgs(alice.address, await getBlockTimestamp());

      expect(await blindroll.getIsEmployeeActive(alice.address)).to.be.false;
    });

    it("employer can reactivate a deactivated employee", async function () {
      await blindroll.connect(employer).deactivateEmployee(alice.address);

      await expect(blindroll.connect(employer).reactivateEmployee(alice.address))
        .to.emit(blindroll, "EmployeeReactivated")
        .withArgs(alice.address, await getBlockTimestamp());

      expect(await blindroll.getIsEmployeeActive(alice.address)).to.be.true;
    });

    it("deactivated employee's encrypted salary is still ACL-protected after deactivation", async function () {
      // Deactivating should NOT expose or delete the salary ciphertext
      await blindroll.connect(employer).deactivateEmployee(alice.address);

      const salaryHandle = await blindroll.connect(alice).getMyEncryptedSalary();
      const decrypted = await decryptSalary(contractAddress, alice, salaryHandle);
      expect(decrypted).to.equal(SALARY_ALICE); // salary still intact and private
    });

    it("reverts deactivate if employee not found", async function () {
      await expect(
        blindroll.connect(employer).deactivateEmployee(stranger.address)
      ).to.be.revertedWithCustomError(blindroll, "EmployeeNotFound");
    });

    it("reverts reactivate if employee not found", async function () {
      await expect(
        blindroll.connect(employer).reactivateEmployee(stranger.address)
      ).to.be.revertedWithCustomError(blindroll, "EmployeeNotFound");
    });

    it("non-employer cannot deactivate", async function () {
      await expect(
        blindroll.connect(stranger).deactivateEmployee(alice.address)
      ).to.be.revertedWithCustomError(blindroll, "NotEmployer");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. DEPOSIT TO TREASURY
  // ═══════════════════════════════════════════════════════════════════════════

  describe("depositToTreasury", function () {
    it("employer can fund the treasury", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);

      await expect(
        blindroll.connect(employer).depositToTreasury(handle, proof, {
          value: TREASURY_DEPOSIT_ETH,
        })
      ).to.emit(blindroll, "TreasuryDeposited");
    });

    it("employer can decrypt the treasury balance after deposit", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);
      await blindroll.connect(employer).depositToTreasury(handle, proof, {
        value: TREASURY_DEPOSIT_ETH,
      });

      const treasuryHandle = await blindroll.connect(employer).getEncryptedTreasuryBalance();
      const decrypted = await decryptSalary(contractAddress, employer, treasuryHandle);
      expect(decrypted).to.equal(TREASURY_DEPOSIT_UNITS);
    });

    it("treasury balance accumulates correctly across multiple deposits", async function () {
      const deposit1Units = 20_000_000_000n;
      const deposit2Units = 30_000_000_000n;

      const input1 = await encryptSalary(contractAddress, employer, deposit1Units);
      await blindroll.connect(employer).depositToTreasury(input1.handle, input1.proof, {
        value: ethers.parseEther("4.0"),
      });

      const input2 = await encryptSalary(contractAddress, employer, deposit2Units);
      await blindroll.connect(employer).depositToTreasury(input2.handle, input2.proof, {
        value: ethers.parseEther("6.0"),
      });

      const treasuryHandle = await blindroll.connect(employer).getEncryptedTreasuryBalance();
      const decrypted = await decryptSalary(contractAddress, employer, treasuryHandle);
      expect(decrypted).to.equal(deposit1Units + deposit2Units);
    });

    it("contract ETH balance equals total deposited", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);
      await blindroll.connect(employer).depositToTreasury(handle, proof, {
        value: TREASURY_DEPOSIT_ETH,
      });

      const contractBalance = await ethers.provider.getBalance(contractAddress);
      expect(contractBalance).to.equal(TREASURY_DEPOSIT_ETH);
    });

    it("stranger cannot decrypt the treasury balance", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);
      await blindroll.connect(employer).depositToTreasury(handle, proof, {
        value: TREASURY_DEPOSIT_ETH,
      });

      const treasuryHandle = await blindroll.connect(employer).getEncryptedTreasuryBalance();
      await expect(
        decryptSalary(contractAddress, stranger, treasuryHandle)
      ).to.be.rejected;
    });

    it("reverts if deposit amount is zero", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);
      await expect(
        blindroll.connect(employer).depositToTreasury(handle, proof, { value: 0n })
      ).to.be.revertedWith("Deposit must be non-zero");
    });

    it("non-employer cannot deposit to treasury", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, stranger, TREASURY_DEPOSIT_UNITS);
      await expect(
        blindroll.connect(stranger).depositToTreasury(handle, proof, {
          value: TREASURY_DEPOSIT_ETH,
        })
      ).to.be.revertedWithCustomError(blindroll, "NotEmployer");
    });

    it("getEncryptedTreasuryBalance reverts before any deposit", async function () {
      await expect(
        blindroll.connect(employer).getEncryptedTreasuryBalance()
      ).to.be.revertedWith("Treasury not funded");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. EXECUTE PAYROLL
  // ═══════════════════════════════════════════════════════════════════════════

  describe("executePayroll", function () {
    // Shared setup: 3 employees + funded treasury + plaintext mirrors set
    beforeEach(async function () {
      // Add employees
      const aliceInput = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      const bobInput   = await encryptSalary(contractAddress, employer, SALARY_BOB);
      const carolInput = await encryptSalary(contractAddress, employer, SALARY_CAROL);

      await blindroll.connect(employer).addEmployee(alice.address, aliceInput.handle, aliceInput.proof);
      await blindroll.connect(employer).addEmployee(bob.address,   bobInput.handle,   bobInput.proof);
      await blindroll.connect(employer).addEmployee(carol.address, carolInput.handle, carolInput.proof);

      // Set plaintext salary mirrors for ETH withdrawal accounting
      await blindroll.connect(employer).setPlainSalaryMirror(alice.address, SALARY_ALICE_ETH);
      await blindroll.connect(employer).setPlainSalaryMirror(bob.address,   SALARY_BOB_ETH);
      await blindroll.connect(employer).setPlainSalaryMirror(carol.address, SALARY_CAROL_ETH);

      // Fund treasury
      const treasuryInput = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);
      await blindroll.connect(employer).depositToTreasury(
        treasuryInput.handle,
        treasuryInput.proof,
        { value: TREASURY_DEPOSIT_ETH }
      );
    });

    it("emits PayrollExecuted with correct employee count", async function () {
      await expect(blindroll.connect(employer).executePayroll())
        .to.emit(blindroll, "PayrollExecuted")
        .withArgs(await getBlockTimestamp(), 3n);
    });

    it("employee can decrypt their balance after payroll", async function () {
      await blindroll.connect(employer).executePayroll();

      const balanceHandle = await blindroll.connect(alice).getMyEncryptedBalance();
      const aliceBalance = await decryptSalary(contractAddress, alice, balanceHandle);
      expect(aliceBalance).to.equal(SALARY_ALICE);
    });

    it("balances accumulate correctly across multiple payroll cycles", async function () {
      await blindroll.connect(employer).executePayroll();
      await blindroll.connect(employer).executePayroll();

      const balanceHandle = await blindroll.connect(alice).getMyEncryptedBalance();
      const aliceBalance = await decryptSalary(contractAddress, alice, balanceHandle);
      expect(aliceBalance).to.equal(SALARY_ALICE * 2n);
    });

    it("employer can decrypt any employee's balance after payroll", async function () {
      await blindroll.connect(employer).executePayroll();

      const aliceHandle = await blindroll.connect(alice).getMyEncryptedBalance();
      const bobHandle   = await blindroll.connect(bob).getMyEncryptedBalance();
      const carolHandle = await blindroll.connect(carol).getMyEncryptedBalance();

      expect(await decryptSalary(contractAddress, employer, aliceHandle)).to.equal(SALARY_ALICE);
      expect(await decryptSalary(contractAddress, employer, bobHandle)).to.equal(SALARY_BOB);
      expect(await decryptSalary(contractAddress, employer, carolHandle)).to.equal(SALARY_CAROL);
    });

    it("employee cannot decrypt another employee's balance", async function () {
      await blindroll.connect(employer).executePayroll();

      const bobHandle = await blindroll.connect(bob).getMyEncryptedBalance();

      // Alice should NOT be able to decrypt Bob's balance
      await expect(
        decryptSalary(contractAddress, alice, bobHandle)
      ).to.be.rejected;
    });

    it("treasury decreases by the correct amount after payroll", async function () {
      await blindroll.connect(employer).executePayroll();

      const treasuryHandle = await blindroll.connect(employer).getEncryptedTreasuryBalance();
      const remaining = await decryptSalary(contractAddress, employer, treasuryHandle);

      const expectedTotal = SALARY_ALICE + SALARY_BOB + SALARY_CAROL;
      expect(remaining).to.equal(TREASURY_DEPOSIT_UNITS - expectedTotal);
    });

    it("deactivated employees are skipped during payroll", async function () {
      await blindroll.connect(employer).deactivateEmployee(bob.address);
      await blindroll.connect(employer).executePayroll();

      // Bob should have no balance — he was inactive
      await expect(
        blindroll.connect(bob).getMyEncryptedBalance()
      ).to.be.revertedWith("No balance yet");

      // Alice and Carol should be paid normally
      const aliceHandle = await blindroll.connect(alice).getMyEncryptedBalance();
      expect(await decryptSalary(contractAddress, alice, aliceHandle)).to.equal(SALARY_ALICE);
    });

    it("payroll emits correct count when some employees are inactive", async function () {
      await blindroll.connect(employer).deactivateEmployee(bob.address);

      await expect(blindroll.connect(employer).executePayroll())
        .to.emit(blindroll, "PayrollExecuted")
        .withArgs(await getBlockTimestamp(), 2n); // only Alice + Carol
    });

    it("reactivated employee receives pay on next cycle", async function () {
      await blindroll.connect(employer).deactivateEmployee(bob.address);
      await blindroll.connect(employer).executePayroll(); // Bob skipped

      await blindroll.connect(employer).reactivateEmployee(bob.address);
      await blindroll.connect(employer).executePayroll(); // Bob included

      const bobHandle = await blindroll.connect(bob).getMyEncryptedBalance();
      const bobBalance = await decryptSalary(contractAddress, bob, bobHandle);
      expect(bobBalance).to.equal(SALARY_BOB); // paid once only
    });

    it("error code is NO_ERROR for all paid employees after successful payroll", async function () {
      await blindroll.connect(employer).executePayroll();

      const [aliceErrHandle] = await blindroll.getLastError(alice.address);
      const [bobErrHandle]   = await blindroll.getLastError(bob.address);

      const aliceErr = await decryptErrorCode(contractAddress, alice, aliceErrHandle);
      const bobErr   = await decryptErrorCode(contractAddress, bob,   bobErrHandle);

      expect(aliceErr).to.equal(ERROR_NONE);
      expect(bobErr).to.equal(ERROR_NONE);
    });

    it("reverts if treasury has not been funded", async function () {
      // Deploy a fresh contract with no treasury
      const FreshFactory = await ethers.getContractFactory("Blindroll", employer);
      const fresh = await FreshFactory.deploy() as Blindroll;
      await fresh.waitForDeployment();

      await expect(
        fresh.connect(employer).executePayroll()
      ).to.be.revertedWith("Treasury not funded");
    });

    it("non-employer cannot execute payroll", async function () {
      await expect(
        blindroll.connect(stranger).executePayroll()
      ).to.be.revertedWithCustomError(blindroll, "NotEmployer");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SAFE PAYROLL: INSUFFICIENT TREASURY
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Safe Payroll — Insufficient Treasury (FHE.select pattern)", function () {
    it("does not revert when treasury cannot cover all salaries — uses FHE.select", async function () {
      // Add one employee with a salary LARGER than the treasury deposit
      const hugeSalary = 999_999_999_999n; // way more than the treasury
      const { handle, proof } = await encryptSalary(contractAddress, employer, hugeSalary);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);
      await blindroll.connect(employer).setPlainSalaryMirror(alice.address, SALARY_ALICE_ETH);

      // Fund treasury with a small amount (less than Alice's salary)
      const smallDeposit = 100_000_000n; // much less than hugeSalary
      const treasuryInput = await encryptSalary(contractAddress, employer, smallDeposit);
      await blindroll.connect(employer).depositToTreasury(
        treasuryInput.handle,
        treasuryInput.proof,
        { value: ethers.parseEther("0.1") }
      );

      // This must NOT revert — FHE.select() silently zeroes the payment
      await expect(
        blindroll.connect(employer).executePayroll()
      ).to.not.be.reverted;
    });

    it("employee balance remains zero (uninitialized) when treasury was insufficient", async function () {
      const hugeSalary = 999_999_999_999n;
      const { handle, proof } = await encryptSalary(contractAddress, employer, hugeSalary);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);
      await blindroll.connect(employer).setPlainSalaryMirror(alice.address, SALARY_ALICE_ETH);

      const smallDeposit = 100_000_000n;
      const treasuryInput = await encryptSalary(contractAddress, employer, smallDeposit);
      await blindroll.connect(employer).depositToTreasury(
        treasuryInput.handle,
        treasuryInput.proof,
        { value: ethers.parseEther("0.1") }
      );

      await blindroll.connect(employer).executePayroll();

      // Alice should have no accumulated balance — payment was zero
      const balanceHandle = await blindroll.connect(alice).getMyEncryptedBalance()
      const balance = await fhevm.userDecryptEuint(FhevmType.euint64, balanceHandle, contractAddress, alice)
      expect(balance).to.equal(0)
      // await expect(
      //   blindroll.connect(alice).getMyEncryptedBalance()
      // ).to.be.revertedWith("No balance yet");
    });

    it("error code is ERR_INSUFFICIENT_TREASURY when payment was skipped", async function () {
      const hugeSalary = 999_999_999_999n;
      const { handle, proof } = await encryptSalary(contractAddress, employer, hugeSalary);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);

      const smallDeposit = 100_000_000n;
      const treasuryInput = await encryptSalary(contractAddress, employer, smallDeposit);
      await blindroll.connect(employer).depositToTreasury(
        treasuryInput.handle,
        treasuryInput.proof,
        { value: ethers.parseEther("0.1") }
      );

      await blindroll.connect(employer).executePayroll();

      const [errHandle] = await blindroll.getLastError(alice.address);
      const errCode = await decryptErrorCode(contractAddress, alice, errHandle);
      expect(errCode).to.equal(ERROR_INSUFFICIENT_TREASURY);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. WITHDRAW
  // ═══════════════════════════════════════════════════════════════════════════

  describe("withdraw", function () {
    beforeEach(async function () {
      // Full setup: add Alice, fund treasury, run payroll
      const aliceInput = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, aliceInput.handle, aliceInput.proof);
      await blindroll.connect(employer).setPlainSalaryMirror(alice.address, SALARY_ALICE_ETH);

      const treasuryInput = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);
      await blindroll.connect(employer).depositToTreasury(
        treasuryInput.handle,
        treasuryInput.proof,
        { value: TREASURY_DEPOSIT_ETH }
      );

      await blindroll.connect(employer).executePayroll();
    });

    it("employee can withdraw their accumulated ETH balance", async function () {
      const aliceBalanceBefore = await ethers.provider.getBalance(alice.address);

      const tx = await blindroll.connect(alice).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const aliceBalanceAfter = await ethers.provider.getBalance(alice.address);

      // Alice's balance should increase by SALARY_ALICE_ETH minus gas
      expect(aliceBalanceAfter).to.equal(
        aliceBalanceBefore + SALARY_ALICE_ETH - gasUsed
      );
    });

    it("emits Withdrawal event with correct parameters", async function () {
      await expect(blindroll.connect(alice).withdraw())
        .to.emit(blindroll, "Withdrawal")
        .withArgs(alice.address, SALARY_ALICE_ETH, await getBlockTimestamp());
    });

    it("encrypted balance is zeroed after withdrawal", async function () {
      await blindroll.connect(alice).withdraw();

      // After withdrawal, encrypted balance should be zero
      const balanceHandle = await blindroll.connect(alice).getMyEncryptedBalance();
      const decrypted = await decryptSalary(contractAddress, alice, balanceHandle);
      expect(decrypted).to.equal(0n);
    });

    it("contract ETH balance decreases correctly after withdrawal", async function () {
      const contractBalanceBefore = await ethers.provider.getBalance(contractAddress);

      await blindroll.connect(alice).withdraw();

      const contractBalanceAfter = await ethers.provider.getBalance(contractAddress);
      expect(contractBalanceAfter).to.equal(contractBalanceBefore - SALARY_ALICE_ETH);
    });

    it("employee cannot double-withdraw — second withdrawal is zero", async function () {
      await blindroll.connect(alice).withdraw(); // first withdrawal succeeds

      // Second withdrawal should not send any ETH
      const balanceBefore = await ethers.provider.getBalance(alice.address);
      const tx = await blindroll.connect(alice).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(alice.address);

      // Balance decreases only by gas (no ETH received)
      expect(balanceAfter).to.equal(balanceBefore - gasUsed);
    });

    it("error code is ERR_ZERO_BALANCE on withdrawal with no balance", async function () {
      await blindroll.connect(alice).withdraw(); // clears balance

      await blindroll.connect(alice).withdraw(); // zero balance withdrawal

      const [errHandle] = await blindroll.getLastError(alice.address);
      const errCode = await decryptErrorCode(contractAddress, alice, errHandle);
      expect(errCode).to.equal(ERROR_ZERO_BALANCE);
    });

    it("multiple employees can withdraw independently", async function () {
      const bobInput = await encryptSalary(contractAddress, employer, SALARY_BOB);
      await blindroll.connect(employer).addEmployee(bob.address, bobInput.handle, bobInput.proof);
      await blindroll.connect(employer).setPlainSalaryMirror(bob.address, SALARY_BOB_ETH);

      // Run another payroll to also credit Bob
      await blindroll.connect(employer).executePayroll();

      const aliceBefore = await ethers.provider.getBalance(alice.address);
      const bobBefore   = await ethers.provider.getBalance(bob.address);

      const aliceTx = await blindroll.connect(alice).withdraw();
      const aliceReceipt = await aliceTx.wait();
      const aliceGas = aliceReceipt!.gasUsed * aliceReceipt!.gasPrice;

      const bobTx = await blindroll.connect(bob).withdraw();
      const bobReceipt = await bobTx.wait();
      const bobGas = bobReceipt!.gasUsed * bobReceipt!.gasPrice;

      const aliceAfter = await ethers.provider.getBalance(alice.address);
      const bobAfter   = await ethers.provider.getBalance(bob.address);

      // Alice gets 2x salary (2 payroll cycles — setup + extra)
      expect(aliceAfter).to.equal(aliceBefore + SALARY_ALICE_ETH * 2n - aliceGas);
      // Bob gets 1x salary (only credited in the second payroll)
      expect(bobAfter).to.equal(bobBefore + SALARY_BOB_ETH - bobGas);
    });

    it("non-employee cannot call withdraw", async function () {
      await expect(
        blindroll.connect(stranger).withdraw()
      ).to.be.revertedWithCustomError(blindroll, "NotEmployee");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. ACCESS CONTROL
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Access Control", function () {
    it("non-employee cannot call getMyEncryptedSalary", async function () {
      await expect(
        blindroll.connect(stranger).getMyEncryptedSalary()
      ).to.be.revertedWithCustomError(blindroll, "NotEmployee");
    });

    it("non-employee cannot call getMyEncryptedBalance", async function () {
      await expect(
        blindroll.connect(stranger).getMyEncryptedBalance()
      ).to.be.revertedWithCustomError(blindroll, "NotEmployee");
    });

    it("non-employer cannot call getEncryptedTreasuryBalance", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);
      await blindroll.connect(employer).depositToTreasury(handle, proof, {
        value: TREASURY_DEPOSIT_ETH,
      });

      await expect(
        blindroll.connect(alice).getEncryptedTreasuryBalance()
      ).to.be.revertedWithCustomError(blindroll, "NotEmployer");
    });

    it("employer cannot call getMyEncryptedSalary (not an employee)", async function () {
      await expect(
        blindroll.connect(employer).getMyEncryptedSalary()
      ).to.be.revertedWithCustomError(blindroll, "NotEmployee");
    });

    it("non-employer cannot call setPlainSalaryMirror", async function () {
      const aliceInput = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, aliceInput.handle, aliceInput.proof);

      await expect(
        blindroll.connect(stranger).setPlainSalaryMirror(alice.address, SALARY_ALICE_ETH)
      ).to.be.revertedWithCustomError(blindroll, "NotEmployer");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. PLAINTEXT SALARY MIRROR
  // ═══════════════════════════════════════════════════════════════════════════

  describe("setPlainSalaryMirror", function () {
    beforeEach(async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);
    });

    it("employer can set the plaintext salary mirror", async function () {
      // No revert = success (no public getter, verified via withdrawal behavior)
      await expect(
        blindroll.connect(employer).setPlainSalaryMirror(alice.address, SALARY_ALICE_ETH)
      ).to.not.be.reverted;
    });

    it("mirror can be updated (salary raise scenario)", async function () {
      await blindroll.connect(employer).setPlainSalaryMirror(alice.address, SALARY_ALICE_ETH);

      const newMirror = ethers.parseEther("1.5"); // raise
      await expect(
        blindroll.connect(employer).setPlainSalaryMirror(alice.address, newMirror)
      ).to.not.be.reverted;
    });

    it("reverts if employee does not exist", async function () {
      await expect(
        blindroll.connect(employer).setPlainSalaryMirror(stranger.address, SALARY_ALICE_ETH)
      ).to.be.revertedWithCustomError(blindroll, "EmployeeNotFound");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. ERROR CODES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Encrypted Error Codes", function () {
    it("getLastError returns a valid handle and timestamp after payroll", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);
      await blindroll.connect(employer).setPlainSalaryMirror(alice.address, SALARY_ALICE_ETH);

      const treasuryInput = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);
      await blindroll.connect(employer).depositToTreasury(
        treasuryInput.handle,
        treasuryInput.proof,
        { value: TREASURY_DEPOSIT_ETH }
      );

      const txPayroll = await blindroll.connect(employer).executePayroll();
      const receipt = await txPayroll.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const [errHandle, errTimestamp] = await blindroll.getLastError(alice.address);

      expect(errHandle).to.not.equal(ethers.ZeroHash);
      expect(errTimestamp).to.equal(block!.timestamp);
    });

    it("ErrorChanged event is emitted for each employee during payroll", async function () {
      const aliceInput = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      const bobInput   = await encryptSalary(contractAddress, employer, SALARY_BOB);

      await blindroll.connect(employer).addEmployee(alice.address, aliceInput.handle, aliceInput.proof);
      await blindroll.connect(employer).addEmployee(bob.address,   bobInput.handle,   bobInput.proof);

      await blindroll.connect(employer).setPlainSalaryMirror(alice.address, SALARY_ALICE_ETH);
      await blindroll.connect(employer).setPlainSalaryMirror(bob.address, SALARY_BOB_ETH);

      const treasuryInput = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);
      await blindroll.connect(employer).depositToTreasury(
        treasuryInput.handle,
        treasuryInput.proof,
        { value: TREASURY_DEPOSIT_ETH }
      );

      await expect(blindroll.connect(employer).executePayroll())
        .to.emit(blindroll, "ErrorChanged").withArgs(alice.address)
        .and.to.emit(blindroll, "ErrorChanged").withArgs(bob.address);
    });

    it("employee can decrypt their own error code but not another's", async function () {
      const aliceInput = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      const bobInput   = await encryptSalary(contractAddress, employer, SALARY_BOB);

      await blindroll.connect(employer).addEmployee(alice.address, aliceInput.handle, aliceInput.proof);
      await blindroll.connect(employer).addEmployee(bob.address,   bobInput.handle,   bobInput.proof);
      await blindroll.connect(employer).setPlainSalaryMirror(alice.address, SALARY_ALICE_ETH);
      await blindroll.connect(employer).setPlainSalaryMirror(bob.address, SALARY_BOB_ETH);

      const treasuryInput = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);
      await blindroll.connect(employer).depositToTreasury(
        treasuryInput.handle,
        treasuryInput.proof,
        { value: TREASURY_DEPOSIT_ETH }
      );

      await blindroll.connect(employer).executePayroll();

      // Alice can decrypt her own error
      const [aliceErrHandle] = await blindroll.getLastError(alice.address);
      await expect(decryptErrorCode(contractAddress, alice, aliceErrHandle)).to.not.be.rejected;

      // Alice CANNOT decrypt Bob's error (ACL enforced)
      const [bobErrHandle] = await blindroll.getLastError(bob.address);
      await expect(decryptErrorCode(contractAddress, alice, bobErrHandle)).to.be.rejected;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. EDGE CASES & BOUNDARY CONDITIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Edge Cases", function () {
    it("getMyEncryptedBalance reverts before first payroll", async function () {
      const { handle, proof } = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, handle, proof);

      await expect(
        blindroll.connect(alice).getMyEncryptedBalance()
      ).to.be.revertedWith("No balance yet");
    });

    it("payroll with zero employees emits event with 0 processed", async function () {
      const treasuryInput = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);
      await blindroll.connect(employer).depositToTreasury(
        treasuryInput.handle,
        treasuryInput.proof,
        { value: TREASURY_DEPOSIT_ETH }
      );

      await expect(blindroll.connect(employer).executePayroll())
        .to.emit(blindroll, "PayrollExecuted")
        .withArgs(await getBlockTimestamp(), 0n);
    });

    it("payroll with all employees deactivated emits event with 0 processed", async function () {
      const aliceInput = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      await blindroll.connect(employer).addEmployee(alice.address, aliceInput.handle, aliceInput.proof);
      await blindroll.connect(employer).deactivateEmployee(alice.address);

      const treasuryInput = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);
      await blindroll.connect(employer).depositToTreasury(
        treasuryInput.handle,
        treasuryInput.proof,
        { value: TREASURY_DEPOSIT_ETH }
      );

      await expect(blindroll.connect(employer).executePayroll())
        .to.emit(blindroll, "PayrollExecuted")
        .withArgs(await getBlockTimestamp(), 0n);
    });

    it("receive() accepts plain ETH and updates plain treasury balance", async function () {
      // Send ETH directly to the contract
      const tx = await employer.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther("1.0"),
      });
      await tx.wait();

      const contractBalance = await ethers.provider.getBalance(contractAddress);
      expect(contractBalance).to.equal(ethers.parseEther("1.0"));
    });

    it("MAX_EMPLOYEES constant is 100", async function () {
      expect(await blindroll.MAX_EMPLOYEES()).to.equal(100n);
    });

    it("salary of maximum euint64 value can be set without overflow issues", async function () {
      // euint64 max = 2^64 - 1 = 18446744073709551615
      // Note: in mock mode this tests the type boundary; on Sepolia it tests real FHE
      const maxUint64 = 18_446_744_073_709_551_615n;

      // This should encrypt and store without error
      const { handle, proof } = await encryptSalary(contractAddress, employer, maxUint64);
      await expect(
        blindroll.connect(employer).addEmployee(alice.address, handle, proof)
      ).to.not.be.reverted;

      const salaryHandle = await blindroll.connect(alice).getMyEncryptedSalary();
      const decrypted = await decryptSalary(contractAddress, alice, salaryHandle);
      expect(decrypted).to.equal(maxUint64);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. FULL END-TO-END SCENARIO
  // ═══════════════════════════════════════════════════════════════════════════

  describe("End-to-End: Full Payroll Lifecycle", function () {
    it("complete lifecycle: onboard → fund → payroll → update salary → payroll → withdraw", async function () {
      // ── Step 1: Onboard two employees ─────────────────────────────────────
      const aliceInput = await encryptSalary(contractAddress, employer, SALARY_ALICE);
      const bobInput   = await encryptSalary(contractAddress, employer, SALARY_BOB);

      await blindroll.connect(employer).addEmployee(alice.address, aliceInput.handle, aliceInput.proof);
      await blindroll.connect(employer).addEmployee(bob.address,   bobInput.handle,   bobInput.proof);

      await blindroll.connect(employer).setPlainSalaryMirror(alice.address, SALARY_ALICE_ETH);
      await blindroll.connect(employer).setPlainSalaryMirror(bob.address,   SALARY_BOB_ETH);

      expect(await blindroll.getEmployeeCount()).to.equal(2n);

      // ── Step 2: Fund treasury ──────────────────────────────────────────────
      const treasuryInput = await encryptSalary(contractAddress, employer, TREASURY_DEPOSIT_UNITS);
      await blindroll.connect(employer).depositToTreasury(
        treasuryInput.handle,
        treasuryInput.proof,
        { value: TREASURY_DEPOSIT_ETH }
      );

      // ── Step 3: First payroll cycle ───────────────────────────────────────
      await expect(blindroll.connect(employer).executePayroll())
        .to.emit(blindroll, "PayrollExecuted")
        .withArgs(await getBlockTimestamp(), 2n);

      let aliceHandle = await blindroll.connect(alice).getMyEncryptedBalance();
      let aliceBalance = await decryptSalary(contractAddress, alice, aliceHandle);
      expect(aliceBalance).to.equal(SALARY_ALICE);

      // ── Step 4: Give Alice a raise ────────────────────────────────────────
      const newAliceSalary = 6_500_000_000n; // $6,500
      const newAliceETH    = ethers.parseEther("1.3");
      const aliceRaiseInput = await encryptSalary(contractAddress, employer, newAliceSalary);

      await blindroll.connect(employer).updateSalary(
        alice.address,
        aliceRaiseInput.handle,
        aliceRaiseInput.proof
      );
      await blindroll.connect(employer).setPlainSalaryMirror(alice.address, newAliceETH);

      // ── Step 5: Second payroll cycle (Alice earns more now) ───────────────
      await blindroll.connect(employer).executePayroll();

      aliceHandle = await blindroll.connect(alice).getMyEncryptedBalance();
      aliceBalance = await decryptSalary(contractAddress, alice, aliceHandle);
      // Cycle 1: SALARY_ALICE, Cycle 2: newAliceSalary
      expect(aliceBalance).to.equal(SALARY_ALICE + newAliceSalary);

      // ── Step 6: Alice withdraws ───────────────────────────────────────────
      const aliceEthBefore = await ethers.provider.getBalance(alice.address);
      const withdrawTx = await blindroll.connect(alice).withdraw();
      const withdrawReceipt = await withdrawTx.wait();
      const gasUsed = withdrawReceipt!.gasUsed * withdrawReceipt!.gasPrice;
      const aliceEthAfter = await ethers.provider.getBalance(alice.address);

      // Alice receives ETH for both payroll cycles
      const expectedAliceEth = SALARY_ALICE_ETH + newAliceETH;
      expect(aliceEthAfter).to.equal(aliceEthBefore + expectedAliceEth - gasUsed);

      // ── Step 7: Verify privacy — Bob cannot see Alice's salary ────────────
      const aliceSalaryHandle = await blindroll.connect(alice).getMyEncryptedSalary();
      await expect(
        decryptSalary(contractAddress, bob, aliceSalaryHandle)
      ).to.be.rejected;

      // ── Step 8: Treasury reflects total disbursements ─────────────────────
      const treasuryHandle = await blindroll.connect(employer).getEncryptedTreasuryBalance();
      const remaining = await decryptSalary(contractAddress, employer, treasuryHandle);

      const totalPaid = SALARY_ALICE + SALARY_BOB + newAliceSalary + SALARY_BOB;
      expect(remaining).to.equal(TREASURY_DEPOSIT_UNITS - totalPaid);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the timestamp of the next block that will be mined.
 * Used for expect().withArgs() on events that include block.timestamp.
 *
 * NOTE: This is approximate — it matches when used immediately before the
 * transaction in the same test. On Sepolia, skip timestamp assertions
 * or use a range check instead.
 */
async function getBlockTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block!.timestamp + 1; // +1 because the tx mines the next block
}