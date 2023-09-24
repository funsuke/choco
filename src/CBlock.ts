// 継承とかよく分からんから１つのクラスで済ましておりますｩ
// 継承しろ！って言われたら勉強するけど、見せるコードでもないので直し..直せません

import { ASPECT_RATIO, G_GAME_PARAMETER } from './main';
import { Random } from "./CRandom";
import { Easing, Timeline } from "@akashic-extension/akashic-timeline";
import { debugFuncLog, debugLog } from './debug';

/**
 * ブロックタイプ型
 */
// const BlockType = {
// 	none: 0,
// 	blue: 1,
// 	green: 2,
// 	orange: 3,
// 	red: 4,
// 	white: 5,
// 	colors: 5,
// 	all: 6,
// } as const;
enum BlockType {
	none = 0,
	blue = 1,
	green = 2,
	orange = 3,
	red = 4,
	white = 5,
	colors = 5,
	all = 6,
	other = -1,
};

/**
 * ブロック移動列挙型
 */
// const BlockDir = {
// 	right: 0,
// 	down: 1,
// 	left: 2,
// 	up: 3,
// } as const;
enum BlockMoveDir {
	right = 0,
	down = 1,
	left = 2,
	up = 4,
	other = -1,
};

interface Target {
	x: number,
	y: number,
	no: number,
};

enum EraseType {
	none = 0,
	col = 1,
	row = 2,
};

/**
 * ブロッククラス
 * @class
 */
export class Block {
	// 定数
	private NUM_X: number = 8;
	private NUM_Y: number = 7;
	private W: number = 112;
	private H: number = 91;
	private MARGIN_LT: number = 84;
	private MARGIN_TP: number = 77;
	private INPUT_DELTA: number = 50;
	// ブロック背景の表示位置
	// LEFT = (g.game.height - (top + imgBackBlk.height)) * 16 / 9;
	private TOP: number;
	private LEFT: number;
	// 配列のサイズ
	private ARRAY_NUM_Y: number = this.NUM_Y * 2;
	private ARRAY_SIZE: number = this.NUM_X * this.ARRAY_NUM_Y;
	private ARRAY_SIZE_SHOW: number = this.NUM_X * this.NUM_Y;
	// シーン
	private scene: g.Scene;
	// 画像アセット
	private imgBack: g.ImageAsset;
	private imgBlock: g.ImageAsset;
	// 画像エンティティ
	private entBack: g.Sprite;
	private entPane: g.Pane;
	private entBlock: g.FrameSprite[];
	// ブロックタイプ配列(ブロックのframeIndex)
	private arrBlock: BlockType[];
	private arrErase: number[];
	// ランダムクラス
	private rnd: Random;
	// フラグ類
	private isSwapping = false;

	/**
	 * コンストラクタ(imageIDの設定など)
	 * @param {string} block	ブロックのimageID
	 * @param {string} back		ブロック背景のimageID
	 */
	constructor(scene: g.Scene, block: string, back: string) {
		this.scene = scene;
		// アセットの設定
		this.imgBack = scene.asset.getImageById(back);
		this.imgBlock = scene.asset.getImageById(block);
		// ブロックタイプ配列の設定
		this.rnd = new Random(G_GAME_PARAMETER.random);
		this.arrBlock = new Array<BlockType>(this.ARRAY_SIZE);
		this.arrErase = new Array<BlockType>(this.NUM_X * this.NUM_Y);
		// エンティティの設定
		this.TOP = 120;
		this.LEFT = (g.game.height - (this.TOP + this.imgBack.height)) * ASPECT_RATIO;
		this.entBack = new g.Sprite({
			scene: scene,
			src: this.imgBack,
			x: this.LEFT,
			y: this.TOP,
		});
		this.entPane = new g.Pane({
			scene: scene,
			width: this.MARGIN_LT * this.NUM_X,
			height: this.MARGIN_TP * this.NUM_Y,
		});
		this.entBlock = new Array<g.FrameSprite>(this.ARRAY_SIZE);
		// ブロック配列の設定
		this.initArrayBlock();
	}

	/**
	 * １次元インデックスから２次元のＸインデックスを取得する
	 * @param {number} idx １次元ブロック配列のインデックス
	 * @returns {number}
	 */
	private getX(idx: number): number {
		return idx % this.NUM_X;
	}

