import { ConvertersJa, mergeObjectJaJp, overWrite } from './converters-ja.js';

/**
 *
 */
export class Wfrp4eJaJp {
    constructor() {
        this.dict = null;
        this.Characteristics = Wfrp4eJaJp.Characteristics
    }
    static _updateProcedureShown = false;
    static Characteristics = {
        "weapon skill": "WS",
        "ballistic skill": "BS",
        "strength": "S",
        "toughness": "T",
        "initiative": "I",
        "agility": "Ag",
        "dexterity": "Dex",
        "intelligence": "Int",
        "intellegence": "Int",
        "willpower": "WP",
        "fellowship": "Fel"
    }
    static async init() {
        if (!game.wfrp4ejajp) {
            game.wfrp4ejajp = new Wfrp4eJaJp();
        }
        if (game.i18n.defaultModule !== "fvtt-ja") {
            window.alert("wfrp4e-ja-jp：本モジュールを使用する場合\nFVTT本体の設定で、デフォルト言語に「日本語：Foundry VTT（MRyas私家版）」を設定してください。");
            game.logOut();
        }
        await Wfrp4eJaJp.localizeDict();
    }
    static get log() { return console.log.bind(console, 'wfrp4e-ja-jp |'); }
    static _warnUpdateProcedure() {
        if (Wfrp4eJaJp._updateProcedureShown) return;
        Wfrp4eJaJp._updateProcedureShown = true;
        console.warn(
            "wfrp4e-ja-jp | 翻訳ファイル更新手順：\n" +
            "  1. game.wfrp4ejajp.dict.journalUpdate でデータを確認\n" +
            "  2. game.wfrp4ejajp.exportDict() または exportDict({ useZip: false }) でデータをエクスポート\n" +
            "  3. エクスポートしたJSONを参照して翻訳ファイルの text・_text を更新"
        );
    }
    static get warn() { return console.warn.bind(console, 'wfrp4e-ja-jp |'); }
    static notify(message) {
        if (typeof message === "string") {
            ui.notifications.notify("WFRP4e-ja-JP: " + message)
        }
    }
    /**
     * @param {string} name
     * @param {"auto"|1|2|3} [format="auto"]
     * @returns {{ name: string, spec: string }}
     */
    splitNameSpec(name, format = "auto") {
        return ConvertersJa.splitNameSpec(name, format);
    }
    static getSkill(value) {
        let dict = ConvertersJa.getItemDict(game.wfrp4ejajp.dict.item, "skill");
        let entry = ConvertersJa.getItemEntry(dict.entries, value);
        return ConvertersJa.getItemName(entry, value);
    }
    static getTalent(value) {
        let dict = ConvertersJa.getItemDict(game.wfrp4ejajp.dict.item, "talent");
        let entry = ConvertersJa.getItemEntry(dict.entries, value);
        return ConvertersJa.getItemName(entry, value)
    }
    static charGenLocalize() {
        // ローカライズ出来ない部分は、内部データを無理やり書き換える
        for (let species in game.wfrp4e.config.species) {
            if (species in game.wfrp4ejajp.dict.config.species) {
                game.wfrp4e.config.species[species] = game.wfrp4ejajp.dict.config.species[species];
            } else {
                game.wfrp4ejajp.dict.config.species[species] = species;
            }
        }
        for (let especies in game.wfrp4e.config.speciesSkills) {
            for (let i = 0; i < game.wfrp4e.config.speciesSkills[especies].length; i++) {
                game.wfrp4e.config.speciesSkills[especies][i] = Wfrp4eJaJp.getSkill(game.wfrp4e.config.speciesSkills[especies][i]);
            }
        }
        for (let especies in game.wfrp4e.config.speciesTalents) {
            game.wfrp4e.config.speciesTalents[especies] = game.wfrp4e.config.speciesTalents[especies].map(x => { return typeof x === "string" ? x.split(",").map(y => Wfrp4eJaJp.getTalent(y.trim())).join(", ") : x; });
        }
        for (let species in game.wfrp4e.config.subspecies) {
            if (!(species in game.wfrp4ejajp.dict.config.subspecies)) {
                game.wfrp4ejajp.dict.config.subspecies[species] = {};
            }
            for (let subspecies in game.wfrp4e.config.subspecies[species]) {
                if (subspecies in game.wfrp4ejajp.dict.config.subspecies[species]) {
                    game.wfrp4e.config.subspecies[species][subspecies].name = game.wfrp4ejajp.dict.config.subspecies[species][subspecies];
                } else {
                    game.wfrp4ejajp.dict.config.subspecies[species][subspecies] = subspecies;
                }
                if (game.wfrp4e.config.subspecies[species][subspecies].skills) {
                    game.wfrp4e.config.subspecies[species][subspecies].skills = game.wfrp4e.config.subspecies[species][subspecies].skills.map(x => { return Wfrp4eJaJp.getSkill(x); });
                }
                if (game.wfrp4e.config.subspecies[species][subspecies].talents) {
                    game.wfrp4e.config.subspecies[species][subspecies].talents = game.wfrp4e.config.subspecies[species][subspecies].talents.map(x => { return typeof x === "string" ? x.split(",").map(y => Wfrp4eJaJp.getTalent(y.trim())).join(", ") : x; });
                }
            }
        }
        for (let species in game.wfrp4e.config.speciesCareerReplacements) {
            let scr = game.wfrp4e.config.speciesCareerReplacements[species];
            for (let careergroup in scr) {
                // キャリア置き換えはハッシュのキーをローカライズする必要があるので、ローカライズしたものを追加する
                let tw_careergroup = game.wfrp4ejajp.dict.item.career.hashes.careergroup[careergroup];
                if (tw_careergroup != careergroup) {
                    scr[tw_careergroup] = scr[careergroup].map(cg => {
                        let tw = game.wfrp4ejajp.dict.item.career.hashes.careergroup[cg];
                        return tw ? tw : cg;
                    });
                }
            }
        }
        game.wfrp4e.config.classTrappings = {
            "学士": game.i18n.localize("ClassTrappings.Academics"),
            "都市民": game.i18n.localize("ClassTrappings.Burghers"),
            "廷臣": game.i18n.localize("ClassTrappings.Courtiers"),
            "農村民": game.i18n.localize("ClassTrappings.Peasants"),
            "野外民": game.i18n.localize("ClassTrappings.Rangers"),
            "河川民": game.i18n.localize("ClassTrappings.Riverfolk"),
            "無頼": game.i18n.localize("ClassTrappings.Rogues"),
            "戦士": game.i18n.localize("ClassTrappings.Warriors")
        }
    }
    static symptomsLocalize() {
        for (let esymptom in game.wfrp4e.config.symptoms) {
            //let tw = game.wfrp4ejajp.dict.diseases.symptoms[esymptom];
            let text = esymptom.toLowerCase();
            let tw = game.wfrp4ejajp.dict.item.disease.hashes.symptoms[text];
            if (tw) {
                if (tw !== game.wfrp4e.config.symptoms[esymptom]) {
                    Wfrp4eJaJp.log(`症状「${esymptom}」ラベル：「${game.wfrp4e.config.symptoms[esymptom]}」⇒「${tw}」`);
                    game.wfrp4e.config.symptoms[esymptom] = tw;
                }
            } else {
                game.wfrp4ejajp.dict.item.disease.hashes.symptoms[text] = text;
            }
        }
        Object.keys(game.wfrp4e.config.symptomEffects).map((key, index) => {
            //let tw = game.wfrp4ejajp.dict.diseases.symptoms[key];
            let text = key.toLowerCase();
            let tw = game.wfrp4ejajp.dict.item.disease.hashes.symptoms[text];
            if (tw) {
                Wfrp4eJaJp.log(`症状「${key}」効果ラベル：「${game.wfrp4e.config.symptomEffects[key].label}」⇒「${tw}」`);
                game.wfrp4e.config.symptomEffects[key].label = tw
            } else {
                game.wfrp4ejajp.dict.item.disease.hashes.symptoms[text] = text;
            }
        });
        Object.keys(game.wfrp4e.config.symptomDescriptions).forEach(key => {
            let tw = game.wfrp4ejajp.dict.diseases.symptomDescriptions[key];
            if (tw) {
                Wfrp4eJaJp.log(`症状「${key}」説明：「${game.wfrp4e.config.symptomDescriptions[key]}」⇒「${tw}」`);
                game.wfrp4e.config.symptomDescriptions[key] = tw;
            }
        });
        Object.keys(game.wfrp4e.config.symptomTreatment).forEach(key => {
            if (game.wfrp4ejajp.dict.diseases.symptomTreatment[key]) {
                game.wfrp4e.config.symptomTreatment[key] = game.wfrp4ejajp.dict.diseases.symptomTreatment[key];
            } else if (game.wfrp4e.config.symptomTreatment[key].substring(0, 24) === "WFRP4E.SymptomTreatment.") {
                game.wfrp4e.config.symptomTreatment[key] = game.i18n.localize(game.wfrp4e.config.symptomTreatment[key]);
            }
        });
    }
    static travelLocalize() {
        TravelDistanceWFRP4e.travel_data?.forEach(x => {
            if (x.from in game.wfrp4ejajp.dict.travel) {
                x.from = game.wfrp4ejajp.dict.travel[x.from];
            } else {
                game.wfrp4ejajp.dict.travel[x.from] = x.from;
            }
            if (x.to in game.wfrp4ejajp.dict.travel) {
                x.to = game.wfrp4ejajp.dict.travel[x.to];
            } else {
                game.wfrp4ejajp.dict.travel[x.to] = x.to;
            }
        })
    }
    static groupAdvantageActionsLocalize() {
        if (!game.wfrp4ejajp.dict.config.groupAdvantageActions) game.wfrp4ejajp.dict.config.groupAdvantageActions = {};
        game.wfrp4e.config.groupAdvantageActions.forEach(x => {
            // 「name」をキーに翻訳データを「game.wfrp4e」
            if (game.wfrp4ejajp.dict.config.groupAdvantageActions[x.name]) {
                let dict = game.wfrp4ejajp.dict.config.groupAdvantageActions[x.name];
                Object.keys(dict).forEach(key => {
                    x[key] = dict[key];
                });
            } else {
                game.wfrp4ejajp.dict.config.groupAdvantageActions[x.name] = {};
                ["name", "description", "effect"].forEach(key => {
                    game.wfrp4ejajp.dict.config.groupAdvantageActions[x.name][key] = x[key];
                })
            }
        })
    }
    static async localizeDict() {
        let localizeDict = game.settings.get("wfrp4e-ja-jp", "localizeDict");
        if (localizeDict === "") {
            localizeDict = "modules/wfrp4e-ja-jp/json/wfrp4e-ja-jp.json"
        }
        try {
            const response = await fetch(localizeDict);
            game.wfrp4ejajp.dict = await response.json();
        } catch (err) {
            Wfrp4eJaJp.warn(err);
            game.wfrp4ejajp.dict = {};
        }
        mergeObjectJaJp(game.wfrp4ejajp.dict, {
            "actor": {
                "hashes": {
                    "color": {},
                    "gender": {},
                    "species": {},
                    "status": {}
                }
            },
            "item": {
                "hashes": {
                    "location": {}
                },
                "career": {
                    "mapping": {},
                    "hashes": {
                        "class": {},
                        "careergroup": {},
                        "trappings": {}
                    },
                    "entries": {}
                },
                "critical": {
                    "mapping": {},
                    "entries": {}
                },
                "disease": {
                    "mapping": {},
                    "hashes": {
                        "symptoms": {}
                    },
                    "entries": {}
                },
                "injury": {
                    "mapping": {},
                    "entries": {}
                },
                "mutation": {
                    "mapping": {},
                    "entries": {}
                },
                "prayer": {
                    "mapping": {},
                    "hashes": {
                        "god": {}
                    },
                    "entries": {}
                },
                "psychology": {
                    "mapping": {},
                    "entries": {}
                },
                "skill": {
                    "mapping": {},
                    "entries": {}
                },
                "spell": {
                    "mapping": {},
                    "entries": {}
                },
                "talent": {
                    "mapping": {},
                    "entries": {}
                },
                "trait": {
                    "mapping": {},
                    "entries": {}
                },
                "ammunition": {
                    "mapping": {},
                    "entries": {}
                },
                "armour": {
                    "mapping": {},
                    "entries": {}
                },
                "trapping": {
                    "mapping": {},
                    "entries": {}
                },
                "container": {
                    "mapping": {},
                    "entries": {}
                },
                "weapon": {
                    "mapping": {},
                    "entries": {}
                },
                "money": {
                    "mapping": {},
                    "entries": {}
                }
            },
            "prayer_spell": {
                "simple": {},
                "unit": {}
            },
            "table": {},
            "scene": {
                "drawings": {
                    "hashes": {
                        "text": {}
                    },
                    "entries": {}
                },
                "notes": {
                    "hashes": {
                        "text": {},
                        "slug": {},
                        "name": {}
                    },
                    "entries": {}
                },
                "tokens": {
                    "hashes": {
                        "name": {}
                    },
                    "entries": {}
                }
            },
            "globalEffects": {},
            "travel": {},
            "trade": {}
        });

        const mergeDict = game.settings.get("wfrp4e-ja-jp", "mergeDict");
        if (mergeDict !== "") {
            try {
                const data = await (await fetch(mergeDict)).json();
                //キーに「.」があると mergeObject は展開してしまうので使わない
                mergeObjectJaJp(game.wfrp4ejajp.dict, data);
            } catch (err) {
                Wfrp4eJaJp.warn(err);
            }
        }

        const mergeDictFolder = game.settings.get('wfrp4e-ja-jp', 'mergeDictFolder');
        if (mergeDictFolder !== "") {
            let dictFiles = [];
            try {
                let result = await foundry.applications.apps.FilePicker.browse('data', mergeDictFolder);
                result.files.forEach(file => dictFiles.push(file));
            } catch (err) {
                Wfrp4eJaJp.warn(err);
            }
            await Promise.all(dictFiles.map(async file => {
                try {
                    const data = await (await fetch(file)).json();
                    //キーに「.」があると mergeObject は展開してしまうので使わない
                    mergeObjectJaJp(game.wfrp4ejajp.dict, data);
                    Wfrp4eJaJp.log(`辞書ファイル「${file}」を読み込み。`);
                } catch (err) {
                    Wfrp4eJaJp.warn(`辞書ファイル「${file}」の読み込みに失敗しました: ${err}`);
                }
            }));
        }
    }
    /*
    ** extract(collection, entity)
    **  exportTranslationsFile から呼ばれる翻訳フィールド抽出メソッド。
    **  【未実装】collection の種別に応じてエンティティから翻訳対象フィールドを
    **  抽出し { name, description, ... } 形式のオブジェクトを返す必要がある。
    */
    /** @param {string} _collection @param {unknown} _entity @returns {Record<string, unknown>} */
    extract(_collection, _entity) {
        return {};
    }

