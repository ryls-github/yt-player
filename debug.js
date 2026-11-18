const noDebug = ["", "0", "false"].includes((localStorage.debug || "").toLowerCase())

export default noDebug ? () => {} : (...args) => console.debug(...args)