	/**
	 * １次元インデックスから２次元のＹインデックスを取得する
	 * @param {number} idx １次元ブロック配列のインデックス
	 * @returns 
	 */
	private getY(idx: number): number {
		return Math.floor(idx / this.NUM_X);
	}

	/**
	 * 数値配列の初期化
	 */
	private initArrayBlock(): void {
		// ３つ繋がらないようにランダム値で初期化
		for (let i = 0; i < this.ARRAY_SIZE; i++) {
			const x: number = this.getX(i);
			const y: number = this.getY(i);
			const dx: number = 1;
			const dy: number = this.NUM_X;
			// 下方向と左方向の要素(ブロックタイプ)を取得
			let left1: BlockType = BlockType.none;
			let left2: BlockType = BlockType.none;
			let down1: BlockType = BlockType.none;
			let down2: BlockType = BlockType.none;
			if (x >= 2) {
				left1 = this.arrBlock[i - dx];
				left2 = this.arrBlock[i - dx * 2];
				// left1 = this.getEntBlock(i - dx);
				// left2 = this.getEntBlock(i - dx * 2);
			}
			// if (y < this.ARRAY_NUM_Y - 2) {
			// 	down1 = this.arrBlock[i - dy];
			// 	down2 = this.arrBlock[i - dy * 2];
			// }
			if (y >= 2) {
				down1 = this.arrBlock[i - dy];
				down2 = this.arrBlock[i - dy * 2];
				// down1 = this.getEntBlock(i - dy);
				// down2 = this.getEntBlock(i - dy * 2);
			}
			// 新規ブロックの設定
			let newBlock: BlockType = this.getRandomBlock();
			if (y < this.NUM_Y) {
				if (left1 === left2 || down1 === down2) {
					while (newBlock === left2 || newBlock === down2) {
						newBlock = this.getRandomBlock();
					}
				}
			}
			this.arrBlock[i] = newBlock;
			// this.setEntBlock(i, newBlock);
		}
	}

	private getEntBlock(idx: number): number {
		return this.entBlock[idx].frameNumber;
	}

	private setEntBlock(idx: number, no: number): void {
		this.entBlock[idx].frameNumber = no;
	}

	public appendBlock(scene: g.Scene): void {
		debugLog("setBlockEntity_in");
		// ブロックの表示 yを降順で表示 0は一番下に表示
		// for (let i = 0; i < this.NUM_X * (this.NUM_Y + 1); i++) {
		for (let i = 0; i < this.ARRAY_SIZE; i++) {
			// const idx: number = this.NUM_X * (this.NUM_Y - this.getY(i)) + this.getX(i);
			const idx: number = this.ARRAY_SIZE - this.NUM_X * (this.getY(i) + 1) + this.getX(i);
			debugLog("idx=" + idx);
			this.entBlock[idx] = this.createBlock(scene, idx);
			this.addOnPointMoveEvent(idx);
			this.entPane.append(this.entBlock[idx]);
		}
		debugLog(this.arrBlock);
		// ペインの設定
		this.entPane.x = this.LEFT + 9;
		this.entPane.y = this.TOP + 10;
		this.entPane.invalidate();
		scene.append(this.entPane);
		debugLog("setBlockEntity_out");
	}

	private createBlock(scene: g.Scene, idx: number): g.FrameSprite {
		const x: number = this.getX(idx);
		const y: number = (this.NUM_Y - 1) - this.getY(idx);
		return new g.FrameSprite({
			scene: scene,
			src: this.imgBlock,
			width: this.W,
			height: this.H,
			frames: [0, 1, 2, 3, 4, 5],
			frameNumber: this.arrBlock[idx],
			x: this.MARGIN_LT * x - 8,
			y: this.MARGIN_TP * y - 4,
			touchable: true,
		});
	}

	private addOnPointMoveEvent(idx: number): void {
		const clickEnt: g.FrameSprite = this.entBlock[idx];
		// debugLog("addOnPointMoveEvent_in");
		clickEnt.onPointMove.add((ev) => {
			debugLog(`entBlock.onPointMove_in idx=${idx}`);
			debugLog(`isSwapping=${this.isSwapping}, no=${clickEnt.frameNumber}`);
			if (!this.isSwapping && clickEnt.frameNumber != BlockType.none) {
				// 操作
				this.inputBlock(ev, idx);
			}
			debugLog("entBlock.onPointMove_out");
		});
	};

