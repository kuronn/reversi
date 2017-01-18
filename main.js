window.addEventListener("load", function() {

		//canvasクラス
		var Board = function() { }
		Board.id = "canvas";
		Board.canvas = document.getElementById(Board.id);
		Board.w = 418;
		Board.h = 418;
		Board.back_color = "Chartreuse";

		//石
		var Stone = function() { }
		Stone.empty = "空";
		Stone.white = "白";
		Stone.black = "黒";

		//ゲーム情報など
		var Game = function() { }
		//マップ
		Game.map = new Array(8);
		for (let iy=0; iy<8; iy++) {
				Game.map[iy] = new Array(8);
				for (let ix=0; ix<8; ix++) {
						Game.map[iy][ix] = Stone.empty;
				}
		}
		Game.map[3][3] = Stone.white;
		Game.map[3][4] = Stone.black;
		Game.map[4][3] = Stone.black;
		Game.map[4][4] = Stone.white;
		//評価マップ
		Game.evaluation_map = [[30, -12, 0, -1, -1, 0, -12, 30],
								[-12, -15, -3, -3, -3, -3, -15, -12],
								[0, -3, 0, -1, -1, 0, -3, 0],
								[-1,-3,-1,-1,-1,-1,-3,-1],
								[-1,-3,-1,-1,-1,-1,-3,-1],
								[0, -3, 0, -1, -1, 0, -3, 0],
								[-12, -15, -3, -3, -3, -3, -15, -12],
								[30, -12, 0, -1, -1, 0, -12, 30]]

		//プレイヤーチェンジ
		Game.change_player = function() {
				Game.player = Game.player.rival;
				let player = Game.player.name + "の" + Game.player.stone + "の番です。";
				document.getElementById("current_player").innerHTML = player;
				let stones = get_white_black(Game.map);
				let stones_message = "石の数　　白：" + stones.white + "　黒：" + stones.black;
				document.getElementById("now_stones").innerHTML = stones_message;
		}
		//プレイヤーパス
		Game.pass_player = function() {
				//相手は置けるか
				let n = getPutLocation(Game.player.rival, Game.map);
				if (n==0) {
						let player = "誰も置く事ができません！";
						let message = "ゲーム終了です。";
						document.getElementById("current_player").innerHTML = player;
						document.getElementById("message").innerHTML = message;
				} else {
						let message = Game.player.name + "は置く場所がありません！";
						document.getElementById("message").innerHTML = message;
						setTimeout(function() {
								document.getElementById("message").innerHTML = "";
						}, 3*1000);
						Game.change_player();
				}
		}


		//プレイヤー
		var Player = function(_name, _stone) {
				self = this;

				self.name = _name;
				self.stone = _stone;
				//置ける場所
				self.putmap = new Array(8);
				for (let iy=0; iy<8; iy++) {
						self.putmap[iy] = new Array(8);
						for (let ix=0; ix<8; ix++) {
								self.putmap[iy][ix] = false;
						}
				}
				self.formatPutmap = function() {
						for (let iy=0; iy<8; iy++) {
								for (let ix=0; ix<8; ix++) {
										self.putmap[iy][ix] = false;
								}
						}
				}
		}


		//始まり
		if (Board.canvas.getContext) {
				Board.context = Board.canvas.getContext("2d");
				Board.canvas.addEventListener("click", canvas_click, false);
				drawing();
				let yuser = new Player("プレイヤー", Stone.white);
				let cpu = new Player("CPU", Stone.black);
				yuser.rival = cpu;
				cpu.rival = yuser;
				Game.player = yuser;
				drawingMap(Game.map);
		} else {
				alert("このブラウザではできません。\nすみません。");
		}


		//canvasがクリックされたら
		function canvas_click(e) {
				console.log("");

				//クリックされた要素を取得
				let click = getArrayIndex(e);
				console.log("クリック　　X＝" + click.x + "　　Y＝ " + click.y);
				//置ける場所か確認
				let numbers = getPutLocation(Game.player, Game.map);
				if (!Game.player.putmap[click.y][click.x]) { return; }
				//おける場所を自分の石に変える
				let m = put_mystone(click.x, click.y, Game.player, Game.map);
				Game.map = m.concat();
				//プレイヤー交代
				Game.change_player();
				//マップの状態を描画する
				drawingMap(Game.map);
				//相手は置けるか
				//Game.player = rival
				let n = getPutLocation(Game.player, Game.map);
				if (n==0) {
						Game.pass_player();
						return;
				}

				//CPUの番
				setTimeout(cpu_ai, 1*1000);
		}

		//cpuの置く場所を決める
		function cpu_ai() {
				let numbers = getPutLocation(Game.player, Game.map);

				//おける場所リストを作る
				let list = new Array(0);
				for (let iy=0; iy<8; iy++) {
						for (let ix=0; ix<8; ix++) {
								if (Game.player.putmap[iy][ix]) {
										//おける場所
										list.push({x: ix, y:iy});
								}
						}
				}

				//置いた時の点数を調べる
				for (let i=0; i<list.length; i++) {
						list[i].cmap = copy(Game.map);
						list[i].cmap = put_mystone(list[i].x, list[i].y, Game.player, list[i].cmap);

						list[i].score = get_map_score(list[i].cmap);
				}
				//黒の最高得点を探す
				let a=list[0].score.black;
				let b=0;;
				for (let i=0; i<list.length; i++) {
						if (list[i].score.black > a) {
								b=i;
						}
				}
				//最高得点の場所に置く
				Game.map = copy(list[b].cmap);

				/*
				//ランダムな場所に置く
				let r = Math.floor(Math.random()*(list.length));
				put_mystone(list[r].x, list[r].y, Game.player, Game.map);
				*/
				Game.change_player();
				drawingMap(Game.map);
				//相手は置けるか
				let n = getPutLocation(Game.player, Game.map);
				if (n==0) {
						Game.pass_player();
						setTimeout(cpu_ai, 2*1000);
						return;
				}
		}

		//点数をつける
		function get_map_score(map) {
				let emap = Game.evaluation_map;
				let wscore = 0;
				let bscore = 0;
				for (let iy=0; iy<8; iy++) {
						for (let ix=0; ix<8; ix++) {
								switch (map[iy][ix]) {
									case Stone.empty:
										continue;
									case Stone.white:
										wscore += emap[iy][ix];
										break;
									case Stone.black:
										bscore += emap[iy][ix];
										break;
								}
						}
				}
				return {
						white: wscore,
						black: bscore
				}
		}

		//渡された配列のコピーを作る(8*8のサイズ)
		function copy(copied) {
				let made = new Array(8);
				for (let i=0; i<8; i++) { made[i] = new Array(8); }

				for (let iy=0; iy<8; iy++) {
						for (let ix=0; ix<8; ix++) {
								made[iy][ix] = copied[iy][ix];
						}
				}
				return made;
		}


		//白と黒の石の数を数える
		function get_white_black(map){
				let white = 0;
				let black = 0;
				for (let iy=0; iy<8; iy++) {
						for (let ix=0; ix<8; ix++) {
								switch (map[iy][ix]) {
									case Stone.white:
										white = white + 1;
										continue;
									case Stone.black:
										black = black + 1;
										continue;
								}
						}
				}
				return {
						white: white,
						black: black
				}
		}

		//自分の石に変える
		function put_mystone(indexX, indexY, player, map) {

				map[indexY][indexX] = player.stone;
				for (let iy=-1; iy<=1; iy++) {
						for (let ix=-1; ix<=1; ix++) {
								if (ix==0 && iy==0) { continue; }
								if (indexX+ix<0 || 8<=indexX+ix) { continue; }
								if (indexY+iy<0 || 8<=indexY+iy) { continue; }

								switch (map[indexY+iy][indexX+ix]) {
									case Stone.empty:
										continue;
									case player.stone:
										continue;
									case player.rival.stone:
										let n = getFilpNumbers(ix, iy, indexX, indexY, player, map);
										let x = indexX, y = indexY;
										while (n>0) {
												x = x + ix;
												y = y + iy;
												map[y][x] = player.stone;
												n -= 1;
										}
										break;
								}
						}
				}
				return map;
		}

		//置けるか9方向確認
		function isPut(player, indexX, indexY, map) {

				if(map[indexY][indexX] != Stone.empty) { return false; }

				for (let iy=-1; iy<=1; iy++) {
						for (let ix =-1; ix<=1; ix++) {
								if(ix==0 && iy==0) { continue; }

								let x = indexX + ix;
								let y = indexY + iy;
								if (x<0 || 8<=x) { continue; }
								if (y<0 || 8<=y) { continue; }

								let m = map[y][x];
								if(m == Stone.empty) {
										continue;
								} else if (m == player.stone) {
										continue;
								} else if (m == player.rival.stone) {
										//ここに置いた時、自分の色で何個挟めるか
										let numbers = getFilpNumbers(ix, iy, indexX, indexY, player, map);
										if (numbers>0) {
												return true;
										}
								}
						}
				}
				return false;
		}

		//自分の色で何個挟めるか
		function getFilpNumbers(ix, iy, indexX, indexY, player, map) {
				let checkX = indexX, checkY = indexY;
				let numbers = 0;
				do {
						checkX += ix;
						checkY += iy;
						//はみ出し
						if (checkX<0 || 8<= checkX) { return 0; }
						if (checkY<0 || 8<= checkY) { return 0; }

						numbers++;
				} while (map[checkY][checkX] == player.rival.stone)

				if (map[checkY][checkX] == player.stone) {
						return numbers - 1;
				} else if (map[checkY][checkX] == Stone.empty) {
						return 0;
				}
		}

		//置ける場所を返す
		function getPutLocation(player, map) {
				player.formatPutmap();
				let numbers = 0;
				for (let iy=0; iy<8; iy++) {
						for (let ix=0; ix<8; ix++) {
								if (map[iy][ix] != Stone.empty) {
										player.putmap[iy][ix] = false;
										continue;
								}
								if (isPut(player, ix, iy, map)) {
										//置けるなら
										numbers = numbers + 1;
										player.putmap[iy][ix] = true;
								} else {
										player.putmap[iy][ix] = false;
								}
						}
				}
				return numbers;
		}

		//クリックされた要素を取得
		function getArrayIndex(e) {
				let rect = e.target.getBoundingClientRect();
				let x = Math.floor((e.clientX - rect.left)/52);
				let y = Math.floor((e.clientY - rect.top)/52);

				return {
						x: x,
						y: y
				}
		}

		//ゲームボードを描画する
		function drawing() {
				let context = Board.context;
				//背景
				context.fillStyle = Board.back_color;
				context.fillRect(0, 0, Board.w, Board.h);
				//線
				for (let i=0; i<9; i++) {
						let x = i*50 + i*2 + 1;
						context.beginPath();
						context.moveTo(x, 0);
						context.lineTo(x, Board.w);
						context.stroke();
						let y = i*50 + i*2 + 1;
						context.beginPath();
						context.moveTo(0, y);
						context.lineTo(Board.h, y);
						context.stroke();
				}
		}

		//マップを描画
		function drawingMap(map) {
				//canvasクリア
				Board.context.clearRect(0, 0, Board.w, Board.h);
				//ボード
				drawing();
				//石を描画
				for (let iy=0; iy<8; iy++) {
						for (let ix=0; ix<8; ix++) {
								if (map[iy][ix] == Stone.empty) {
										continue;
								} else if (map[iy][ix] == Stone.white) {
										Board.context.fillStyle = "rgb(255, 255, 255)";
								} else if (map[iy][ix] == Stone.black) {
										Board.context.fillStyle = "rgb(0, 0, 0)";
								}
								let x = ix*50 + ix*2 + 26;
								let y = iy*50 + iy*2 + 26;
								Board.context.beginPath();
								Board.context.arc(x, y, 20, 0, Math.PI*2, false);
								Board.context.fill();
						}
				}
		}

}, false);
