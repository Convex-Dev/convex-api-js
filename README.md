
# convex-api-js

API toolkit to access convex network.

[Documentation](https://convex-dev.github.io/convex-api-js)

## Example of using the library

```js
    import { ConvexAPI } from '@convex-dev/convex-api-js'

    const convex = new ConvexAPI('https://convex.world')
    const account = convex.createAccount()
    const amount = await convex.requestFunds(10000000, account)
    console.log(`requested ${amount} funds.`)
    const balance = await convex.getBalance(account)
    console.log(`The account ${account.address} has a balance of ${balance}`)
    const result = await convex.send('(map inc [1 2 3 4 5])', account)
    consol.log(`Result from calculation ${result}`)

```
