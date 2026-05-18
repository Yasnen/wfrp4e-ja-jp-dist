import { Wfrp4eJaJp } from './Wfrp4eJaJp.js';

// https://obfuscator.io
/**
 * Utility class with all predefined converters
 */
export class ConvertersJa {
    static tableResults(results, translations, x, y, z) {
        return results.map(data => {
            if (translations) {
                const translation = data.range ? translations[`${data.range[0]}-${data.range[1]}`] : undefined;
                if (translation) {
                    return foundry.utils.mergeObject(data, foundry.utils.mergeObject({ 'text': translation }, { translated: true }));
                }
            }
            if (data.documentCollection) {
                const text = game.babele.translateField('name', data.documentCollection, { 'name': data.text });
                if (text) {
                    return foundry.utils.mergeObject(data, foundry.utils.mergeObject({ 'text': text }, { translated: true }));
                } else {
                    return data;
                }
            }
            return data;
        })
    }
    static translateActorEffects(effects, translation, actor, TranslatedCompendium, translations) {
        for (let i = 0; i < effects.length; i++) {
            game.wfrp4ejajp.translateEffect(effects[i], null);
        }
        return effects;
    }
    static translateEffects(effects, translation, item, TranslatedCompendium, translations) {
        for (let i = 0; i < effects.length; i++) {
            game.wfrp4ejajp.translateEffect(effects[i], item);
        }
        return effects;
    }
    static unitLocalizeJa(value) {
        if(!value) return value;
        let text = value.toLowerCase();
        if (text == "days") return game.i18n.localize("Days");
        if (text == "hours") return game.i18n.localize("Hours");
        if (text == "minutes") return game.i18n.localize("Minutes");
        if (value) Wfrp4eJaJp.warn(`ConvertersJa.unitLocalizeJa：入力値が対象外です「${value}」`);
        return value
    }

