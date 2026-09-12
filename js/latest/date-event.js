import {fetchJSON, renderInfo, renderEventDetails, siki, sikiNow} from "./common.js";

// HTML側の静的なラジオボタンのid（#events fieldset内）と対応
const TAB_IDS = ["spring", "summer", "autumne", "winter", "all"];

// obj.date（季節別に分かれた外部JSON） / obj.events（直接埋め込み）から
// eventAllArrを組み立て、#eventsに要素を生成する。
export async function processEvents(obj) {
    const eventAllArr = [];

    if (obj.eventsJSON) {
        for (const json of obj.eventsJSON) {
            const index = await fetchJSON(json);
            if (index.events) {
                eventAllArr.push(...index.events);
            };
        };
    };

    if (obj.events) {
        eventAllArr.push(...obj.events);
    };

    if (eventAllArr.length) {
        document.querySelector("#events").hidden = false;
        sortEvents(eventAllArr);
        renderEvents(eventAllArr);
    } else {
        document.querySelector("#events").hidden = true;
    };

    return eventAllArr;
};

// eventEach.dateの値から、月・日それぞれの並び替え用の数値を求める。
// 「毎」または値が無い場合は最後尾に来るよう、月は13、日は32を返す。
function monthSortValue(eventEach) {
    let month;
    if (eventEach.date && eventEach.date.month !== undefined) {
        month = eventEach.date.month;
    } else if (eventEach.month) {
        month = Math.min(...eventEach.month);
    };

    if (month === undefined || month === "毎") {
        return 13;
    };
    return Number(month);
};

function daySortValue(eventEach) {
    const date = eventEach.date && eventEach.date.date;
    if (date === undefined || date === "毎") {
        return 32;
    };
    const firstDay = Array.isArray(date) ? date[0] : date;
    if (firstDay === undefined || firstDay === "毎") {
        return 32;
    };

    const num = Number(firstDay);
    if (!isNaN(num)) {
        return num;
    };
    return 31.5;
};

// eventAllArrを 月(1〜12、最後に「毎」) → 日(date[0]、1〜31、最後に「毎」) の順に並び替える
function sortEvents(eventAllArr) {
    eventAllArr.sort((a, b) => {
        const monthDiff = monthSortValue(a) - monthSortValue(b);
        if (monthDiff !== 0) {
            return monthDiff;
        };
        return daySortValue(a) - daySortValue(b);
    });
};

// イベント1件が属するタブid（複数の場合あり）を判定する
function getTabIds(eventEach) {
    if (eventEach.date && eventEach.date.month == "毎") {
        return ["all"];
    } else if (eventEach.date && eventEach.date.month <= 12) {
        return [siki[eventEach.date.month - 1][2]];
    } else if (eventEach.month) {
        return [...new Set(eventEach.month.map(month => siki[month - 1][2]))];
    };
    return [];
};

// eventAllArrから#events内のsection要素を生成し、季節タブの表示・絞り込みを設定する
function renderEvents(eventAllArr) {
    document.querySelectorAll("#events section").forEach(section => section.remove());

    const activeTabIds = new Set();

    for (const eventEach of eventAllArr) {
        const section = document.createElement("section");
        document.querySelector("#events").appendChild(section);

        if (eventEach.info && (eventEach.info.note || eventEach.info.markdown)) {
            const moreinfo = document.createElement("button");
            moreinfo.textContent = "もっと詳しく";
            section.appendChild(moreinfo);

            moreinfo.addEventListener("click", () => {
                const thisInfo = document.querySelector("#thisEvent #thisInfo");
                thisInfo.innerHTML = "";
                renderEventDetails(thisInfo, eventEach);

                const notesContainer = document.createElement("div");
                thisInfo.appendChild(notesContainer);
                renderInfo(eventEach.info, {
                    notes: notesContainer,
                    links: document.querySelector("#thisLink")
                });
                document.querySelector("#thisEvent").showModal();
            });
        };

        const tabIds = getTabIds(eventEach);
        tabIds.forEach(id => {
            section.classList.add(id);
            activeTabIds.add(id);
        });

        renderEventDetails(section, eventEach);
    };

    const fieldset = document.querySelector("#events fieldset");

    if (activeTabIds.size <= 2) {
        if (fieldset) {
            fieldset.hidden = true;
        };
        document.querySelectorAll("#events section").forEach(section => {
            section.hidden = false;
        });
        const emptyMsg = document.querySelector("#events p.no-events");
        if (emptyMsg) {
            emptyMsg.remove();
        };
        return;
    };

    if (fieldset) {
        fieldset.hidden = false;
    };

    TAB_IDS.forEach(id => {
        const hasEvents = activeTabIds.has(id);
        const radio = document.querySelector(`#events input[id="${id}"]`);
        const label = document.querySelector(`#events label[for="${id}"]`);
        if (radio) radio.hidden = !hasEvents;
        if (label) label.hidden = !hasEvents;
    });

    // 修正: 現在の季節（sikiNow）にイベントが1件も無い場合、既定選択のまま
    // 「該当イベントなし」表示になってしまい、切り替えても反応が無いように
    // 見えていた。イベントが実際にある最初のタブを既定選択にする。
    let defaultTabId = sikiNow;
    if (!activeTabIds.has(defaultTabId)) {
        defaultTabId = TAB_IDS.find(id => activeTabIds.has(id));
    };

    const currentRadio = document.querySelector(`#events input[id="${defaultTabId}"]`);
    if (currentRadio) {
        currentRadio.checked = true;
    };
    updateEventVisibility(defaultTabId);

    document.querySelectorAll(`#events input[name="siki"]`).forEach(radio => {
        // 修正: renderEventsが複数回呼ばれた場合に変更リスナーが
        // 重複登録されないようにガードする
        if (radio.dataset.listenerBound) return;
        radio.addEventListener("change", (e) => {
            updateEventVisibility(e.target.id);
        });
        radio.dataset.listenerBound = "true";
    });
};

// 指定したタブidに該当するsectionのみ表示し、該当が無ければメッセージを表示する
function updateEventVisibility(tabId) {
    let hasVisible = false;
    document.querySelectorAll("#events section").forEach(section => {
        const matches = section.classList.contains(tabId);
        section.hidden = !matches;
        if (matches) {
            hasVisible = true;
        };
    });

    let emptyMsg = document.querySelector("#events p.no-events");
    if (!hasVisible) {
        if (!emptyMsg) {
            emptyMsg = document.createElement("p");
            emptyMsg.className = "no-events";
            document.querySelector("#events").appendChild(emptyMsg);
        };
        emptyMsg.textContent = "この季節に該当するイベントはありません";
    } else if (emptyMsg) {
        emptyMsg.remove();
    };
};