    /*
    ** exportTranslationsFile(pack)
    **  指定コンペンディアムから Babele 翻訳テンプレート JSON を生成し ZIP で出力する。
    **  Babele 標準のテンプレート出力とは独立した実装で、Babele 未翻訳時の
    **  originalName を使って英語キーを取得する点が異なる。
    **  extract() が未実装のため現在は空エントリのみ出力される。
    **  実装するまで呼び出し元を設けないこと。
    */
    async exportTranslationsFile(pack) {
        let file = {
            label: pack.metadata.label,
            entries: {}
        }
        let index = await pack.getIndex();
        Promise.all(index.map(entry => pack.getDocument(entry._id))).then(entries => {
            entries.forEach((entity, idx) => {
                const name = entity.getFlag("babele", "translated") ? entity.getFlag("babele", "originalName") : entity.name;
                file.entries[`${name}`] = this.extract(pack.collection, entity);
            });

            let dataStr = JSON.stringify(file, null, '\t');
            let exportFileDefaultName = pack.collection + '.json';

            var zip = new JSZip();
            zip.file(exportFileDefaultName, dataStr);
            zip.generateAsync({ type: "blob" })
                .then(content => {
                    saveAs(content, pack.collection + ".zip");
                });
        });
    }

    static configJP() {
        if (game.wfrp4ejajp?.dict?._configJP) {
            for (let ekeyj in game.wfrp4ejajp.dict._configJP) {
                ConvertersJa.checkDictmap(game.wfrp4e.config[ekeyj], game.wfrp4ejajp.dict._configJP[ekeyj], ekeyj);
            }
        }
        if (game.wfrp4ejajp?.dict?.configJP) {
            for (let ekeyj in game.wfrp4ejajp.dict.configJP) {
                if (!game.wfrp4e.config[ekeyj]) {
                    Wfrp4eJaJp.warn(`Wfrp4eJaJp.configJP：存在しないキーです「${ekeyj}」`);
                    continue;
                }
                ConvertersJa.dictmap(game.wfrp4e.config[ekeyj], game.wfrp4ejajp.dict.configJP[ekeyj], true, true, `configJP.${ekeyj}`);
            }
        }
    }

