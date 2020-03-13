import localforage from "localforage"
import Sha256 from "sha.js/sha256"

export class LocalForageCache {
  constructor(options) {
    this.storage = localforage.createInstance()
    this.defineDriver = this.storage.defineDriver
    this.driver = this.storage.driver
    this.getDriver = this.storage.getDriver
    this.getSerializer = this.storage.getSerializer
    this.ready = this.storage.ready
    this.setDriver = this.storage.setDriver
    this.supports = this.storage.supports
    this.clear = this.storage.clear

    this.config(options)
  }

  async setItem(key, value, expires = this.storage._config.defaultExpiration) {
    const expirationKey = this._expirationKey(key)

    console.log("expiration key", expirationKey)

    let expiresTimestamp = expires

    if (expires instanceof Date) {
      expiresTimestamp = expires.getTime()
    }

    await this.storage.setItem(key, value)
    return this.storage.setItem(expirationKey, expiresTimestamp)
  }

  async getItem(key) {
    const expirationKey = this._expirationKey(key)
    const expires = await this.storage.getItem(expirationKey)

    console.log("expiration result", expires)

    if (expires === null) {
      return this.storage.getItem(key)
    }

    const hasExpired = this._hasExpired(expires)

    if (hasExpired) {
      await this.removeItem(key)
      return null
    }

    return this.storage.getItem(key)
  }

  async removeItem(key) {
    const expirationKey = this._expirationKey(key)
    const removeValue = this.storage.removeItem(key)
    const removeExpiration = this.storage.removeItem(expirationKey)

    return Promise.all([removeValue, removeExpiration])
  }

  config(options) {
    if (typeof options !== "object") {
      return this.storage.config(options)
    }

    const { defaultExpiration } = options

    if (typeof defaultExpiration === "undefined") {
      options.defaultExpiration = Infinity
    }

    return this.storage.config(options)
  }

  createInstance(options) {
    return new LocalForageCache(options)
  }

  _expirationKey(key) {
    const hash = new Sha256()
      .update(key)
      .digest("hex")
      .substring(0, 8)

    return `${key}_expires_${hash}`
  }

  _hasExpired(expires) {
    if (expires === Infinity) {
      return false
    }

    if (isNaN(expires)) {
      return false
    }

    return expires < Date.now()
  }
}

export default new LocalForageCache()
