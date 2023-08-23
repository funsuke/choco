/**
 * 乱数生成器を設定して使う乱数クラス
 * 整数値乱数(randRange)のみ
 * @class
 */
export class Random {
	// 乱数生成器
	private rnd: g.RandomGenerator;
	/**
	 * 乱数クラス生成
	 * @param rnd 乱数生成器(通常はg.game.randomなど)
	 */
	constructor(rnd: g.RandomGenerator) {
		this.rnd = rnd;
	}
	/**
	 * 整数の乱数値を出力
	 * @param {number} start 開始値
	 * @param {number} stop 閾値(含まない)
	 * @param {number} step 増減値
	 * @returns {number} 整数値
	 */
	public randRange(start: number = 0, stop: number = 1, step: number = 1): number {
		// return Math.floor(start + (stop - start) * this.rnd.generate() * step);
		return Math.floor(start + (stop - start) * this.rnd.generate() * step);
	}
}
