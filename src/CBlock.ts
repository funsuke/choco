import { ASPECT_RATIO, G_GAME_PARAMETER, debugLog } from "./main";
import { Random } from "./CRandom";
import { Easing, Timeline } from "@akashic-extension/akashic-timeline";
import { SpriteFactory } from "@akashic/akashic-engine";

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
	some = -1,
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
	up = 3,
};

interface Target {
	x: number,
	y: number,
	no: number,
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
	private arrErase: BlockType[];
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
		this.initArray();
	}

	private getX(idx: number): number {
		return idx % this.NUM_X;
	}

	private getY(idx: number): number {
		return Math.floor(idx / this.NUM_X);
	}

	/**
	 * 数値配列の初期化
	 */
	private initArray(): void {
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
			}
			if (y < this.ARRAY_NUM_Y - 2) {
				down1 = this.arrBlock[i - dy];
				down2 = this.arrBlock[i - dy * 2];
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
		}
	}

	public appendBlock(scene: g.Scene): void {
		debugLog("setBlockEntity_in");
		// ブロックの表示 yを降順で表示 0は一番下に表示
		for (let i = 0; i < this.NUM_X * (this.NUM_Y + 1); i++) {
			const idx: number = this.NUM_X * (this.NUM_Y - this.getY(i)) + this.getX(i);
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
		})
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
		debugLog(`blockMove_in idx=${idx}, dir=${dir}`);
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
			const srcEnt: g.FrameSprite = this.entBlock[idx];
			const dstEnt: g.FrameSprite = this.entBlock[idx + di];
			const target: Target = {
				x: srcEnt.x, y: srcEnt.y, no: this.entBlock[idx].frameNumber
			};
			const dstTarget: Target = {
				x: dstEnt.x, y: dstEnt.y, no: this.entBlock[idx + di].frameNumber
			};
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
					// 消す＆落下処理
					if (this.checkEraseBlock(sIdx, dIdx)) {
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
			if (x === 0) {
				for (let y = 0; y < arrMoveTo.length; y++) {
					if (arrMoveTo[y] != -1 && arrMoveTo[y] != y) {
						const srcIdx: number = x + this.NUM_X * y;
						const dstIdx: number = x + this.NUM_X * arrMoveTo[y];
						// 配列の移動
						this.arrBlock[dstIdx] = this.arrBlock[srcIdx]
						this.arrBlock[srcIdx] = 0;
						// エンティティの移動
						this.entBlock[dstIdx].frameNumber = this.entBlock[srcIdx].frameNumber;
						this.entBlock[srcIdx].frameNumber = 0;
						this.entBlock[dstIdx].modified();
					}
				}
				debugLog("落とした後");
				const tmp: BlockType[] = this.arrBlock;
				debugLog(tmp[this.NUM_X * 0], tmp[this.NUM_X * 1], tmp[this.NUM_X * 2], tmp[this.NUM_X * 3], tmp[this.NUM_X * 4], tmp[this.NUM_X * 5], tmp[this.NUM_X * 6], tmp[this.NUM_X * 7], tmp[this.NUM_X * 8]);
			}
		}
	}

	// ex. [0,0,0,0,0,0,0] => [-1,-1,-1,-1,-1,-1,-1,-1,0,1,2,3...]
	// ex. [1,1,1,1,1,1,1] => [0,1,2,3,4,5,6,7,8,9...]
	// ex. [0,1,1,0,0,0,1] => [-1,0,1,-1,-1,-1,2,3,4,5,6...]
	private fallBlockCol(x: number): number[] {
		// debugLog(`fallBlockCol_in x=${x}`);
		let arrMoveTo: number[] = new Array<number>(this.NUM_Y * 2);
		for (let i = 0; i < arrMoveTo.length; i++) {
			arrMoveTo[i] = -1;
		}
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

	private checkEraseBlock(sIdx: number, dIdx: number): boolean {
		debugLog("checkErase_in");
		let retBool: boolean = false;
		// 消去配列の初期化
		for (let i = 0; i < this.arrErase.length; i++) {
			this.arrErase[i] = 0;
		}
		// クリック元とクリック先の位置関係を調べる
		const dif: number = Math.abs(dIdx - sIdx);
		debugLog("dif=" + dif);
		if (dif == 1 || dif == 8) {
			// 論理和の左式と右式を入れ替えてはダメ
			// 短絡評価で関数が評価されない場合がある
			retBool = this.checkEraseBlockCol(sIdx) || retBool;
			retBool = this.checkEraseBlockRow(sIdx) || retBool;
			retBool = this.checkEraseBlockCol(dIdx) || retBool;
			retBool = this.checkEraseBlockRow(dIdx) || retBool;
			debugLog("arrErase=" + this.arrErase);
		} else {	// ？？？？
			return false;
		}
		debugLog("checkErase_out retBool=" + retBool);
		return retBool;
	}

	private checkEraseBlockCol(idx: number): boolean {
		debugLog("checkEraseBlockCol_in idx=" + idx);
		const color: BlockType = this.arrBlock[idx];
		if (color <= BlockType.none) return false;
		if (color <= BlockType.colors) {
			let erasePlus: number = idx;
			let eraseMinus: number = idx;
			let canPlus: boolean = true;
			let canMinus: boolean = true;
			for (let i = 1; i < this.NUM_Y; i++) {
				const pls: number = idx + this.NUM_X * i;
				const min: number = idx - this.NUM_X * i;
				if (canPlus && pls < this.NUM_X * this.NUM_Y && this.arrBlock[pls] == color) {
					erasePlus += this.NUM_X;
				} else {
					canPlus = false;
				}
				if (canMinus && min >= 0 && this.arrBlock[min] == color) {
					eraseMinus -= this.NUM_X;
				} else {
					canMinus = false;
				}
				if (!(canPlus || canMinus)) break;
			}
			if (Math.floor((erasePlus - eraseMinus) / this.NUM_X) >= 2) {
				for (let i = eraseMinus; i <= erasePlus; i += this.NUM_X) {
					this.arrErase[i] = BlockType.some;
				}
				debugLog("checkEraseBlockCol_out true");
				return true;
			}
		}
		debugLog("checkEraseBlockCol_out false");
		return false;
	}

	private checkEraseBlockRow(idx: number): boolean {
		debugLog("checkEraseBlockRow_in idx=" + idx);
		const color: BlockType = this.arrBlock[idx];
		if (color <= BlockType.none) return false;
		if (color <= BlockType.colors) {
			let erasePlus: number = idx;
			let eraseMinus: number = idx;
			let canPlus: boolean = true;
			let canMinus: boolean = true;
			for (let i = 1; i < this.NUM_X; i++) {
				const pls: number = idx + i;
				const min: number = idx - i;
				if (canPlus && pls % this.NUM_X > idx % this.NUM_X && this.arrBlock[pls] == color) {
					erasePlus++;
				} else {
					canPlus = false;
				}
				if (canMinus && min % this.NUM_X < idx % this.NUM_X && this.arrBlock[min] == color) {
					eraseMinus--;
				} else {
					canMinus = false;
				}
				if (!(canPlus || canMinus)) break;
			}
			if (erasePlus - eraseMinus >= 2) {
				for (let i = eraseMinus; i <= erasePlus; i++) {
					this.arrErase[i] = BlockType.some;
				}
				debugLog("checkEraseBlockRow_out true");
				return true;
			}
		}
		debugLog("checkEraseBlockRow_out false");
		return false;
	}

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

