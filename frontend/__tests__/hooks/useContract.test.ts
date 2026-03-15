/**
 * useContract.test.ts
 *
 * Tests the critical business logic in useContract:
 *   - isEmployer detection (case-insensitive address match)
 *   - isEmployee detection (on-chain active flag)
 *   - isConfigured gate (no reads fire without a contract address)
 *   - Encrypted handle queries only fire for the correct role
 *   - useEmployeeStatus timestamp → Date conversion
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useContract, useEmployeeStatus } from "@/hooks/useContract";

const EMPLOYER = "0xF6903FE7Db4214524c68c33de9229b57AB5BF6BE" as `0x${string}`;
const EMPLOYEE = "0xCa21b5f07a126F649EBFFAE82F997334e85E00AF" as `0x${string}`;
const CONTRACT = "0xa09f0438bc5a178a5561dc7f6b02b49053790444" as `0x${string}`;
const SALARY_HANDLE = "0xB5A67ACC11FC6C61FD522971B94A5547610FE740" as `0x${string}`;
const TREASURY_HANDLE = "0xB4FA605F124A89E64BA6A6E969B9046CFB7C4479" as `0x${string}`;

const mockReadContract = vi.fn();
const mockWriteContract = vi.fn();
const mockWaitForReceipt = vi.fn();
const mockGetContractAddress = vi.fn();
const mockUseWallet = vi.fn();

vi.mock("wagmi", () => ({
  useReadContract: (args: { functionName: string; query?: { enabled?: boolean } }) => {
    if (args.query?.enabled === false) return { data: undefined, isLoading: false };
    return mockReadContract(args.functionName);
  },
  useWriteContract: () => mockWriteContract(),
  useWaitForTransactionReceipt: () => mockWaitForReceipt(),
}));

vi.mock("@/lib/contractConfig", () => ({
  getContractAddress: () => mockGetContractAddress(),
}));

vi.mock("@/hooks/useWallet", () => ({
  useWallet: () => mockUseWallet(),
}));

vi.mock("@/abi/abi", () => ({ BLINDROLL_ABI: [] }));

function setupDefaults(options: {
  walletAddress?: `0x${string}` | undefined;
  contractAddress?: `0x${string}` | undefined;
  employerOnChain?: string;
  isActiveEmployee?: boolean;
  employeeCount?: bigint;
  employeeList?: `0x${string}`[];
} = {}) {
  // Check if the key was explicitly provided, otherwise use the default
  const walletAddress = "walletAddress" in options ? options.walletAddress : EMPLOYER;
  const contractAddress = "contractAddress" in options ? options.contractAddress : CONTRACT;
  const employerOnChain = "employerOnChain" in options ? options.employerOnChain : EMPLOYER;
  const isActiveEmployee = "isActiveEmployee" in options ? options.isActiveEmployee : false;
  const employeeCount = "employeeCount" in options ? options.employeeCount : 2n;
  const employeeList = "employeeList" in options ? options.employeeList : [EMPLOYEE];

  mockGetContractAddress.mockReset();
  mockUseWallet.mockReset();
  mockReadContract.mockReset();
  mockWriteContract.mockReset();
  mockWaitForReceipt.mockReset();

  mockGetContractAddress.mockReturnValue(contractAddress);
  mockUseWallet.mockReturnValue({ address: walletAddress });

  mockReadContract.mockImplementation((functionName: string) => {
    switch (functionName) {
      case "employer":
        return { data: employerOnChain, isLoading: false };
      case "getEmployeeCount":
        return { data: employeeCount, isLoading: false };
      case "getEmployeeList":
        return { data: employeeList, isLoading: false };
      case "getIsEmployeeActive":
        return { data: isActiveEmployee, isLoading: false };
      case "getMyEncryptedSalary":
        return { data: SALARY_HANDLE, isLoading: false };
      case "getMyEncryptedBalance":
        return { data: SALARY_HANDLE, isLoading: false };
      case "getEncryptedTreasuryBalance":
        return { data: TREASURY_HANDLE, isLoading: false };
      default:
        return { data: undefined, isLoading: false };
    }
  });

  mockWriteContract.mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
    data: undefined,
  });

  mockWaitForReceipt.mockReturnValue({ isLoading: false, isSuccess: false });
}

describe("useContract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  describe("isConfigured", () => {
    it("is true when a contract address is available", () => {
      const { result } = renderHook(() => useContract());
      expect(result.current.isConfigured).toBe(true);
      expect(result.current.contractAddress).toBe(CONTRACT);
    });

    it("is false when no contract address is available", () => {
      setupDefaults({ contractAddress: undefined });
      const { result } = renderHook(() => useContract());
      expect(result.current.isConfigured).toBe(false);
      expect(result.current.contractAddress).toBeUndefined();
    });
  });

  describe("isEmployer detection", () => {
    it("returns true when the connected wallet matches the on-chain employer", () => {
      setupDefaults({ walletAddress: EMPLOYER, employerOnChain: EMPLOYER });
      const { result } = renderHook(() => useContract());
      expect(result.current.isEmployer).toBe(true);
    });

    it("is case-insensitive — matches even if cases differ", () => {
      setupDefaults({
        walletAddress: EMPLOYER.toLowerCase() as `0x${string}`,
        employerOnChain: EMPLOYER.toUpperCase(),
      });
      const { result } = renderHook(() => useContract());
      expect(result.current.isEmployer).toBe(true);
    });

    it("returns false when the connected wallet is not the employer", () => {
      setupDefaults({ walletAddress: EMPLOYEE, employerOnChain: EMPLOYER });
      const { result } = renderHook(() => useContract());
      expect(result.current.isEmployer).toBe(false);
    });

    it("returns false when no wallet is connected", () => {
      setupDefaults({ walletAddress: undefined });
      const { result } = renderHook(() => useContract());
      expect(result.current.isEmployer).toBe(false);
    });
  });

  describe("isEmployee detection", () => {
    it("returns true when the wallet is an active employee on-chain", () => {
      setupDefaults({ walletAddress: EMPLOYEE, isActiveEmployee: true });
      const { result } = renderHook(() => useContract());
      expect(result.current.isEmployee).toBe(true);
    });

    it("returns false when the wallet is not an active employee", () => {
      setupDefaults({ walletAddress: EMPLOYEE, isActiveEmployee: false });
      const { result } = renderHook(() => useContract());
      expect(result.current.isEmployee).toBe(false);
    });
  });

  describe("employee list reads", () => {
    it("returns the employee count and list from on-chain reads", () => {
      setupDefaults({ employeeCount: 3n, employeeList: [EMPLOYEE, EMPLOYER, CONTRACT] });
      const { result } = renderHook(() => useContract());
      expect(result.current.employeeCount).toBe(3n);
      expect(result.current.employeeList).toHaveLength(3);
    });
  });

  describe("encrypted handle reads are role-gated", () => {
    it("does not return the treasury handle when the caller is not the employer", () => {
      // Employee wallet — isEmployer will be false, so the query is disabled
      setupDefaults({ walletAddress: EMPLOYEE, employerOnChain: EMPLOYER });
      const { result } = renderHook(() => useContract());
      // The query.enabled = isEmployer = false, so wagmi returns undefined
      expect(result.current.encryptedTreasuryHandle).toBeUndefined();
    });

    it("does not return salary/balance handles when the caller is not an employee", () => {
      // Employer wallet — isEmployee will be false
      setupDefaults({ walletAddress: EMPLOYER, isActiveEmployee: false });
      const { result } = renderHook(() => useContract());
      expect(result.current.encryptedSalaryHandle).toBeUndefined();
      expect(result.current.encryptedBalanceHandle).toBeUndefined();
    });
  });

  describe("write contract pass-through", () => {
    it("exposes mutate, mutateAsync, isPending, txHash, writeError", () => {
      const { result } = renderHook(() => useContract());
      expect(typeof result.current.mutate).toBe("function");
      expect(typeof result.current.mutateAsync).toBe("function");
      expect(result.current.isPending).toBe(false);
      expect(result.current.txHash).toBeUndefined();
      expect(result.current.writeError).toBeNull();
    });
  });
});

// ── useEmployeeStatus tests ───────────────────────────────────────────────────

describe("useEmployeeStatus", () => {
  beforeEach(() => {
    mockGetContractAddress.mockReturnValue(CONTRACT);
  });

  it("returns isActive true when the employee is active on-chain", () => {
    mockReadContract.mockImplementation((fn: string) =>
      fn === "getIsEmployeeActive" ? { data: true, isLoading: false } : { data: undefined, isLoading: false },
    );
    const { result } = renderHook(() => useEmployeeStatus(EMPLOYEE));
    expect(result.current.isActive).toBe(true);
  });

  it("returns isActive false when the employee is not active", () => {
    mockReadContract.mockImplementation((fn: string) =>
      fn === "getIsEmployeeActive" ? { data: false, isLoading: false } : { data: undefined, isLoading: false },
    );
    const { result } = renderHook(() => useEmployeeStatus(EMPLOYEE));
    expect(result.current.isActive).toBe(false);
  });

  it("converts a Unix timestamp to a JS Date correctly", () => {
    const unixTs = 1773149124n; // matches the test transaction timestamp
    mockReadContract.mockImplementation((fn: string) => {
      if (fn === "getIsEmployeeActive") return { data: true, isLoading: false };
      if (fn === "getEmployeeAddedAt") return { data: unixTs, isLoading: false };
      return { data: undefined, isLoading: false };
    });
    const { result } = renderHook(() => useEmployeeStatus(EMPLOYEE));
    expect(result.current.addedAt).toBeInstanceOf(Date);
    expect(result.current.addedAt?.getTime()).toBe(Number(unixTs) * 1000);
  });

  it("returns addedAt undefined when no timestamp is available", () => {
    mockReadContract.mockReturnValue({ data: undefined, isLoading: false });
    const { result } = renderHook(() => useEmployeeStatus(EMPLOYEE));
    expect(result.current.addedAt).toBeUndefined();
  });

  it("does not fire reads when employeeAddress is undefined", () => {
    const { result } = renderHook(() => useEmployeeStatus(undefined));
    // enabled = false when address is undefined — reads return nothing
    expect(result.current.isActive).toBe(false);
    expect(result.current.addedAt).toBeUndefined();
  });

  it("aggregates isLoading correctly — true if either read is loading", () => {
    mockReadContract.mockImplementation((fn: string) => {
      if (fn === "getIsEmployeeActive") return { data: undefined, isLoading: true };
      return { data: undefined, isLoading: false };
    });
    const { result } = renderHook(() => useEmployeeStatus(EMPLOYEE));
    expect(result.current.isLoading).toBe(true);
  });
});