	private inputBlock(ev: g.PointMoveEvent, idx: number): void {
		debugLog("inputBlock_in idx=" + idx);
		debugLog(`startDelta=(${ev.startDelta.x},${ev.startDelta.y})`);
		if (Math.abs(ev.startDelta.x) >= this.INPUT_DELTA || Math.abs(ev.startDelta.y) >= this.INPUT_DELTA) {
			const x: number = this.getX(idx);
			const y: number = this.getY(idx);
			if (ev.startDelta.x >= this.INPUT_DELTA) {
				debugLog("右っぽい", "x=" + x, "y=" + y);
				// 右
				if (x < this.NUM_X - 1 && y < this.NUM_Y) {
					debugLog("右");
					this.isSwapping = true;
					this.blockMove(idx, BlockMoveDir.right)
				}
			} else if (ev.startDelta.y >= this.INPUT_DELTA) {
				debugLog("下っぽい", "x=" + x, "y=" + y);
				// 下
				if (y > 0 && y < this.NUM_Y) {
					debugLog("下");
					this.isSwapping = true;
					this.blockMove(idx, BlockMoveDir.down)
				}
			} else if (ev.startDelta.x <= -this.INPUT_DELTA) {
				debugLog("左っぽい", "x=" + x, "y=" + y);
				// 左
				if (x > 0 && y < this.NUM_Y) {
					debugLog("左");
					this.isSwapping = true;
					this.blockMove(idx, BlockMoveDir.left)
				}
			} else if (ev.startDelta.y <= -this.INPUT_DELTA) {
				debugLog("上っぽい", "x=" + x, "y=" + y);
				// 上
				if (y < this.NUM_Y - 1) {
					debugLog("上");
					this.isSwapping = true;
					this.blockMove(idx, BlockMoveDir.up)
				}
			} else {
				debugLog("動けませんでした");
				debugLog(`dlt=>(${ev.startDelta.x},${ev.startDelta.y}),idx=>(${idx})`);
				return;
			}
			// if (this.isSwapping) {
			// 	this.scene.setTimeout(() => {
			// 		this.isSwapping = false;
			// 	}, 300);
			// }
		}
		debugLog("inputBlock_out");
	}

	private blockMove(idx: number, dir: BlockMoveDir): void {
		debugLog("blockMove_in", idx, dir);
		let di: number = 0;
		switch (dir) {
			case BlockMoveDir.right:
				di = 1;
				break;
			case BlockMoveDir.down:
				di = -this.NUM_X;
				break;
			case BlockMoveDir.left:
				di = -1;
				break;
			case BlockMoveDir.up:
				di = this.NUM_X;
				break;
			default:
				debugLog(`${dir}の方向には動かせません`);
				return;
		}
		debugLog("di=" + di);
		if (di) {
			if (this.entBlock[idx + di].frameNumber == BlockType.none) {
				this.isSwapping = false;
				return;
			}
			this.createSwapAnime(idx, idx + di, true);
			this.createSwapAnime(idx + di, idx);
			[this.arrBlock[idx], this.arrBlock[idx + di]] = [this.arrBlock[idx + di], this.arrBlock[idx]];
		}
		debugLog("blockMove_out");
	}

