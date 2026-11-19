// 入力用フォーマット
//
// database: (channel) {
//     id: "チャンネルの ID",
//     name: "チャンネル名",
//     videos: (video) {
//         id: "動画の ID",
//         title: "動画のタイトル",
//         date: "動画の日付",
//         time: "動画の時間",
//         cues: (cue) {
//             title: "タイトル",
//             singer: "歌手",
//             org_artist: "オリジナルアーティスト",
//             start: "開始タイムスタンプ",
//             end: "終了タイムスタンプ",
//         }[]
//     }[]
// }[]
//
// playlist: (playlist): {
//     name: "プレイリストの名前",
//     entries: (entry) {
//         vid: "動画の ID",
//         number: "動画の cue の番号",
//         start: "動画の開始タイムスタンプ",
//         end: "動画の終了タイムスタンプ",
//     }[]
// }
//
// 内部フォーマット
//
// database: (video id => video) {
//     id: "動画の ID",
//     title: "動画のタイトル",
//     date: "動画の日付",
//     time: "動画の時間",
//     cues: (cue) {...}[],
//     channel: (channel) {
//         id: "チャンネルの ID",
//         name: "チャンネル名",
//     }
// }

import { loadLocalStorage, saveLocalStorage, parseXSV } from "./util.js"

export const loadExternalScript = async (url) => {
	const { promise, resolve, reject } = Promise.withResolvers()

	const iframe = document.createElement("iframe")
	iframe.setAttribute("sandbox", "allow-scripts")
	iframe.hidden = true

	const cleanup = () => {
		clearTimeout(timerId)
		window.removeEventListener("message", onMessage)
		iframe.remove()
	}

	const onMessage = (event) => {
		if (event.source !== iframe.contentWindow || !event.data) return

		cleanup()
		if (event.data.error) {
			reject(new Error(event.data.error || "EXTERNAL SCRIPT ERROR: " + url.href))
			return
		}
		resolve(event.data)
	}

	const timerId = setTimeout(() => {
		cleanup()
		reject(new Error("TIMEOUT EXTERNAL SCRIPT: " + url.href))
	}, 3000)

	window.addEventListener("message", onMessage)

	const safeJson = (value) => JSON.stringify(value).replace(/</g, "\\u003c")
	iframe.srcdoc = `
		<!doctype html>
		<script type="module">
			const send = (payload) => {
				try {
					parent.postMessage(payload, "*")
				} catch (err) {
					parent.postMessage({ error: err.message }, "*")
				}
			}

			window.cb = send
			const s = document.createElement("script")
			s.src = ${safeJson(url.href)}
			s.onerror = () => send({ error: "LOAD FAILED: " + s.src })
			document.head.append(s)
		</script>
	`

	document.body.append(iframe)
	return promise
}

const readFileCommon = async (url) => {
	const format =
		url.searchParams.get("format") || url.pathname.match(/\.([A-Za-z0-9]+)$/)?.[1] || ""
	if (format.startsWith("json")) {
		const data = format.endsWith("p")
			? await loadExternalScript(url)
			: await fetch(url).then((res) => {
					if (!res.ok) throw new Error("STATUS ERROR: " + res.status)
					return res.json()
				})
		return { type: "json", data }
	} else if (format.startsWith("tsv") || format.startsWith("csv")) {
		const text = format.endsWith("p")
			? await loadExternalScript(url)
			: await fetch(url).then((res) => {
					if (!res.ok) throw new Error("STATUS ERROR: " + res.status)
					return res.text()
				})
		return { type: format.startsWith("tsv") ? "tsv" : "csv", data: text }
	} else {
		// 自動検出: JSON パースできたら JSON、その他でタブ文字があれば TSV、それ以外は CSV
		const text = await fetch(url).then((res) => {
			if (!res.ok) throw new Error("STATUS ERROR: " + res.status)
			return res.text()
		})
		try {
			const data = JSON.parse(text)
			return { type: "json", data }
		} catch {
			return { type: text.includes("\t") ? "tsv" : "csv", data: text }
		}
	}
}

const parseTimestamp = (text) => {
	// : で分割される、整数かつ 0 から 59 の間の 2 or 3 個の数
	const parts = (text || "")
		.trim()
		.split(":")
		.map((x) => +x)
	if (parts.length === 2) parts.unshift(0)
	const ok = parts.length === 3 && parts.every((p) => p === ~~p && p >= 0 && p < 60)
	if (!ok) return ""
	return parts.map((x) => String(x).padStart(2, "0")).join(":")
}

