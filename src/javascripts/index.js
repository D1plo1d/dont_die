let PixelJS = require("pixel.js/pixel.js")
let $ = require("jquery")
require("../stylesheets/index.styl")

window.addEventListener("load", function() {
  var game = new PixelJS.Engine()
  game.init({
    container: 'game_container',
    width: 800,
    height: 600
  })

  var backgroundLayer = game.createLayer('background')
  var grass = backgroundLayer.createEntity()
  backgroundLayer.static = true
  grass.pos = { x: 0, y: 0 }
  grass.asset = new PixelJS.Tile()
  grass.asset.prepare({
    name: 'grass.png',
    size: {
      width: 800,
      height: 600
    }
  })

  var playerLayer = game.createLayer('players')
  var player = new PixelJS.Player()
  player.addToLayer(playerLayer)
  player.allowDiagonalMovement = true
  player.pos = { x: 400, y: 300 }
  player.size = { width: 32, height: 32 }
  player.velocity = { x: 400, y: 400 }
  player.asset = new PixelJS.AnimatedSprite()
  player.asset.prepare({
    name: 'char.png',
    frames: 3,
    rows: 4,
    speed: 50,
    defaultFrame: 1
  })

  var treeLayer = game.createLayer('trees')
  treeLayer.zindex = 1
  var milkLayer = game.createLayer('milk')
  milkLayer.zindex = 2

  var initTree = function() {
    let tree = treeLayer.createEntity()
    milkLayer.registerCollidable(tree)
    tree.size = { width: 64, height: 64 }
    tree.asset = new PixelJS.AnimatedSprite()
    tree.asset.prepare({
      name: 'trees.png',
      frames: 5,
      rows: 1,
      speed: 100,
      defaultFrame: Math.random()*3
    })
    tree.reset = function() {
      tree.pos = {
        x: Math.floor(Math.random() * (700 - 100 + 1) + 100),
        y: Math.floor(Math.random() * (500 - 100 + 1) + 100),
      }
      tree.velocity = { x: 0, y: 0 }
    }
    tree.reset()
    return tree
  }

  var initMilkJug = function() {
    let milkJug = milkLayer.createEntity()
    milkLayer.registerCollidable(milkJug)
    milkJug.size = { width: 64, height: 64 }
    milkJug.acceleration = Math.min(40, Math.max(5, secondsSinceStart))
    milkJug.friction = 1 + Math.random()*2
    milkJug.maxSpeed = Math.min(600, Math.max(100, secondsSinceStart * 50))
    milkJug.asset = new PixelJS.Sprite()
    milkJug.asset.prepare({
      name: 'milk_jug.png',
    })
    milkJug.spawnedAt = secondsSinceStart
    milkJug.updatePosition = function() {
      let isEast = (this.pos.x > player.pos.x)
      let isSouth = (this.pos.y > player.pos.y)
      // Acceleration
      this.velocity.x += (isEast ? -1 : 1) * this.acceleration
      this.velocity.y += (isSouth ? -1 : 1) * this.acceleration
      // Friction
      let {x, y} = this.velocity
      let {min, max, sign, abs} = Math
      x = sign(x) * min(milkJug.maxSpeed, max(0, abs(x) - this.friction))
      y = sign(y) * min(milkJug.maxSpeed, max(0, abs(y) - this.friction))
      this.velocity = {x, y}
      this.moveDown()
      this.moveRight()
    }
    milkJug.reset = function() {
      milkJug.pos = {
        x: Math.floor(Math.random() * (700 - 100 + 1) + 100),
        y: Math.floor(Math.random() * (500 - 100 + 1) + 100),
      }
      milkJug.velocity = { x: 0, y: 0 }
    }
    milkJug.reset()
    return milkJug
  }

  var trees = []
  var milkJugs = []
  var secondsSinceStart
  var level
  var $container = $("#game_container")
  var resetGame = function() {
    secondsSinceStart = 0
    level = 1
    $container.attr("class", "")
    for (let tree of trees) tree.dispose()
    for (let jug of milkJugs) jug.dispose()
    milkJugs = (new Array(2).fill(0)).map(initMilkJug)
    trees = []
    player.pos = {
      x: 400,
      y: 300,
    }
    milkLayer.load(() => undefined)
    treeLayer.load(() => undefined)
  }
  resetGame()

  player.onCollide(function (entity) {
      if (milkJugs.indexOf(entity) !== -1 && secondsSinceStart > entity.spawnedAt + 1) {
          resetGame()
          deaths += 1
          scoreLayer.redraw = true
          scoreLayer.drawText(
              'Deaths By Sentient Recycling: ' + deaths,
              50,
              50,
              '14pt "Trebuchet MS", Helvetica, sans-serif',
              '#FFFFFF',
              'left'
          )
      }
  })

  playerLayer.registerCollidable(player)

  var deaths = 0
  var scoreLayer = game.createLayer("score")
  scoreLayer.static = true

  game.loadAndRun(function (elapsedTime, dt) {
    secondsSinceStart += dt
    player.canMoveLeft = player.pos.x > 0
    player.canMoveRight = player.pos.x < 800 - 32
    player.canMoveUp = player.pos.y > 0
    player.canMoveDown = player.pos.y < 600 - 32
    if (level < secondsSinceStart / 8 && level < 4) {
      console.log(`LEVEL ${level}`)
      level++
      $container.attr("class", `level${level}`)
    }
    if (secondsSinceStart / 3 > milkJugs.length ) {
      milkJugs.push(initMilkJug())
      milkLayer.load(() => undefined)
    }
    if (trees.length/2 < secondsSinceStart) {
      trees.push(initTree())
      treeLayer.load(() => undefined)
    }
    for (let jug of milkJugs) {
      jug.opacity = Math.abs(1 - secondsSinceStart % 2)*0.3 + 0.7
      jug.updatePosition()
    }
  })
})
