/*

    Test Utils.ts

*/

import { assert } from 'chai'
import { randomInt } from 'crypto'
import { randomHex } from '../Helpers'

import { Account } from '../../src/Account'
import { KeyPair } from '../../src/KeyPair'
import { isAddress, isPublicKeyChecksum, toAddress, toPublicKeyChecksum } from '../../src/Utils'

const PUBLIC_ADDRESS = '0x5288fec4153b702430771dfac8aed0b21cafca4344dae0d47b97f0bf532b3306'
const PUBLIC_ADDRESS_CHECHKSUM = '0x5288Fec4153b702430771DFAC8AeD0B21CAFca4344daE0d47B97F0bf532b3306'



describe('Utils module', () => {
    describe('Address validation tests', () => {
        it('should return assert to a valid address', () => {
            const address = randomInt(0, 2048)
            assert(isAddress(address))
        })
        it('should return assert to an invalid address', () => {
            const address = 'bad-' + randomInt(0, 2048)
            assert(!isAddress(address))
        })
        it('should convert a number to address', () => {
            const address = randomInt(0, 2048)
            const result = toAddress(address)
            assert.equal(result, BigInt(address))
        })
        it('should convert a string to address', () => {
            const address = String(randomInt(0, 2048))
            const result = toAddress(address)
            assert.equal(result, BigInt(address))
        })
        it('should convert an address string to address', () => {
            const addressNumber = randomInt(0, 2048)
            const address = `#${addressNumber}`
            const result = toAddress(address)
            assert.equal(result, BigInt(addressNumber))
        })
        it('should convert an account to address', () => {
            const addressNumber = randomInt(0, 2048)
            const keyPair = KeyPair.create()
            const account = Account.create(keyPair, toAddress(addressNumber))
            const result = toAddress(account)
            assert.equal(result, BigInt(addressNumber))
        })


    })

    describe('toPublicKeyChecksum', () => {
        it('should return assert to a valid checksum public key', () => {
            const publicKey = randomHex(32)
            assert(isPublicKeyChecksum(toPublicKeyChecksum(publicKey)))
        })
        it('Test toPublicKeyChecksum', () => {
            const result = toPublicKeyChecksum(PUBLIC_ADDRESS)
            assert(result)
            assert.equal(result, PUBLIC_ADDRESS_CHECHKSUM)
        })
    })
})
