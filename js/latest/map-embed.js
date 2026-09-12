// map.js側のwindow.maplibregl/maplibreglreadyという橋渡しは、
// map-features.jsが既に直接importしているのと同じ理由でここでも
// 不要（ESモジュールはimportの解決を待ってから本体が実行されるため）。
// 直接importすることでより単純になる。
import * as maplibregl from "https://unpkg.com/maplibre-gl@6.9.0/dist/maplibre-gl.mjs";

export let map;
let resolveMapReady;
const mapReady = new Promise((resolve) => {resolveMapReady = resolve;});
const style = "https://tiles.openfreemap.org/styles/liberty";

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
};

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
};

let initialSettings = null; // setInitialMapSettingsが呼ばれるまでnull（＝まだ埋め込み待ち）

// initialSettingsが揃った時点でのみ地図を生成する
function tryEmbed() {
    if (initialSettings === null || map) return;

    const center = initialSettings.center || [getRandomInt(0, 360), getRandomInt(-90, 90)];
    const zoom = initialSettings.zoom || getRandomFloat(1.5, 3);
    const bounds = initialSettings.bounds || null;

    map = new maplibregl.Map({
        container: "map",
        style: style,
        center: center,
        zoom: zoom,
        maxBounds: bounds,
        bearing: 0,
        pitch: 0,
        scrollZoom: true,
        projection: "globe",
        attributionControl: false
    });
    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    // "load"は一度しか発火しないため、以後は必ずmapReadyを介して同期する
    map.on("load", () => resolveMapReady());
};

// map.js側がJSON取得後（obj.mapが分かった時点）に一度だけ呼ぶ
// obj.mapが無いJSONの場合はundefinedを渡せばランダム値にフォールバック
export function setInitialMapSettings(mapSettings) {
    initialSettings = mapSettings || {};
    tryEmbed();
};

export {mapReady};