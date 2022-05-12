/*

    Account.ts class to manage address and name.

*/

import { KeyPair } from './KeyPair'

export class Account {
    readonly keyPair: KeyPair // KeyPair object
    readonly address: BigInt // address for this account
    readonly name: string // name of the registered account

    constructor(keyPair: KeyPair, address: BigInt, name: string) {
        this.keyPair = keyPair
        this.address = address
        this.name = name
    }

    /**
     * Creates a new account
     *
     * @returns a new Account Object
     */
    public static create(keyPair: KeyPair, address?: BigInt, name?: string): Account {
        return new Account(keyPair, BigInt(address), name)
    }

    /**
     * Sign text, and return the signature
     *
     * @param text Text to sign
     *
     * @returns a signature of the signed text
     *
     */
    public sign(text: string): string {
        return this.keyPair.sign(text)
    }
}
