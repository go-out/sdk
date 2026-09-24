// ESモジュールは常にstrict modeなので "use strict" は不要

// "/"始まり・パラメーター付きのurlが、今表示しているページと同一かどうかを判定する。
// パラメーターの順番が違っても同一とみなせるよう、キー・値の集合で比較する
// （"/"始まりでない、またはパラメーターを含まないurlは対象外＝常にfalse）
export function isSameAsCurrentPage(url) {
    if (typeof url !== "string" || !url.startsWith("/") || !url.includes("?")) return false;
    try {
        const target = new URL(url, location.origin);
        if (target.pathname !== location.pathname) return false;
        const targetParams = new URLSearchParams(target.search);
        const currentParams = new URLSearchParams(location.search);
        const targetKeys = [...targetParams.keys()];
        if (targetKeys.length !== [...currentParams.keys()].length) return false;
        return targetKeys.every(key => currentParams.get(key) === targetParams.get(key));
    } catch (error) {
        return false;
    };
};

// 汎用JSON取得
export async function fetchJSON(url) {
    const response = await fetch(new Request(url));
    if (!response.ok) {
        throw new Error(`fetchJSON: ${url} -> HTTP ${response.status}`);
    };
    const text = await response.text();
    return JSON.parse(text);
};

// info（markdown / note / links）をコンテナに描画する汎用処理
// containers: { notes: Element|null, links: Element|null }
export function renderInfo(info, containers) {
    const { notes, links } = containers;

    if (info && (info.markdown || info.note)) {
        if (notes) {
            notes.hidden = false;
            if (info.markdown) {
                fetch(info.markdown)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`renderInfo: ${info.markdown} -> HTTP ${response.status}`);
                        };
                        return response.text();
                    })
                    .then(text => {
                        const p = document.createElement("p");
                        p.innerText = text;
                        notes.appendChild(p);
                    })
                    .catch(error => console.error(error));
            } else if (info.note) {
                notes.innerHTML = "";
                for (const note of info.note) {
                    const p = document.createElement("p");
                    p.innerHTML = note;
                    notes.appendChild(p);
                };
            };
        };
    } else if (notes) {
        notes.hidden = true;
    };

    if (info && info.links) {
        if (links) {
            links.innerHTML = "";
            for (const link of info.links) {
                if (isSameAsCurrentPage(link.url)) continue;
                const a = document.createElement("a");
                a.href = link.url;
                a.target = link.target;
                a.textContent = link.text;
                links.appendChild(a);
            };
            links.hidden = links.childElementCount === 0;
        };
    } else if (links) {
        links.hidden = true;
    };
};

// イベント1件分（タイトル・note・description）をコンテナに描画する汎用処理
export function renderEventDetails(container, eventObj) {
    if (eventObj.title) {
        const h3 = document.createElement("h3");
        h3.textContent = `${eventObj.title[0]} `;
        if (eventObj.title[1]) {
            const small = document.createElement("small");
            small.textContent = eventObj.title[1];
            h3.appendChild(small);
        };
        container.appendChild(h3);
    };

    if (eventObj.note) {
        const note = document.createElement("ruby");
        note.textContent = `${eventObj.note[1]} `;
        if (eventObj.note[0]) {
            const rt = document.createElement("rt");
            rt.textContent = eventObj.note[0];
            note.appendChild(rt);
        };
        container.appendChild(note);
    };

    if (eventObj.description) {
        const p = document.createElement("p");
        p.textContent = eventObj.description;
        container.appendChild(p);
    };
};

// 配列シャッフル（Fisher–Yates）
export function shuffle(arrays) {
    const array = arrays.slice();
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    };
    return array;
};

// canonical URL（<link rel="canonical">）を設定する。無ければ要素ごと追加する
export function setCanonical(url) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
    };
    link.href = url;
};

// JSON-LD構造化データ（<script type="application/ld+json">）を設定する。
// Googleの検索結果でのリッチ表示に使われる。無ければ要素ごと追加する
export function setStructuredData(data) {
    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        document.head.appendChild(script);
    };
    script.textContent = JSON.stringify(data);
};

// 範囲内のランダムな整数
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
};

// 範囲内のランダムな小数
export function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
};