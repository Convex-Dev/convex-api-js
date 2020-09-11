/*

    Account.ts class to manage private/public key for signing hashed text on the Convex Network.


*/

import { KeyObject, generateKeyPairSync, createPrivateKey, createPublicKey } from 'crypto'
import pem from 'pem-file'

export class Account {
    readonly privateKey: KeyObject
    readonly publicKey: KeyObject
    readonly address: string
    readonly addressAPI: string

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
        // return new Account(publicKey, privateKey)
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

    constructor(publicKey: KeyObject, privateKey: KeyObject) {
        this.publicKey = publicKey
        this.privateKey = privateKey
        const exportPublicKey = publicKey.export({
            type: 'spki',
            format: 'pem',
        })
        this.addressAPI = pem.decode(exportPublicKey).toString('hex').substring(24)
        this.address = '0x' + this.addressAPI
    }
}
