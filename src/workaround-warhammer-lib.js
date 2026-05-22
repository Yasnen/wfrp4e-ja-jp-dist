import { Wfrp4eJaJp } from './Wfrp4eJaJp.js';

// warhammer-lib v2.10.0 時点の WarhammerModuleContentHandler.prototype.delete の toString() ハッシュ。
// await なし（バグあり）状態のハッシュ。ブラウザの toString() 結果との差異がある場合は
// コンソールに出力される「実際値」でこの定数を更新すること。
const EXPECTED_DELETE_HASH = "02065c8e3892e6454c272e34924a0e08a605be02a4e8b8f4572fcbe2a083ed35";

async function verifyDeleteMethod(src) {
    try {
        const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(src));
        const hashHex = Array.from(new Uint8Array(hashBuf))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        if (hashHex !== EXPECTED_DELETE_HASH) {
            const version = game.modules.get("warhammer-lib")?.version ?? "unknown";
            Wfrp4eJaJp.warn(
                `WarhammerModuleContentHandler.delete() のハッシュが変化しています。workaround-warhammer-lib.js の見直しが必要な可能性があります。` +
                `\n  warhammer-lib バージョン: ${version}` +
                `\n  期待値: ${EXPECTED_DELETE_HASH}\n  実際値: ${hashHex}`
            );
            if (game.user?.isGM) {
                ui.notifications.warn(
                    `[wfrp4e-ja-jp] warhammer-lib (v${version}) が更新されています。WarhammerModuleContentHandler パッチの確認が必要です。`,
                    { permanent: true }
                );
            }
        }
    } catch (e) {
        Wfrp4eJaJp.warn(`WarhammerModuleContentHandler.delete() のハッシュ検証に失敗しました: ${e}`);
    }
}

// WORKAROUND: warhammer-lib の WarhammerModuleContentHandler.delete() は await が欠落しており、
// フォルダ削除がコンテンツ削除と競合して失敗する。libWrapper でオーバーライドして修正する。
// warhammer-lib が deleteDocuments() に await を追加して修正したら、このファイルごと削除すること。
Hooks.once("setup", () => {
    if (!game.modules.get("warhammer-lib")?.active) return;

    const src = WarhammerModuleContentHandler.prototype.delete.toString();

    // 上流修正チェック：deleteDocuments の前に await があれば修正済みのためパッチ不要
    if (/await\s+CONFIG\.\w+\.documentClass\.deleteDocuments/.test(src)) {
        Wfrp4eJaJp.log("workaround-warhammer-lib: 上流が await を追加済み。パッチをスキップします。");
        return;
    }

    // await はまだないが内容が変化している場合の安全網（fire-and-forget）
    verifyDeleteMethod(src);

    libWrapper.register(
        "wfrp4e-ja-jp",
        "WarhammerModuleContentHandler.prototype.delete",
        async function() {
            const id = this.module.id;
            const filter = doc => doc.flags?.["warhammer-lib"]?.source === id;

            ui.notifications.notify(this.module.title + ": " + game.i18n.localize("WH.Initialization.DeletingScenes"));
            await CONFIG.Scene.documentClass.deleteDocuments(
                game.scenes.filter(filter).map(doc => doc.id)
            );

            ui.notifications.notify(this.module.title + ": " + game.i18n.localize("WH.Initialization.DeletingActors"));
            await CONFIG.Actor.documentClass.deleteDocuments(
                game.actors.filter(d => filter(d) && !d.hasPlayerOwner).map(doc => doc.id)
            );

            ui.notifications.notify(this.module.title + ": " + game.i18n.localize("WH.Initialization.DeletingItems"));
            await CONFIG.Item.documentClass.deleteDocuments(
                game.items.filter(filter).map(doc => doc.id)
            );

            ui.notifications.notify(this.module.title + ": " + game.i18n.localize("WH.Initialization.DeletingJournals"));
            await CONFIG.JournalEntry.documentClass.deleteDocuments(
                game.journal.filter(filter).map(doc => doc.id)
            );

            ui.notifications.notify(this.module.title + ": " + game.i18n.localize("WH.Initialization.DeletingTables"));
            await CONFIG.RollTable.documentClass.deleteDocuments(
                game.tables.filter(filter).map(doc => doc.id)
            );

            // ネスト構造に対応するため、子フォルダから先に削除する
            ui.notifications.notify(this.module.title + ": " + game.i18n.localize("WH.Initialization.DeletingFolders"));
            const moduleFolders = game.folders.filter(filter);
            const sortedFolderIds = moduleFolders
                .sort((a, b) => (b.depth ?? 0) - (a.depth ?? 0))
                .map(doc => doc.id);
            await CONFIG.Folder.documentClass.deleteDocuments(sortedFolderIds);
        },
        "OVERRIDE"
    );
});
