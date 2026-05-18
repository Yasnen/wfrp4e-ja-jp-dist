globalThis.__WFRP4E_JA_JP_BUILD__ = '2026-05-18T18:49:09.769Z';
import { Wfrp4eJaJp } from './Wfrp4eJaJp.js';
import './hooks-babele.js';
import './hooks-init.js';
import './workaround-wfrp4e.js';
import './workaround-dhar.js';
import './workaround-warhammer-lib.js';

(/** @type {any} */ (globalThis)).Wfrp4eJaJp = Wfrp4eJaJp;

const _build = /** @type {any} */ (globalThis).__WFRP4E_JA_JP_BUILD__ ?? 'dev';
console.log(`%cwfrp4e-ja-jp | build: ${_build}`, 'color: #a855f7; font-weight: bold');
