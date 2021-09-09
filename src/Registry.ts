/*


    Registry


*/

import { Account } from './Account'
import { API } from './API'
import { toAddress } from './Utils'
import { IRegistryItem } from './Interfaces'

const QUERY_ACCOUNT_ADDRESS = BigInt(9)

export class Registry {
    /**
     * Registry object to call registry commands
     */
    readonly convex: API
    address: BigInt
    protected items: { [name: string]: IRegistryItem } = {}

    /**
     * Initaliizes a new Registry object, you need to provide a ConvexAPI Object.
     *
     * @param convex API object to access the convex network.
     *
     */
    public constructor(convex: API) {
        this.convex = convex
    }

    /**
     * Clear the internal CNS cache. This will restart the requests to resolve registry names.
     */
    public clearCache(): void {
        this.items = {}
    }

    /**
     * Return true if the name has been registered.
     *
     * @param name Name of the registry entry
     *
     * @returns boolean True or False if the name has been registered.
     *
     */
    public async isRegistered(name: string): Promise<boolean> {
        return this.item(name) != null
    }

    /**
     * Return registry information about the registered name. At the moment this just
     * returns the address and the owner address of the registered item.
     *
     * @param name Name of the registered item
     *
     * @returns return an IRegistryItem record with the address and owner address of the registered name
     */
    public async item(name: string): Promise<IRegistryItem> {
        if (!this.items[name]) {
            const address = await this.getAddress()
            const queryLine = `(get cns-database (symbol "${name}"))`
            const result = await this.convex.query(queryLine, address)
            if (result && result['value']) {
                this.items[name] = {
                    address: toAddress(result['value'][0]),
                    owner: toAddress(result['value'][1]),
                }
            }
        }
        return this.items[name]
    }

    /**
     * Register or update a name with the CNS ( Convex Named Service ).
     *
     * @param name Name to register or update
     *
     * @param registerAddress Address to register/update with the name
     *
     * @param account ConvexAccount to use to sign and spend a fee to register/update the name.
     *
     * @returns an IRegistryItem object with the new address and owner address of the registered item.
     *
     */
    public async register(name: string, registerAddress: BigInt, account: Account): Promise<IRegistryItem> {
        const address = await this.getAddress()
        const registerLine = `(call #${address} (register {:name (symbol "${name}")}))`
        const registerResult = await this.convex.send(registerLine, account)
        if (registerResult && registerResult['value']) {
            const updateLine = `(call #${address} (cns-update (symbol "${name}") #${registerAddress}))`
            const updateResult = await this.convex.send(updateLine, account)
            if (updateResult && updateResult['value']) {
                const items = updateResult['value']
                this.items[name] = {
                    address: toAddress(items[name][0]),
                    owner: toAddress(items[name][1]),
                }
                return this.items[name]
            }
        }
    }

    /**
     * Resolve a registerd name to it's owner. Only an owner address can update a current registered name
     *
     * @param name Name of the registration.
     *
     * @results The owner address of the registration
     *
     */
    public async resolveOwner(name: string): Promise<BigInt> {
        const value = await this.item(name)
        if (value) {
            return value.owner
        }
    }

    /**
     * Resolve a registartion name to an address.
     *
     * @param name Name of the registration to resolve.
     *
     * @returns The address saved for this registered name.
     *
     */
    public async resolveAddress(name: string): Promise<BigInt> {
        const value = await this.item(name)
        if (value) {
            return value.address
        }
    }

    /**
     * Return the address of the CNS system. This calls `(address *registry*)` to find the internal address used
     * by convex than has the registration list
     *
     * @returns Address of the registration library/actor
     *
     */
    protected async getAddress(): Promise<BigInt> {
        if (!this.address) {
            const result = await this.convex.query(`(address *registry*)`, QUERY_ACCOUNT_ADDRESS)
            this.address = toAddress(result['value'])
        }
        return this.address
    }
}
