/**
 *
 * Utils module to provide utility helpers for accounts and public key values
 *
 */

import { createHash } from 'crypto'
import { Account } from './Account'

/**
 * Return true if the number or string is an address value. This does not check the network for a valid
 * address, but just checks to see if it is a number
 *
 * @param address Value to check to see if it can be a valid address
 *
 * @returns Boolean True if the address field is valid, else false
 *
 */
export function isAddress(address: string | number | BigInt): boolean {
    try {
        return BigInt(address) >= BigInt(0)
    } catch {
        return false
    }
    return false
}

/**
 * Convert an Account object, string, number BigInt values to an address number
 *
 * @param address The Account object or number to convert to a single address value
 *
 * @returns Returns a single BigInt value of the address
 *
 */
export function toAddress(address: Account | string | number | BigInt): BigInt {
    let result = address
    if (Object.prototype.toString.call(address) === '[object BigInt]') {
        result = BigInt(address)
    } else if (typeof address === 'string') {
        result = BigInt(address.replace(/^#/, ''))
    } else if (typeof address === 'object' && address.constructor.name === 'Account') {
        result = (<Account>address).address
    } else {
        result = BigInt(address)
    }

    return result
}

/**
 * Preappends a '0x' value to the front of key value.
 *
 * @param value Value to preappend.
 *
 * @returns Return the string with a '0x' at the front.
 *
 */
export function prefix0x(value: string): string {
    if (value) {
        return '0x' + remove0xPrefix(value)
    }
    return null
}

/**
 * Removes any leading '0x' value.
 *
 * @param value Value to remove the leading '0x'
 *
 * @returns Return the value with the missing '0x'
 *
 */
export function remove0xPrefix(value: string): string {
    if (value) {
        return value.replace(/^0x/i, '')
    }
    return null
}

/**
 * Converts a public key to a public key with a checksum. The checksum is calculated
 * by doing as SHA3-256 on the hex values, then for each hex value if the hash value
 * is > 7, then the hex value is upper case.
 *
 * @param publicKey Value to convert to checksum key
 *
 * @returns Checksum upper/lower case hex values
 *
 */
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

/**
 * Returns true if the value is a public key.
 *
 * @param publicKey value is public key - is string and has 64 hex chars
 *
 * @return True if the key is a public key
 *
 */
export function isPublicKey(publicKey: string): boolean {
    if (publicKey && typeof publicKey === 'string') {
        return remove0xPrefix(publicKey).match(/^[0-9a-x]{64}$/i) != null
    }
    return false
}

/**
 * Returns true if the public key provided has a valid checksum
 *
 * @param publicKey to check to see if is a valid checksum key
 *
 * @return True if the public key has the correct upper/lower case checksum
 *
 */
export function isPublicKeyChecksum(publicKey: string): boolean {
    return remove0xPrefix(publicKey) && remove0xPrefix(publicKey) == remove0xPrefix(toPublicKeyChecksum(publicKey))
}
