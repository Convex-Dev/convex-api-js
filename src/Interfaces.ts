/*
    Interfaces

*/

export interface IAccountInformation {
    address: BigInt
    isLibrary: boolean
    isActor: boolean
    memorySize: number
    allowance: number
    type: string
    balance: number
    sequence: number
    environment: unknown
}

export interface IRegistryItem {
    address: BigInt
    owner: BigInt
}