	private createSwapAnime(sIdx: number, dIdx: number, isSrc: boolean = false): void {
		const src: g.FrameSprite = this.entBlock[sIdx];
		const dstX: number = this.getX(dIdx);
		const dstY: number = (this.NUM_Y - 1) - this.getY(dIdx);
		const dst: Target = {
			x: this.MARGIN_LT * dstX - 8,
			y: this.MARGIN_TP * dstY - 4,
			no: this.entBlock[dIdx].frameNumber
		};
		const preX: number = src.x;
		const preY: number = src.y;
		// タイムライン
		const tl = new Timeline(this.scene);
		// 特徴的(なし) easeInCirc easeInCubic easeInExpo
		// 特徴的(あり) easeInOutBack  easeOutBounce
		// まあまあ良い easeInOutCirc easeInOutCubic easeInOutExpo easeInOutSine easeInSine
		//             easeOutCirc easeOutCubic easeOutQuad easeOutQuart easeOutQuint
		// 少しもたつき easeInOutQuad easeInQuad easeOutSine
		// きびきび easeInOutQuint
		// もたつき easeInQuart easeInQuint linear
		tl.create(src)
			.call(() => {
				src.x = dst.x;
				src.y = dst.y;
				src.frameNumber = dst.no;
				src.modified();
			})
			.moveTo(preX, preY, 333, Easing.easeInOutCirc)
			.call(() => {
				this.isSwapping = false;
				// クリックしたブロックだけの処理
				if (isSrc) {
					debugLog(this.arrBlock);
					let canErase: boolean = false;
					// 消す＆落下処理
					this.initArrayErase();
					// if (this.checkEraseBlock(sIdx, dIdx)) {
					// 	// 消す処理
					// 	this.eraseBlock();
					// 	// 落とす処理
					// 	this.fallBlock();
					// }
					if (this.checkEraseBlock(sIdx)) {
						canErase = true;
					}
					if (this.checkEraseBlock(dIdx)) {
						canErase = true;
					}
					if (canErase) {
						// 消す処理
						this.eraseBlock();
						// 落とす処理
						this.fallBlock();
					}
				}
			});
	}

	private eraseBlock(): void {
		// test
		for (let i = 0; i < this.arrErase.length; i++) {
			if (this.arrErase[i]) {
				this.arrBlock[i] = BlockType.none;
				this.entBlock[i].frameNumber = BlockType.none;
				this.entBlock[i].modified();
			}
		}
	}

	private fallBlock(): void {
		for (let x = 0; x < this.NUM_X; x++) {
			const arrMoveTo: number[] = this.fallBlockCol(x);
			debugLog(`x=${x}, arrMoveTo=${arrMoveTo}`);
			let cntFallBlocks: number = 0;
			for (let y = 0; y < arrMoveTo.length; y++) {
				if (arrMoveTo[y] != -1 && arrMoveTo[y] != y) {
					cntFallBlocks++;
					const srcIdx: number = x + this.NUM_X * y;
					const dstIdx: number = x + this.NUM_X * arrMoveTo[y];
					// 配列の移動
					this.arrBlock[dstIdx] = this.arrBlock[srcIdx]
					this.arrBlock[srcIdx] = 0;
					// エンティティの移動
					this.entBlock[dstIdx].frameNumber = this.entBlock[srcIdx].frameNumber;
					this.entBlock[srcIdx].frameNumber = 0;
					const targetY: number = this.entBlock[dstIdx].y;
					this.entBlock[dstIdx].y = this.entBlock[srcIdx].y;
					this.entBlock[dstIdx].modified();

					const tl = new Timeline(this.scene);
					if (cntFallBlocks) {
						tl.create(this.entBlock[dstIdx])
							.moveY(targetY, 300, Easing.easeInCubic)
							.call(() => {
								debugLog("フォールブロック", dstIdx);
								// // 消す＆落下処理
								// if (dstIdx >= 0 && dstIdx < this.ARRAY_SIZE_SHOW && this.checkEraseBlock(dstIdx)) {
								// 	// 消す処理
								// 	this.eraseBlock();
								// 	// 落とす処理
								// 	this.fallBlock();
								// }
							});
					}
				}
				// debugLog("落とした後");
				// const tmp: BlockType[] = this.arrBlock;
				// debugLog(tmp[this.NUM_X * 0], tmp[this.NUM_X * 1], tmp[this.NUM_X * 2], tmp[this.NUM_X * 3], tmp[this.NUM_X * 4], tmp[this.NUM_X * 5], tmp[this.NUM_X * 6], tmp[this.NUM_X * 7], tmp[this.NUM_X * 8]);
				const topIdx: number = this.ARRAY_SIZE - this.NUM_X + x;
				for (let i = 0; i < cntFallBlocks; i++) {
					const idx: number = topIdx - this.NUM_X * i;
					this.arrBlock[idx] = this.getRandomBlock();
					this.entBlock[idx].frameNumber = this.arrBlock[idx];
					this.entBlock[idx].modified();
				}
			}
		}
	}

