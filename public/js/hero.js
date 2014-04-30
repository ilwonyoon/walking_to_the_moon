(function(scope) {

    function Hero(image) {
        this.initialize(image);
    }
    Hero.prototype = new createjs.Bitmap();

    //save the original initialize-method so
    //it won't be gone after overwriting it
    Hero.prototype.Bitmap_init = Hero.prototype.initialize;

    //initialize the object
    Hero.prototype.initialize = function(image) {
        this.Bitmap_init(image);
        this.snapToPixel = true;
        this.velocity = {
            x: 0,
            y: -15
        };

        this.addEventListener('tick', this.onTick.bind(this));
    }

    Hero.prototype.onTick = function() {
        this.velocity.y += 1;
        this.y += this.velocity.y;
    }

    Hero.prototype.jump = function() {
        this.velocity.y = -15;
    }

    scope.Hero = Hero;
})(window);