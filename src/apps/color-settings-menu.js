const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const MODULE_ID = "wfrp4e-ja-jp";

/**
 * テストカード色分けに関する設定をまとめて編集するダイアログ。
 * `game.settings.registerMenu` から開かれる設定サブメニュー。
 *
 * 色分け関連の設定キーは {@link ColorSettingsMenu.SETTING_KEYS} に列挙する。
 * ここに追加するだけで（select / checkbox）ダイアログに項目が増える。
 */
export class ColorSettingsMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @type {string[]} ダイアログで編集する色分け関連の設定キー（追加はここに） */
    static SETTING_KEYS = [
        "successHue",
        "failureHue",
        "targetSlBg",
        "targetSlBorder",
        "targetCardBorder",
        "targetTestTitle",
        "targetDescription",
    ];

    static DEFAULT_OPTIONS = {
        id: "wfrp4e-ja-jp-color-settings",
        tag: "form",
        classes: ["wfrp4e-ja-jp", "color-settings-menu"],
        window: {
            title: "Wfrp4eJaJp.Settings.colorSettingsMenu.title",
            icon: "fa-solid fa-palette",
            contentClasses: ["standard-form"],
        },
        position: { width: 480, height: "auto" },
        form: {
            handler: ColorSettingsMenu.#onSubmit,
            closeOnSubmit: true,
        },
    };

    static PARTS = {
        body: { template: `modules/${MODULE_ID}/templates/color-settings-menu.hbs` },
        footer: { template: "templates/generic/form-footer.hbs" },
    };

    /** @override */
    async _prepareContext(_options) {
        const fields = ColorSettingsMenu.SETTING_KEYS.map((key) => {
            const config = game.settings.settings.get(`${MODULE_ID}.${key}`);
            const value = game.settings.get(MODULE_ID, key);
            const isSelect = !!config?.choices;
            return {
                key,
                name: config?.name ? game.i18n.localize(config.name) : key,
                hint: config?.hint ? game.i18n.localize(config.hint) : "",
                value,
                isSelect,
                isCheckbox: !isSelect && config?.type === Boolean,
                choices: isSelect
                    ? Object.entries(config.choices).map(([v, label]) => ({
                        value: v,
                        label: game.i18n.localize(label),
                        selected: v === value,
                    }))
                    : [],
            };
        });

        return {
            fields,
            buttons: [
                { type: "submit", icon: "fa-solid fa-floppy-disk", label: "SETTINGS.Save" },
            ],
        };
    }

    /**
     * フォーム送信時に各設定を保存する。
     * @this {ColorSettingsMenu}
     * @param {SubmitEvent} _event
     * @param {HTMLFormElement} _form
     * @param {FormDataExtended} formData
     */
    static async #onSubmit(_event, _form, formData) {
        const data = foundry.utils.expandObject(formData.object);
        for (const key of ColorSettingsMenu.SETTING_KEYS) {
            if (!(key in data)) continue;
            if (data[key] !== game.settings.get(MODULE_ID, key)) {
                await game.settings.set(MODULE_ID, key, data[key]);
            }
        }
    }
}
