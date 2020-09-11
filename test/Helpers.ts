/*

    Test Helpers

*/

import { randomBytes } from 'crypto'

export function randomHex(size: number): string {
    return randomBytes(size).toString('hex')
}
