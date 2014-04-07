function init() {
	var canvas = document.getElementById("easel"),
	stage = new createjs.Stage(canvas);
	
	var sentence = new createjs.Text("The quick brown fox jumps over the lazy dog", "bold 30px Times", "purple");
	
	sentence.x = 200;
	sentence.y = 100;
	sentence.textAlign = "center";
	sentence.lineWidth = 150;	
	sentence.lineHeight = 100;	
	
	stage.addChild(sentence);
	stage.update();
}