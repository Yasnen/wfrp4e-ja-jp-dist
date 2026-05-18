// WORKAROUND: WFRP4e System の不具合対応

// wfrp4e の addSystemEffect がコンペンディアム内の Actor に対しても createEmbeddedDocuments を
// 呼んでしまい、ロック済みコンペンディアムへの書き込みエラーが発生する問題を回避する。
// 上流システムで修正されたら削除すること。
Hooks.once('ready', () => {
    libWrapper.register('wfrp4e-ja-jp', 'ActorWFRP4e.prototype.addSystemEffect', async function (wrapped, key) {
        if (this.pack) return;
        return wrapped(key);
    }, 'MIXED');
});

// CareerSheet / SpellSheet の input 要素に onkeypress で幅を更新するコードが埋め込まれているが、
// 日本語入力（全角文字）では ch 単位の幅計算が正しく動作しないため、
// onkeypress を除去して input イベントで全角/半角を考慮した幅計算に差し替えている。
// 上流システムで日本語対応の幅計算が修正されたら、このファイルごと削除すること。

function calcCh(value) {
    return [...value].reduce((n, c) =>
        n + (/[　-鿿＀-￯]/.test(c) ? 2 : 1), 0
    );
}

Hooks.on("renderCareerSheet", (_app, html) => {
    html.querySelectorAll("input[onkeypress]").forEach(input => {
        input.removeAttribute("onkeypress");
        const update = () => {
            input.style.width = (calcCh(input.value) + 4) + "ch";
        };
        update();
        input.addEventListener("input", update);
    });
    html.querySelectorAll("input.skill:disabled, input.talent:disabled, input.trapping:disabled").forEach(input => {
        input.style.width = (calcCh(input.value) + 2) + "ch";
    });
});

Hooks.on("renderSpellSheet", (_app, html) => {
    html.querySelectorAll("input[onkeypress]").forEach(input => {
        input.removeAttribute("onkeypress");
        const update = () => {
            input.style.width = (calcCh(input.value) + 4) + "ch";
        };
        update();
        input.addEventListener("input", update);
    });
});