	// ex. [0,0,0,0,0,0,0] => [-1,-1,-1,-1,-1,-1,-1,-1,0,1,2,3...]
	// ex. [1,1,1,1,1,1,1] => [0,1,2,3,4,5,6,7,8,9...]
	// ex. [0,1,1,0,0,0,1] => [-1,0,1,-1,-1,-1,2,3,4,5,6...]
	private fallBlockCol(x: number): number[] {
		// debugLog(`fallBlockCol_in x=${x}`);
		// 初期化
		let arrMoveTo: number[] = new Array<number>(this.NUM_Y * 2);
		for (let i = 0; i < arrMoveTo.length; i++) {
			arrMoveTo[i] = -1;
		}
		// 
		let moveTo: number = 0;
		for (let y = 0; y < this.NUM_Y * 2; y++) {
			const idx: number = x + this.NUM_X * y;
			// debugLog(`y=${y}, idx=${idx}`);
			if (this.arrBlock[idx] != BlockType.none) {
				arrMoveTo[y] = moveTo;
				moveTo++;
			}
		}
		// debugLog("fallBlockCol_out");
		return arrMoveTo;
	}

	private initArrayErase(): void {
		for (let i = 0; i < this.arrErase.length; i++) {
			this.arrErase[i] = 0;
		}
	}

	/**
	 * 消えるかどうかチェックする
	 * @param sIdx 
	 * @param dIdx 
	 * @returns 
	 */
	// private checkEraseBlock(sIdx: number, dIdx: number = -1): boolean {
	// 	debugLog("checkErase_in", sIdx, dIdx);
	// 	let retBool: boolean = false;
	// 	// 移動先がある場合
	// 	if (dIdx !== -1) {
	// 		// クリック元とクリック先の位置関係を調べる
	// 		const dif: number = Math.abs(dIdx - sIdx);
	// 		debugLog("dif=" + dif);
	// 		if (dif == 1 || dif == 8) {
	// 			// 論理和の左式と右式を入れ替えてはダメ
	// 			// 短絡評価で関数が評価されない場合がある
	// 			retBool = this.checkEraseBlockCol(sIdx) || retBool;
	// 			retBool = this.checkEraseBlockRow(sIdx) || retBool;
	// 			retBool = this.checkEraseBlockCol(dIdx) || retBool;
	// 			retBool = this.checkEraseBlockRow(dIdx) || retBool;
	// 			debugLog("arrErase=" + this.arrErase);
	// 		} else {	// ？？？？
	// 			return false;
	// 		}
	// 	} else {
	// 		retBool = this.checkEraseBlockCol(sIdx) || retBool;
	// 		retBool = this.checkEraseBlockRow(sIdx) || retBool;
	// 		debugLog("arrErase=" + this.arrErase);
	// 	}
	// 	debugLog("checkErase_out retBool=" + retBool);
	// 	return retBool;
	// }
	private checkEraseBlock(idx: number): boolean {
		debugLog("checkErase_in", idx);
		let retBool: boolean = false;
		retBool = this.checkEraseBlockCol(idx) || retBool;
		retBool = this.checkEraseBlockRow(idx) || retBool;
		debugLog("checkErase_out", retBool);
		return retBool;
	}

	private isAnyColor(idx: number): boolean {
		const color: BlockType = this.arrBlock[idx];
		if (color > BlockType.none && color <= BlockType.colors) {
			return true;
		}
		return false;
	}

	private isSameColor(idx1: number, idx2: number): boolean {
		if (this.arrBlock[idx1] === this.arrBlock[idx2]) return true;
		return false;
	}

	private isSameX(idx1: number, idx2: number): boolean {
		if (this.getX(idx1) === this.getX(idx2)) return true;
		return false;
	}

	private isSameY(idx1: number, idx2: number): boolean {
		if (this.getY(idx1) === this.getY(idx2)) return true;
		return false;
	}

	private isInColumn(idx: number): boolean {
		if (this.getY(idx) >= 0 && this.getY(idx) < this.NUM_Y) return true;
		return false;
	}

	private isInRow(idx: number): boolean {
		if (this.getX(idx) >= 0 && this.getX(idx) < this.NUM_X) return true;
		return false;
	}

	private isSameCol(idxCheck: number, idxBase: number): boolean {
		if (this.isSameX(idxCheck, idxBase) && this.isInColumn(idxCheck)) return true;
		return false;
	}

