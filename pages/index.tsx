import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect } from 'react'
import { auth, db } from '../firebase'
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth'
import { useState } from 'react'
import { randomFromArray } from '../scripts/globals'
import {
  DatabaseReference,
  onChildAdded,
  onDisconnect,
  onValue,
  ref,
  set,
} from 'firebase/database'
import KeyPressListener from '../scripts/KeyPressListener'

interface PlayerData {
  name: string
  id: string
  color: string
  x: number
  y: number
  coins: number
  direction?: string
}

interface Player {
  key: PlayerData
}

const Home: NextPage = () => {
  const [playerid, setplayerid] = useState('')
  const [playerRef, setplayerRef] = useState<DatabaseReference>()
  const [players, setplayers] = useState<any>({})
  const [name, setname] = useState('')

  const playerColors = ['blue', 'red', 'orange', 'yellow', 'green', 'purple']

  const signIn = () => {
    onAuthStateChanged(auth, (user) => user && addUserDetails(user))

    signInAnonymously(auth).catch((error) => {
      console.log(error.code, error.message)
    })

    return
  }

  const createName = () => {
    let prefix = randomFromArray([
      'EPIC',
      'MASSIVE',
      'TINY',
      'UWU',
      'MUSHROOM',
      'BORGOR',
      'SQUEAKY',
    ])
    let suffix = randomFromArray([
      'COCK',
      'WEINER',
      'CAT',
      'TURTLE',
      'MUSHROOM',
      'LEAF',
      'WHALE',
      'PUMPKIN',
      'BOOB',
    ])
    setname(`${prefix} ${suffix}`)
    return `${prefix} ${suffix}`
  }

  const addUserDetails = (user: User) => {
    console.log(user)
    if (user) {
      console.log('Signed in, Welcome!')
      let pref = ref(db, `players/${user?.uid}`)
      let p = {
        name: createName(),
        id: user.uid,
        color: randomFromArray(playerColors),
        x: 6,
        y: 9,
        coins: 22,
        direction: randomFromArray(['left', 'right']),
      }

      setplayerid(user.uid)
      setplayerRef(pref)
      players[p.id] = p
      setplayers(players)

      set(pref, p)

      onDisconnect(pref).remove()

      initGame(user.uid)
    } else {
      console.log('Error signing in, please refresh the page :(')
    }
  }

  const initGame = (uid: string) => {
    new KeyPressListener('ArrowUp', () => {
      handleMovement(0, -1, uid)
    })
    new KeyPressListener('ArrowDown', () => {
      handleMovement(0, 1, uid)
    })
    new KeyPressListener('ArrowLeft', () => {
      handleMovement(-1, 0, uid)
    })
    new KeyPressListener('ArrowRight', () => {
      handleMovement(1, 0, uid)
    })

    const allPlayersRef = ref(db, 'players')
    const allCoinsRef = ref(db, 'coins')

    onValue(allPlayersRef, (snapshot) => {
      const playerchange = snapshot.val()
      setplayers(playerchange)
    })

    onChildAdded(allPlayersRef, (snapshot) => {
      const addedPlayer: PlayerData = snapshot.val()
      let playerscop = JSON.parse(JSON.stringify(players))
      playerscop[addedPlayer.id] = addedPlayer

      setplayers(playerscop)
      if (addedPlayer.id === playerid) {
        console.log('hi u')
      }
    })
  }

  const handleMovement = (
    xchange: number = 0,
    ychange: number = 0,
    uid: string
  ) => {
    let playerscop = JSON.parse(JSON.stringify(players))

    let newx = players[uid].x += xchange
    let newy = players[uid].y += ychange

    console.log(xchange, ychange)

    if (true) {
      playerscop[uid].y = newy
      playerscop[uid].x = newx

      if (xchange === 1) {
        playerscop[uid].direction = 'right'
      }
      if (xchange === -1) {
        playerscop[uid].direction = 'left'
      }
    }
    set(ref(db, 'players/' + uid), playerscop[uid])
  }

  useEffect(() => {
    signIn()
  }, [])

  return (
    <div className="game-container">
      {Object.keys(players).map((player: any) => {
        const left = 16 * players[player].x
        const top = 16 * players[player].y - 3
        return (
          <div
            data-color={players[player].color}
            data-direction={players[player].direction}
            key={players[player].id}
            style={{ transform: `translate3d(${left}px,${top}px,0)` }}
            className={`Character grid-cell ${
              players[player].id === playerid && 'you'
            }`}
          >
            <div className="Character_shadow grid-cell"></div>
            <div className="Character_sprite grid-cell"></div>
            <div className="Character_name-container ">
              <span className="Character_name">{players[player].name}</span>
              <span className="Character_coins">{players[player].coins}</span>
            </div>
            {players[player].id === playerid && (
              <div className="Character_you-arrow"></div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Home
