import { html } from "lit-html"
import { when } from "lit-html/directives/when.js"
import { choose } from "lit-html/directives/choose.js"
import { classMap } from "lit-html/directives/class-map.js"
import { extractAllTracks, extractPlaylistTracks } from "./data.js"

/* =========================================================
SVG アイコンコンポーネント
========================================================= */

const iconDatabase = () => html`
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
	>
		<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
		<path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
		<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
	</svg>
`

const iconPlaylist = () => html`
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
	>
		<line x1="3" y1="6" x2="21" y2="6"></line>
		<line x1="3" y1="12" x2="21" y2="12"></line>
		<line x1="3" y1="18" x2="16" y2="18"></line>
	</svg>
`

const iconPlaySmall = () => html`
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
	>
		<polygon points="5 3 19 12 5 21 5 3"></polygon>
	</svg>
`

const iconPlay = () => html`
	<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
		<polygon points="5 3 19 12 5 21 5 3"></polygon>
	</svg>
`

const iconPause = () => html`
	<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
		<rect x="6" y="4" width="4" height="16"></rect>
		<rect x="14" y="4" width="4" height="16"></rect>
	</svg>
`

const iconPrev = () => html`
	<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
		<polygon points="19 20 9 12 19 4 19 20"></polygon>
		<line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2"></line>
	</svg>
`

const iconNext = () => html`
	<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
		<polygon points="5 4 15 12 5 20 5 4"></polygon>
		<line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2"></line>
	</svg>
`

const iconSettings = () => html`
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
	>
		<circle cx="12" cy="12" r="3"></circle>
		<path
			d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
		></path>
	</svg>
`

const iconCoverArt = () => html`
	<svg
		width="32"
		height="32"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
	>
		<circle cx="12" cy="12" r="10"></circle>
		<polygon points="10 8 16 12 10 16 10 8"></polygon>
	</svg>
`

/* =========================================================
ユーティリティ
========================================================= */

const channelURL = (cid) => {
	return `https://www.youtube.com/channel/${cid}`
}

const videoURL = (vid) => {
	return `https://www.youtube.com/watch?v=${vid}`
}

const getCurrentTrack = (state) => {
	const ref = state.currentTrackRef
	if (!ref) return []

	const [plIndex, trackIndex] = ref

	const tracks =
		plIndex == null
			? extractAllTracks(state.database)
			: extractPlaylistTracks(state.playlists[plIndex], state.database)

	return tracks[trackIndex]
}

const getTrackList = (state) => {
	if (state.view === "database") {
		return {
			title: "データベース",
			plIndex: null,
			tracks: extractAllTracks(state.database),
		}
	} else {
		const currentPlaylist = state.playlists[state.view]
		if (currentPlaylist) {
			return {
				title: `プレイリスト: ${currentPlaylist.name}`,
				plIndex: state.view,
				tracks: extractPlaylistTracks(currentPlaylist, state.database),
			}
		} else {
			return {
				title: "",
				plIndex: null,
				tracks: [],
			}
		}
	}
}

/* =========================================================
メインレイアウト
========================================================= */

export const view = (state, dispatch) => {
	return html`
		<div class="contents">
			${renderSidebar(state, dispatch)}
			<div class="list">
				${choose(state.view, [["manage", () => renderManageView(state, dispatch)]], () =>
					renderTableView(state, dispatch),
				)}
			</div>
		</div>
		${renderFooter(state, dispatch)}
	`
}

/* =========================================================
サイドバー
========================================================= */

const renderSidebar = (state, dispatch) => {
	return html`
		<div class="sidebar">
			<div class="sidebar-nav">
				<button
					class=${classMap({ "nav-item": true, active: state.view === "database" })}
					@click=${() => dispatch("selectDatabase")}
				>
					${iconDatabase()}
					<span>データベース</span>
				</button>

				<button
					class=${classMap({
						"nav-item": true,
						"nav-playlist-toggle": true,
						active: typeof state.view === "number",
					})}
					@click=${() => dispatch("togglePlaylistExpand")}
				>
					<div style="display: flex; align-items: center; gap: 10px;">
						${iconPlaylist()}
						<span>プレイリスト</span>
					</div>
					<span class=${classMap({ chevron: true, open: state.isPlaylistExpanded })}
						>▶</span
					>
				</button>

				${when(
					state.isPlaylistExpanded && state.playlists,
					() => html`
						<div class="playlist-sublist">
							${state.playlists.map(
								(pl, idx) => html`
									<button
										class=${classMap({
											"playlist-item": true,
											active: state.view === idx,
										})}
										@click=${() => dispatch("selectPlaylist", idx)}
									>
										${iconPlaySmall()}
										<span>${pl.name}</span>
									</button>
								`,
							)}
						</div>
					`,
				)}
			</div>

			<div class="sidebar-art">
				<div class="dummy-art">
					${iconCoverArt()}
					<span>Now Playing Cover</span>
				</div>
				<div id="ytplayer0" class="player" data-layer="front"></div>
				<div id="ytplayer1" class="player" data-layer="back"></div>
			</div>
		</div>
	`
}

