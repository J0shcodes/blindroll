export default function formatEth(wei: bigint): string {
    const eth = Number(wei) / 1e18
    return eth.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 6}) + " ETH"
}