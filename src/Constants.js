module.exports = {
  status: {
    SUCCESS: "success",
    ERROR: "error",
    PARTIAL: "partial",
    STALE: "stale"
  },
  defaultFragment: "full",
  timestamp: {
    stale: -1,
    loading: 0
  },
  action: {
    fetch: "GET",
    save: "SAVE",
    delete: "DELETE"
  }
}
