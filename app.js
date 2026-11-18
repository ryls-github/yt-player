import { render } from "lit-html"
import debug from "./debug.js"

export const app = ({ createState, view, actions, root }) => {
	// アプリケーション状態
	const state = createState()

	// レンダリング関数
	const update = () => {
		render(view(state, dispatch), root)
	}

	// 自動更新スキップ用シンボル
	const NO_UPDATE = Symbol("NO_UPDATE")

	// 共通ディスパッチャー関数
	const dispatch = (type, params) => {
		debug("DISPATCH", { type, params })

		const action = actions[type]
		if (!action) {
			console.warn(`Unknown action type: ${type}`)
			return
		}

		const context = {
			state,
			update,
			noUpdate: NO_UPDATE,
			dispatch,
		}

		const result = action(context, params)

		// noUpdate 以外なら自動的に画面を更新
		if (result instanceof Promise) {
			result.then((res) => {
				if (res !== NO_UPDATE) {
					update()
				}
			})
		} else if (result !== NO_UPDATE) {
			update()
		}
	}

	return dispatch
}
