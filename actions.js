import {
	getInitData,
	playlistToCSV,
	readDBInput,
	readPLInput,
	mergeDB,
	databaseToJSON,
	databaseToTSV,
	clearStorage,
	extractAllTracks,
	extractPlaylistTracks,
	saveStorage,
} from "./data.js"
import { downloadFile } from "./util.js"
import ytplayer from "./ytplayer.js"

export const createState = () => {
	return {
		database: null,
		playlists: null,

		// UI状態
		view: "database", // "database" | playlist index | "manage"
		isPlaylistExpanded: true,
		isPlaying: false,
		// 前後トラックを参照できるように直接持たずインデックスで持つ
		// playlist index が null は database を表す
		currentTrackRef: null, // [playlist index, track index]
		manageTab: "database", // "database" | playlist index | "new" | "clear"
		managePlaylistNameInput: "",
		manageTextareaValue: "",

		ytPlayer: null,
	}
}

export const actions = {
	init: async ({ state, update, dispatch }) => {
		const initData = await getInitData()

		state.database = initData.database
		state.playlists = initData.playlists

		update()

		// 更新して DOM 作成後に YouTube プレイヤーの初期化
		state.ytPlayer = await ytplayer({
			onNext: () => dispatch("nextTrack"),
		})
	},

	selectDatabase: ({ state }) => {
		state.view = "database"
	},

	togglePlaylistExpand: ({ state }) => {
		state.isPlaylistExpanded = !state.isPlaylistExpanded
	},

	selectPlaylist: ({ state }, index) => {
		state.view = index
	},

	toggleManageView: ({ state }) => {
		if (state.view === "manage") {
			state.view = "database"
		} else {
			state.view = "manage"
			actions.selectManageTab({ state }, "database")
		}
	},

	selectManageTab: ({ state }, tabName) => {
		state.manageTab = tabName
		if (tabName === "database" || tabName === "new" || tabName === "clear") {
			state.managePlaylistNameInput = ""
			state.manageTextareaValue = ""
		} else {
			const playlist = state.playlists[tabName]
			if (playlist) {
				state.managePlaylistNameInput = playlist.name
				state.manageTextareaValue = playlistToCSV(playlist)
			}
		}
	},

	clearStorage: ({ noUpdate }) => {
		if (!confirm("ローカルデータをクリアしますか？")) {
			return noUpdate
		}
		clearStorage()
		alert("ローカルデータをクリアしました")
	},

	dbAdd: ({ state, noUpdate }) => {
		const database = readDBInput(state.manageTextareaValue)
		if (!database) {
			alert("入力形式が不正です")
			return noUpdate
		}

		state.database = mergeDB(state.database, database)
		state.manageTextareaValue = ""
		saveStorage({ database: state.database })
		alert("データベースに追加しました")
	},

	dbReplace: ({ state, noUpdate }) => {
		const database = readDBInput(state.manageTextareaValue)
		if (!database) {
			alert("入力形式が不正です")
			return noUpdate
		}

		state.database = database
		state.manageTextareaValue = ""
		saveStorage({ database: state.database })
		alert("データベースを置換しました")
	},

	dbDownloadJson: ({ state, noUpdate }) => {
		const json = databaseToJSON(state.database)
		downloadFile(json, "database.json", "application/json")
		return noUpdate
	},

	dbDownloadTsv: ({ state, noUpdate }) => {
		const tsv = databaseToTSV(state.database)
		downloadFile(tsv, "database.tsv", "text/tsv")
		return noUpdate
	},

	playlistUpdate: ({ state, noUpdate }) => {
		const entries = readPLInput(state.manageTextareaValue)
		if (!entries) {
			alert("入力形式が不正です")
			return noUpdate
		}

		state.playlists = state.playlists.with(state.manageTab, {
			name: state.managePlaylistNameInput.trim(),
			entries,
		})
		saveStorage({ playlists: state.playlists })
		alert("プレイリストを更新しました")
	},

	playlistDownload: ({ state, noUpdate }) => {
		const playlist = state.playlists[state.manageTab]
		const csv = playlistToCSV(playlist)
		downloadFile(csv, `${playlist.name}.csv`, "text/csv")
		return noUpdate
	},

	playlistDelete: ({ state, noUpdate }) => {
		if (!confirm(`プレイリスト「${state.manageTab}」を削除しますか？`)) {
			return noUpdate
		}
		state.playlists = state.playlists.toSpliced(state.manageTab, 1)
		saveStorage({ playlists: state.playlists })
		alert("プレイリストを削除しました")
		actions.selectManageTab({ state }, "new")
	},

	playlistAdd: ({ state, noUpdate }) => {
		const entries = readPLInput(state.manageTextareaValue)
		if (!entries) {
			alert("入力形式が不正です")
			return noUpdate
		}

		state.playlists = [
			...state.playlists,
			{
				name: state.managePlaylistNameInput.trim(),
				entries,
			},
		]
		saveStorage({ playlists: state.playlists })
		alert("プレイリストを追加しました")
		actions.selectManageTab({ state }, state.playlists.length - 1)
	},

	playTrack: ({ state, noUpdate }, trackRef) => {
		const [plIndex, trackIndex] = trackRef
		const tracks =
			plIndex == null
				? extractAllTracks(state.database)
				: extractPlaylistTracks(state.playlists[plIndex], state.database)
		const track = tracks[trackIndex]
		const nextTrack = tracks[trackIndex + 1]
		if (!track) {
			state.ytPlayer.stop()
			return noUpdate
		}

		state.currentTrackRef = trackRef
		state.isPlaying = true
		state.ytPlayer.play(track, nextTrack)
	},

	togglePlay: ({ state, noUpdate }) => {
		if (!state.currentTrackRef) return noUpdate
		if (state.isPlaying) {
			state.ytPlayer.pause()
		} else {
			state.ytPlayer.resume()
		}
		state.isPlaying = !state.isPlaying
	},

	prevTrack: ({ state, noUpdate }) => {
		if (!state.currentTrackRef) return noUpdate

		const [plIndex, trackIndex] = state.currentTrackRef
		actions.playTrack({ state }, [plIndex, trackIndex - 1])
	},

	nextTrack: ({ state, noUpdate }) => {
		if (!state.currentTrackRef) return noUpdate

		const [plIndex, trackIndex] = state.currentTrackRef
		actions.playTrack({ state }, [plIndex, trackIndex + 1])
	},
}
