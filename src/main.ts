// ・つりっクラッシュ(ニコ生ゲーム　60秒)
// 　8x8	3種
// 　落ちる速度は深さにかかわらず指定秒(演出はだんだん速くtween操作？)
// 　4つで横→縦イカ、4つ縦で→横イカ、5つで人魚　合成は無し
// ・ズーパズル(ニコ生ゲーム 70秒)
// 　8x7 7種(緑, 橙, 赤, 水, 白, ピ, 黄)？
// 　落ちる速度は深さにかかわらず指定秒(演出は同じ速度でそのままずれる)
// 　特別な仕様なし
// ・ぷよぷよ(アーケード 決着つくまで)
// 　6x12 5種(赤,黄,緑,紫,水) 対戦
// 　落ちる速度は1マス指定秒(試合時間が長くなるほど短くなる)、深くなるほど時間がかかる
// 　連鎖などすることで相手に攻撃
// ・キャンディクラッシュ(スマホゲーム 操作回数制限)
// 　最大9x9?,多種多様なステージ 6種?(赤,橙,黄,水,緑,紫,?)
// 　落ちる速度は1マス指定秒(試合時間が長くなるほど短くなる)、深くなるほど時間がかかる
// 　・スペシャルキャンディ初期3種
// 　　４つ　　ストライプ　１列
// 　　ＬorＴ　ラッピング　周り(3x3?)
// 　　５つ　　カラー　　　同色
// 　　ストｘスト　　　　　十字
// 　　ストｘラプ　　　　　十字３列
// 　　ストｘカラ　　　　　縦or横ライン、色すべてスト変化
// 　　ラプｘラプ　　　　　周り(5x5?)
// 　　ラプｘカラ　　　　　２回カラ
// 　　カラｘカラ　　　　　全て削除

import { Block } from "./CBlock";
import { GameMainParameterObject } from "./parameterObject";

// グローバルゲームパラメータ
export let G_GAME_PARAMETER: GameMainParameterObject;

// アスペクト比
export const ASPECT_RATIO: number = g.game.width / g.game.height;

// ブロック関連定数
const MARGIN_LT: number = 84;
const MARGIN_TP: number = 77;


// ブロック移動アニメーションフラグ
let isMoving: boolean = false;

/**
 * メイン関数
 * @param {GameMainParameterObject} param ゲームパラメータ
 */
