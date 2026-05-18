import { ConvertersJa, mergeObjectJaJp } from './converters-ja.js';
import { Wfrp4eJaJp } from './Wfrp4eJaJp.js';

Hooks.once('babele.init', (babele) => {
    babele.register({
        module: 'wfrp4e-ja-jp',
        lang: 'ja',
        dir: 'compendium'
    });

    babele.registerConverters({
        "spellLore": (value, _translation, item) => {
            // 呪文の専門分野は本来小文字のデータであれば正しく表示されるが、一部モジュールの不具合で大文字が混在することがあるため、小文字に正規化する。
            if (!Array.isArray(value)) return value;
            return value.map((v) => {
                const lower = v.toLowerCase();
                if (lower !== v) {
                    Wfrp4eJaJp.warn(`spellLore: 大文字を含む値を正規化しました「${v}」→「${lower}」（item: ${item?.name ?? "不明"}）`);
                }
                return lower;
            });
        },
        "skillItemName": (name, translation, item, translationCompendium, translations) => {
            if (name && name !== "") {
                Wfrp4eJaJp.log("skillItemName: " + name);
                return name;
            }
        },
        "systemMappingCheck": (system, translation, item, translationCompendium, translations) => {
            // コンバータを使わない辞書ファイルの、更新確認
            Wfrp4eJaJp.log(`systemMappingCheck [${item?.name}]:`, translation);
        },
        "addArray": (elements, translation, item, translatedCompendium, translations) => {
            if (translation) {
                translation.forEach((value) => {
                    if (elements.some(e => e._id === value._id)) {
                        Wfrp4eJaJp.warn(`_id=「${value._id}」は重複するためジャーナルノートに追加できません。`)
                    } else {
                        elements.push(value);
                    }
                });
            }
            return elements;
        },
        "sceneDrawingsJP": (drawings, translation, item, translatedCompendium, translations) => {
            if (Array.isArray(translation)) return translation;
            if (drawings.length === 0) return;
            let supressExportDict = game.settings.get("wfrp4e-ja-jp", "supressExportDict");
            let use_idAsKey = game.settings.get("wfrp4e-ja-jp", "use_idAsKey");
            let keyI = use_idAsKey ? item._id : item.name;
            let exportDict = false;
            let dict_scene = {};
            dict_scene[keyI] = { "name": item.name, "_id": item._id, "drawings": {} };
            let entries = dict_scene[keyI].drawings;
            drawings.map(data => {
                if (translation) {
                    let entry = translation[data._id] || translation[data.name || data.text];
                    if (entry) {
                        if (typeof entry === "object") {
                            if (!entry._id || entry._id === data._id) {
                                // Babeleの辞書ファイルで、「name」や「text」で対象を識別した場合、辞書ファイルに「_id」が含まれているときはそれも一致が必要
                                Object.keys(entry).forEach(key => {
                                    if (key !== "_id") {    // _id は処理対象外
                                        key.split('.').reduce((acc, val, idx, arr) => { if (idx === arr.length - 1) acc[val] = entry[key]; return acc[val]; }, data);
                                    }
                                });
                            }
                        } else {
                            if (data.name) {
                                data.name = entry;
                            } else if (data.text) {
                                data.text = entry;
                            }
                        }
                    }
                    if (!entry && (supressExportDict && (data.text?.length ?? 0) > 1 || !supressExportDict && data.text != null && data.text !== "")) {
                        let keyD = use_idAsKey ? data._id : data.name || data.text;
                        entries[keyD] = { "text": data.text, "_id": data._id };
                        if (data.x) entries[keyD].x = data.x;
                        if (data.y) entries[keyD].y = data.y;
                        if (data.shape?.height) entries[keyD]["shape.height"] = data.shape.height;
                        if (data.shape?.width) entries[keyD]["shape.width"] = data.shape.width;
                        exportDict = true;
                    }
                } else {
                    if (supressExportDict && (data.text?.length ?? 0) > 1 || !supressExportDict && data.text != null && data.text !== "") {
                        let keyD = use_idAsKey ? data._id : data.name || data.text;
                        entries[keyD] = { "text": data.text, "_id": data._id };
                        if (data.x) entries[keyD].x = data.x;
                        if (data.y) entries[keyD].y = data.y;
                        if (data.shape?.height) entries[keyD]["shape.height"] = data.shape.height;
                        if (data.shape?.width) entries[keyD]["shape.width"] = data.shape.width;
                        exportDict = true;
                    }
                }
                return data;
            });
            if (exportDict) {
                if (!game.wfrp4ejajp.dict.scene) game.wfrp4ejajp.dict.scene = {};
                mergeObjectJaJp(game.wfrp4ejajp.dict.scene, dict_scene);
            }
        },
        "sceneNotesJP": (notes, translation, item, translatedCompendium, translations) => {
            if (Array.isArray(translation)) return translation;
            if (notes.length === 0) return;
            let supressExportDict = game.settings.get("wfrp4e-ja-jp", "supressExportDict");
            let use_idAsKey = game.settings.get("wfrp4e-ja-jp", "use_idAsKey");
            let keyI = use_idAsKey ? item._id : item.name;
            let exportDict = false;
            let dict_scene = {};
            dict_scene[keyI] = { "name": item.name, "_id": item._id, "notes": {} };
            let entries = dict_scene[keyI].notes;
            notes.map(data => {
                if (translation) {
                    let entry = translation[data._id] || translation[data.name || data.text];
                    if (entry) {
                        if (typeof entry === "object") {
                            if (!entry._id || entry._id === data._id) {
                                // Babeleの辞書ファイルで、「name」や「text」で対象を識別した場合、辞書ファイルに「_id」が含まれているときはそれも一致が必要
                                Object.keys(entry).forEach(key => {
                                    if (key !== "_id") {    // _id は処理対象外
                                        key.split('.').reduce((acc, val, idx, arr) => { if (idx === arr.length - 1) acc[val] = entry[key]; return acc[val]; }, data);
                                    }
                                });
                            }
                        } else if (data.text) {
                            data.text = entry;
                        }
                    }
                    if (!entry && (supressExportDict && (data.text?.length ?? 0) > 1 || !supressExportDict && data.text != null && data.text !== "")) {
                        let keyD = use_idAsKey ? data._id : data.name || data.text;
                        entries[keyD] = { "text": data.text, "_id": data._id };
                        if (data.x) entries[keyD].x = data.x;
                        if (data.y) entries[keyD].y = data.y;
                        if (data.flags?.anchor?.slug) entries[keyD]["flags.anchor.slug"] = data.flags.anchor.slug;
                        if (data.flags?.anchor?.name) entries[keyD]["flags.anchor.name"] = data.flags.anchor.name;
                        exportDict = true;
                    }
                } else if (supressExportDict && (data.text?.length ?? 0) > 1 || !supressExportDict && data.text != null && data.text !== "") {
                    let keyD = use_idAsKey ? data._id : data.name || data.text;
                    entries[keyD] = { "text": data.text, "_id": data._id };
                    if (data.x) entries[keyD].x = data.x;
                    if (data.y) entries[keyD].y = data.y;
                    if (data.flags?.anchor?.slug) entries[keyD]["flags.anchor.slug"] = data.flags.anchor.slug;
                    if (data.flags?.anchor?.name) entries[keyD]["flags.anchor.name"] = data.flags.anchor.name;
                    exportDict = true;
                }
                return data;
            });
            if (exportDict) {
                if (!game.wfrp4ejajp.dict.scene) game.wfrp4ejajp.dict.scene = {};
                mergeObjectJaJp(game.wfrp4ejajp.dict.scene, dict_scene);
            }
        },
        "sceneTokensJP": (tokens, translation, item, translatedCompendium, translations) => {
            if (Array.isArray(translation)) return translation;
            if (tokens.length === 0) return;
            let supressExportDict = game.settings.get("wfrp4e-ja-jp", "supressExportDict");
            let use_idAsKey = game.settings.get("wfrp4e-ja-jp", "use_idAsKey");
            let keyI = use_idAsKey ? item._id : item.name;
            let exportDict = false;
            let dict_scene = {};
            dict_scene[keyI] = { "name": item.name, "_id": item._id, "tokens": {} };
            let entries = dict_scene[keyI].tokens;
            tokens.map(data => {
                if (data.delta) {
                    if (data.delta.effects) {
                        data.delta.effects.map(x => {
                            game.wfrp4ejajp.translateEffect(x, null);
                        });
                    }
                    if (data.delta.items) {
                        data.delta.items.map(x => {
                            let dict = ConvertersJa.getItemDict(game.wfrp4ejajp.dict.item, x.type);
                            let entry = ConvertersJa.getItemEntry(dict.entries, x.name);
                            return ConvertersJa.translateItem(dict.mapping, entry, x, false, x);
                        });
                    }
                }
                if (translation) {
                    let entry = translation[data._id] || translation[data.name || data.text];
                    if (entry) {
                        if (typeof entry === "object") {
                            if (!entry._id || entry._id === data._id) {
                                // Babeleの辞書ファイルで、「name」や「text」で対象を識別した場合、辞書ファイルに「_id」が含まれているときはそれも一致が必要
                                Object.keys(entry).forEach(key => {
                                    if (key !== "_id") {    // _id は処理対象外
                                        key.split('.').reduce((acc, val, idx, arr) => { if (idx === arr.length - 1) acc[val] = entry[key]; return acc[val]; }, data);
                                    }
                                });
                            }
                        } else {
                            if (data.name) {
                                data.name = entry;
                            } else if (data.text) {
                                data.text = entry;
                            }
                        }
                    }
                    if (!entry) {
                        let keyD = use_idAsKey ? data._id : data.name || data.text;
                        entries[keyD] = { "name": data.name, "_id": data._id };
                        if (data.x) entries[keyD].x = data.x;
                        if (data.y) entries[keyD].y = data.y;
                        exportDict = true;
                    }
                } else {
                    tokens.map(data => {
                        let keyD = use_idAsKey ? data._id : data.name || data.text;
                        entries[keyD] = { "name": data.name, "_id": data._id };
                        if (data.x) entries[keyD].x = data.x;
                        if (data.y) entries[keyD].y = data.y;
                        exportDict = true;
                        return data;
                    });
                }
                return data;
            });

            if (exportDict) {
                if (!game.wfrp4ejajp.dict.scene) game.wfrp4ejajp.dict.scene = {};
                mergeObjectJaJp(game.wfrp4ejajp.dict.scene, dict_scene);
            }
        },
        "tableResultsJP": (results, translation, table, translatedCompendium, translations) => {
            // 翻訳データとして配列が渡された場合は、翻訳処理を行わずにそのまま返す。配列が渡されるのは、Babeleの翻訳データで固定値として翻訳する場合を想定。
            if (Array.isArray(translation)) return translation;
            if (results.length === 0) return;
            let use_idAsKey = game.settings.get("wfrp4e-ja-jp", "use_idAsKey");
            let keyI = use_idAsKey ? table._id : table.name;
            let exportDict = false;
            let dict_table = {};
            dict_table[keyI] = { "name": table.name, "_id": table._id, "results": {} };
            let entries = dict_table[keyI].results;
            results.forEach(data => {
                if ( data.name !=="" ){
                    let entry = (use_idAsKey ? translation?.[data._id] : translation?.[data.name]) || translation?.[data._id];
                    if (entry) {
                        if (typeof entry === "object") {
                            Object.keys(entry).forEach(key => {
                                if (key !== "_id") {    // _id は処理対象外
                                    key.split('.').reduce((acc, val, idx, arr) => { if (idx === arr.length - 1) acc[val] = entry[key]; return acc[val]; }, data);
                                }
                            });
                        } else {
                            data.name = entry;
                        }
                    } else {
                        let keyR = use_idAsKey ? data._id : data.name;
                        entries[keyR] = { "name": data.name, "_id": data._id, "description": data.description };
                        exportDict = true;
                    }
                } else {
                    // ロール表の名前が空文字の場合は、説明を直接検索して登録
                    let entry = translation?.[data.description];
                    if (entry) {
                        if (typeof entry === "object") {
                            data.description = entry.description;
                        } else {
                            data.description = entry;
                        }
                    } else {
                        let keyR =  use_idAsKey ? data._id : data.description;
                        entries[keyR] = { "name": data.name, "_id": data._id, "description": data.description };
                        exportDict = true;
                    }
                }
            });
            if (exportDict) {
                if (!game.wfrp4ejajp.dict.table) game.wfrp4ejajp.dict.table = {};
                mergeObjectJaJp(game.wfrp4ejajp.dict.table, dict_table);
            }
            return results;
        },
        "itemName": (name, translation, item, translatedCompendium, translations) => {
            let dict = ConvertersJa.getItemDict(game.wfrp4ejajp.dict.item, item.type);
            let entry = ConvertersJa.getItemEntry(dict.entries, name);
            return ConvertersJa.getItemName(entry, name);
        },
        "itemSystem": (system, translation, item, translationCompendium, translations) => {
            let dict = ConvertersJa.getItemDict(game.wfrp4ejajp.dict.item, item.type);
            let entry = ConvertersJa.getItemEntry(dict.entries, item.name);
            return ConvertersJa.translateItem(dict.mapping, entry, system, true, item);
        },
        "itemEffects": (effects, translation, item, translationCompendium, translations) => {
            if (effects?.length > 0) {
                let dict = ConvertersJa.getItemDict(game.wfrp4ejajp.dict.item, item.type);
                let entry = ConvertersJa.getItemEntry(dict.entries, item.name);
                let itemEffectsAddDict = game.settings.get("wfrp4e-ja-jp", "itemEffectsAddDict");
                if (!entry.effects && itemEffectsAddDict) entry.effects = {};
                if (entry.effects) ConvertersJa.dictmap(effects, entry.effects, itemEffectsAddDict, true, `${item.name}.effects`);
                // 「item.name」と同名の「effects.name」、「effects.system.scriptData.label」はentry.nameに置き換える
                effects.forEach(x => {
                    if (!x.name) return;
                    const { name: xName, spec: xSpec } = ConvertersJa.splitNameSpec(x.name, 1);
                    const { name: itemName } = ConvertersJa.splitNameSpec(item.name, 1);
                    if (xName === itemName) {
                        x.name = entry.name;
                        if (xSpec) {
                            if (entry.spec && entry.spec[xSpec]) {
                                x.name += " (" + entry.spec[xSpec] + ")"
                            } else {
                                x.name += " (" + xSpec + ")"
                            }
                        }
                    } else if (x.name === `Apply ${item.name}`) {
                        x.name = `${entry.name}を適用`
                    }
                    if (x.system?.scriptData) x.system.scriptData.forEach(y => {
                        if (y.label) {
                            const { name: yName, spec: ySpec } = ConvertersJa.splitNameSpec(y.label, 1);
                            if (yName === itemName) {
                                y.label = entry.name;
                                if (ySpec) {
                                    if (entry.spec && entry.spec[ySpec]) {
                                        y.label += " (" + entry.spec[ySpec] + ")"
                                    } else {
                                        y.label += " (" + ySpec + ")"
                                    }
                                }
                            }
                        } else {
                            //  Wfrp4eJaJp.log(`ScriptDataにlabelがありません：${item.name}.${itemName}`);
                        }
                    });
                });
                ConvertersJa.dictmap(effects, game.wfrp4ejajp.dict.globalEffects, itemEffectsAddDict, true, `${item.name}.effects`);
            }
            return effects;
        },
        "itemWeaponQualities": (qualities) => {
            if (qualities?.value?.length > 0) {
                qualities.value.forEach(q => {
                    if (q.value && typeof q.value === "string") {
                        q.value = q.value.replace(/^(\d+)(A)$/, "$1優");
                    }
                });
            }
            return qualities;
        },
        "items_converter": (items, translation, item, translationCompendium, translations) => {
            if (translation) return translation;
            return items.map(data => {
                let dict = ConvertersJa.getItemDict(game.wfrp4ejajp.dict.item, data.type);
                let entry = ConvertersJa.getItemEntry(dict.entries, data.name);
                return ConvertersJa.translateItem(dict.mapping, entry, data, false, data);
            });
        },
        "unit_localization": ConvertersJa.unitLocalizeJa,
        "location_localization": (value) => {
            return ConvertersJa.translateHashes(game.wfrp4ejajp.dict.item.hashes.location, value);
        },
        "description_translate_condition": (description) => {
            let tw = description;
            for (let key in game.i18n.translations.WFRP4E.ConditionName) {
                tw = tw.replaceAll("@Condition\[" + key + '\]', "@Condition[" + game.i18n.localize("WFRP4E.ConditionName." + key) + ']')
            }
            return tw
        },
        "duration_range_target_damage": (value) => {
            if (!value) return value;
            let translw = value.toLowerCase();
            // 単純ケースを即処理
            let tw = game.wfrp4ejajp.dict.prayer_spell.simple[translw];
            if (tw) {
                return tw;
            }
            // 能力値、能力値ボーナスのローカライズ
            for (let key in Wfrp4eJaJp.Characteristics) {
                if (translw.indexOf(key) != -1) {
                    translw = translw.replace(key + " bonus", game.i18n.localize("CHARBonus." + Wfrp4eJaJp.Characteristics[key]))
                    translw = translw.replace(key, game.i18n.localize("CHAR." + Wfrp4eJaJp.Characteristics[key]))
                }
            }
            for (let key in game.wfrp4ejajp.dict.prayer_spell.unit) {
                translw = translw.replace(key, game.wfrp4ejajp.dict.prayer_spell.unit[key])
            }
            if (translw !== "" && translw === value.toLowerCase() && !/^[ -+*/#0-9]+$/.test(translw)) {
                game.wfrp4ejajp.dict.prayer_spell.simple[translw] = translw;
            }
            return translw
        },
        "effects_converter": (effects, translations, x, y, z) => {
            return ConvertersJa.translateEffects(effects, translations, x, y, z);
        },
        "actor_effects_converter": ConvertersJa.translateActorEffects,
        "actor_color": (color, translation) => {
            if (translation) return translation;
            return ConvertersJa.translateHashes(game.wfrp4ejajp.dict.actor.hashes.color, color);
        },
        "actor_gender": (gender, translation, actor, translationCompendium, translations) => {
            if (translation) return translation;
            if (actor.type === "creature") {
                if (gender === "Female") {
                    return "雌";
                } else if (gender === "Male") {
                    return "雄";
                }
            }
            return ConvertersJa.translateHashes(game.wfrp4ejajp.dict.actor.hashes.gender, gender);
        },
        "actor_species": (species, translation, actor, translationCompendium, translations) => {
            if (translation) return translation;
            return ConvertersJa.translateHashes(game.wfrp4ejajp.dict.actor.hashes.species, species);
        },
        "actor_status": (status, translation, actor, translationCompendium, translations) => {
            if (translation) return translation;
            let tstatus;
            let spacePos = status.indexOf(' ');
            if (spacePos !== -1) {
                tstatus = ConvertersJa.translateHashes(game.wfrp4ejajp.dict.actor.hashes.status, status.substring(0, spacePos).trim()) + " " + ConvertersJa.translateHashes(game.wfrp4ejajp.dict.actor.hashes.status, status.substring(spacePos + 1).trim());
            } else {
                tstatus = ConvertersJa.translateHashes(game.wfrp4ejajp.dict.actor.hashes.status, status.trim());
            }
            return tstatus;
        },
        "actor_prototypeToken_name": (name, translation, actor, translationCompendium, translations) => {
            if (translation) return translation;
            if (actor.name === name) return translations.name;
            if (!game.wfrp4ejajp.dict.actor) game.wfrp4ejajp.dict.actor = {};
            if (!game.wfrp4ejajp.dict.actor.hasOwnProperty(translationCompendium.metadata.packageName)) game.wfrp4ejajp.dict.actor[translationCompendium.metadata.packageName] = {};
            let dict = game.wfrp4ejajp.dict.actor[translationCompendium.metadata.packageName];
            let use_idAsKey = game.settings.get("wfrp4e-ja-jp", "use_idAsKey");
            let keyI = use_idAsKey ? actor._id : actor.name;
            if (!dict.hasOwnProperty(keyI)) {
                dict[keyI] = { "name": actor.name, "tokenName": actor.prototypeToken.name, "_id": actor._id };
            } else {
                dict[keyI].tokenName = actor.prototypeToken.name;
            }
            return translations.name;
        },
        "vehicle_motivePower": (motivePower) => {
            motivePower = motivePower.replace("Animals", "動物");
            motivePower = motivePower.replace("Animal", "動物");
            motivePower = motivePower.replace("Operators", "操縦員");
            motivePower = motivePower.replace("Operator", "操縦員");
            motivePower = motivePower.replace("Oars", "櫂");
            motivePower = motivePower.replace("Sails", "帆");
            return motivePower
        },
        "i18n": (value) => {
            if(!value) return value;
            let tw0 = value.toLowerCase();
            let tw1 = game.i18n.localize(tw0);

            return tw0 === tw1 ? value : tw1;
        },
        "career_class": (value) => {
            let tw = game.wfrp4ejajp.dict.item.career.hashes.class[value];
            if (tw) {
                return tw;
            } else {
                game.wfrp4ejajp.dict.item.career.hashes.class[value] = value;
                return value;
            }
        },
        "career_careergroup": (value) => {
            let tw = game.wfrp4ejajp.dict.item.career.hashes.careergroup[value];
            if (tw) {
                return tw;
            } else {
                game.wfrp4ejajp.dict.item.career.hashes.careergroup[value] = value;
                return value;
            }
        },
        "career_skills": (skills) => {
            if(!skills) return skills;
            let translated = [];
            let dict = ConvertersJa.getItemDict(game.wfrp4ejajp.dict.item, "skill");
            for (let i = 0; i < skills.length; i++) {
                let entry = ConvertersJa.getItemEntry(dict.entries, skills[i]);
                translated.push(ConvertersJa.getItemName(entry, skills[i]));
            }
            return translated;
        },
        "career_talents": (talents) => {
            if(!talents) return talents;
            let translated = [];
            let dict = ConvertersJa.getItemDict(game.wfrp4ejajp.dict.item, "talent");
            for (let i = 0; i < talents.length; i++) {
                let entry = ConvertersJa.getItemEntry(dict.entries, talents[i]);
                translated.push(ConvertersJa.getItemName(entry, talents[i]));
            }
            return translated
        },
        "career_trappings": (trappings, translation, item, translations) => {
            if(!trappings) return trappings;
            let translated = [];
            let pre = "";
            for (let i = 0; i < trappings.length; i++) {
                let tw = /** @type {string | Record<string, string>} */ (game.wfrp4ejajp.dict.item.career.hashes.trappings[trappings[i]]);
                if (tw) {
                    if (typeof tw !== "string") {
                        // 同じ単語を異なる訳語に振り分けるため、直前の要素で判断する
                        if (!(pre in tw)) {
                            tw[pre] = trappings[i];
                            tw = trappings[i];
                        } else {
                            tw = tw[pre];
                        }
                    }
                    translated.push(tw ? tw : trappings[i])
                } else if (!(trappings[i] in game.wfrp4ejajp.dict.item.career.hashes.trappings)) {
                    // nullを設定すると、「,」で区切られた
                    game.wfrp4ejajp.dict.item.career.hashes.trappings[trappings[i]] = trappings[i];
                    translated.push(trappings[i]);
                }
                pre = trappings[i];
            }
            return translated
        },
        "diseases_symptoms": (value, t, d, tc) => {
            if(!value) return value;
            return value.split(",").map(esym => {
                const symptom = esym.trim().toLowerCase();
                const tw = game.wfrp4ejajp.dict.item.disease.hashes.symptoms[symptom];
                if (!tw) {
                    game.wfrp4ejajp.dict.item.disease.hashes.symptoms[symptom] = esym;
                }
                return tw ? tw : esym;
            }).join(", ");
        },
        "prayer_god": (god) => {
            if(!god) return god;
            return god.split(",").map(data => {
                let god = data.trim();
                let tw_god = game.wfrp4ejajp.dict.item.prayer.hashes.god[god];
                if (!tw_god) {
                    game.wfrp4ejajp.dict.item.prayer.hashes.god[god] = god;
                    return god;
                }
                return tw_god;
            }).join(", ");
        },
        "trait_specification": (value) => {
            if(!value) return value;
            if (typeof value === "string") {
                let ret = [];
                value.split(',').forEach(val => {
                    let tval = game.wfrp4ejajp.dict.item.trait.hashes.specification[val.trim()];
                    ret.push(tval ? tval : val.trim())
                });
                return ret.join(', ')
            } else {
                return value
            }
        },
        "table_results": (results, x, table, z, ...u) => {
            let tableDict = game.wfrp4ejajp.dict.table;
            let dict;
            if (table.name) {
                if (!(table.name in tableDict)) {
                    tableDict[table.name] = {};
                }
                dict = tableDict[table.name];
            } else {
                // ロール表の名前が取得できない場合、ロール表共通の変換テーブルを使用する
                if (!tableDict.hashes) tableDict.hashes = {};
                dict = tableDict.hashes;
            }
            return results.map(result => {
                if (result.text in dict) {
                    return foundry.utils.mergeObject(result, foundry.utils.mergeObject({ 'text': dict[result.text] }, { translated: true }));
                } else {
                    dict[result.text] = result.text;
                    return result;
                }
            });
        },
        "scene_notes_old": (notes) => {
            // Scene[].notes[].text
            // Scene[].notes[].flags.anchor.slug
            // Scene[].notes[].flags.anchor.name
            if (!game.wfrp4ejajp.dict.scene) {
                game.wfrp4ejajp.dict.scene = { "notes": { "text": {}, "flags": { "anchor": { "slug": {}, "name": {} } } } }
            }
            let dict_notes = game.wfrp4ejajp.dict.scene
            return notes.map(note => {
                if (note.text) {
                    if (note.text in dict_notes.text) {
                        note.text = dict_notes.text[note.text];
                    } else {
                        dict_notes.text[note.text] = note.text;
                    }
                }
                if (!dict_notes.flags) { dict_notes.flags = { "anchor": { "slug": {}, "name": {} } } }
                if (!dict_notes.flags.anchor) { dict_notes.flags.anchor = { "slug": {}, "name": {} } }
                if (note.flags?.anchor?.slug) {
                    if (!dict_notes.flags.anchor.slug) { dict_notes.flags.anchor.slug = {} }
                    if (note.flags.anchor.slug in dict_notes.flags.anchor.slug) {
                        note.flags.anchor.slug = dict_notes.flags.anchor.slug[note.flags.anchor.slug];
                    } else {
                        dict_notes.flags.anchor.slug[note.flags.anchor.slug] = note.flags.anchor.slug;
                    }
                }
                if (note.flags?.anchor?.name) {
                    if (!dict_notes.flags.anchor.name) { dict_notes.flags.anchor.name = {} }
                    if (note.flags.anchor.name in dict_notes.flags.anchor.name) {
                        note.flags.anchor.name = dict_notes.flags.anchor.name[note.flags.anchor.name];
                    } else {
                        dict_notes.flags.anchor.name[note.flags.anchor.name] = note.flags.anchor.name;
                    }
                }
                return note;
            });
        },
        "scene_drawings": (drawings, translation, item, translationCompendium, translations) => {
            if (!game.wfrp4ejajp.dict.scene) { game.wfrp4ejajp.dict.scene = {} }
            if (!game.wfrp4ejajp.dict.scene.drawings) { game.wfrp4ejajp.dict.scene.drawings = {} }
            if (!game.wfrp4ejajp.dict.scene.drawings.hashes) { game.wfrp4ejajp.dict.scene.drawings.hashes = {} }
            if (!game.wfrp4ejajp.dict.scene.drawings.hashes.text) { game.wfrp4ejajp.dict.scene.drawings.hashes.text = {} }
            if (!game.wfrp4ejajp.dict.scene.drawings.entries) { game.wfrp4ejajp.dict.scene.drawings.entries = {} }
            let dict_hashes = game.wfrp4ejajp.dict.scene.drawings.hashes;
            let dict_entries = game.wfrp4ejajp.dict.scene.drawings.entries;
            let dict_entry = dict_entries[item._id] || dict_entries[item.name];
            if (!dict_entry) {
                dict_entries[item.name] = { "_id": item._id, "entries": {}, "text": {} };
                dict_entry = dict_entries[item.name];
            }
            return drawings.map(drawing => {
                if (drawing.text === "") return drawing;
                let entry;
                if (dict_entry.text) {
                    entry = dict_entry.text[drawing.text]
                }
                if (!entry && dict_entry.drawings) {
                    entry = dict_entry.drawings[drawing._id] || dict_entry.drawings[drawing.text] || dict_hashes.text[drawing.text];
                } else {
                    entry = dict_entry.text[drawing.text] || dict_hashes.text[drawing.text];
                }

                if (entry) {
                    if (typeof entry === "object") {
                        if (!entry._id || entry._id === drawing._id) {
                            Object.keys(entry).forEach(key => {
                                if (key !== "_id") {    // _id は処理対象外
                                    key.split('.').reduce((acc, val, idx, arr) => { if (idx === arr.length - 1) acc[val] = entry[key]; return acc[val]; }, drawing);
                                }
                            });
                        }
                    } else {
                        drawing.text = entry;
                    }
                } else {
                    if (!dict_entry.drawings) dict_entry.drawings = {};
                    dict_entry.drawings[drawing._id] = {
                        "_id": drawing._id,
                        "text": drawing.text,
                        "x": drawing.x,
                        "y": drawing.y,
                        "shape.width": drawing.shape.width,
                        "shape.height": drawing.shape.height
                    };
                }
                /*
                if ( dict_entry.text[drawing.text] ) {
                    drawing.text = dict_entry.text[drawing.text];
                } else if ( dict_hashes.text[drawing.text] ) {
                    drawing.text = dict_hashes.text[drawing.text];
                    dict_entry.text[drawing.text] = drawing.text;
                } else {
                    dict_entry.text[drawing.text] = drawing.text;
                }
                */
                return drawing;
            });
        },
        "scene_notes": (notes, translation, item, translationCompendium, translations) => {
            if (!game.wfrp4ejajp.dict.scene) { game.wfrp4ejajp.dict.scene = {} }
            if (!game.wfrp4ejajp.dict.scene.notes) { game.wfrp4ejajp.dict.scene.notes = {} }
            if (!game.wfrp4ejajp.dict.scene.notes.hashes) { game.wfrp4ejajp.dict.scene.notes.hashes = {} }
            if (!game.wfrp4ejajp.dict.scene.notes.hashes.text) { game.wfrp4ejajp.dict.scene.notes.hashes.text = {} }
            if (!game.wfrp4ejajp.dict.scene.notes.entries) { game.wfrp4ejajp.dict.scene.notes.entries = {} }
            let dict_hashes = game.wfrp4ejajp.dict.scene.notes.hashes;
            let dict_entries = game.wfrp4ejajp.dict.scene.notes.entries;
            let dict_entry = dict_entries[item._id] || dict_entries[item.name];
            if (!dict_entry) {
                dict_entries[item.name] = { "_id": item._id, "text": {}, "slug": {}, "name": {} };
                dict_entry = dict_entries[item.name];
            }
            if (!dict_entry.text) dict_entry.text = {};
            if (!dict_entry.slug) dict_entry.slug = {};
            if (!dict_entry.name) dict_entry.name = {};
            return notes.map(note => {
                if (note.text !== "") {
                    if (dict_entry.text[note.text]) {
                        note.text = dict_entry.text[note.text];
                    } else if (dict_hashes.text[note.text]) {
                        note.text = dict_hashes.text[note.text];
                        dict_entry.text[note.text] = note.text;
                    } else {
                        dict_entry.text[note.text] = note.text;
                    }
                }
                if (note.flags?.anchor?.slug) {
                    if (dict_entry.slug[note.flags.anchor.slug]) {
                        note.flags.anchor.slug = dict_entry.slug[note.flags.anchor.slug];
                    } else if (dict_hashes.slug[note.flags.anchor.slug]) {
                        note.flags.anchor.slug = dict_hashes.slug[note.flags.anchor.slug];
                        dict_entry.slug[note.flags.anchor.slug] = note.flags.anchor.slug;
                    } else {
                        dict_entry.slug[note.flags.anchor.slug] = note.flags.anchor.slug;
                    }
                }
                if (note.flags?.anchor?.name) {
                    if (dict_entry.name[note.flags.anchor.name]) {
                        note.flags.anchor.name = dict_entry.name[note.flags.anchor.name];
                    } else if (dict_hashes.name[note.flags.anchor.name]) {
                        note.flags.anchor.name = dict_hashes.name[note.flags.anchor.name];
                        dict_entry.name[note.flags.anchor.name] = note.flags.anchor.name;
                    } else {
                        dict_entry.name[note.flags.anchor.name] = note.flags.anchor.name;
                    }
                }
                return note;
            });
        },
        "scene_tokens": (tokens, translation, item, translationCompendium, translations) => {
            if (!game.wfrp4ejajp.dict.scene) { game.wfrp4ejajp.dict.scene = {} }
            if (!game.wfrp4ejajp.dict.scene.tokens) { game.wfrp4ejajp.dict.scene.tokens = {} }
            if (!game.wfrp4ejajp.dict.scene.tokens.hashes) { game.wfrp4ejajp.dict.scene.tokens.hashes = {} }
            if (!game.wfrp4ejajp.dict.scene.tokens.hashes.name) { game.wfrp4ejajp.dict.scene.tokens.hashes.name = {} }
            if (!game.wfrp4ejajp.dict.scene.tokens.entries) { game.wfrp4ejajp.dict.scene.tokens.entries = {} }
            let dict_hashes = game.wfrp4ejajp.dict.scene.tokens.hashes;
            let dict_entries = game.wfrp4ejajp.dict.scene.tokens.entries;
            let dict_entry = dict_entries[item._id] || dict_entries[item.name];
            if (!dict_entry) {
                dict_entries[item.name] = { "_id": item._id, "name": {} };
                dict_entry = dict_entries[item.name];
            }
            if (!dict_entry.name) dict_entry.name = {};
            return tokens.map(token => {
                if (dict_entry.name[token.name]) {
                    token.name = dict_entry.name[token.name];
                } else if (dict_hashes.name[token.name]) {
                    token.name = dict_hashes.name[token.name];
                    dict_entry.name[token.name] = token.name;
                } else {
                    dict_entry.name[token.name] = token.name;
                }
                return token;
            });
        }
    });
});
