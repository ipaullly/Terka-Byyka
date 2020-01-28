class Beam extends Phaser.GameObjects.Sprite{
  constructor(scene){
    let x = scene.player.x;
    let y = scene.player.y;
    super(scene, x, y, "beam");    
    scene.add.existing(this);
    
    scene.physics.world.enableBody(this);
    this.body.velocity.y = -250;
  
    console.log(this.body.transform);
    
  }

  update() {
    if(this.y < 32) {
      this.destroy();
    }
  }
}