# Changelog

Go Out組織にデジタル地図サイトを構築するための共有SDK（フレームワーク）の更新履歴です。
このプロジェクトは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) の形式に従います。

## [Unreleased]
 
## [js v1] - 2026-09-24

### Added
- `common.js`に`isSameAsCurrentPage`を追加。`renderInfo`・`date.js`の`readmeThis`のリンク描画で、現在表示中のページと同一URL（`/`始まり・パラメーター付き、パラメーターの順不同を許容）のリンクは生成しない
### Fixed
- `map-features.js`のマーカークリックで`stopPropagation`しておらず、マーカーの真下にラインがある場合、ラインのクリック判定も同時に発火してしまっていた不具合を修正（マーカーを優先）
- `map-spot.js`の`openLineClickEvent`で、地図上のラインをクリックした際、`note`・`links`が文字列化されずに渡ってくる場合に`JSON.parse`がSyntaxErrorになっていた不具合を修正
- `map-spot.js`の`spotImage`・`spotVideo`が、閉じるボタンに毎回新しく`addEventListener`しており、スポットを見るたびにリスナーが積み上がっていた不具合を修正（一度だけ登録するよう統一）


## [css v1 / js v1] - 2026-09-18

### Added
- WebGL2非対応ブラウザ・端末向けのフォールバック表示
- canonical URL・JSON-LD構造化データの出力（SEO対応）
- コメント付きJSONテンプレート（`templates/map.jsonc`・`templates/date.jsonc`）
### Changed
- Mapbox GL JSからMapLibre GL JSに移行
- 通常スクリプトからESモジュールに全面移行
- `map.js`を`map-embed.js`・`map-features.js`・`map-line.js`・`map-cover.js`・`map-spot.js`・`date-event.js`に分割
- 他リポジトリ参照のパスを、ドメインルート基準（`/リポジトリ名/...`）の書き方に統一
- `date`（更新日）を`lastModified`に、`date`（季節イベント外部参照）を`eventsJSON`にリネーム
### Fixed
- ダイアログを閉じても動画キャンバスの描画ループが止まらない不具合
- 季節イベントの絞り込みUIが、CSSにより`hidden`属性を無視して表示され続ける不具合
- `info.links`のURLが`/`始まりの場合に余計なパスが付与される不具合
- `map-spot.js`の`openLineClickEvent`で、地図上のラインをクリックした際、`note`・`links`が
  文字列化されずに渡ってくる場合に`JSON.parse`がSyntaxErrorになっていた不具合を修正
- `map-spot.js`の`spotImage`・`spotVideo`が、閉じるボタンに毎回新しく`addEventListener`しており、
  スポットを見るたびにリスナーが積み上がっていた不具合を修正（一度だけ登録するよう統一）
___

### リリース手順
1. 新しい `vN` フォルダを作成する
2. 最新のコードをそこにコピーする
3. `/latest` を同じ内容で上書きする
4. この CHANGELOG.md に追記する
（慣れてきたら、タグpush時にこの一連の処理を行うGitHub Actionsへの置き換えを検討する）

## 運用ルール
- リリースごとに `v1`・`v2`... のようにバージョンフォルダを記録する
- `/latest` は常に最新版を指す（自動追従用に上書きする）
- CSSとJSはそれぞれ独立したバージョン番号で管理する（CSSは変更頻度が低く、JSは頻繁に変わる想定のため）
- 各サイトからは、常に最新を追従したい場合は `/latest/index.js`、バージョンを固定したい場合は `/v1/index.js` のように読み込む
