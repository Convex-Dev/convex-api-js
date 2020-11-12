
# convex-api-js

API toolkit to access convex network.

[Documentation](https://convex-dev.github.io/convex-api-js)

## Example of using the library

```js
    import { ConvexAccount, ConvexAPI } from '@convex-dev/convex-api-js'

    const convex = new ConvexAPI('https:convex.world')
    const account = ConvexAccount.createNew()
    const amount = await convex.requestFunds(10000000, account)
    console.log(`requested ${amount} funds.`)
    const balance = await convex.getBalance(account)
    console.log(`The account ${account.address} has a balance of ${balance}`)

```
