export function roundDecimal(value: number, decimalPlaces: number): number {
    return Number(Math.round(Number(value+'e'+decimalPlaces))+'e-'+decimalPlaces)
}