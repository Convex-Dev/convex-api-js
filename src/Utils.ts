/*

    Utils for accounts


*/

import { createHash } from 'crypto'

export function removeLeading0x(address: string): string {
    return address.replace(/^0x/, '')
}

export function toAddressChecksum(address: string): string {
    const addressClean = removeLeading0x(address).toLowerCase()
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
