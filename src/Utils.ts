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
 * @param addressAccount Value to check to see if it can be a valid address
 *
 * @returns Boolean True if the address field is valid, else false
 *
 */
export function isAddress(addressAccount: Account | BigInt | number | string): boolean {
    try {
        const address: BigInt = toAddress(addressAccount)
        return address && address >= BigInt(0)
    } catch {
        return false
    }
    return false
}

/**
 * Return true if the addressAccount value is an acount object. This does not check the network for a valid
 * account, but just checks to see if it is an Account object
 *
 * @param addressAccount Value to check to see if it can be a valid account object
 *
 * @returns Boolean True if the addressAccount field is valid, else false
 *
 */
export function isAccount(addressAccount: Account | BigInt | number | string): boolean {
    return typeof addressAccount === 'object' && addressAccount.constructor.name === 'Account'
}

/**
 * Convert an Account object, string, number BigInt values to an address number
 *
 * @param addressAccount The Account object or number to convert to a single address value
 *
 * @returns Returns a single BigInt value of the address
 *
 */
export function toAddress(addressAccount: Account | BigInt | number | string): BigInt {
    let result: BigInt
    if (Object.prototype.toString.call(addressAccount) === '[object BigInt]') {
        result = BigInt(addressAccount)
    } else if (typeof addressAccount === 'string') {
        result = BigInt(addressAccount.replace(/^#/, ''))
    } else if (isAccount(addressAccount)) {
        result = (<Account>addressAccount).address
    } else {
        result = BigInt(addressAccount)
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
