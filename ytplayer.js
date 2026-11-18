import debug from "./debug.js"

export default async ({ onNext }) => {
	await window.ytAPIReady

	const players = Array(2)
		.fill()
		.map((_, i) => {
			let playing = false
			const player = new YT.Player(`ytplayer${i}`, {
				width: "240",
				height: "180",
				playerVars: {
					controls: 0,
				},
				events: {
					onStateChange: ({ data }) => {
						debug("player-state-change", { playerIndex: i, state: data })
						if (data === YT.PlayerState.PLAYING) {
							playing = true
						} else if (data === YT.PlayerState.ENDED) {
							const isEnd = playing
							playing = false
							if (isEnd) {
								onNext()
							}
						}
					},
				},
			})
			player.getIframe().dataset.layer = "back"
			return player
		})

	let frontIndex = 0
	const getPlayers = () => {
		const backIndex = +!frontIndex
		return [players[frontIndex], players[backIndex]]
	}
	const timestampToSeconds = (ts) => {
		const [seconds, minutes, hours] = ts
			.split(":")
			.map((x) => ~~x.trim())
			.reverse()
		return ~~hours * 3600 + ~~minutes * 60 + seconds
	}

	let preparedTrack = null

	return {
		play: (track, nextTrack) => {
			const [front, back] = getPlayers()

			const isPrepared = !!(
				preparedTrack &&
				track.vid === preparedTrack.vid &&
				track.start === preparedTrack.start &&
				track.end === preparedTrack.end
			)
			preparedTrack = nextTrack

			if (isPrepared) {
				front.stopVideo()
				back.playVideo()

				// 切り替え
				frontIndex = +!frontIndex
				front.getIframe().dataset.layer = "back"
				back.getIframe().dataset.layer = "front"

				if (nextTrack) {
					front.cueVideoById({
						videoId: nextTrack.vid,
						startSeconds: timestampToSeconds(nextTrack.start),
						endSeconds: timestampToSeconds(nextTrack.end),
					})
				}
			} else {
				front.getIframe().dataset.layer = "front"
				back.getIframe().dataset.layer = "back"

				front.loadVideoById({
					videoId: track.vid,
					startSeconds: timestampToSeconds(track.start),
					endSeconds: timestampToSeconds(track.end),
				})
				if (nextTrack) {
					back.cueVideoById({
						videoId: nextTrack.vid,
						startSeconds: timestampToSeconds(nextTrack.start),
						endSeconds: timestampToSeconds(nextTrack.end),
					})
				}
			}
		},
		pause: () => {
			const [front] = getPlayers()
			front.pauseVideo()
		},
		resume: () => {
			const [front] = getPlayers()
			front.playVideo()
		},
		stop: () => {
			const [front, back] = getPlayers()
			front.stopVideo()
			front.getIframe().dataset.layer = "back"
			back.getIframe().dataset.layer = "back"
		},
	}
}
