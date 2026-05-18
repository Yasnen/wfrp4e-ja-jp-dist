import { Wfrp4eJaJp } from './Wfrp4eJaJp.js';

// wfrp4e-eis v7.2.0 時点の dhar.js の SHA-256。異なる場合はパッチの見直しが必要。
const DHAR_JS_EXPECTED_HASH = "69b8183c643a218a4cb29e0f29179db9c03dadf191147587dac3512216373832";

async function verifyDharJs() {
    try {
        const res = await fetch('/modules/wfrp4e-eis/dhar.js');
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        const hashBuf = await crypto.subtle.digest('SHA-256', buf);
        const hashHex = Array.from(new Uint8Array(hashBuf))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        if (hashHex !== DHAR_JS_EXPECTED_HASH) {
            Wfrp4eJaJp.warn(
                `wfrp4e-eis/dhar.js のハッシュが変化しています。workaround-dhar.js の見直しが必要な可能性があります。` +
                `\n  期待値: ${DHAR_JS_EXPECTED_HASH}\n  実際値: ${hashHex}`
            );
            if (game.user.isGM) {
                ui.notifications.warn(
                    `[wfrp4e-ja-jp] wfrp4e-eis/dhar.js が更新されています。Dhar ワークアラウンドのパッチ要確認。`,
                    { permanent: true }
                );
            }
        }
    } catch (e) {
        Wfrp4eJaJp.warn(`wfrp4e-eis/dhar.js のハッシュ検証に失敗しました: ${e}`);
    }
}

// WORKAROUND: Dhar（ダハール）ハードコーディング対応
// wfrp4e-eis/dhar.js および systems/wfrp4e/wfrp4e.js で "Dhar" がハードコードされているため、
// 日本語化後の「ダハール」でも Dhar 効果が正しく判定されるよう補完している。
// wfrp4e-eis モジュールおよびシステム側が多言語化に対応したら、このファイルごと削除すること。
Hooks.once('init', () => {
    if (!game.modules.get("wfrp4e-eis")?.active) return;

    Wfrp4eJaJp.log("Dhar ハードコーディング対応：「発動テスト」における「Dhar」を「ダハール」でも判定するよう処理追加！");

    // WORKAROUND: wfrp4e.js の mooOvercasting ハウスルール内でも "Dhar" がハードコードされている。
    // TestWFRP.prototype._overcast / _overcastReset に「ダハール」を追加パッチする。
    // useWoMOvercast=true 時は WomCastTest が独自処理を持ち @HOUSE ブロックを通らないため対象外。
    Hooks.once('ready', () => {
        verifyDharJs();

        libWrapper.register(
            'wfrp4e-ja-jp',
            'game.wfrp4e.rolls.TestWFRP.prototype._overcast',
            async function(wrapped, choice) {
                // オーバーキャスト使用前の状態を記録（補正量の算出に使用）
                const isDharJa = (
                    game.settings.get("wfrp4e", "homebrew").mooOvercasting &&
                    this.spell &&
                    game.settings.get("wfrp4e-eis", "dharRules") &&
                    game.wfrp4e.config.magicWind[this.spell.lore.value] == "ダハール"
                );
                await wrapped(choice);
                if (!isDharJa) return;
                // 元処理は spent=2 で SL を減算したが、ダハールは spent=1 が正しい。1 戻す。
                this.result.SL = `+${Number(this.result.SL) + 1}`;
                await this.calculateDamage();
                await this.updateMessageData();
                await this.renderRollCard();
            },
            'WRAPPER'
        );

        libWrapper.register(
            'wfrp4e-ja-jp',
            'game.wfrp4e.rolls.TestWFRP.prototype._overcastReset',
            async function(wrapped) {
                const isDharJa = (
                    game.settings.get("wfrp4e", "homebrew").mooOvercasting &&
                    this.spell &&
                    game.settings.get("wfrp4e-eis", "dharRules") &&
                    game.wfrp4e.config.magicWind[this.spell.lore.value] == "ダハール"
                );
                // 元処理が overcastData.available を書き換える前に差分を保存する
                const overcastDiff = isDharJa ? (this.result.overcast.total - this.result.overcast.available) : 0;
                await wrapped();
                if (!isDharJa || overcastDiff === 0) return;
                // 元処理は multiplier=2 で SL を加算したが、ダハールは multiplier=1 が正しい。
                // 過剰分 (2-1)*overcastDiff = overcastDiff を引く。
                this.result.SL = `+${Number(this.result.SL) - overcastDiff}`;
                await this.calculateDamage();
                await this.updateMessageData();
                await this.renderRollCard();
            },
            'WRAPPER'
        );

        Wfrp4eJaJp.log("Dhar ハードコーディング対応：mooOvercasting ハウスルールの「Dhar」判定を「ダハール」にも対応するようパッチ済み！");
    });

    Hooks.on("wfrp4e:rollCastTest", test => {
        if (game.wfrp4e.config.magicWind[test.spell.lore.value] == "ダハール") {
            if (test.result.roll == 88) {
                test.result.other.push(game.i18n.localize("EiS.MajorDhar"))
            }
            else if (test.result.roll.toString().includes("8")) {
                test.result.other.push(game.i18n.localize("EiS.MinorDhar"))
            }
            if (test.result.roll % 11 == 0) {
                test.result.other.push(game.i18n.localize("EiS.DoubleRolled"))
            }

            if (test.result.description == game.i18n.localize("ROLL.CastingSuccess")) {
                test.result.overcast.total = Math.max(0, Number(test.result.SL) - (test.spell.cn.value - Math.min(test.preData.itemData.system.cn.SL, test.spell.cn.value)))
                test.result.overcast.available = test.result.overcast.total
                if (game.settings.get("wfrp4e", "useWoMOvercast")) {
                    test.result.overcast.total *= 2;
                    test.result.overcast.available *= 2;
                }
            }
        }
    });

    Hooks.on("wfrp4e:rollChannelTest", test => {
        if (game.wfrp4e.config.magicWind[test.spell.lore.value] == "ダハール") {
            if (test.result.roll == 88) {
                test.result.other.push(game.i18n.localize("EiS.MajorDhar"))
            }
            else if (test.result.roll.toString().includes("8")) {
                test.result.other.push(game.i18n.localize("EiS.MinorDhar"))
            }
            if (test.result.roll % 11 == 0) {
                test.result.other.push(game.i18n.localize("EiS.DoubleRolled"))
            }
        }
    });
});