    /*
    ** exportDict({ fileName, useZip })
    **  fileName: 出力先ファイル名（デフォルト: "wfrp4e-ja-jp.json"）
    **  useZip: ZIP 圧縮して出力するか（デフォルト: true）
    **  辞書ファイルを出力する
    */
    async exportDict({ fileName = "wfrp4e-ja-jp.json", useZip = true, loadAll = false } = {}) {
        if (loadAll) {
            Wfrp4eJaJp.notify("辞書エクスポート準備中：全コンペンディアムを読み込んでいます...");
            for (const pack of game.packs) {
                if (!game.babele?.isTranslated(pack.collection)) continue;
                try {
                    const index = await pack.getIndex();
                    for (const entry of index) {
                        await pack.getDocument(entry._id);
                    }
                } catch (e) {
                    Wfrp4eJaJp.warn(`exportDict: パック「${pack.collection}」の読み込みに失敗しました: ${e.message}`);
                }
            }
        }
        let dataStr = JSON.stringify(this.dict, null, '\t');
        let jsonFileName = fileName.endsWith(".json") ? fileName : fileName + ".json";
        if (useZip) {
            let zip = new JSZip();
            zip.file(jsonFileName, dataStr);
            zip.generateAsync({ type: "blob" }).then(content => {
                saveAs(content, jsonFileName + ".zip");
            });
        } else {
            saveAs(new Blob([dataStr], { type: "application/json" }), jsonFileName);
        }
    }

