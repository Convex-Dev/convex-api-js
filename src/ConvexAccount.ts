/*

    ConvexAccount.ts class to manage private/public key for signing hashed text on the Convex Network.


*/

import fs from 'fs'
import { KeyObject, generateKeyPairSync, createPrivateKey, createPublicKey, randomBytes, sign } from 'crypto'
import pem from 'pem-file'

import { toPublicKeyChecksum } from './Utils'

export class ConvexAccount {
    readonly privateKey: KeyObject // private key object
    readonly publicKey: KeyObject // public key object
    readonly address: BigInt // address for this account
    readonly name: string // name of the registered account
    readonly publicKeyAPI: string // address as hex string without leading '0x'
    readonly publicKeyChecksum: string // address as hex string with checksum upper an lower case hex letters

    /**
     * Creates a new account
     *
     * @returns a new ConvexAccount Object
     */
    public static create(): ConvexAccount {
        // create a temporary password for generating a random private/public keys
        const password = randomBytes(64).toString('hex')
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
        return ConvexAccount.importFromString(privateKey, password, null, null, publicKey)
    }

    /**
     * Imports an account from a PKCS8 fromated text string. You need to pass the correct password, to decrypt
     * the private key stored in the text string.
     *
     * @param text PKCS8 fromated text with the private key encrypted.
     * @param password Password to decrypt the private key.
     * @param address Optional address used for this account.
     * @param publicKeyText Optional public key encoded in PEM format, if non provided, the public key
     * can be obtained from the private key.
     *
     * @returns an account object with the private and public key pairs.
     *
     */
    public static importFromString(
        text: string,
        password: string,
        address?: BigInt,
        name?: string,
        publicKeyText?: string
    ): ConvexAccount {
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

        return new ConvexAccount(publicKey, privateKey, address, name)
    }

    /**
     * Imports a private key file. The key file is in the format as PKCS8 text. The private key is encrypted.
     *
     * @param filename Filename containing the encrypted private key.
     * @param password Password to decrypt the private key.
     * @param address Optional address used for this account.
     *
     * @returns An ConvexAccount object with the private and public keys.
     *
     */
    public static async importFromFile(
        filename: string,
        password: string,
        address?: BigInt,
        name?: string
    ): Promise<ConvexAccount> {
        if (fs.existsSync(filename)) {
            const data = await fs.promises.readFile(filename)
            return ConvexAccount.importFromString(data.toString(), password, address, name)
        }
        return null
    }

    public static async importFromAccount(account: ConvexAccount, address?: BigInt, name?: string): Promise<ConvexAccount> {
        const password = randomBytes(64).toString('hex')
        const keyText = account.exportToText(password)
        return ConvexAccount.importFromString(keyText, password, address, name)
    }

    constructor(publicKey: KeyObject, privateKey: KeyObject, address?: BigInt, name?: string) {
        this.publicKey = publicKey
        this.privateKey = privateKey
        const exportPublicKey = publicKey.export({
            type: 'spki',
            format: 'pem',
        })
        this.publicKeyAPI = pem.decode(exportPublicKey).toString('hex').substring(24)
        this.publicKeyChecksum = toPublicKeyChecksum(this.publicKeyAPI)
        this.address = address
        this.name = name
    }

    /**
     * Export the account to a PKCS8 fromatted text string. The private key is encrypted using the provided password.
     *
     * @param password Password to encrypt the private key.
     *
     * @returns The encrpted private key as a PKCS8 formatted string.
     *
     */
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

    /**
     * Same as `exportToText` this writes the exported tex to a file.
     *
     * @param password Password to encrypt the private key.
     *
     */
    public async exportToFile(filename: string, password: string): Promise<unknown> {
        return await fs.promises.writeFile(filename, this.exportToText(password))
    }

    /**
     * Sign a hash message. This is called by the convex API class to sign a hash returned from the `prepare` api.
     * This signed message cryptographically proves that the account owner has access to the private key.
     *
     * The API calls this with a hex string, that is converted to bytes, and then sigend.
     * The resultant signed data is sent back as a hex string.
     *
     * @param text Text hex string to sign
     *
     * @returns A hex string signed with a prefix of '0x'
     *
     */
    public sign(text: string): string {
        const data = sign(null, Buffer.from(text, 'hex'), this.privateKey)
        return '0x' + data.toString('hex')
    }
}
