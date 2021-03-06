class Scene2 extends Phaser.Scene {
  constructor() {
    super("playGame");
  }
  create() {
    this.background = this.add.tileSprite(0, 0, config.width, config.height, "background");
    this.background.setOrigin(0, 0);

    this.ship1 = this.add.sprite(config.width/2 - 50, config.height/2, "ship");
    this.ship2 = this.add.sprite(config.width/2, config.height/2, "ship2");
    this.ship3 = this.add.sprite(config.width/2 + 50, config.height/2, "ship3");

    this.enemies = this.physics.add.group();
    this.enemies.add(this.ship1);
    this.enemies.add(this.ship2);
    this.enemies.add(this.ship3);

    this.ship1.play("ship1_anim", true);
    this.ship2.play("ship2_anim", true);
    this.ship3.play("ship3_anim", true);

    this.ship1.setInteractive();
    this.ship2.setInteractive();
    this.ship3.setInteractive();

    this.input.on('gameobjectdown', this.destroyShip, this);

    this.powerUps = this.physics.add.group();

    let maxObjects = 4;
    for (let i=0;i<=maxObjects;i++) {
      let powerUp = this.physics.add.sprite(16, 16, "power-up");
      this.powerUps.add(powerUp);
      powerUp.setRandomPosition(0, 0, game.config.width, game.config.height);

      if (Math.random() > 0.5) {
        powerUp.play("red");        
      } else {
        powerUp.play("gray");
      }

      powerUp.setVelocity(100, 100);
      powerUp.setCollideWorldBounds(true);
      powerUp.setBounce(1);  
    }

    this.player = this.physics.add.sprite(config.width / 2 - 8, config.height - 64, "player");
    this.player.setScale(0.25);
    this.player.play("thrust");
    this.player.setCollideWorldBounds(true);

    this.cursorKeys = this.input.keyboard.createCursorKeys();
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.projectiles = this.add.group({
      classType: Beam,
      maxSize: 10,
      runChildUpdate: true
    });
    this.physics.add.collider(this.projectiles, this.powerUps, (projectile, powerUp) => {
      projectile.destroy();
    });
    this.physics.add.overlap(this.player, this.powerUps, this.pickPowerUp, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hurtPlayer, null, this);
    this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);

    let graphics = this.add.graphics();
    graphics.fillStyle(0x8A8A8A, 1);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(config.width, 0);
    graphics.lineTo(config.width, 20);
    graphics.lineTo(0, 20);
    graphics.lineTo(0, 0);
    graphics.closePath();
    graphics.fillPath();

    this.score = 0;
    this.scoreLabel = this.add.bitmapText(10, 5, "pixelFont", "SCORE ", 16);

    this.beamSound = this.sound.add("audio_beam");
    this.explosionSound = this.sound.add("audio_explosion");
    this.collisionSound = this.sound.add("audio_collision");
    this.pickupSound = this.sound.add("audio_pickup");
    this.music = this.sound.add("music");
    this.soundVolume = { volume: 0.4 };

    let musicConfig = {
      mute: false,
      volume: 0.3,
      rate: 1,
      detune: 0,
      seek: 0,
      loop: true,
      delay: 0,
    }

    this.music.play(musicConfig);
  }

  update() {
    this.moveShip(this.ship1, 1);
    this.moveShip(this.ship2, 2);
    this.moveShip(this.ship3, 2.5);

    this.background.tilePositionY -= 0.5;

    this.movePlayerManager();

    if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
      if (this.player.active) {
        this.shootBeam(); 
      }
    }
  }

  moveShip(ship, speed) {
    ship.y += speed;
    if (ship.y > config.height) {
      this.resetShipPos(ship);
    }
  }

  resetShipPos(ship) {
    ship.y = 0;
    let randomX = Phaser.Math.Between(0, config.width);
    ship.x = randomX;
  }

  destroyShip(pointer, gameObject) {
    gameObject.setTexture("explosion");
    gameObject.play("explode");
  }

  movePlayerManager() {
    if (this.cursorKeys.left.isDown) {
      this.player.x -= gameSettings.playerSpeed;
    } else if (this.cursorKeys.right.isDown) {
      this.player.x += gameSettings.playerSpeed;
    }
    
    if (this.cursorKeys.down.isDown) {
      this.player.y += gameSettings.playerSpeed;
    } else if (this.cursorKeys.up.isDown) {
      this.player.y -= gameSettings.playerSpeed;
    }
  }

  shootBeam(){
    let beam = new Beam(this);
    this.beamSound.play(this.soundVolume);
  }

  pickPowerUp(player, powerUp) {
    powerUp.disableBody(true, true);
    this.pickupSound.play(this.soundVolume);
  }

  hurtPlayer(player, enemy) {
    this.resetShipPos(enemy);
    if(this.player.alpha < 1) {
      return;
    }
    let explosion = new Explosion(this, player.x, player.y);
    this.collisionSound.play(this.soundVolume);
    this.adjustScore(10, false)  ;
    player.disableBody(true, true);
    this.time.addEvent({
      delay: 1000,
      callback: this.resetPlayer,
      callbackScope: this,
      loop: false
    });
  }

  hitEnemy(projectile, enemy) {
    let explosion = new Explosion(this, enemy.x, enemy.y);
    projectile.destroy();
    this.resetShipPos(enemy);
    this.adjustScore(15, true);
    this.explosionSound.play(this.soundVolume);
  }

  adjustScore(scoreValue, operation) {
    if (operation) {
      this.score += scoreValue;  
    } else {
      if(this.score > 0) { // the score isn't adjusted in case it is below zero or zero
        this.score -= scoreValue;  
      } 
    }
    let scoreFormated = this.zeroPad(this.score, 6);
    this.scoreLabel.text = "SCORE: " + scoreFormated;
  }

  zeroPad(number, size) {
    let stringNumber = String(number);
    while(stringNumber.length < (size || 2)){
      stringNumber = "0" + stringNumber;
    }
    return stringNumber;
  }

  resetPlayer() {
    let x = config.width / 2 - 8;
    let y = config.height + 64;
    this.player.enableBody(true, x, y, true, true);
    this.player.alpha = 0.5;

    let tween = this.tweens.add({
      targets: this.player,
      y: config.height - 64,
      ease: 'Power1',
      duration: 1500,
      repeat: 0,
      onComplete: () => {
        this.player.alpha = 1;
      },
      callbackScope: this
    });
  }
}