const formatDBJSON = (channels) => {
	const videoMap = {}
	const channelMap = {}
	for (const channel of channels) {
		channelMap[channel.id] ??= {
			id: channel.id,
			name: channel.name,
		}
		for (const video of channel.videos) {
			const cues = video.cues.map((t) => {
				const cue = {
					title: t.title || "",
					singer: t.singer || "",
					org_artist: t.org_artist || "",
					start: parseTimestamp(t.start),
					end: parseTimestamp(t.end),
				}
				return cue
			})
			if (cues.length === 0) continue

			videoMap[video.id] ??= {
				id: video.id || "",
				title: video.title || "",
				date: video.date || "",
				time: video.time || "",
				cues,
				channel: channelMap[channel.id],
			}
		}
	}
	return videoMap
}

const formatDBXSV = (text, delimiter) => {
	const columns = [
		"title",
		"singer",
		"org_artist",
		"start",
		"end",
		"vid",
		"vtitle",
		"vdate",
		"vtime",
		"cid",
		"cname",
	]
	const rows = parseXSV(text, delimiter, columns)
	const videoMap = {}
	const channelMap = {}

	for (const row of rows) {
		channelMap[row.cid] ??= {
			id: row.cid || "",
			name: row.cname || "",
		}
		videoMap[row.vid] ??= {
			id: row.vid || "",
			title: row.vtitle || "",
			date: row.date || "",
			time: row.time || "",
			cues: [],
			channel: channelMap[row.cid],
		}
		videoMap[row.vid].cues.push({
			title: row.title || "",
			singer: row.singer || "",
			org_artist: row.org_artist || "",
			start: parseTimestamp(row.start),
			end: parseTimestamp(row.end),
		})
	}
	return videoMap
}

const readDBFile = async (url) => {
	const { type, data } = await readFileCommon(url)
	switch (type) {
		case "json":
			return formatDBJSON(data)
		case "tsv":
			return formatDBXSV(data, "\t")
		case "csv":
			return formatDBXSV(data, ",")
	}
}

const formatPLJSON = (items) => {
	const result = {}
	if (!Array.isArray(items)) {
		if (items.name) {
			result.name = items.name
		}
		items = items.entries
	}
	result.entries = items.map((e) => {
		if (e.number == null) {
			return {
				vid: e.vid,
				number: null,
				start: parseTimestamp(e.start),
				end: parseTimestamp(e.end),
			}
		} else {
			return {
				vid: e.vid,
				number: e.number,
				start: null,
				end: null,
			}
		}
	})
	return result
}

const formatPLXSV = (text, delimiter) => {
	const columns = ["vid", "start", "end"]
	const rows = parseXSV(text, delimiter, columns)
	return rows.map((row) => {
		if (!row.start) {
			return {
				vid: row.vid,
				number: null,
				start: null,
				end: null,
			}
		} else if (row.start.includes(":")) {
			return {
				vid: row.vid,
				number: null,
				start: parseTimestamp(row.start),
				end: parseTimestamp(row.end),
			}
		} else {
			return {
				vid: row.vid,
				number: ~~row.start,
				start: null,
				end: null,
			}
		}
	})
}

const readPLFile = async (url) => {
	const { type, data } = await readFileCommon(url)
	const name = url.pathname.split("/").at(-1).split(".").at(0)
	switch (type) {
		case "json":
			return { name, ...formatPLJSON(data) }
		case "tsv":
			return { name, entries: formatPLXSV(data, "\t") }
		case "csv":
			return { name, entries: formatPLXSV(data, ",") }
	}
}

const loadDefaults = async () => {
	const params = new URLSearchParams(location.search)
	const defaults = params.get("defaults") ?? ""
	if (defaults.trim() === "") return

	const urls = defaults.split(",").map((x) => x.trim())

	try {
		const data = await Promise.all(
			urls.map((urlStr, index) => {
				if (!urlStr) return
				const url = new URL(urlStr, location.href)
				return index === 0 ? readDBFile(url) : readPLFile(url)
			}),
		)
		return {
			database: data[0] ?? [],
			playlists: data.slice(1).filter(Boolean),
		}
	} catch (err) {
		console.warn(err)
		console.warn("デフォルトデータの読み取りに失敗しました")
		return
	}
}