    /*
    ** translateFolderName(name, id)
    **  フォルダ名を翻訳する。dict.folders → Babele の順で参照。
    */
    static translateFolderName(name, id = null) {
        const byDict = (id && game.wfrp4ejajp.dict.folders?.[id])
                    || game.wfrp4ejajp.dict.folders?.[name];
        if (byDict) return byDict;

        if (game.babele) {
            for (const pack of game.packs) {
                const t = game.babele.packs.get(pack.collection)?.folders?.[name];
                if (t) return t;
            }
        }
        return null;
    }

    /*
    ** localizeFolders()
    **  フォルダをローカライズする
    */
    localizeFolders(localizeCompendiumFolder = false) {
        game.folders.forEach(/** @param {any} f */ f => {
            if (!(f.type === "compendium") || localizeCompendiumFolder) {
                const twname = Wfrp4eJaJp.translateFolderName(f.name, f._id);
                if (twname) {
                    f.update({ "name": twname });
                } else {
                    if (!game.wfrp4ejajp.dict.folders) game.wfrp4ejajp.dict.folders = {};
                    game.wfrp4ejajp.dict.folders[f._id] = f.name;
                }
            }
        });
    }

    translateEffect(effect, sourceItem) {
        if (!("effects" in this.dict)) this.dict.effects = {};
        if ("name" in effect) {
            if (!("name" in this.dict.effects)) this.dict.effects.name = {};
            if (effect.name !== "") {
                let tw = this.dict.effects.name[effect.name];
                if (tw) {
                    effect.name = tw
                } else {
                    this.dict.effects.name[effect.name] = effect.name;
                }
                if (sourceItem?.type === "talent") {
                    effect.name = "《" + effect.name + "》"
                }
            }
        } else if ("label" in effect) {
            // label ～V10まで
            if (!("label" in this.dict.effects)) this.dict.effects.label = {};
            let tw = this.dict.effects.label[effect.label];
            if (tw) effect.label = tw
        }
        // description
        if (effect.flags?.wfrp4e?.effectData?.description) {
            if (!("description" in this.dict.effects)) this.dict.effects.description = {};
            let tw = this.dict.effects.description[effect.flags.wfrp4e.effectData.description];
            if (tw) {
                effect.flags.wfrp4e.effectData.description = tw
            } else {
                this.dict.effects.description[effect.flags.wfrp4e.effectData.description] = effect.flags.wfrp4e.effectData.description
            }
        }
        // script
        if (effect.flags?.wfrp4e?.script) {
            let tw = effect.flags.wfrp4e.script;
            for (let key in this.dict.effects.script) {
                tw = tw.replaceAll(key, this.dict.effects.script[key]);
                // @UUID 対応（@Compendiumを自動的に@UUIDに置き換える）
                if (tw.indexOf("@Compendium[") != -1) {
                    tw = tw.replaceAll("@Compendium[", "@UUID[Compendium.");
                    Wfrp4eJaJp.log(`translateEffect(${effect.name}):@Compendium⇒@UUID`)
                }
                if (key.indexOf("@Compendium[") != -1) {
                    let newKey = key.replaceAll("@Compendium[", "@UUID[Compendium.");
                    let newVal = this.dict.effects.script[key].replaceAll("@Compendium[", "@UUID[Compendium.");
                    tw = tw.replaceAll(newKey, newVal);
                }
            }
            if (tw) effect.flags.wfrp4e.script = tw
        }
    }
}
// End class Wfrp4eJaJp
