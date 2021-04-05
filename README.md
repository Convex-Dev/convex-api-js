
# convex-api-js

API toolkit to access convex network.

[Documentation](https://convex-dev.github.io/convex-api-js)

## Example of using the library

First import the library and setup the convex API connection

```js
    import { ConvexAPI, ConvexAccount } from '@convex-dev/convex-api-js'

    const convex = new ConvexAPI('https://convex.world')

```

Create a new account with random keys.
```js

    const account = convex.createAccount()
```

Topup account to have sufficient funds.

```js
    const amount = await convex.topupAccount(account)
    console.log(`topup account with ${amount} funds.`)
```

Check the balance on the new account.
```js
    const balance = await convex.getBalance(account)
    console.log(`The account ${account.address} has a balance of ${balance}`)

```

Do a send, this will cost the account a small fee so we need the account object to sign the transaction.
```js
    const resultSend = await convex.send('(map inc [1 2 3 4 5])', account)
    consol.log(`Result from calculation ${resultSend}`)
```

All queries are free so we can provide the account object or just an account address, to make the query from.

This can be usefull if you whish to query an actors state by using the actors address as the query address.

```js
    const resultQuery = await convex.query('(balance *address*)', account.address)
    consol.log(`Result from a query ${resultQuery}`)
```

## Example using an account with a name

We have already saved an existing account keys in a .pem file
So first we need to import the account details public/private keys using it's encrypted data on file

```js
    importAccount = ConvexAccount.importFromFile('my-account.pem', 'secret')

```

Create a new account address for the first time, or if the account name has already been regisetered
then load in the account address.

The returned account object will have the account address assigned to the account name `my-account`.
```js
    const account = await convex.setupAccount('my-account', importAccount)
```

Later on you may need to re-load the same account address using only the registered name.
```js
    const sameAccount = await convex.loadAccount('my-account', importAccount)
```

You can still use `setupAccount` this will just call `loadAccount` if the account name is registered with the registry.
```js
    // or the same as
    const sameAccount = await convex.setupAccount('my-account', importAccount)
```


If you just want to find out a name from the registry you can just do this:
```js
    const accountAddress = await convex.resolveAccountName('my-account')

```
