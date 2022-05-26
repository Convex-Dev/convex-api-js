/*

    KeyPair.ts class to manage private/public key for signing hashed text on the Convex Network.


*/

import * as ed25519 from '@noble/ed25519'
import { composePrivateKey, decomposePrivateKey } from 'crypto-key-composer'

import { toPublicKeyChecksum, remove0xPrefix } from './Utils'


export class KeyPair {
    readonly privateKey: any // private key object
    readonly publicKey: any // public key object
    readonly publicKeyAPI: string // address as hex string without leading '0x'
    readonly publicKeyChecksum: string // address as hex string with checksum upper an lower case hex letters

    constructor(publicKey: any, privateKey: any) {
        this.publicKey = publicKey
        this.privateKey = privateKey
        const publicKeyText = ed25519.utils.bytesToHex(this.publicKey)
        this.publicKeyAPI = remove0xPrefix(toPublicKeyChecksum(publicKeyText))
        this.publicKeyChecksum = toPublicKeyChecksum(publicKeyText)
    }

    /**
     * Creates a new keypair
     *
     * @returns a new KeyPair Object
     */
    public static async create(): Promise<KeyPair> {
        const privateKey = ed25519.utils.randomPrivateKey()
        const publicKey = await ed25519.getPublicKey(privateKey)
        return new KeyPair(publicKey, privateKey)
    }

    /**
     * Imports a keypair from a PKCS8 fromated text string. You need to pass the correct password, to decrypt
     * the private key stored in the text string.
     *
     * @param text PKCS8 fromated text with the private key encrypted.
     * @param password Password to decrypt the private key.
     * @param publicKeyText Optional public key encoded in PEM format, if non provided, the public key
     * can be obtained from the private key.
     *
     * @returns an KeyPair object with the private and public key pairs.
     *
     */
    public static async importFromString(text: string, password: string, publicKeyText?: string): Promise<KeyPair> {

        const privateKeyData = decomposePrivateKey(text, {
            format: 'pkcs8-pem',
            password: password,
        })
//        console.log(privateKeyData)
        const privateKey = privateKeyData.keyData.seed
        let publicKey = await ed25519.getPublicKey(privateKey)
        if (publicKeyText) {
            publicKey = await ed25519.getPublicKey(privateKey)
        }
        return new KeyPair(publicKey, privateKey)
    }

    /**
     * Imports a private key file. The key file is in the format as PKCS8 text. The private key is encrypted.
     *
     * @param filename Filename containing the encrypted private key.
     * @param password Password to decrypt the private key.
     *
     * @returns An KeyPair object with the private and public keys.
     *
     */
    public static async importFromFile(filename: string, password: string): Promise<KeyPair> {
        const fs = await import('fs')
        if (fs.existsSync(filename)) {
            const data = await fs.promises.readFile(filename)
            return KeyPair.importFromString(data.toString(), password)
        }
        return null
    }

    /**
     * Export the keypair to a PKCS8 fromatted text string. The private key is encrypted using the provided password.
     *
     * @param password Password to encrypt the private key.
     *
     * @returns The encrpted private key as a PKCS8 formatted string.
     *
     */
    public exportToString(password: string): string {

        return composePrivateKey({
            format: 'pkcs8-pem',
            keyAlgorithm: {
                id: 'ed25519'
            },
            keyData: {
                seed: this.privateKey
            },
        }, {
            format: 'pkcs8-pem',
            password: password,
        })
    }

    /**
     * Same as `exportToText` this writes the exported tex to a file.
     *
     * @param password Password to encrypt the private key.
     *
     */
    public async exportToFile(filename: string, password: string): Promise<unknown> {
        const fs = await import('fs')
        return await fs.promises.writeFile(filename, this.exportToString(password))
    }

    /**
     * Sign a hash message. This is called by the convex API class to sign a hash returned from the `prepare` api.
     * This signed message cryptographically proves that the keypair owner has access to the private key.
     *
     * The API calls this with a hex string, that is converted to bytes, and then sigend.
     * The resultant signed data is sent back as a hex string.
     *
     * @param text Text hex string to sign
     *
     * @returns A hex string signed with a prefix of '0x'
     *
     */
    public async sign(text: string): Promise<string> {
        const data = await ed25519.sign(Buffer.from(text, 'hex'), this.privateKey)
        return '0x' + ed25519.utils.bytesToHex(data)
    }
}
