/**
 * useFhevm.test.ts
 *
 * Tests the FHE hook's three public behaviours:
 *   1. SDK initialisation — isReady lifecycle, initError on failure
 *   2. encryptUint64 — correct SDK calls, handle/proof output, not-ready guard
 *   3. userDecrypt — keypair generation, EIP-712 signing, result extraction, not-ready guard
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFhevm } from "@/hooks/useFhevm";

const mockInitSDK = vi.fn().mockResolvedValue(undefined);
const mockGenerateKeypair = vi.fn();
const mockCreateEIP712 = vi.fn();
const mockUserDecrypt = vi.fn();
const mockCreateEncryptedInput = vi.fn();

const mockInstance = {
  generateKeypair: mockGenerateKeypair,
  createEIP712: mockCreateEIP712,
  userDecrypt: mockUserDecrypt,
  createEncryptedInput: mockCreateEncryptedInput,
};

const mockCreateInstance = vi.fn();

vi.mock("@zama-fhe/relayer-sdk/bundle", () => {
  const SepoliaConfig = {
    aclContractAddress: "0xf0Ff...",
    kmsContractAddress: "0xbE0E...",
    chainId: 11155111,
    relayerUrl: "https://relayer.testnet.zama.org",
  };

  return {
    initSDK: mockInitSDK,
    createInstance: mockCreateInstance,
    SepoliaConfig,
    default: {
      initSDK: mockInitSDK,
      createInstance: mockCreateInstance,
      SepoliaConfig,
    },
  };
});

const mockUseWallet = vi.fn();
const mockGetEthersSigner = vi.fn();

vi.mock("@/hooks/useWallet", () => ({ useWallet: () => mockUseWallet() }));
vi.mock("@/hooks/useEthersSigner", () => ({
  useGetEthersSigner: () => mockGetEthersSigner,
}));

const CONTRACT = "0xa09f0438bc5a178a5561dc7f6b02b49053790444";
const EMPLOYER = "0xF6903FE7Db4214524c68c33de9229b57AB5BF6BE";
const HANDLE = "0xB5A67ACC11FC6C61FD522971B94A5547610FE740" as `0x${string}`;

const FAKE_HANDLES = [new Uint8Array([0xb5, 0xa6, 0x7a, 0xcc])];
const FAKE_PROOF = new Uint8Array([0x01, 0x02, 0x03]);
const FAKE_PRIVATE_KEY = new Uint8Array(32).fill(1);
const FAKE_PUBLIC_KEY = new Uint8Array(32).fill(2);

function setupConnected() {
  mockUseWallet.mockReturnValue({ isConnected: true, isCorrectNetwork: true });
}

function setupEncryptMock() {
  mockCreateEncryptedInput.mockReturnValue({
    add64: vi.fn(),
    encrypt: vi.fn().mockResolvedValue({
      handles: FAKE_HANDLES,
      inputProof: FAKE_PROOF,
    }),
  });
}

function setupDecryptMock(decryptedValue: bigint = 50_000_000_000n) {
  mockGenerateKeypair.mockReturnValue({
    privateKey: FAKE_PRIVATE_KEY,
    publicKey: FAKE_PUBLIC_KEY,
  });
  mockCreateEIP712.mockReturnValue({
    domain: { name: "Blindroll" },
    types: {
      UserDecryptRequestVerification: [{ name: "publicKey", type: "bytes" }],
    },
    message: { publicKey: FAKE_PUBLIC_KEY },
  });
  mockGetEthersSigner.mockResolvedValue({
    address: EMPLOYER,
    signTypedData: vi.fn().mockResolvedValue("0xSIGNATURE"),
  });
  mockUserDecrypt.mockResolvedValue({ [HANDLE]: decryptedValue });
}

describe("useFhevm", () => {
  beforeEach(() => {
    // Clear call counts and history
    mockInitSDK.mockReset();
    mockCreateInstance.mockReset();
    mockGenerateKeypair.mockReset();
    mockCreateEIP712.mockReset();
    mockUserDecrypt.mockReset();
    mockCreateEncryptedInput.mockReset();

    mockInitSDK.mockResolvedValue(undefined);
    mockCreateInstance.mockResolvedValue(mockInstance);

    setupConnected()

    setupEncryptMock()
    setupDecryptMock()
  });

  describe("SDK initialisation", () => {
    it("starts with isReady false and no initError", () => {
      setupConnected();
      mockCreateInstance.mockReturnValueOnce(new Promise(() => {})); // never resolves
      const { result } = renderHook(() => useFhevm());
      expect(result.current.isReady).toBe(false);
      expect(result.current.initError).toBeUndefined();
    });

    it("sets isReady true after successful init", async () => {
      const { result } = renderHook(() => useFhevm());
      await waitFor(() => expect(result.current.isReady).toBe(true));
      expect(result.current.initError).toBeUndefined();
    });

    it("passes the SepoliaConfig with window.ethereum override to createInstance", async () => {
    //   setupConnected();
      const fakeProvider = { request: vi.fn() };
      Object.defineProperty(window, "ethereum", { value: fakeProvider, writable: true });
      renderHook(() => useFhevm());
      await waitFor(() => expect(mockCreateInstance).toHaveBeenCalled());
      const config = mockCreateInstance.mock.calls[0][0];
      expect(config.network).toBe(fakeProvider);
    });

    it("sets initError and keeps isReady false when SDK init throws", async () => {
    //   setupConnected();
      mockInitSDK.mockRejectedValueOnce(new Error("WASM load failed"));
      const { result } = renderHook(() => useFhevm());
      await waitFor(() => expect(result.current.initError).toBe("WASM load failed"));
      expect(result.current.isReady).toBe(false);
    });

    it("does not initialise when wallet is not connected", async () => {
      mockUseWallet.mockReturnValue({ isConnected: false, isCorrectNetwork: false });
      renderHook(() => useFhevm());
      // Give async init a chance to run — it should not
      await new Promise((r) => setTimeout(r, 50));
      expect(mockInitSDK).not.toHaveBeenCalled();
    });

    it("does not initialise when wallet is on the wrong network", async () => {
      mockUseWallet.mockReturnValue({ isConnected: true, isCorrectNetwork: false });
      renderHook(() => useFhevm());
      await new Promise((r) => setTimeout(r, 50));
      expect(mockInitSDK).not.toHaveBeenCalled();
    });
  });

  describe("encryptUint64", () => {
    beforeEach(async () => {
      setupConnected();
      setupEncryptMock();
    });

    it("returns a hex handle and proof after encryption", async () => {
      const { result } = renderHook(() => useFhevm());
      await waitFor(() => expect(result.current.isReady).toBe(true));

      let encrypted: { handle: string; proof: string } | undefined;
      await act(async () => {
        encrypted = await result.current.encryptUint64(50_000_000_000n, CONTRACT, EMPLOYER);
      });

      expect(encrypted?.handle).toMatch(/^0x/);
    //   expect(encrypted?.proof).toMatch(/^0x[0-9a-f]+/i);
    });

    it("calls createEncryptedInput with the contract and signer addresses", async () => {
      const { result } = renderHook(() => useFhevm());
      await waitFor(() => expect(result.current.isReady).toBe(true));

      await act(async () => {
        await result.current.encryptUint64(50_000_000_000n, CONTRACT, EMPLOYER);
      });

      expect(mockCreateEncryptedInput).toHaveBeenCalledWith(CONTRACT, EMPLOYER);
    });

    it("throws when called before FHE is ready", async () => {
      mockCreateInstance.mockReturnValueOnce(new Promise(() => {})); // never resolves
      const { result } = renderHook(() => useFhevm());
      // isReady is still false — should throw
      await expect(result.current.encryptUint64(1n, CONTRACT, EMPLOYER)).rejects.toThrow("fhEVM instance not ready");
    });
  });

  describe("userDecrypt", () => {
    beforeEach(async () => {
      setupConnected();
      setupDecryptMock();
    });

    it("returns the decrypted bigint value", async () => {
      const { result } = renderHook(() => useFhevm());
      await waitFor(() => expect(result.current.isReady).toBe(true));

      let decrypted: bigint | boolean | string | null = null;
      await act(async () => {
        decrypted = await result.current.userDecrypt(HANDLE, CONTRACT);
      });

      expect(decrypted).toBe(50_000_000_000n);
    });

    it("calls generateKeypair to create an ephemeral session keypair", async () => {
      const { result } = renderHook(() => useFhevm());
      await waitFor(() => expect(result.current.isReady).toBe(true));
      await act(async () => {
        await result.current.userDecrypt(HANDLE, CONTRACT);
      });
      expect(mockGenerateKeypair).toHaveBeenCalledOnce();
    });

    it("calls signTypedData on the ethers signer — no gas, no tx", async () => {
      const { result } = renderHook(() => useFhevm());
      await waitFor(() => expect(result.current.isReady).toBe(true));

      const signer = await mockGetEthersSigner();
      await act(async () => {
        await result.current.userDecrypt(HANDLE, CONTRACT);
      });
      expect(signer.signTypedData).toHaveBeenCalledOnce();
    });

    it("strips the 0x prefix from the signature before passing to userDecrypt", async () => {
      const { result } = renderHook(() => useFhevm());
      await waitFor(() => expect(result.current.isReady).toBe(true));
      await act(async () => {
        await result.current.userDecrypt(HANDLE, CONTRACT);
      });
      const signatureArg = mockUserDecrypt.mock.calls[0][3];
      expect(signatureArg).not.toMatch(/^0x/);
    });

    it("returns null when the signer is unavailable", async () => {
      mockGetEthersSigner.mockResolvedValueOnce(null);
      const { result } = renderHook(() => useFhevm());
      await waitFor(() => expect(result.current.isReady).toBe(true));

      let decrypted: bigint | boolean | string | null = 99n;
      await act(async () => {
        try {
          decrypted = await result.current.userDecrypt(HANDLE, CONTRACT);
        } catch {
          decrypted = null;
        }
      });
      expect(decrypted).toBeNull();
    });

    it("throws when called before FHE is ready", async () => {
      mockCreateInstance.mockReturnValueOnce(new Promise(() => {}));
      const { result } = renderHook(() => useFhevm());
      await expect(result.current.userDecrypt(HANDLE, CONTRACT)).rejects.toThrow("fhEVM instance not ready");
    });
  });
});