	private isSameRow(idxCheck: number, idxBase: number): boolean {
		if (this.isSameY(idxCheck, idxBase) && this.isInRow(idxCheck)) return true;
		return false;
	}

	/**
	 * 指定したブロックインデックスが縦に消えるかどうかチェックする
	 * @param {number} idx 検査するブロックのインデックス
	 * @returns {boolean}
	 */
	private checkEraseBlockCol(idx: number): boolean {
		const methodName: string = "checkEraseBlockCol";
		debugFuncLog(methodName, "in", { idx });
		let retBool: boolean = false;
		// 色が取得できる場合
		if (this.isAnyColor(idx)) {
			debugFuncLog(methodName, "isAnyColor!");
			// 縦に消去チェックが入っていない場合
			if (!(this.arrErase[idx] & EraseType.col)) {
				let idxEraseP: number = idx;		// 正方向のインデックス
				let idxEraseM: number = idx;		// 負方向のインデックス
				// 縦がどのインデックスまで消えるか取得
				let canP: boolean = true;
				let canM: boolean = true;
				for (let i = 1; i < this.NUM_Y; i++) {
					const idxP: number = idx + this.NUM_X * i;
					const idxM: number = idx - this.NUM_X * i;
					// 正方向の探査
					if (canP) {
						debugFuncLog(methodName, "正方向探査", { idxP, sameRow: this.isSameRow(idxP, idx), sameColor: this.isSameColor(idxP, idx) });
						if (this.isSameCol(idxP, idx) && this.isSameColor(idxP, idx)) {
							idxEraseP = idxP;
						} else {
							canP = false;
						}
					}
					// 負方向の探査
					if (canM) {
						debugFuncLog(methodName, "負方向探査", { idxM, sameRow: this.isSameRow(idxP, idx), sameColor: this.isSameColor(idxP, idx) });
						if (this.isSameCol(idxM, idx) && this.isSameColor(idxM, idx)) {
							idxEraseM = idxM;
						} else {
							canM = false;
						}
					}
					// 正負ともに見つけられない場合脱出
					if (!canP && !canM) break;
				}
				debugFuncLog(methodName, "探査正常終了", { idxEraseM, idxEraseP });
				// 削除配列に設定
				// if (this.getY(idxEraseP) - this.getY(idxEraseM) >= 2) {
				// 	// 削除配列に設定
				// 	for (let i = idxEraseM; i <= idxEraseP; i += this.NUM_X) {
				// 		this.arrErase[i] |= EraseType.col;
				// 	}
				// 	retBool = true;
				// }
				if (idxEraseM != idxEraseP && this.setArrErase(idxEraseM, idxEraseP)) {
					retBool = true;
				}
			} else {
				debugFuncLog(methodName, "既に縦チェック済み");
				retBool = true;
			}
		}
		debugFuncLog(methodName, "out", { retBool });
		return retBool;
	}

	/**
	 * 指定したブロックインデックスが横に消えるかどうかチェックする
	 * @param {number} idx 検査するブロックのインデックス
	 * @returns {boolean}
	 */
	private checkEraseBlockRow(idx: number): boolean {
		const methodName: string = "checkEraseBlockRow";
		debugFuncLog(methodName, "in", { idx });
		let retBool: boolean = false;
		// 色が取得できる場合
		if (this.isAnyColor(idx)) {
			debugFuncLog(methodName, "isAnyColor!");
			// 横に消去チェックが入っていない場合
			if (!(this.arrErase[idx] & EraseType.row)) {
				let idxEraseP: number = idx;		// 正方向のインデックス
				let idxEraseM: number = idx;		// 負方向のインデックス
				// 横がどのインデックスまで消えるか取得
				let canP: boolean = true;
				let canM: boolean = true;
				for (let i = 1; i < this.NUM_X; i++) {
					const idxP: number = idx + i;
					const idxM: number = idx - i;
					// 正方向の探査
					if (canP) {
						debugFuncLog(methodName, "正方向探査", { i, sameRow: this.isSameRow(idxP, idx), sameColor: this.isSameColor(idxP, idx) });
						if (this.isSameRow(idxP, idx) && this.isSameColor(idxP, idx)) {
							idxEraseP = idxP;
						} else {
							canP = false;
						}
					}
					// 負方向の探査
					if (canM) {
						debugFuncLog(methodName, "負方向探査", { i, sameRow: this.isSameRow(idxM, idx), sameColor: this.isSameColor(idxM, idx) });
						if (this.isSameRow(idxM, idx) && this.isSameColor(idxM, idx)) {
							idxEraseM = idxM;
						} else {
							canM = false;
						}
					}
					// 正負ともに見つけられない場合脱出
					if (!canP && !canM) break;
				}
				debugFuncLog(methodName, "探査正常終了", { idxEraseM, idxEraseP });
				// 削除配列に設定
				// if (this.getX(idxEraseP) - this.getX(idxEraseM) >= 2) {
				// 	for (let i = idxEraseM; i <= idxEraseP; i++) {
				// 		this.arrErase[i] |= EraseType.row;
				// 	}
				// 	retBool = true;
				// }
				if (idxEraseM != idxEraseP && this.setArrErase(idxEraseM, idxEraseP)) {
					retBool = true;
				}
			} else {
				debugFuncLog(methodName, "既に横チェック済み");
				retBool = true;
			}
		}
		debugFuncLog(methodName, "out", { retBool });
		return retBool;
	}

