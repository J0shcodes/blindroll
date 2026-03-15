import "@testing-library/jest-dom"
import {cleanup} from "@testing-library/react"
import {afterAll, afterEach, vi, beforeAll} from "vitest"

afterEach(() => {
    cleanup();
    vi.clearAllMocks()
    localStorage.clear()
})

const originalError = console.error
beforeAll(() => {
    console.error = (...args: unknown[]) => {
        if (
            typeof args[0] === "string" && args[0].includes("Warning: An update to")
        ) return
        originalError(...args)
    }
})
afterAll(() => {
    console.error = originalError
})