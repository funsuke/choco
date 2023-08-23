import { ASPECT_RATIO, G_GAME_PARAMETER, debugLog } from "./main";
import { Random } from "./CRandom";

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
	// ランダムクラス
	private rnd: Random;
	// フラグ類
	private isMoving = false;

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

	/**
	 * 数値配列の初期化
	 */
	private initArray(): void {
		// ３つ繋がらないようにランダム値で初期化
		for (let i = 0; i < this.ARRAY_SIZE; i++) {
			const x: number = i % this.NUM_X;
			const y: number = Math.floor(i / this.NUM_X);
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

	public setBlockEntity(scene: g.Scene): void {
		debugLog("setBlockEntity_in");
		// ブロックの表示
		for (let i = 0; i < this.NUM_X * (this.NUM_Y + 1); i++) {
			const row: number = Math.floor(i / this.NUM_X);
			const x: number = i % this.NUM_X;
			const y: number = 7 + row;
			const idx: number = 56 - this.NUM_X * row + x;
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
		const x: number = idx % this.NUM_X;
		const y: number = (this.NUM_Y - 1) - Math.floor(idx / this.NUM_X);
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
		// debugLog("addOnPointMoveEvent_in");
		this.entBlock[idx].onPointMove.add((ev) => {
			// debugLog(`entBlock.onPointMove_in idx=${idx}`);
			if (!this.isMoving && this.entBlock[idx].frameNumber != 0) {
				// 操作
				this.inputBlock(ev, idx);
			}
		});
	};

	private inputBlock(ev: g.PointMoveEvent, idx: number) {
		debugLog("inputBlock_in idx=" + idx);
		debugLog(`startDelta=(${ev.startDelta.x},${ev.startDelta.y})`);
		if (Math.abs(ev.startDelta.x) >= this.INPUT_DELTA || Math.abs(ev.startDelta.y) >= this.INPUT_DELTA) {
			const x = idx % this.NUM_X;
			const y = Math.floor(idx / this.NUM_X);
			if (ev.startDelta.x >= this.INPUT_DELTA) {
				debugLog("右っぽい", "x=" + x, "y=" + y);
				// 右
				if (x < this.NUM_X - 1 && y < this.NUM_Y) {
					debugLog("右");
					this.isMoving = true;
					this.blockMove(idx, BlockMoveDir.right)
				}
			} else if (ev.startDelta.y >= this.INPUT_DELTA) {
				debugLog("下っぽい", "x=" + x, "y=" + y);
				// 下
				if (y > 0 && y < this.NUM_Y) {
					debugLog("下");
					this.isMoving = true;
					this.blockMove(idx, BlockMoveDir.down)
				}
			} else if (ev.startDelta.x <= -this.INPUT_DELTA) {
				debugLog("左っぽい", "x=" + x, "y=" + y);
				// 左
				if (x > 0 && y < this.NUM_Y) {
					debugLog("左");
					this.isMoving = true;
					this.blockMove(idx, BlockMoveDir.left)
				}
			} else if (ev.startDelta.y <= -this.INPUT_DELTA) {
				debugLog("上っぽい", "x=" + x, "y=" + y);
				// 上
				if (y < this.NUM_Y - 1) {
					debugLog("上");
					this.isMoving = true;
					this.blockMove(idx, BlockMoveDir.up)
				}
			} else {
				debugLog("動けませんでした");
				debugLog(`dlt=>(${ev.startDelta.x},${ev.startDelta.y}),idx=>(${idx})`);
			}
			if (this.isMoving) {
				this.scene.setTimeout(() => {
					this.isMoving = false;
				}, 300);
			}
		}
	}

	private blockMove(idx: number, dir: BlockMoveDir): void {
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
		if (di) {
			const fNo: number = this.entBlock[idx].frameNumber;
			this.entBlock[idx].frameNumber = this.entBlock[idx + di].frameNumber;
			this.entBlock[idx].modified();
			this.entBlock[idx + di].frameNumber = fNo;
			this.entBlock[idx + di].modified();
		}
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

