import css from "./style.css" with { type: "css" }
import { view } from "./views.js"
import { createState, actions } from "./actions.js"
import { app } from "./app.js"

document.adoptedStyleSheets = [css]
const root = document.getElementById("root")

// アプリケーションの開始
app({
	createState,
	actions,
	view,
	root,
})("init")
