/**
 * useWallet.test.ts
 *
 * Tests the derived values useWallet computes on top of wagmi primitives:
 *   - isCorrectNetwork (must be Sepolia chainId 11155111)
 *   - shortAddress formatting
 *   - pass-through of connection state
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWallet } from "@/hooks/useWallet";

// const mockUseAccount = vi.fn();
const mockUseDisconnect = vi.fn();
const mockUseChainId = vi.fn();
const mockUseConnection = vi.fn();

vi.mock("wagmi", () => ({
  useDisconnect: () => mockUseDisconnect(),
  useChainId: () => mockUseChainId(),
  useConnection: () => mockUseConnection(),
}));

vi.mock("@reown/appkit/networks", () => ({
  sepolia: { id: 11155111 },
}));

const WALLET = "0xF6903FE7Db4214524c68c33de9229b57AB5BF6BE" as `0x${string}`;
const disconnectMock = vi.fn();

function setupMocks({
  address = undefined as `0x${string}` | undefined,
  isConnected = false,
  isConnecting = false,
  isDisconnected = true,
  chainId = 1,
} = {}) {
  mockUseConnection.mockReturnValue({ address, isConnected, isConnecting, isDisconnected });
  mockUseDisconnect.mockReturnValue({ mutateAsync: disconnectMock });
  mockUseChainId.mockReturnValue(chainId);
  //   mockUseConnection.mockReturnValue({status: isConnected ? "connected" : "disconnected"})
}

describe("useWallet", () => {
  describe("connection state pass-through", () => {
    it("returns isDisconnected true when no wallet is connected", () => {
      setupMocks({ isDisconnected: true, isConnected: false });
      const { result } = renderHook(() => useWallet());
      expect(result.current.isDisconnected).toBe(true);
      expect(result.current.isConnected).toBe(false);
    });

    it("returns isConnected true when a wallet is connected", () => {
      setupMocks({ address: WALLET, isConnected: true, isDisconnected: false });
      const { result } = renderHook(() => useWallet());
      expect(result.current.isConnected).toBe(true);
      expect(result.current.address).toBe(WALLET);
    });

    it("returns isConnecting true while the wallet is being established", () => {
      setupMocks({ isConnecting: true, isConnected: false, isDisconnected: false });
      const { result } = renderHook(() => useWallet());
      expect(result.current.isConnecting).toBe(true);
    });

    it("exposes the disconnect function", () => {
      setupMocks();
      const { result } = renderHook(() => useWallet());
      result.current.disconnectWallet();
      expect(disconnectMock).toHaveBeenCalledOnce();
    });
  });

  describe("idCorrectNetwork", () => {
    it("returns true when chainIf is Sepolia (11155111)", () => {
      setupMocks({ chainId: 11155111 });
      const { result } = renderHook(() => useWallet());
      expect(result.current.isCorrectNetwork).toBe(true);
    });

    it("returns false when chainId is Ethereum Mainnet", () => {
      setupMocks({ chainId: 1 });
      const { result } = renderHook(() => useWallet());
      expect(result.current.isCorrectNetwork).toBe(false);
    });

    it("returns false when chainId is Polygon (137)", () => {
      setupMocks({ chainId: 137 });
      const { result } = renderHook(() => useWallet());
      expect(result.current.isCorrectNetwork).toBe(false);
    });

    it("returns false when chainId is undefined", () => {
      mockUseConnection.mockReturnValue({
        address: undefined,
        isConnected: false,
        isConnecting: false,
        isDisconnected: true,
      });
      mockUseDisconnect.mockReturnValue({ disconnect: disconnectMock });
      mockUseChainId.mockReturnValue(undefined)
      const {result} = renderHook(() => useWallet())
      expect(result.current.isCorrectNetwork).toBe(false)
    });
  });

  describe("shortAddress", () => {
    it("formats a connected address as 0x1234...5678", () => {
      setupMocks({ address: WALLET, isConnected: true });
      const { result } = renderHook(() => useWallet());
      expect(result.current.shortAddress).toBe("0xF690...F6BE");
    });
 
    it("returns undefined when no wallet is connected", () => {
      setupMocks({ address: undefined, isConnected: false });
      const { result } = renderHook(() => useWallet());
      expect(result.current.shortAddress).toBeUndefined();
    });
  })
});