/* =========================================================
テーブル（トラック一覧）
========================================================= */

// トラック1行のレンダリング
const renderTrackRow = (track, plIndex, trackIndex, isCurrent, dispatch) => {
	const video = track.video
	const channel = video?.channel

	return html`
		<tr
			class=${classMap({ playing: Boolean(isCurrent) })}
			@dblclick=${() => dispatch("playTrack", [plIndex, trackIndex])}
		>
			<td class="track-num">${trackIndex + 1}</td>
			<td>
				<span class="track-title"> ${track.title || "-"} </span>
			</td>
			<td>
				<div class="artist-text">
					<span>${track.singer || "-"}</span>
					${when(track.org_artist, () => html`<span class="artist-org"> / ${track.org_artist}</span>`)}
				</div>
			</td>
			<td>
				${when(
					channel,
					() =>
						html`<a
							href="${channelURL(channel.id)}"
							target="_blank"
							class="channel-link"
							>${channel.name}</a
						>`,
					() => html`-`,
				)}
			</td>
			<td>
				<a href="${videoURL(track.vid)}" target="_blank" class="video-link-text">
					${when(
						video,
						() => html`${video.title} [${video.date || ""}]`,
						() => html`${track.vid}`,
					)}
					/ ${track.start}-${track.end}
				</a>
			</td>
		</tr>
	`
}

const renderTableView = (state, dispatch) => {
	if (!state.database || !state.playlists) {
		return html`<div style="padding: 24px; color: var(--text-muted);">読み込み中...</div>`
	}
	const { title, plIndex, tracks } = getTrackList(state)
	const currentTrack = getCurrentTrack(state)

	return html`
		<div class="list-header">
			<h2 class="list-title">
				${title}
				<span class="list-count">${tracks.length} 曲</span>
			</h2>
		</div>
		<div class="table-container">
			<table class="track-table">
				<thead>
					<tr>
						<th style="width: 40px; text-align: center;">#</th>
						<th style="min-width: 240px">Title</th>
						<th style="min-width: 200px">Artist/Original</th>
						<th style="min-width: 200px">Channel</th>
						<th>Video</th>
					</tr>
				</thead>
				<tbody>
					${tracks.map((track, idx) => {
						// アクティブなプレイリスト外でも同じ曲は再生中扱い
						const isCurrent =
							currentTrack &&
							currentTrack.vid === track.vid &&
							currentTrack.start === track.start
						return renderTrackRow(track, plIndex, idx, isCurrent, dispatch)
					})}
				</tbody>
			</table>
		</div>
	`
}

/* =========================================================
管理画面
========================================================= */

const getManageCategory = (manageTab) => {
	if (manageTab === "database") return "database"
	if (manageTab === "new") return "new"
	if (manageTab === "clear") return "clear"
	return "existing"
}

// 管理画面の上部タブ群
const renderManageTabs = (state, manageCategory, dispatch) => {
	return html`
		<div class="manage-tabs">
			<button
				class=${classMap({ "manage-tab-btn": true, active: manageCategory === "database" })}
				@click=${() => dispatch("selectManageTab", "database")}
			>
				データベース
			</button>
			${(state.playlists || []).map(
				(pl, index) => html`
					<button
						class=${classMap({ "manage-tab-btn": true, active: state.manageTab === index })}
						@click=${() => dispatch("selectManageTab", index)}
					>
						${pl.name}
					</button>
				`,
			)}
			<button
				class=${classMap({ "manage-tab-btn": true, active: manageCategory === "new" })}
				@click=${() => dispatch("selectManageTab", "new")}
			>
				+ 新プレイリスト
			</button>
			<button
				class=${classMap({ "manage-tab-btn": true, active: manageCategory === "clear" })}
				@click=${() => dispatch("selectManageTab", "clear")}
			>
				データクリア
			</button>
		</div>
	`
}