	private setArrErase(idx1: number, idx2: number): boolean {
		const methodName: string = "setArrErase";
		debugFuncLog(methodName, "in", { idx1, idx2 });
		let retBool: boolean = false;
		// 同じ値の場合終了
		if (idx1 === idx2) {
			debugFuncLog(methodName, "sameNumber!")
			return retBool;
		}
		const idxMax: number = Math.max(idx1, idx2);
		const idxMin: number = Math.min(idx1, idx2);
		// 横(Row)か縦(col)か取得
		let incrementVal: number;
		let eraseType: EraseType;
		if (this.isSameRow(idxMin, idxMax)) {
			debugFuncLog(methodName, "Row!");
			incrementVal = 1;
			eraseType = EraseType.row;
		} else if (this.isSameCol(idxMin, idxMax)) {
			debugFuncLog(methodName, "Col!");
			incrementVal = this.NUM_X;
			eraseType = EraseType.col;
		} else {	// ？？？？
			debugFuncLog(methodName, "????");
			return retBool;
		}
		// 繋がりを検査して設定
		if (this.canSetArrErase(idxMin, idxMax)) {
			debugFuncLog(methodName, "set", { idxMin, idxMax });
			for (let i = idxMin; i <= idxMax; i += incrementVal) {
				this.arrErase[i] |= eraseType;
			}
			retBool = true;
		}
		// // 横(Row)の繋がりを検査して設定
		// if (this.canSetArrErase(idxMin, idxMax)) {
		// 	debugFuncLog(self, "row_in");
		// 	for (let i = idxRMin; i <= idxRMax; i++) {
		// 		this.arrErase[i] |= EraseType.row;
		// 	}
		// 	retBool = true;
		// }
		// // 縦(Column)の繋がりを検査して設定
		// if (this.canSetArrErase(idxC1, idxC2)) {
		// 	debugFuncLog(self, "col_in");
		// 	for (let i = idxCMin; i <= idxCMax; i += this.NUM_X) {
		// 		this.arrErase[i] |= EraseType.col;
		// 	}
		// 	retBool = true;
		// }
		debugFuncLog(methodName, "out", { retBool });
		return retBool;
	}

