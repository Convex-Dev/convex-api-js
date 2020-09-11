/*

    Test Utils.ts

*/

import { assert } from 'chai'
import { toAddressChecksum } from '../../src/Utils'

const PUBLIC_ADDRESS = '0x5288fec4153b702430771dfac8aed0b21cafca4344dae0d47b97f0bf532b3306'
const PUBLIC_ADDRESS_CHECHKSUM = '0x5288Fec4153b702430771DFAC8AeD0B21CAFca4344daE0d47B97F0bf532b3306'


describe('Utils module', () => {
    describe('toAddressChecksum', () => {
        it('Test toAddressChecksum', () => {
            const result = toAddressChecksum(PUBLIC_ADDRESS)
            assert(result)
            assert.equal(result, PUBLIC_ADDRESS_CHECHKSUM)
        })
    })
})
