/*

    Utils for accounts


*/

import { createHash } from 'crypto'

export function remove0xPrefix(publicKey: string): string {
    if (publicKey) {
        return publicKey.replace(/^0x/, '')
    }
    return null
}

export function toPublicKeyChecksum(publicKey: string): string {
    const publicKeyClean = remove0xPrefix(publicKey).toLowerCase()
    let result = '0x'
    const hash = createHash('SHA3-256')
    hash.update(Buffer.from(publicKeyClean, 'hex'))
    const hashData = hash.digest('hex')
    for (let index = 0; index < hashData.length && index < publicKeyClean.length; index++) {
        if (parseInt(hashData.charAt(index), 16) > 7) {
            result = result.concat(publicKeyClean.charAt(index).toUpperCase())
        } else {
            result = result.concat(publicKeyClean.charAt(index))
        }
    }
    return result
}

export function isAddress(address: string | number | BigInt): boolean {
    try {
        return BigInt(address) >= BigInt(0)
    } catch {
        return false
    }
    return false
}

export function toAddress(address: string | number | BigInt): BigInt {
    let result = address
    if (typeof address === 'string') {
        result = address.replace(/^#/, '')
    }
    return BigInt(result)
}

export function isPublicKeyChecksum(publicKey: string): boolean {
    return remove0xPrefix(publicKey) && remove0xPrefix(publicKey) == remove0xPrefix(toPublicKeyChecksum(publicKey))
}
