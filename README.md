# sdk

Go Out組織のデジタル地図サイト群が共有して読み込む、JS/CSSのフレームワーク（SDK）です。
各サイト（地域ごとのリポジトリ）は、このリポジトリが公開するファイルを絶対URLで読み込んで動作します。

## 使い方

各サイトのHTMLから、必要なファイルを直接読み込みます。

```html
<script type="module" src="https://go-out.github.io/sdk/js/v1/map.js"></script>
<link rel="stylesheet" href="https://go-out.github.io/sdk/css/v1/style.css">
```

- 常に最新を追従したい場合は、パスの`v1`部分を`latest`に置き換える
- バージョンを固定したい場合は、`v1`（`v2`...）のまま使う
- CSSとJSはそれぞれ独立したバージョン番号で管理している（更新頻度が異なるため）

バージョニングの運用ルールは [CHANGELOG.md](./CHANGELOG.md) を参照してください。

## 構成

```
sdk/
├── js/v1/
│   ├── common.js        共通ユーティリティ（fetchJSON・renderInfo・SEO関連など）
│   ├── date.js           dateページ（カレンダー）のエントリーポイント
│   ├── date-event.js     季節イベントの絞り込み表示
│   ├── map.js            mapページのエントリーポイント
│   ├── map-embed.js      地図の埋め込み・初期設定
│   ├── map-features.js   マーカー表示
│   ├── map-line.js       ルートライン表示
│   ├── map-cover.js      写真ギャラリー風のカバー表示
│   ├── map-spot.js       クリック時のモーダル表示・地図移動
│   └── weather.js        天気ウィジェット（OpenWeatherMap）
├── css/v1/
│   ├── style.css         全ページ共通のベーススタイル（header/h1のベース構造・#linksなど）
│   ├── date.css          dateページ専用スタイル
│   ├── date-event.css    季節イベントUI（#events）・詳細モーダルのスタイル
│   ├── map-cover.css     mapページ専用: 写真ギャラリー風のヘッダー表示
│   ├── map-main.css      mapページ専用: 地図まわり全体のレイアウト
│   └── map-spot.css      写真・動画ビューアモーダル（dialog#spot）のスタイル
├── assets/               favicon・フォント（バージョン管理対象外の共有静的資材）
└── CHANGELOG.md
```

## JSONの書き方

各サイトが読み込むJSONの雛形（コメント付き）は `templates/map.jsonc`・`templates/date.jsonc` を参照してください。実データを書く際はコメント行を削除して使います。

## 開発・動作確認

VS Codeの「Live Server」拡張でローカル確認しています。ローカル確認用の`*.html`・`*.json`・`little-person.md`はこのリポジトリには含めていません（`.gitignore`参照）。実際のサイト構築は、別のテンプレートリポジトリ側で行います。