export function main(param: GameMainParameterObject): void {
	// パラメータをグローバル変数に設定
	G_GAME_PARAMETER = param;
	// シーンの設定
	const scene = new g.Scene({
		game: g.game,
		assetIds: ["block", "choco", "bg", "blk_back", "area"]
	});
	// 制限時間
	let time = 60;
	if (param.sessionParameter.totalTimeLimit) {
		time = param.sessionParameter.totalTimeLimit; // セッションパラメータで制限時間が指定されたらその値を使用します
	}
	// スコア
	g.game.vars.gameState = { score: 0 };
	// =============================================================
	// シーン読み込み時処理
	// =============================================================
	scene.onLoad.add(() => {
		// ここからゲーム内容を記述します
		debugLog("セッションモード");
		debugLog(param.sessionParameter.mode);

		// 各アセットオブジェクトを取得します
		// const playerImageAsset = scene.asset.getImageById("player");
		// const shotImageAsset = scene.asset.getImageById("shot");
		// const seAudioAsset = scene.asset.getAudioById("se");
		const imgChoco = scene.asset.getImageById("choco");
		const imgBg = scene.asset.getImageById("bg");
		const imgArea = scene.asset.getImageById("area");

		// 背景の生成
		const bg = new g.Sprite({
			scene: scene,
			src: imgBg,
		});
		scene.append(bg);


		// ブロッククラスの生成
		const block: Block = new Block(scene, "block", "blk_back");
		// ブロック背景の追加
		block.appendBack(scene);

		// debugLog("ブロック配列初期値設定_開始");
		// for (let y = arrBlock[0].length - 1; y >= 0; y--) {
		// 	for (let x = 0; x < arrBlock.length; x++) {
		// 		let left1: typBlockType = typBlockType.none;
		// 		let left2: typBlockType = typBlockType.none;
		// 		let down1: typBlockType = typBlockType.none;
		// 		let down2: typBlockType = typBlockType.none;
		// 		let newBlock: typBlockType = typBlockType.none;
		// 		// 範囲内のブロックであれば左1,2と下1,2を取得
		// 		if (x > 1) {
		// 			left1 = arrBlock[x - 1][y];
		// 			left2 = arrBlock[x - 2][y];
		// 		}
		// 		if (y < arrBlock[0].length - 2) {
		// 			down1 = arrBlock[x][y + 1];
		// 			down2 = arrBlock[x][y + 2];
		// 		}
		// 		// 新しいブロックの設定
		// 		newBlock = Random.randRange(1, typBlockType.all);
		// 		debugLog(newBlock);
		// 		if (left1 === left2 || down1 === down2) {
		// 			while (newBlock === left2 || newBlock === down2) {
		// 				newBlock = Random.randRange(1, typBlockType.all);
		// 				debugLog(newBlock);
		// 			}
		// 		}
		// 		arrBlock[x][y] = newBlock;
		// 	}
		// }
		// debugLog("ブロック配列初期値設定_終了");

		// ブロックの表示
		block.setBlockEntity(scene);

		// ショコの生成 500x500
		const choco = new g.Sprite({
			scene: scene,
			src: imgChoco,
			x: g.game.width - 450,
			y: g.game.height - 500,
		});
		scene.append(choco);

		// test
		// const rect = new g.FilledRect({
		// 	scene: scene,
		// 	cssColor: "red",
		// 	width: 128,
		// 	height: 128,
		// 	x: 700,
		// 	y: 300,
		// 	touchable: true,
		// });
		// rect.onPointDown.add((ev) => {
		// 	debugLog("testOnPointDown");
		// 	debugLog(`(ev) => (${ev.point.x},${ev.point.y})`);
		// });
		// scene.append(rect);

		// フォントの生成
		const font = new g.DynamicFont({
			game: g.game,
			fontFamily: "sans-serif",
			size: 48
		});

		// スコア表示用のラベル
		const scoreLabel = new g.Label({
			scene: scene,
			text: "SCORE: 0",
			font: font,
			fontSize: font.size / 2,
			textColor: "black"
		});
		scene.append(scoreLabel);

		// 残り時間表示用ラベル
		const timeLabel = new g.Label({
			scene: scene,
			text: "TIME: 0",
			font: font,
			fontSize: font.size / 2,
			textColor: "black",
			x: 0.65 * g.game.width
		});
		scene.append(timeLabel);

		// ボタン等表示領域
		const area = new g.Sprite({
			scene: scene,
			src: imgArea,
		});
		scene.append(area);

		// 画面をタッチしたとき、SEを鳴らします
		scene.onPointDownCapture.add(() => {
			// 制限時間以内であればタッチ1回ごとにSCOREに+1します
			if (time > 0) {
				g.game.vars.gameState.score++;
				scoreLabel.text = "SCORE: " + g.game.vars.gameState.score;
				scoreLabel.invalidate();
			}
			// seAudioAsset.play();

			// プレイヤーが発射する弾を生成します
			// const shot = new g.Sprite({
			// 	scene: scene,
			// 	src: shotImageAsset,
			// 	width: shotImageAsset.width,
			// 	height: shotImageAsset.height
			// });

			// 弾の初期座標を、プレイヤーの少し右に設定します
			// shot.x = player.x + player.width;
			// shot.y = player.y;
			// shot.onUpdate.add(() => {
			// 	// 毎フレームで座標を確認し、画面外に出ていたら弾をシーンから取り除きます
			// 	if (shot.x > g.game.width) shot.destroy();

			// 	// 弾を右に動かし、弾の動きを表現します
			// 	shot.x += 10;

			// 	// 変更をゲームに通知します
			// 	shot.modified();
			// });
			// scene.append(shot);
		});
		const updateHandler = (): void => {
			if (time <= 0) {
				scene.onUpdate.remove(updateHandler); // カウントダウンを止めるためにこのイベントハンドラを削除します
			}
			// カウントダウン処理
			time -= 1 / g.game.fps;
			timeLabel.text = "TIME: " + Math.ceil(time);
			timeLabel.invalidate();
		};
		scene.onUpdate.add(updateHandler);
		// ここまでゲーム内容を記述します
	});
	g.game.pushScene(scene);
}

/**
 * デバッグ表示(コンソール)
 * @param a 表示するパラメータ
 */
export function debugLog(...a: any[]): void {
	console.log(a);
}

// function blockMove(blk: g.FrameSprite[][], x: number, y: number, dir: typeBlockMoveDir): void {
// 	let dx: number = 0;
// 	let dy: number = 0;
// 	switch (dir) {
// 		case typeBlockMoveDir.right:
// 			dx = 1, dy = 0;
// 			break;
// 		case typeBlockMoveDir.down:
// 			dx = 0, dy = 1;
// 			break;
// 		case typeBlockMoveDir.left:
// 			dx = -1, dy = 0;
// 			break;
// 		case typeBlockMoveDir.up:
// 			dx = 0, dy = -1;
// 			break;
// 		default:
// 			debugLog(`${dir}の方向には動かせません`);
// 			return;
// 	}
// 	const fNo: number = blk[x][y].frameNumber;
// 	blk[x][y].frameNumber = blk[x + dx][y + dy].frameNumber;
// 	blk[x][y].modified();
// 	blk[x + dx][y + dy].frameNumber = fNo;
// 	blk[x + dx][y + dy].modified();
// }