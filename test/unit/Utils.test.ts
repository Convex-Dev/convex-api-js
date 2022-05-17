/*

    Test Utils.ts

*/

import { assert } from 'chai'
import { randomInt, randomBytes } from 'crypto'

import { Account } from '../../src/Account'
import { KeyPair } from '../../src/KeyPair'
import { isAddress, isPublicKey, isPublicKeyChecksum, prefix0x, remove0xPrefix, toAddress, toPublicKeyChecksum } from '../../src/Utils'

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

    describe('0x prefix', () => {
        it('should remove a 0x prefix', () => {
            const publicKey = randomBytes(32).toString('hex')
            assert.equal(remove0xPrefix(`0x${publicKey}`), publicKey, 'not a valid public key')
        })
        it('should remove a 0X prefix', () => {
            const publicKey = randomBytes(32).toString('hex')
            assert.equal(remove0xPrefix(`0X${publicKey}`), publicKey, 'not a valid public key')
        })
        it('should fail to remove a 0X prefix from an empty string', () => {
            const emptyValue = null
            assert.equal(remove0xPrefix(emptyValue), emptyValue, 'not a valid public key')
        })
        it('should pre-append a 0x prefix', () => {
            const publicKey = randomBytes(32).toString('hex')
            assert.equal(prefix0x(publicKey), `0x${publicKey}`, 'not a valid public key')
        })
        it('should pre-append a 0x prefix to a 0x prefix key', () => {
            const publicKey = randomBytes(32).toString('hex')
            assert.equal(prefix0x(`0x${publicKey}`), `0x${publicKey}`, 'not a valid public key')
        })
        it('should pre-append a 0x prefix to a 0X prefix key', () => {
            const publicKey = randomBytes(32).toString('hex')
            assert.equal(prefix0x(`0X${publicKey}`), `0x${publicKey}`, 'not a valid public key')
        })
        it('should fail to pre-append a 0x prefix to an empty string', () => {
            const emptyValue = null
            assert.equal(prefix0x(emptyValue), emptyValue, 'not a valid public key')
        })
    })

    describe('isPublicKey utils', () => {
        it('should return true for a 32 byte hex public key', () => {
            const publicKey = randomBytes(32).toString('hex')
            assert(isPublicKey(publicKey), 'not a valid public key')
        })
        it('should return true for a uppercase 32 byte hex public key', () => {
            const publicKey = randomBytes(32).toString('hex').toUpperCase()
            assert(isPublicKey(publicKey), 'not a valid public key')
        })
        it('should return true for a prefix 0x on a 32 byte hex public key', () => {
            const publicKey = randomBytes(32).toString('hex').toUpperCase()
            assert(isPublicKey(prefix0x(publicKey)), 'not a valid public key')
        })
        it('should return false for a 32 byte hex public key with invalid charcters', () => {
            const publicKey = randomBytes(32).toString('hex')
            assert(!isPublicKey(`_${publicKey}bad`), 'not a valid public key')
        })
        it('should return false for a 18 byte hex public keys', () => {
            const publicKey = randomBytes(18).toString('hex')
            assert(!isPublicKey(publicKey), 'not a valid public key')
        })
    })
    describe('PublicKeyChecksum', () => {
        it('should return assert to a valid checksum public key', () => {
            const publicKey = randomBytes(32).toString('hex')
            assert(isPublicKeyChecksum(toPublicKeyChecksum(publicKey)), 'not a valid public key')
        })
        it('Test toPublicKeyChecksum with known keys', () => {
            const result = toPublicKeyChecksum(PUBLIC_ADDRESS)
            assert(result, 'to public key checksum')
            assert.equal(result, PUBLIC_ADDRESS_CHECHKSUM)
        })
    })

})
