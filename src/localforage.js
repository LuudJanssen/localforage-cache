import localforage from "localforage"

class LocalForageCache {
  localforageInstance = localforageInstance
  config = localforage.config
  defineDriver = localforage.defineDriver
  driver = localforage.driver
  getDriver = localforage.getDriver
  getSerializer = localforage.getSerializer
  ready = localforage.ready
  setDriver = localforage.setDriver
  supports = localforage.supports
}