	/**
	 * 
	 * @param {number} idx1 消せるインデックス１ 大小は問わない
	 * @param idx2 消せるインデックス２ 大小は問わない
	 * @returns 
	 */
	private canSetArrErase(idx1: number, idx2: number): boolean {
		const methodName: string = "canSetArrErase";
		debugFuncLog(methodName, "in", { idx1, idx2 });
		let retBool: boolean = false;
		const idxMin: number = Math.min(idx1, idx2);
		const idxMax: number = Math.max(idx1, idx2);
		const xMin: number = this.getX(idxMin);
		const xMax: number = this.getX(idxMax);
		const yMin: number = this.getY(idxMin);
		const yMax: number = this.getY(idxMax);
		// 同じ行の場合
		if (this.isSameRow(idxMin, idxMax)) {
			debugFuncLog(methodName, "sameRow!", { idxMin, idxMax });
			// 横(Row)の繋がりを検査
			if (xMax - xMin < 2) {
				debugFuncLog(methodName, "横に消す数が足りません", { xMin, xMax });
			} else {
				retBool = true;
				for (let i = idxMin + 1; i <= idxMax; i++) {
					if (!this.isSameColor(idxMin, i)) {
						debugFuncLog(methodName, "同じ色ではありません", { idxMin, i });
						retBool = false;
						break;
					}
				}
			}
		} else if (this.isSameCol(idxMin, idxMax)) {
			debugFuncLog(methodName, "sameCol!", { idxMin, idxMax });
			// 縦(Column)の繋がりを検査
			if (yMax - yMin < 2) {
				debugFuncLog(methodName, "縦に消す数が足りません", { yMin, yMax });
			} else {
				retBool = true;
				for (let i = idxMin + this.NUM_X; i <= idxMax; i += this.NUM_X) {
					if (!this.isSameColor(idxMin, i)) {
						debugFuncLog(methodName, "同じ色ではありません", { idxMin, i });
						retBool = false;
						break;
					}
				};
			}
		} else {	// ？？？？
			debugFuncLog(methodName, "同じ行列ではありません", { idxMin, idxMax });
		}
		debugFuncLog(methodName, "out", { retBool });
		return retBool
	}

	// private checkEraseBlockLine(idx: number, isCol: boolean) {
	// 	debugLog(`checkEraseBlockLine_in idx = ${ idx }, isCol = ${ isCol }`);
	// 	const color: BlockType = this.arrBlock[idx];
	// 	if (color <= BlockType.none || color > BlockType.colors) {
	// 		return false;
	// 	}
	// 	//
	// 	let erasePlus: number = idx;
	// 	let eraseMinus: number = idx;
	// 	let canPlus: boolean = true;
	// 	let canMinus: boolean = true;
	// 	let loopLimit: number = this.NUM_X;
	// 	let deltaIdx: number = 1;
	// 	// ループ回数と差を設定
	// 	if (isCol) {
	// 		loopLimit = this.NUM_Y;
	// 		deltaIdx = this.NUM_X;
	// 	}
	// 	// 
	// 	for (let i = 1; i < loopLimit; i++) {
	// 		const pls: number = idx + deltaIdx * i;
	// 		const min: number = idx + deltaIdx * i;
	// 		if (isCol) {
	// 			if (canPlus && pls < this.NUM_X * this.NUM_Y && this.arrBlock[pls] == color) {
	// 				erasePlus += this.NUM_X;
	// 			} else {
	// 				canPlus = false;
	// 			}
	// 			if (canMinus && min >= 0 && this.arrBlock[min] == color) {
	// 				eraseMinus -= this.NUM_X;
	// 			} else {
	// 				canMinus = false;
	// 			}
	// 			if (!(canPlus || canMinus)) break;
	// 		} else {
	// 			if (canPlus && pls % this.NUM_X > idx % this.NUM_X && this.arrBlock[pls] == color) {
	// 				erasePlus++;
	// 			} else {
	// 				canPlus = false;
	// 			}
	// 			if (canMinus && min % this.NUM_X < idx % this.NUM_X && this.arrBlock[min] == color) {
	// 				eraseMinus--;
	// 			} else {
	// 				canMinus = false;
	// 			}
	// 			if (!(canPlus || canMinus)) break;
	// 		}
	// 	}
	// 	if (isCol) {
	// 		if (Math.floor((erasePlus - eraseMinus) / this.NUM_X) >= 2) {
	// 			for (let i = eraseMinus; i <= erasePlus; i += this.NUM_X) {
	// 				this.arrErase[i] = BlockType.some;
	// 			}
	// 			debugLog("checkEraseBlockCol_out true");
	// 			return true;
	// 		}
	// 	} else {

	// 	}
	// }

	/**
	 * 背景のエンティティをシーンに追加する
	 * @param {g.Scene} scene	背景を追加するシーン
	 * @returns 
	 */
	public appendBack(scene: g.Scene): void {
		scene.append(this.entBack);
	}

	/**
	 * ランダムでブロックの値を返す
	 * @returns {typBlockType}
	 */
	private getRandomBlock(): BlockType {
		return this.rnd.randRange(1, BlockType.all);
	}
}
