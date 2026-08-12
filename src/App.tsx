import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { BootScene } from './game/scenes/BootScene'
import { MenuScene } from './game/scenes/MenuScene'
import { SkillSelectScene } from './game/scenes/SkillSelectScene'
import { GameScene } from './game/scenes/GameScene'
import { CONFIG } from './game/constants'
import './App.css'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: CONFIG.width,
      height: CONFIG.height,
      parent: containerRef.current,
      backgroundColor: '#0a0a0a',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: CONFIG.gravity },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: CONFIG.width,
        height: CONFIG.height,
      },
      input: {
        activePointers: 3,
      },
      scene: [BootScene, MenuScene, SkillSelectScene, GameScene],
    })

    gameRef.current = game

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div className="game-wrapper">
      <div ref={containerRef} className="game-container" />
    </div>
  )
}

export default App