const getKey = (name) => `streamplayer.${name}`

const load = () => {
	const db = loadLocalStorage(getKey("database"))
	const pl = loadLocalStorage(getKey("playlists"))
	if (!db && !pl) return
	return {
		database: db ?? [],
		playlists: pl ?? [],
	}
}

export const saveStorage = (data) => {
	if (data.database) {
		saveLocalStorage(getKey("database"), data.database)
	}
	if (data.playlists) {
		saveLocalStorage(getKey("playlists"), data.playlists)
	}
}

export const clearStorage = () => {
	const prefix = getKey("")
	const keys = Object.keys(localStorage)
	for (const key of keys) {
		if (key.startsWith(prefix)) {
			localStorage.removeItem(key)
		}
	}
}

const empty = {
	database: {},
	playlists: [],
}

export const getInitData = async () => load() ?? (await loadDefaults()) ?? empty

// データベースのトラック一覧を抽出
export const extractAllTracks = (database) => {
	return Object.values(database).flatMap((video) => {
		return (video.cues || []).map((cue) => {
			return {
				...cue,
				vid: video.id,
				video,
			}
		})
	})
}

// プレイリストに該当するトラック一覧を抽出
export const extractPlaylistTracks = (playlist, database) => {
	return playlist.entries.map((entry) => {
		const video = database[entry.vid]
		const cue = video?.cues.find((cue, index) => {
			if (entry.number && entry.number - 1 === index) return true
			return cue.start === entry.start
		})
		return {
			title: cue?.title || "",
			singer: cue?.singer || "",
			org_artist: cue?.org_artist || "",
			start: entry.start || cue?.start || "",
			end: entry.end || cue?.end || "",
			vid: entry.vid,
			video,
		}
	})
}

// input からの文字列からデータベースの読み取り（自動判別）
export const readDBInput = (value) => {
	if (value.trimStart().startsWith("[")) {
		try {
			return formatDBJSON(JSON.parse(value))
		} catch {
			return
		}
	}
	if (value.includes("\t")) {
		return formatDBXSV(value, "\t")
	} else {
		return formatDBXSV(value, ",")
	}
}

// input からの文字列からプレイリストの読み取り（自動判別）
export const readPLInput = (value) => {
	if (value.trimStart().startsWith("[")) {
		try {
			return formatPLJSON(JSON.parse(value))
		} catch {
			return
		}
	}
	if (value.includes("\t")) {
		return formatPLXSV(value, "\t")
	} else {
		return formatPLXSV(value, ",")
	}
}

export const mergeDB = (base, newVal) => {
	const result = { ...base }
	for (const [key, val] of Object.entries(newVal)) {
		if (result[key]) {
			result[key] = {
				...result[key],
				cues: [...result[key].cues, ...val.cues],
			}
		} else {
			result[key] = val
		}
	}
	return result
}

// プレイリストの CSV 文字列化
export const playlistToCSV = (playlist) => {
	return playlist.entries
		.map((entry) => {
			if (entry.number) {
				return `${entry.vid},${entry.number}`
			} else {
				const arr = [entry.vid, entry.start, entry.end]
				while (arr.length && !arr.at(-1)) arr.pop()
				return arr.join(",")
			}
		})
		.join("\n")
}

export const databaseToJSON = (database) => {
	const channels = {}
	for (const video of Object.values(database)) {
		channels[video.channel.id] ??= {
			id: video.channel.id,
			name: video.channel.name,
			videos: [],
		}
		channels[video.channel.id].videos.push({
			id: video.id,
			title: video.title,
			date: video.date,
			time: video.time,
			cues: video.cues,
		})
	}
	return JSON.stringify(Object.values(channels), null, "\t")
}

export const databaseToTSV = (database) => {
	const rows = []
	for (const video of Object.values(database)) {
		for (const cue of video.cues) {
			rows.push(
				[
					cue.title,
					cue.singer,
					cue.org_artist,
					cue.start,
					cue.end,
					video.id,
					video.title,
					video.date,
					video.time,
					video.channel.id,
					video.channel.name,
				].join("\t"),
			)
		}
	}
	return rows.join("\n")
}
