/*

    Account.ts class to manage private/public key for signing hashed text on the Convex Network.


*/

import fs from 'fs'
import { KeyObject, generateKeyPairSync, createPrivateKey, createPublicKey, sign } from 'crypto'
import pem from 'pem-file'

import { toAddressChecksum } from 'Utils'

export class Account {
    readonly privateKey: KeyObject
    readonly publicKey: KeyObject
    readonly address: string
    readonly addressAPI: string
    readonly addressChecksum: string

    public static createNew(password: string): Account {
        const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: password,
            },
        })
        return Account.importFromString(privateKey, password, publicKey)
    }

    public static importFromString(text: string, password: string, publicKeyText?: string): Account {
        const privateKey = createPrivateKey({
            key: text,
            type: 'pkcs8',
            passphrase: password,
        })

        let publicKey
        if (publicKeyText) {
            publicKey = createPublicKey(privateKey)
        } else {
            publicKey = createPublicKey(privateKey)
        }

        return new Account(publicKey, privateKey)
    }

    public static async importFromFile(filename: string, password: string): Promise<Account> {
        if (fs.existsSync(filename)) {
            const data = await fs.promises.readFile(filename)
            return Account.importFromString(data.toString(), password)
        }
        return null
    }

    constructor(publicKey: KeyObject, privateKey: KeyObject) {
        this.publicKey = publicKey
        this.privateKey = privateKey
        const exportPublicKey = publicKey.export({
            type: 'spki',
            format: 'pem',
        })
        this.addressAPI = pem.decode(exportPublicKey).toString('hex').substring(24)
        this.address = '0x' + this.addressAPI
        this.addressChecksum = toAddressChecksum(this.address)
    }

    public exportToText(password: string): string {
        return this.privateKey
            .export({
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: password,
            })
            .toString()
    }

    public async exportToFile(filename: string, password: string): Promise<unknown> {
        return await fs.promises.writeFile(filename, this.exportToText(password))
    }

    public sign(text: string): string {
        const data = sign(null, Buffer.from(text, 'hex'), this.privateKey)
        return '0x' + data.toString('hex')
    }
}
