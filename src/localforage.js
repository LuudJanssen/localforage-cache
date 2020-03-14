import localforage from "localforage"
import Sha256 from "sha.js/sha256"

/**
 * Wrapper around localforage that adds the ability to set expiration dates for saved values.
 *
 * It works by creating an additional entry that tells you when the key is due to expire.
 */
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

  /**
   * Save an entry in the offline storage.
   *
   * @param {String} key The key of the value you wish to save to the cache.
   * @param {any} value The value you wish to save.
   * @param {Date|Number} expires The expiry date. Either a timestamp or date object. By default this value is the default expiration set in the config + the current time.
   * @return {Promise<void>} A promise that resolves when the value has been saved.
   */
  async setItem(
    key,
    value,
    expires = this.storage._config.defaultExpiration + Date.now()
  ) {
    const expirationKey = this._expirationKey(key)

    let expiresTimestamp = expires

    // If we get a date object, turn it into a timestamp
    if (expires instanceof Date) {
      expiresTimestamp = expires.getTime()
    }

    await this.storage.setItem(key, value)
    return this.storage.setItem(expirationKey, expiresTimestamp)
  }

  /**
   * Retreive an entry from the offline storage.
   *
   * @param {String} key The key of the value you wish to retreive from the cache.
   * @return {Promise<any>} A promise that resolves with the value of the key. Returns null if the key does not exist.
   */
  async getItem(key) {
    const expirationKey = this._expirationKey(key)
    const expires = await this.storage.getItem(expirationKey)

    // If we don't find an experation date, just return the value
    if (expires === null) {
      return this.storage.getItem(key)
    }

    const hasExpired = this._hasExpired(expires)

    // If the item has expired, remove it from the cache
    if (hasExpired) {
      await this.removeItem(key)
      return null
    }

    return this.storage.getItem(key)
  }

  /**
   * Removes an entry from the offline storage while also removing its expiry entry.
   *
   * @param {String} key The key of the value you wish to remove from the cache.
   */
  async removeItem(key) {
    const expirationKey = this._expirationKey(key)
    const removeValue = this.storage.removeItem(key)
    const removeExpiration = this.storage.removeItem(expirationKey)

    return Promise.all([removeValue, removeExpiration])
  }

  /**
   * Sets the options for the cache module.
   *
   * @param {Object} options
   */
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

  /**
   * Creates a new instance of the cache module.
   *
   * @param {Object} options
   */
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
