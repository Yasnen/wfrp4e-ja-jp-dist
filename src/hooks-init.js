import { ConvertersJa } from './converters-ja.js';
import { Wfrp4eJaJp } from './Wfrp4eJaJp.js';

Hooks.once('init', async () => {
    game.settings.register("wfrp4e-ja-jp", "travelLocalize", {
        name: "Wfrp4eJaJp.Settings.travelLocalize.name",
        hint: "Wfrp4eJaJp.Settings.travelLocalize.hint",
        type: Boolean,
        scope: 'world',
        default: false,
        config: true,
        onChange: () => {
            if (game.settings.get("wfrp4e-ja-jp", "travelLocalize")) {
                Wfrp4eJaJp.travelLocalize()
            }
        }
    });
    game.settings.register("wfrp4e-ja-jp", "bilingualJournal", {
        name: "Wfrp4eJaJp.Settings.bilingualJournal.name",
        hint: "Wfrp4eJaJp.Settings.bilingualJournal.hint",
        type: Boolean,
        scope: 'world',
        default: false,
        config: true
    });
    game.settings.register("wfrp4e-ja-jp", "localizeDict", {
        name: "Wfrp4eJaJp.Settings.localizeDict.name",
        hint: "Wfrp4eJaJp.Settings.localizeDict.hint",
        type: String,
        default: "",
        scope: 'world',
        config: true,
        filePicker: "file",
        onChange: () => {
            Wfrp4eJaJp.localizeDict()
        }
    });
    game.settings.register("wfrp4e-ja-jp", "mergeDict", {
        name: "Wfrp4eJaJp.Settings.mergeDict.name",
        hint: "Wfrp4eJaJp.Settings.mergeDict.hint",
        type: String,
        default: "",
        scope: 'world',
        config: true,
        filePicker: "file",
        onChange: () => {
            Wfrp4eJaJp.localizeDict()
        }
    });
    game.settings.register("wfrp4e-ja-jp", "mergeDictFolder", {
        name: "Wfrp4eJaJp.Settings.mergeDictFolder.name",
        hint: "Wfrp4eJaJp.Settings.mergeDictFolder.hint",
        type: String,
        default: "",
        scope: 'world',
        config: true,
        filePicker: "folder",
        onChange: () => {
            Wfrp4eJaJp.localizeDict()
        }
    });
    game.settings.register("wfrp4e-ja-jp", "supressExportDict", {
        name: "Wfrp4eJaJp.Settings.supressExportDict.name",
        hint: "Wfrp4eJaJp.Settings.supressExportDict.hint",
        scope: 'world',
        type: Boolean,
        config: true,
        default: true
    });
    game.settings.register("wfrp4e-ja-jp", "supressDescription", {
        name: "Wfrp4eJaJp.Settings.supressDescription.name",
        hint: "Wfrp4eJaJp.Settings.supressDescription.hint",
        scope: 'world',
        type: Boolean,
        config: false,
        default: false
    });
    game.settings.register("wfrp4e-ja-jp", "exportJournalToDict", {
        name: "Wfrp4eJaJp.Settings.exportJournalToDict.name",
        hint: "Wfrp4eJaJp.Settings.exportJournalToDict.hint",
        scope: 'world',
        type: Boolean,
        config: true,
        default: false
    });
    game.settings.register("wfrp4e-ja-jp", "use_idAsKey", {
        name: "Wfrp4eJaJp.Settings.use_idAsKey.name",
        hint: "Wfrp4eJaJp.Settings.use_idAsKey.hint",
        scope: "world",
        type: Boolean,
        config: true,
        default: false
    });
    game.settings.register("wfrp4e-ja-jp", "checkSourceUpdate", {
        name: "Wfrp4eJaJp.Settings.checkSourceUpdate.name",
        hint: "Wfrp4eJaJp.Settings.checkSourceUpdate.hint",
        type: Boolean,
        scope: 'world',
        default: true,
        config: true,
        onChange: () => {
            window.location.reload()
        }
    });
    game.settings.register("wfrp4e-ja-jp", "itemEffectsAddDict", {
        name: "Wfrp4eJaJp.Settings.itemEffectsAddDict.name",
        hint: "Wfrp4eJaJp.Settings.itemEffectsAddDict.hint",
        scope: "world",
        type: Boolean,
        config: true,
        default: false
    });

    Wfrp4eJaJp.init();

});

Hooks.once("i18nInit", () => {
    Wfrp4eJaJp.charGenLocalize();
});

Hooks.once("ready", async () => {
    
    if (game.settings.get("wfrp4e", "useGroupAdvantage")) {
        Wfrp4eJaJp.groupAdvantageActionsLocalize();
    }
    // Wfrp4eJaJp.symptomsLocalize();
    if (game.settings.get("wfrp4e-ja-jp", "travelLocalize")) {
        Wfrp4eJaJp.travelLocalize()
    }
    if (!game.wfrp4ejajp.dict.trade) game.wfrp4ejajp.dict.trade = {};
    // 「name」を検索キーにしているため、元データで「name」が空白になっている不具合があるデータに予めパッチ当て
    game.wfrp4e.trade.gazetteers.river.forEach(x => { if (x.name == "") { x.name = "Castle Reikguard" } });
    ConvertersJa.dictmap(game.wfrp4e.trade, game.wfrp4ejajp.dict.trade, true);
    let tradeData = {
        cargoTypes: {
            "boatbuilding": "ボート建造",
            "metalworking": "金属加工"
        }
    }
    game.wfrp4e.trade.addTradeData(tradeData, "river");

    let cd = 100;
    while (!game.wfrp4e?.config?.statusEffects && --cd > 0) {
        // WFRP4eシステムが「hooks\ready.js」で「game.wfrp4e.config」を更新しているので、暫定的に無理やり待つ
        await WFRP_Utility.sleep(1);
    }
    if (cd == 0) { Wfrp4eJaJp.warn("statusEffects日本語化出来ませんでした"); }
    Wfrp4eJaJp.configJP();
    ui.notifications.notify("WFRP4e-ja-JP: 初期化完了");
});

Hooks.on("preCreateFolder", (document, data, options, userId) => {
    if (!data.flags?.["warhammer-lib"]) return;
    const translated = Wfrp4eJaJp.translateFolderName(data.name);
    if (translated) document.updateSource({ name: translated });
});
