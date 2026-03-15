/**
 * DecryptSalaryButton.test.tsx
 *
 * Tests the employer's per-row salary decrypt component:
 *   - Shows "Decrypt" button when handle is available and FHE is ready
 *   - Shows "Initializing FHE…" while SDK is loading
 *   - Shows "Loading…" while handle is being fetched from chain
 *   - Calls userDecrypt with correct handle and contract address
 *   - Displays the decrypted ETH value correctly
 *   - "Hide" button returns to encrypted state
 *   - Shows inline error with Retry on failure
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DecryptSalaryButton } from "@/components/DecryptSalaryButton";


const mockUserDecrypt = vi.fn();
const mockUseReadContract = vi.fn();
const mockGetContractAddress = vi.fn();
const mockUseWallet = vi.fn();

vi.mock("@/hooks/useWallet", () => ({
  useWallet: () => mockUseWallet(),
}));

vi.mock("wagmi", () => ({
  useReadContract: (args: any) => {
    // If query is disabled, return empty state
    if (args.query?.enabled === false) {
      return { data: undefined, isLoading: false, isError: false };
    }
    return mockUseReadContract(args);
  },
  // Adding these prevents "useConfig" errors from leaking in
  useConfig: vi.fn(),
  useAccount: vi.fn(() => ({ address: undefined, isConnected: false })),
  useDisconnect: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useConnection: vi.fn(() => ({ address: undefined, isConnected: false })),
}));

// vi.mock("wagmi", () => ({
//   useReadContract: (args: { query?: { enabled?: boolean } }) => {
//     if (args.query?.enabled === false) return { data: undefined, isLoading: false };
//     return mockUseReadContract(args);
//   },
// }));

vi.mock("@/hooks/useFhevm", () => ({
  useFhevm: () => ({
    isReady: mockFhevmReady(),
    userDecrypt: mockUserDecrypt,
  }),
}));

vi.mock("@/lib/contractConfig", () => ({
  getContractAddress: () => mockGetContractAddress(),
}));

vi.mock("@/abi/abi", () => ({ BLINDROLL_ABI: [] }));

let _fhevmReady = true;
const mockFhevmReady = () => _fhevmReady;

const EMPLOYEE = "0xCa21b5f07a126F649EBFFAE82F997334e85E00AF" as `0x${string}`;
const CONTRACT = "0x5917b72E064d3Ac2A3148100f217C3B5a3359aC1";
const HANDLE = "0xB5A67ACC11FC6C61FD522971B94A5547610FE740" as `0x${string}`;

// 0.05 ETH in wei = 50_000_000_000_000_000n
const SALARY_WEI = 50_000_000_000_000_000n;

function setupDefaults({
  handleAvailable = true,
  handleLoading = false,
  fhevmReady = true,
  isConnected = true, // Add this
} = {}) {
  _fhevmReady = fhevmReady;
  
  // Set the wallet mock return value
  mockUseWallet.mockReturnValue({ 
    isConnected, 
    address: EMPLOYEE,
    isConnecting: false,
    isDisconnected: !isConnected 
  });

  mockGetContractAddress.mockReturnValue(CONTRACT);
  mockUseReadContract.mockReturnValue({
    data: handleAvailable ? HANDLE : undefined,
    isLoading: handleLoading,
  });
  mockUserDecrypt.mockResolvedValue(SALARY_WEI);
}

function renderButton() {
  return render(<DecryptSalaryButton employeeAddress={EMPLOYEE} />);
}

describe("DecryptSalaryButton", () => {

  beforeEach(() => { setupDefaults(); });

  describe("loading states", () => {
    it("shows Loading… while the handle is being fetched from chain", () => {
      setupDefaults({ handleLoading: true, handleAvailable: false });
      renderButton();
      expect(screen.getByText("Loading…")).toBeInTheDocument();
    });

    it("shows the Decrypt button when handle is available and FHE is ready", () => {
      renderButton();
      expect(screen.getByRole("button", { name: /decrypt/i })).toBeInTheDocument();
    });

    it("disables the button and shows FHE init text when SDK is not ready", () => {
      setupDefaults({ fhevmReady: false });
      renderButton();
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute("title", "Initializing FHE…");
    });

    it("disables the button when no handle is available", () => {
      setupDefaults({ handleAvailable: false });
      renderButton();
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("decrypt flow", () => {
    it("calls userDecrypt with the salary handle and contract address", async () => {
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /decrypt/i }));

      await waitFor(() => expect(mockUserDecrypt).toHaveBeenCalledOnce());
      expect(mockUserDecrypt).toHaveBeenCalledWith(HANDLE, CONTRACT);
    });

    it("displays the decrypted salary formatted as ETH", async () => {
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /decrypt/i }));

      // 50_000_000_000_000_000n = 0.05 ETH
      await waitFor(() =>
        expect(screen.getByText(/0\.0500/)).toBeInTheDocument()
      );
    });

    it("shows a Hide button after successful decryption", async () => {
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /decrypt/i }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /hide/i })).toBeInTheDocument()
      );
    });

    it("clicking Hide removes the decrypted value and shows Decrypt again", async () => {
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /decrypt/i }));
      await waitFor(() => screen.getByRole("button", { name: /hide/i }));

      fireEvent.click(screen.getByRole("button", { name: /hide salary/i }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /decrypt/i })).toBeInTheDocument()
      );
      expect(screen.queryByText(/0\.0500/)).not.toBeInTheDocument();
    });

    it("shows Decrypting… spinner while decryption is in progress", async () => {
      mockUserDecrypt.mockImplementation(() => new Promise(() => {})); // never resolves
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /decrypt/i }));

      await waitFor(() =>
        expect(screen.getByText(/decrypting/i)).toBeInTheDocument()
      );
    });
  });

  describe("error handling", () => {
    it("shows an inline error message when decryption throws", async () => {
      mockUserDecrypt.mockRejectedValueOnce(new Error("ACL denied"));
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /decrypt/i }));

      await waitFor(() =>
        expect(screen.getByText("ACL denied")).toBeInTheDocument()
      );
    });

    it("shows a fallback error when the error is not an Error instance", async () => {
      mockUserDecrypt.mockRejectedValueOnce("unexpected");
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /decrypt/i }));

      await waitFor(() =>
        expect(screen.getByText("Decryption failed")).toBeInTheDocument()
      );
    });

    it("shows a Retry button in the error state", async () => {
      mockUserDecrypt.mockRejectedValueOnce(new Error("timeout"));
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /decrypt/i }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
      );
    });

    it("clicking Retry clears the error and shows the Decrypt button again", async () => {
      mockUserDecrypt.mockRejectedValueOnce(new Error("timeout"));
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /decrypt/i }));

      await waitFor(() => screen.getByRole("button", { name: /retry/i }));
      fireEvent.click(screen.getByRole("button", { name: /retry/i }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /decrypt/i })).toBeInTheDocument()
      );
      expect(screen.queryByText("timeout")).not.toBeInTheDocument();
    });

    it("shows 'Unexpected result' when userDecrypt returns a non-bigint", async () => {
      mockUserDecrypt.mockResolvedValueOnce("not-a-bigint");
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /decrypt/i }));

      await waitFor(() =>
        expect(screen.getByText("Unexpected result")).toBeInTheDocument()
      );
    });
  });

  describe("when no contract address is configured", () => {
    it("disables the button when getContractAddress returns undefined", () => {
      mockGetContractAddress.mockReturnValue(undefined);
      renderButton();
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });
});