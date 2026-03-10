"use client"

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useWallet } from "./useWallet"
import { BLINDROLL_ABI } from "@/abi/abi"
import { getContractAddress } from "@/lib/contractConfig"

export type ContractAddress = `0x${string}`
export type EncryptedHandle = `0x${string}`

export interface UseContractReturn {
    contractAddress: ContractAddress | undefined
    isConfigured: boolean
    isEmployer: boolean
    isEmployee: boolean
    isRoleLoading: boolean

    employerAddress: ContractAddress | undefined
    employeeCount: bigint | undefined
    employeeList: readonly ContractAddress[] | undefined

    encryptedSalaryHandle: EncryptedHandle | undefined
    encryptedBalanceHandle: EncryptedHandle | undefined
    encryptedTreasuryHandle: EncryptedHandle | undefined

    mutate: ReturnType<typeof useWriteContract>["mutate"]
    mutateAsync: ReturnType<typeof useWriteContract>["mutateAsync"]
    reset: ReturnType<typeof useWriteContract>["reset"] 

    isPending: boolean

    isConfirming: boolean

    isConfirmed: boolean
    txHash: `0x${string}` | undefined
    writeError: Error | null
}

export function useContract(): UseContractReturn {
    const {address: walletAddress} = useWallet()

    const contractAddress = getContractAddress()

    const isConfigured = !!contractAddress

    const {data: employerAddress, isLoading: IsEmployerLoading} = useReadContract({
        address: contractAddress, 
        abi: BLINDROLL_ABI, 
        functionName: "employer", 
        query: {enabled: isConfigured}
    })

    const {data: employeeCount} = useReadContract({
        address: contractAddress,
        abi: BLINDROLL_ABI,
        functionName: "getEmployeeCount",
        query: {enabled: isConfigured}
    })

    const {data: employeeList} = useReadContract({
        address: contractAddress,
        abi: BLINDROLL_ABI,
        functionName: "getEmployeeList",
        query: {enabled: isConfigured}
    })

    const {data: isActiveEmployee, isLoading: isEmployeeLoading} = useReadContract({
        address: contractAddress,
        abi: BLINDROLL_ABI,
        functionName: "getIsEmployeeActive",
        args: walletAddress ? [walletAddress] : undefined,
        query: {enabled: isConfigured && !!walletAddress}
    })

    const isEmployer = 
      !!walletAddress && 
      !!employerAddress && 
      (walletAddress as string).toLowerCase() === 
        (employerAddress as string).toLowerCase()

    const isEmployee = !!isActiveEmployee
    const isRoleLoading = IsEmployerLoading || isEmployeeLoading

    const {data: encryptedSalaryHandle} = useReadContract({
        address: contractAddress,
        abi: BLINDROLL_ABI,
        functionName: "getMyEncryptedSalary",
        account: walletAddress,
        query: {enabled: isConfigured && !!walletAddress && !isEmployeeLoading && isEmployee}
    })

    const {data: encryptedBalanceHandle} = useReadContract({
        address: contractAddress,
        abi: BLINDROLL_ABI,
        functionName: "getMyEncryptedBalance",
        account: walletAddress,
        query: {enabled: isConfigured && !!walletAddress && !isEmployeeLoading}
    })

    const {data: encryptedTreasuryHandle} = useReadContract({
        address: contractAddress,
        abi: BLINDROLL_ABI,
        functionName: "getEncryptedTreasuryBalance",
        account: walletAddress,
        query: {enabled: isConfigured && isEmployer}
    })

    const {
      mutate, 
      mutateAsync,
      reset,
      isPending, 
      error: writeError, 
      data: txHash
    } = useWriteContract()

    const {isLoading: isConfirming, isSuccess: isConfirmed} = 
      useWaitForTransactionReceipt({hash: txHash})
    
    return {
        contractAddress,
        isConfigured,
        isEmployer,
        isEmployee,
        isRoleLoading,
        employerAddress: employerAddress as ContractAddress | undefined,
        employeeCount: employeeCount as bigint | undefined,
        employeeList: employeeList as readonly ContractAddress[] | undefined,
        encryptedSalaryHandle: encryptedSalaryHandle as EncryptedHandle | undefined,
        encryptedBalanceHandle: encryptedBalanceHandle as EncryptedHandle | undefined,
        encryptedTreasuryHandle: encryptedTreasuryHandle as EncryptedHandle | undefined,
        mutate,
        mutateAsync,
        reset,
        isPending,
        isConfirming,
        isConfirmed,
        txHash,
        writeError,
    }
}

export interface UseEmployeeStatusReturn {
    isActive: boolean;
    addedAt: Date | undefined;
    isLoading: boolean;
}

export function useEmployeeStatus(employeeAddress: ContractAddress | undefined): UseEmployeeStatusReturn {
    const contractAddress = getContractAddress()

    const enabled = !!contractAddress && !!employeeAddress

    const {data: isActive, isLoading: isActiveLoading} = useReadContract({
        address: contractAddress,
        abi: BLINDROLL_ABI,
        functionName: "getIsEmployeeActive",
        args: employeeAddress ? [employeeAddress] : undefined,
        query: {enabled}
    })

    const {data: addedAtTimestamp, isLoading: isDateLoading} = useReadContract({
        address: contractAddress,
        abi: BLINDROLL_ABI,
        functionName: "getEmployeeAddedAt",
        args: employeeAddress ? [employeeAddress] : undefined,
        query: {enabled}
    })

    return {
        isActive: !!isActive,
        addedAt: addedAtTimestamp ? new Date(Number(addedAtTimestamp) * 1000): undefined,
        isLoading: isActiveLoading || isDateLoading
    }
}