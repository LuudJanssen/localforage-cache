# localforage-cache

A wrapper around [localforage](https://github.com/localForage/localForage) adding experation times and cache invalidation methods

## Usage

First import the module:

```javascript
import cache from "@luudjanssen/localforage-cache"
```

Then, create a new cache instance:

```javascript
const productCache = cache.createInstance({
  name: "products-cache",
  defaultExpiration: 1000
})
```

The `defaultExpiration` is the default expiration time of the items saved to the cache. In the example we have 10 minutes, this means that all items saved to the cache will expire in 1 second (1000 milliseconds). The default expiration time is "Infinity", which would give you the same behaviour as using the original [localforage](https://github.com/localForage/localForage) module.

Now, you can save items to the cache and retreive them:

```javascript
// Save an item to the cache
await productCache.setItem("product-1", { stock: 4, name: "Product 1" })

// Retreive it from the cache
const product1 = await productCache.getItem("product-1")
console.log('Product 1 returned from cache:', product1)

// Wait two seconds and retreive it again
setTimeout(() => {
    const product1Expired = await productCache.getItem("product-1")
    console.log('The cache has expired, so this should be null', product1Expired)
}, 2000)
```

## How does it work?

The module works by saving an additional entry in the local storage for each item you save which states its expiration date.

For example, the output in the storage driver of the first line of the example code in the database would be:

| Key                        | Value                            |
| -------------------------- | -------------------------------- |
| product-1                  | { stock: 4 , name: "Product 1" } |
| product-1_expires_a05fa06b | 1584277478393                    |

The timestamp in the `product-1_expires_a05fa06b` entry is 1000 (the `defaultExpiration`) + the timestamp of the moment it was saved.

If an item is retreived from the cache which is expired, both rows will be deleted and `null` will be returned.

If you want more in depth knowledge of how the module works, take a look at the [source](src/localforage.js).