    static getItemDict(dict_item, type) {
        let entries = dict_item[type];
        if (!entries) {
            dict_item[type] = { 'mapping': { 'description': "system.description.value", 'gmdescription': "system.gmdescription.value" }, 'entries': {} };
            entries = dict_item[type];
        }
        return entries
    }
    /**
     * @param {string} name
     * @param {"auto"|1|2|3} [format="auto"]
     * @returns {{ name: string, spec: string }}
     */
    static splitNameSpec(name, format = "auto") {
        if (!name) return { name: name ?? "", spec: "" };
        const t = name.trim();
        if (format === "auto" || format === 2) {
            const m = t.match(/^〈(.+?)：(.+?)〉$/);
            if (m) return { name: m[1], spec: m[2] };
        }
        if (format === "auto" || format === 3) {
            const m = t.match(/^《(.+?)：(.+?)》$/);
            if (m) return { name: m[1], spec: m[2] };
        }
        if (format === "auto" || format === 1) {
            const p = t.indexOf("(");
            const q = t.indexOf(")", p);
            if (p !== -1 && q !== -1) return { name: t.substring(0, p).trim(), spec: t.substring(p + 1, q).trim() };
        }
        return { name: t, spec: "" };
    }
    static getItemEntry(entries, name) {
        if (!name) return { name: name };
        let entry = entries[name];
        if (entry) { return entry; }
        const { name: item_name, spec: item_spec } = ConvertersJa.splitNameSpec(name, 1);
        const isSpec = item_spec !== "";
        entry = entries[item_name];
        if (!entry) {
            entries[item_name] = { "name": item_name }
            entry = entries[item_name];
        }
        if (isSpec) {
            if (!("spec" in entry)) { entry.spec = {}; }
            ConvertersJa.translateHashes(entry.spec, item_spec);
        }
        return entry;
    }
    static getItemName(entry, name) {
        let tw_name = entry.name;
        if (entry.spec) {
            const { spec: item_spec } = ConvertersJa.splitNameSpec(name, 1);
            if (item_spec) {
                tw_name = tw_name + " (" + (entry.spec[item_spec] || item_spec) + ")";
            }
        } else {
            // getItemEntryが先に呼ばれて、専門分野は登録済みの前提で処理を省略
        }
        return tw_name;
    }
    /**
     * ドット区切りパスでネストオブジェクトに値を書き込む。
     * 中間ノードが存在しない場合は {} で自動生成する。
     * @param {object} object - 書き込み先のルートオブジェクト
     * @param {string} path   - "a.b.c" 形式のパス
     * @param {*}      value  - 書き込む値
     */
    static setNestedValue(object, path, value) {
        const keys = path.split('.');
        keys.reduce((acc, val, idx, arr) => {
            if (idx === arr.length - 1) {
                acc[val] = value;
            } else {
                if (acc[val] === undefined || acc[val] === null) {
                    acc[val] = {};
                }
            }
            return acc[val];
        }, object);
    }
    static translateItem(mapping, entry, object, isSystem, item) {
        let itemName = null;
        // マッピングの処理
        for (let key in mapping) {
            //========== Description 処理抑制（確認用） ==========
            if (game.settings.get("wfrp4e-ja-jp", "supressDescription") && key === "description") continue;
            //========== Description 処理抑制（確認用） ==========
            if (typeof mapping[key] === "string") {
                let path = mapping[key];
                if (!isSystem || path.substring(0, 7) === "system.") {
                    if (isSystem) { path = path.substring(7); }
                    let text = path.split('.').reduce((acc, val) => { return acc && acc[val] }, object);
                    if (text && !/^([ -+*/#0-9]+|[0-9]+d[0-9]+[ -+*/#0-9]+|[a-z]{1,3}|\s*)$/.test(text) && text != "<p></p>") {
                        if (typeof entry[key] === "string" && path === "name") {
                            // 泥縄的対処、名前は他のマップ処理後に反映するため一次格納
                            itemName = entry[key];
                        } else if (typeof entry[key] === "string") {
                            ConvertersJa.setNestedValue(object, path, entry[key]);
                        } else {
                            if (!(key in entry)) {
                                entry[key] = {};
                            }
                            ConvertersJa.setNestedValue(object, path, ConvertersJa.translateHashes(entry[key], text));
                        }
                    }
                }
            } else if (typeof mapping[key] === "object") {
                let path = mapping[key].path;
                if (!isSystem || path.substring(0, 7) === "system.") {
                    if (isSystem) { path = path.substring(7); }
                    let converter = game.babele.converters[mapping[key].converter];
                    if (typeof converter !== "function" && typeof converter?.translate !== "function") {
                        Wfrp4eJaJp.warn(`translateItem: コンバータ "${mapping[key].converter}" が未登録です (key="${key}", type="${item?.type}", name="${item?.name}")`);
                        continue;
                    }
                    let text = path.split('.').reduce((acc, val) => { return acc && acc[val] }, object);
                    if (text == null) continue;
                    let tw_text = typeof converter === "function"
                        ? converter(text, null, item)
                        : converter.translate({ value: text, translation: null, source: item });
                    // 泥縄的対処、名前は他のマップ処理後に反映するため一次格納
                    if (path === "name") {
                        itemName = tw_text;
                    } else {
                        ConvertersJa.setNestedValue(object, path, tw_text);
                    }
                }
            }
        }
        // 泥縄的対処、対比した名前が存在した場合、反映
        if (itemName) {
            object["name"] = itemName;
        }
        return object;
    }
    static dictmap(data, dict, addDict, asHash = true, path = "") {
        if (!(dict instanceof Object) || dict instanceof Array) {
            Wfrp4eJaJp.warn(`ConvertersJa.dictmap: 辞書データがハッシュテーブルではありません。（${path}）`);
            return false;
        }
        if (data instanceof Array) {
            data.forEach(x => {
                if (x instanceof Array) {
                    ConvertersJa.dictmap(x, dict, addDict, asHash, path);
                } else if (x instanceof Object) {
                    let use_idAsKey = game.settings.get("wfrp4e-ja-jp", "use_idAsKey");
                    // 配列の要素がオブジェクトの場合は、オブジェクトに次の要素が有る場合、辞書を参照、登録する。
                    // 「_id」、「name」、「label」 ※ scriptData には name が無いので label で代替できるようにする
                    let id = (use_idAsKey ? x._id : x.name) || x.name || x.label;
                    if (id) {
                        let translation = dict[id];
                        if (addDict && !translation) {
                            dict[id] = {};
                            ConvertersJa.dictmap(x, dict[id], addDict, asHash, path + "." + id);
                        } else if (translation) {
                            ConvertersJa.dictmap(x, translation, addDict, asHash, path + "." + id);
                        }
                    } else {
                        ConvertersJa.dictmap(x, dict, addDict, asHash, path + "." + id);
                        if (path.split(".").pop() !== "changes") { // changesには無いので、警告抑制
                            Wfrp4eJaJp.warn(`ConvertersJa.dictmap: 配列「${path}」にid候補要素（「_id」、「name」、「label」）がありません。`);
                        }
                    }
                } else {
                    if (x in dict) {
                        x = dict[x];
                    } else if (addDict) {
                        dict[x] = x;
                    }
                }
            });
        } else if (data instanceof Object) {
            Object.keys(data).forEach(key => {
                if (!(key in dict)) {
                    if (!addDict) return;
                    if (!asHash && !(data[key] instanceof Object)) {
                        dict[key] = data[key];
                        return;
                    } else {
                        dict[key] = {};
                    }
                }
                if (data[key] instanceof Object) {
                    ConvertersJa.dictmap(data[key], dict[key], addDict, asHash, path + "." + key);
                } else if (asHash && dict[key] instanceof Object) {
                    if (data[key] in dict[key]) {
                        data[key] = dict[key][data[key]];
                    } else {
                        dict[key][data[key]] = data[key];
                    }
                } else {
                    if (key in dict) {
                        data[key] = dict[key];
                    } else {
                        dict[key] = data[key];
                    }
                }
            });
        } else {
            Wfrp4eJaJp.warn("ConvertersJa.dictmap: 処理対象がハッシュテーブルや配列ではありません。");
            return false;
        }
    }
    static checkDictmap(data, dict_org, path = "") {
        const supressExportDict = game.settings.get("wfrp4e-ja-jp", "supressExportDict");
        const suppress = (value) => {
            if (!supressExportDict) return false;
            if (value === null || value === undefined) return true;
            if (typeof value === "boolean" || typeof value === "number") return true;
            if (value instanceof Array) return value.length === 0;
            if (value instanceof Object) return Object.keys(value).length === 0;
            if (typeof value === "string") {
                const v = value.trim();
                return /^([ \-+*/#0-9]*|[0-9]+d[0-9]+[\-+*/#0-9]*|\s*)$/.test(v)
                    || v === "<p></p>"
                    || ["ws", "bs", "s", "t", "i", "ag", "dex", "int", "wp", "fel"].includes(v.toLowerCase());
            }
            return false;
        };
        if (!(dict_org instanceof Object) || dict_org instanceof Array) {
            Wfrp4eJaJp.warn(`ConvertersJa.checkDictmap: パス「${path}」元データがありません。`);
            return false;
        }
        if (data instanceof Array) {
            data.forEach(x => {
                if (x instanceof Object) {
                    ConvertersJa.checkDictmap(x, dict_org, path);
                } else if (!(x in dict_org)) {
                    if (!suppress(x)) Wfrp4eJaJp.warn(`ConvertersJa.checkDictmap: パス「${path}.${x}」が追加されています。`);
                    return false;
                }
            });
        } else if (data instanceof Object) {
            Object.keys(data).forEach(key => {
                if (!(key in dict_org)) {
                    if (!suppress(data[key])) Wfrp4eJaJp.warn(`ConvertersJa.checkDictmap: パス「${path}.${key}」が追加されています。`);
                    return false;
                }
                if (data[key] instanceof Object) {
                    ConvertersJa.checkDictmap(data[key], dict_org[key], `${path}.${key}`);
                } else if (key in dict_org) {
                    if (data[key] !== dict_org[key]) {
                        if (!suppress(data[key])) Wfrp4eJaJp.warn(`ConvertersJa.checkDictmap: パス「${path}.${key}」が更新されています。\n「${dict_org[key]}」\n⇒「${data[key]}」`);
                        return false;
                    }
                } else {
                    if (!suppress(data[key])) Wfrp4eJaJp.warn(`ConvertersJa.checkDictmap: パス「${path}.${key}」が追加されています。`);
                    return false;
                }
            });
        } else if (data in dict_org) {
            if (!suppress(data)) Wfrp4eJaJp.warn(`ConvertersJa.checkDictmap: パス「${path}」で想定外の状況が発生 (data="${data}")`);
            return false;
        } else {
            if (!suppress(data)) Wfrp4eJaJp.warn("ConvertersJa.checkDictmap: 処理対象がハッシュテーブルや配列ではありません。");
            return false;
        }
    }
    static translateHashes(hashes, data) {
        if(!data) return data;
        if(Array.isArray(data)) return data.map(x => ConvertersJa.translateHashes(hashes, x));
        let value = data.trim()
        let flgExport = !game.settings.get("wfrp4e-ja-jp", "supressExportDict") ||
            !/^([ -+*/#0-9]+|[0-9]+d[0-9]+[ -+*/#0-9]+|\s*)$/.test(value) &&
            value != "<p></p>" &&
            !["ws", "bs", "s", "t", "i", "ag", "dex", "int", "wp", "fel"].includes(value);
        let tw_value = hashes[value];
        if (!tw_value && !value.startsWith("<p>")) {
            tw_value = "<p>" + value + "</p>";
            tw_value = hashes[tw_value];
        }
        if (!tw_value) {
            // 未登録の場合、辞書に登録
            if (flgExport) hashes[value] = value;
            return value;
        } else {
            return tw_value;
        }
    }
}

/**
 * キーに「.」を含むオブジェクトを安全にマージする。
 * foundry.utils.mergeObject はキーの「.」をパス区切りとして展開するため、
 * 翻訳辞書のように「.」を含むキー（例: "Corrosive.Weapons"）を持つオブジェクトには使用してはならない。
 * 通常のデータマージ（キーに「.」が含まれない固定キーのみ）には foundry.utils.mergeObject を使用すること。
 *
 * @limitation 以下の用途には使用してはならない:
 *   - 元オブジェクトを保持したい場合（常に original を破壊的変更する。非破壊コピーが必要なら先に deepClone すること）
 *   - 配列を含むオブジェクトのマージ（配列は Object として再帰処理されるため添字キーが混入する）
 *   - キーの挿入・上書き・型チェックを制御したい場合（insertKeys / overwrite / enforceTypes 相当のオプションなし）
 *   - 「-=key」構文によるキー削除（performDeletions 非対応）
 *
 * @param {Object} original - マージ先（破壊的変更される）
 * @param {Object} other - マージ元
 */
export function mergeObjectJaJp(original, other = {}) {
    if (!(original instanceof Object)) return original;
    other = other || {};
    for (let k of Object.keys(other)) {
        const v = other[k];
        if (original[k] instanceof Object) {
            mergeObjectJaJp(original[k], v);
        } else {
            original[k] = v;
        }
    }
    return original;
}

export function overWrite(original, dict) {
    Object.keys(original).forEach(key => {
        if (typeof original[key] !== "object") {
            if (key in dict) {
                if (typeof dict[key] !== "object") {
                    original[key] = dict[key];
                } else {
                    if (original[key] in dict[key]) {
                        original[key] = dict[key][original[key]];
                    } else {
                        dict[key][original[key]] = original[key];
                    }
                }
            } else {
                dict[key] = original[key];
            }
        } else {
            if (!(key in dict)) {
                dict[key] = {};
            }
            overWrite(original[key], dict[key]);
        }
    });
}