// 管理画面のアクションボタン群
const renderManageActions = (manageCategory, dispatch) => {
	return html`
		<div class="manage-actions">
			${choose(manageCategory, [
				[
					"database",
					() => html`
						<button class="btn-primary" @click=${() => dispatch("dbAdd")}>追加</button>
						<button class="btn-primary" @click=${() => dispatch("dbReplace")}>
							置換
						</button>
						<button class="btn-primary" @click=${() => dispatch("dbDownloadJson")}>
							ダウンロード(JSON)
						</button>
						<button class="btn-primary" @click=${() => dispatch("dbDownloadTsv")}>
							ダウンロード(TSV)
						</button>
					`,
				],
				[
					"existing",
					() => html`
						<button class="btn-primary" @click=${() => dispatch("playlistUpdate")}>
							更新
						</button>
						<button class="btn-primary" @click=${() => dispatch("playlistDownload")}>
							ダウンロード
						</button>
						<button class="btn-danger" @click=${() => dispatch("playlistDelete")}>
							削除
						</button>
					`,
				],
				[
					"new",
					() => html`
						<button class="btn-primary" @click=${() => dispatch("playlistAdd")}>
							追加
						</button>
					`,
				],
			])}
		</div>
	`
}

const renderManageView = (state, dispatch) => {
	const manageCategory = getManageCategory(state.manageTab)

	return html`
		<div class="list-header">
			<h2 class="list-title">${iconSettings()} 管理画面</h2>
		</div>
		<div class="manage-view">
			${renderManageTabs(state, manageCategory, dispatch)}
			${when(
				manageCategory === "clear",
				() => html`
					<div class="manage-clear">
						<p class="manage-clear-message">
							ローカルに保存したデータをすべて削除します
						</p>
						<div class="manage-clear-action">
							<button class="btn-danger" @click=${() => dispatch("clearStorage")}>
								ローカルデータのクリア
							</button>
						</div>
					</div>
				`,
				() => html`
					<div class="manage-form">
						${when(
							manageCategory !== "database",
							() => html`
								<input
									type="text"
									class="manage-input"
									placeholder="プレイリスト名"
									.value=${state.managePlaylistNameInput}
									@input=${(e) => {
										state.managePlaylistNameInput = e.target.value
									}}
								/>
							`,
						)}

						<textarea
							class="manage-textarea"
							placeholder=${manageCategory === "database" ? "追加・置換するデータベースデータ" : "プレイリストのデータ"}
							.value=${state.manageTextareaValue}
							@input=${(e) => {
								state.manageTextareaValue = e.target.value
							}}
						></textarea>

						${renderManageActions(manageCategory, dispatch)}
					</div>
				`,
			)}
		</div>
	`
}

/* =========================================================
フッター
========================================================= */

const renderFooter = (state, dispatch) => {
	const currentTrack = getCurrentTrack(state)

	return html`
		<footer>
			<div class="footer-left">
				<button
					class="ctrl-btn play-btn"
					@click=${() => dispatch("togglePlay")}
					title=${state.isPlaying ? "一時停止" : "再生"}
				>
					${state.isPlaying ? iconPause() : iconPlay()}
				</button>
				<button class="ctrl-btn" @click=${() => dispatch("prevTrack")} title="前の曲">
					${iconPrev()}
				</button>
				<button class="ctrl-btn" @click=${() => dispatch("nextTrack")} title="次の曲">
					${iconNext()}
				</button>
			</div>

			<div class="footer-center">
				${when(
					currentTrack,
					() => html`
						<div class="now-playing-title">${currentTrack.title}</div>
						<div class="now-playing-sub">
							${currentTrack.singer || ""}
							${when(currentTrack.org_artist, () => ` / ${currentTrack.org_artist}`)}
						</div>
					`,
					() => html`
						<div class="now-playing-title" style="color: var(--text-sub);">
							曲を選択してください
						</div>
					`,
				)}
			</div>

			<div class="footer-right">
				<button
					class=${classMap({ "settings-btn": true, active: state.view === "manage" })}
					@click=${() => dispatch("toggleManageView")}
					title="管理画面"
				>
					${iconSettings()}
				</button>
			</div>
		</footer>
	`
}
