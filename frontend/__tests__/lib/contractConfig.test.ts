/**
 * contractConfig.test.ts
 *
 * Tests the three-priority address resolution chain:
 *   1. ?contract= URL param
 *   2. localStorage
 *   3. NEXT_PUBLIC_CONTRACT_ADDRESS env var
 *
 * Also tests save / clear / validation helpers.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { getContractAddress, saveContractAddress, clearContractAddress, isValidAddress } from "@/lib/contractConfig";

const VALID_ADDRESS = "0x5917b72E064d3Ac2A3148100f217C3B5a3359aC1";
const VALID_ADDRESS_2 = "0xF6903FE7Db4214524c68c33de9229b57AB5BF6BE";
const INVALID_ADDRESS = "0xNOTANADDRESS";
const LS_KEY = "blindroll:contractAddress";

describe("isValidAddress", () => {
  it("accepts a valid checksummed address", () => {
    expect(isValidAddress(VALID_ADDRESS)).toBe(true);
  });

  it("accepts a lowercase address", () => {
    expect(isValidAddress(VALID_ADDRESS.toLowerCase())).toBe(true);
  });

  it("accepts an uppercase address", () => {
    expect(isValidAddress(VALID_ADDRESS.toUpperCase().replace("0X", "0x"))).toBe(true);
  });

  it("rejects an address missing the 0x prefix", () => {
    expect(isValidAddress(VALID_ADDRESS.slice(2))).toBe(false);
  });

  it("rejects an address that is too short", () => {
    expect(isValidAddress("0x1234")).toBe(false);
  });

  it("rejects an address that is too long", () => {
    expect(isValidAddress(VALID_ADDRESS + "00")).toBe(false);
  });

  it("rejects an address with non-hex characters", () => {
    expect(isValidAddress(INVALID_ADDRESS)).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidAddress("")).toBe(false);
  });
});

describe("saveContractAddress", () => {
  it("persits a valid address to localStorage in lowercase", () => {
    saveContractAddress(VALID_ADDRESS);
    expect(localStorage.getItem(LS_KEY)).toBe(VALID_ADDRESS.toLowerCase());
  });

  it("overwrites a previously saved address", () => {
    saveContractAddress(VALID_ADDRESS);
    saveContractAddress(VALID_ADDRESS_2);
    expect(localStorage.getItem(LS_KEY)).toBe(VALID_ADDRESS_2.toLowerCase());
  });
});

describe("clearContractAddress", () => {
  it("removes the sorted address", () => {
    saveContractAddress(VALID_ADDRESS);
    clearContractAddress();
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  it("does not throw when nothing is stored", () => {
    expect(() => clearContractAddress()).not.toThrow();
  });
});

describe("getContractAddress", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    Object.defineProperty(window, "location", {
      value: { search: "" },
      writable: true,
    });
  });

  it("returns undefined when no source is available", () => {
    expect(getContractAddress()).toBeUndefined()
  })

  // Priority 3 — env var
  it("falls back to the env var when localStorage and URL are empty", () => {
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = VALID_ADDRESS;
    expect(getContractAddress()).toBe(VALID_ADDRESS);
  });
 
  it("ignores the env var if it is not a valid address", () => {
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = INVALID_ADDRESS;
    expect(getContractAddress()).toBeUndefined();
  });
 
  // Priority 2 — localStorage
  it("returns the localStorage value and ignores the env var", () => {
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = VALID_ADDRESS;
    saveContractAddress(VALID_ADDRESS_2);
    // localStorage is priority 2, env is priority 3
    expect(getContractAddress()).toBe(VALID_ADDRESS_2.toLowerCase());
  });
 
  it("ignores an invalid address stored in localStorage", () => {
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = VALID_ADDRESS;
    localStorage.setItem(LS_KEY, INVALID_ADDRESS);
    expect(getContractAddress()).toBe(VALID_ADDRESS);
  });
 
  // Priority 1 — URL param
  it("prefers the URL ?contract= param over localStorage and env", () => {
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = VALID_ADDRESS;
    saveContractAddress(VALID_ADDRESS_2);
    Object.defineProperty(window, "location", {
      value: { search: `?contract=${VALID_ADDRESS}` },
      writable: true,
    });
    expect(getContractAddress()).toBe(VALID_ADDRESS);
  });
 
  it("ignores an invalid ?contract= param and falls through to localStorage", () => {
    saveContractAddress(VALID_ADDRESS_2);
    Object.defineProperty(window, "location", {
      value: { search: `?contract=${INVALID_ADDRESS}` },
      writable: true,
    });
    expect(getContractAddress()).toBe(VALID_ADDRESS_2.toLowerCase());
  });
 
  // localStorage failure
  it("gracefully falls through when localStorage throws", () => {
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = VALID_ADDRESS;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(getContractAddress()).toBe(VALID_ADDRESS);
  });
});
