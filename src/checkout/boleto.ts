function modulo10(value: string): number {
  let sum = 0
  let weight = 2
  for (let index = value.length - 1; index >= 0; index--) {
    const product = Number(value[index]) * weight
    sum += Math.floor(product / 10) + (product % 10)
    weight = weight === 2 ? 1 : 2
  }
  return (10 - (sum % 10)) % 10
}

function barcodeDigit(value: string): number {
  let sum = 0
  let weight = 2
  for (let index = value.length - 1; index >= 0; index--) {
    if (index === 4) continue
    sum += Number(value[index]) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  const digit = 11 - (sum % 11)
  return digit >= 10 ? 1 : digit
}

/** Converts a bank boleto's linha digitável to its 44-digit ITF payload. */
export function boletoBarcode(value: string): string | null {
  if (!/^[\d.\s-]+$/.test(value)) return null
  const digits = value.replace(/\D/g, '')
  let barcode: string

  if (digits.length === 47) {
    if (
      modulo10(digits.slice(0, 9)) !== Number(digits[9]) ||
      modulo10(digits.slice(10, 20)) !== Number(digits[20]) ||
      modulo10(digits.slice(21, 31)) !== Number(digits[31])
    ) return null

    barcode = digits.slice(0, 4) + digits[32] + digits.slice(33) +
      digits.slice(4, 9) + digits.slice(10, 20) + digits.slice(21, 31)
  } else if (digits.length === 44) {
    barcode = digits
  } else {
    return null
  }

  if (barcode[3] !== '9' || barcodeDigit(barcode) !== Number(barcode[4])) return null
  return barcode
}
