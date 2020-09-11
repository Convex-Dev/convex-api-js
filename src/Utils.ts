/*

    Utils for accounts


*/

import { createHash } from 'crypto'

export function remove0xPrefix(address: string): string {
    if (address) {
        return address.replace(/^0x/, '')
    }
    return null
}

export function toAddressChecksum(address: string): string {
    const addressClean = remove0xPrefix(address).toLowerCase()
    let result = '0x'
    const hash = createHash('SHA3-256')
    hash.update(Buffer.from(addressClean, 'hex'))
    const hashData = hash.digest('hex')
    for (let index = 0; index < hashData.length && index < addressClean.length; index++) {
        if (parseInt(hashData.charAt(index), 16) > 7) {
            result = result.concat(addressClean.charAt(index).toUpperCase())
        } else {
            result = result.concat(addressClean.charAt(index))
        }
    }
    return result
}

export function isAddressHex(address: string): boolean {
    const addressClean = remove0xPrefix(address).toLowerCase()
    if ( addressClean.match(/[0-9a-f]+/) && addressClean.length == 64) {
        return true
    }
    return false
}

export function isAddress(address: string): boolean {
    if ( isAddressChecksum(address)) {
        return true
    }
    else if (isAddressHex(address)) {
        return true
    }
    return false
}

export function isAddressChecksum(address: string): boolean {
    return remove0xPrefix(address) && remove0xPrefix(address) == remove0xPrefix(toAddressChecksum(address))
}
