/**
 *
 * Utils module to provide utility helpers for accounts and public key values
 *
 */

import cryptojs from 'crypto-js'
import { sha3_256 } from 'js-sha3'
import { Account } from './Account'

interface IWordArray {
    words: Uint32Array
    sigBytes: number
}

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
    const hashData = sha3_256(hexToByteArray(publicKeyClean))
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

/**
 * Returns true if the string is a hex string
 *
 */
export function isHexString(hex: string): boolean {
    return hex !== null && hex.match(/^[0-9a-f]+$/gi) !== null
}

/**
 * Returns a Uint8Array of a hex string. The hex string must only contain
 * characters from 0 - 9 and a-f
 */
export function hexToByteArray(hex: string): Uint8Array {
    if (!isHexString(hex)) {
        throw TypeError(`the hex string ${hex} contains non hex characters`)
    }
    const pairs = hex.match(/[0-9a-f]{2}/gi)
    const values = pairs.map((p) => {
        return parseInt(p, 16)
    })
    return new Uint8Array(values)
}

/*
 * Code originally copied from crypto-js for conversion Latin1 to and from WordArray
 * but changed to return/input Uint8Array
 *
 */
export function wordArrayToByteArray(wordArray: IWordArray): Uint8Array {
    const words = wordArray.words
    const sigBytes = wordArray.sigBytes
    // Convert from WordArray object to Uint8Array
    const result = new Uint8Array(sigBytes)
    for (let i = 0; i < sigBytes; i++) {
        const value = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
        result[i] = value
    }
    return result
}

export function byteArrayToWordArray(data: Uint8Array): IWordArray {
    // Convert Uint8Array to a word array object
    const words = []
    for (let i = 0; i < data.length; i++) {
        words[i >>> 2] |= (data[i] & 0xff) << (24 - (i % 4) * 8)
    }
    return new cryptojs.lib.WordArray.init(words)
}
