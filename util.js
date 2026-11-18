// ファイルダウンロード補助
export const downloadFile = (content, filename, mimeType) => {
	const blob = new Blob([content], { type: mimeType })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}

const parseJSON = (text, defaultVal) => {
	try {
		return JSON.parse(text)
	} catch {
		console.warn("JSON の読み取りに失敗しました: " + text.slice(0, 100))
		return defaultVal
	}
}

export const loadLocalStorage = (key, defaultVal) => {
	return localStorage[key] === undefined ? defaultVal : parseJSON(localStorage[key])
}

export const saveLocalStorage = (key, value) => {
	localStorage[key] = JSON.stringify(value)
}

// CSV や TSV のパース
export const parseXSV = (text, delimiter = ",", headers = null) => {
	if (typeof text !== "string" || text.length === 0) {
		return []
	}

	// 改行コードをあらかじめ \n に統一
	const normalizedText = text.replace(/\r\n|\r/g, "\n")

	const rows = []
	let currentRow = []
	let currentField = ""
	let inQuotes = false

	const commitRow = () => {
		currentRow.push(currentField)
		currentField = ""
		// 空行（フィールドが1つだけで空文字または空白）でなければ追加
		if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== "")) {
			rows.push(currentRow)
		}
		currentRow = []
	}

	for (let i = 0; i < normalizedText.length; i++) {
		const char = normalizedText[i]
		const nextChar = normalizedText[i + 1]

		if (inQuotes) {
			if (char === '"') {
				if (nextChar === '"') {
					// 連続する "" は1つのダブルクオートとしてエスケープ
					currentField += '"'
					i++
				} else {
					// クオート終了
					inQuotes = false
				}
			} else {
				// クオート内は区切り文字や改行も含めてそのまま蓄積
				currentField += char
			}
		} else {
			if (char === '"') {
				inQuotes = true
			} else if (char === delimiter) {
				currentRow.push(currentField)
				currentField = ""
			} else if (char === "\n") {
				commitRow()
			} else {
				currentField += char
			}
		}
	}

	// 未確定のフィールド・行があればコミット
	if (currentField !== "" || currentRow.length > 0) {
		commitRow()
	}

	// 列名(headers)が渡されている場合はオブジェクト配列にマッピング
	if (Array.isArray(headers) && headers.length > 0) {
		return rows.map((row) =>
			Object.fromEntries(row.map((value, i) => [headers[i] ?? i, value])),
		)
	}

	return rows
}
