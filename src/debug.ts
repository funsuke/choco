/**
 * デバッグ表示(コンソール)
 * @param {any[]} a 表示するパラメータ
 */
export function debugLog(...a: any[]): void {
	console.log(a);
}

/**
 * 関数用デバッグ表示
 * @param {string} inOut in時out時の指定
 * @param {string} funcName 関数名
 * @param {any[]} other 表示するパラメータ
 */
export function debugFuncLog(funcName: string, mes: string, ...inOut: any[]) {
	if (mes === "in") {
		console.log(`i***${funcName}_in`, inOut);
	} else if (mes === "out") {
		console.log(`o***${funcName}_out`, inOut);
	} else {
		console.log(`    ${funcName} ${mes} `, inOut);
	}
}

// 関数名の取得 今回は使わず
// ※debugFuncLogのfuncNameについて
// ES2015ではFunction.nameで取得できるらしい selfなどで指定できたらいいよね
// https://www.endorphinbath.com/javascript-get-this-class-funcname/
function getThisFuncName(func: Function): string {
	const funcValue: string = func.toString();
	const initialOfFuncStatement: string = "function ";
	console.log("*******************");
	console.log(funcValue);
	console.log("*******************");
	let funcName = "";
	if (funcValue.indexOf(initialOfFuncStatement, 0) !== 0) {
		funcName = funcValue.substring(0, funcValue.indexOf("(", 0));
	} else {
		funcName = funcValue.substring(initialOfFuncStatement.length, funcValue.indexOf("(", 0));
	}
	return funcName;
}
