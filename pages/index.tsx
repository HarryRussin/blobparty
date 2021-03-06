import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { FormEvent, useEffect } from 'react'
import { auth, db } from '../firebase'
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth'
import { useState } from 'react'
import { getKeyString, randomFromArray } from '../scripts/globals'
import {
  onChildAdded,
  onChildRemoved,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from 'firebase/database'
import KeyPressListener from '../scripts/KeyPressListener'
import { useRef } from 'react'
import { ChatIcon, CheckIcon, XIcon } from '@heroicons/react/outline'

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
  const [players, setplayers] = useState<any>({})
  const [name, setname] = useState('')
  const [coins, setcoins] = useState<any>({})
  const [typing, settyping] = useState(false)
  const [openText, setopenText] = useState(false)
  const [messages, setmessages] = useState<any>([])
  const messageInputRef = useRef(null)

  const typingStateRef = useRef(typing)
  const setTypingState = (data: boolean) => {
    typingStateRef.current = data
    settyping(data)
  }
  const openTextStateRef = useRef(openText)
  const setOpenTextState = (data: boolean) => {
    openTextStateRef.current = data
    setopenText(data)
  }

  const playerColors = ['blue', 'red', 'orange', 'yellow', 'green', 'purple']
  const mapData = {
    minX: 1,
    maxX: 14,
    minY: 4,
    maxY: 12,
    blockedSpaces: [
      '7x4',
      '1x11',
      '12x10',
      '4x7',
      '5x7',
      '6x7',
      '8x6',
      '9x6',
      '10x6',
      '7x9',
      '8x9',
      '9x9',
    ],
  }

  const signIn = () => {
    onAuthStateChanged(auth, (user) => user && addUserDetails(user))

    signInAnonymously(auth).catch((error) => {
      console.log(error.code, error.message)
    })

    return
  }

  function getRandomSafeSpot() {
    //We don't look things up by key here, so just return an x/y
    return randomFromArray([
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 1, y: 5 },
      { x: 2, y: 6 },
      { x: 2, y: 8 },
      { x: 2, y: 9 },
      { x: 4, y: 8 },
      { x: 5, y: 5 },
      { x: 5, y: 8 },
      { x: 5, y: 10 },
      { x: 5, y: 11 },
      { x: 11, y: 7 },
      { x: 12, y: 7 },
      { x: 13, y: 7 },
      { x: 13, y: 6 },
      { x: 13, y: 8 },
      { x: 7, y: 6 },
      { x: 7, y: 7 },
      { x: 7, y: 8 },
      { x: 8, y: 8 },
      { x: 10, y: 8 },
      { x: 8, y: 8 },
      { x: 11, y: 4 },
    ])
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
      'CAT',
      'TURTLE',
      'MUSHROOM',
      'LEAF',
      'WHALE',
      'PUMPKIN',
    ])
    setname(`${prefix} ${suffix}`)
    return `${prefix} ${suffix}`
  }

  const addUserDetails = (user: User) => {
    console.log(user)
    if (user) {
      let pos = getRandomSafeSpot()
      console.log('Signed in, Welcome!')
      let pref = ref(db, `players/${user?.uid}`)
      let pname = createName()
      setname(pname)
      let p = {
        name: pname,
        id: user.uid,
        color: randomFromArray(playerColors),
        x: pos.x,
        y: pos.y,
        coins: 0,
        direction: randomFromArray(['left', 'right']),
      }

      setplayerid(user.uid)
      players[p.id] = p
      setplayers(players)

      set(pref, p)

      onDisconnect(pref).remove()

      initGame(user.uid)
    } else {
      console.log('Error signing in, please refresh the page :(')
    }
  }

  useEffect(() => {
    update(ref(db, 'players/' + playerid), {
      name,
    })
  }, [name])

  const placeCoin = () => {
    const { x, y } = getRandomSafeSpot()
    set(ref(db, 'coins/' + getKeyString(x, y)), {
      x,
      y,
    })
    let coinscop = JSON.parse(JSON.stringify(coins))
    coinscop[getKeyString(x, y)] = { x, y }
    setcoins(coinscop)

    const timeouts = [2000, 3000, 4000, 5000]
    setTimeout(() => {
      placeCoin()
    }, randomFromArray(timeouts))
  }

  const tryToEat = (x: number, y: number, uid: string) => {
    if (coins[getKeyString(x, y)]) {
      console.log('collision')
      console.log(getKeyString(x, y))
      console.log(players[uid])

      players[uid].coins += 1
      delete coins[getKeyString(x, y)]
      setcoins(coins)
      setplayers(players)
      remove(ref(db, 'coins/' + getKeyString(x, y)))
      update(ref(db, 'players/' + uid), {
        coins: players[uid].coins,
      })
    }
  }

  const initGame = (uid: string) => {
    //ARROW KEYS
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

    //WASD
    new KeyPressListener('KeyW', () => {
      handleMovement(0, -1, uid)
    })
    new KeyPressListener('KeyS', () => {
      handleMovement(0, 1, uid)
    })
    new KeyPressListener('KeyA', () => {
      handleMovement(-1, 0, uid)
    })
    new KeyPressListener('KeyD', () => {
      handleMovement(1, 0, uid)
    })

    new KeyPressListener('KeyT', () => {
      toggleOpenText()
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

    onChildAdded(ref(db,'messages'),(snapshot)=>{
      const messageChanged = snapshot.val()
      console.log(messageChanged);
      messages.push(messageChanged)
      //@ts-ignore
      setmessages(messages)
    })

    onChildAdded(allCoinsRef, (snapshot) => {
      let coin = snapshot.val()
      let key = getKeyString(coin.x, coin.y)
      coins[key] = { x: coin.x, y: coin.y }
      console.log(coins);

      setcoins(coins)
    })

    onChildRemoved(allCoinsRef, (snapshot) => {
      const { x, y }: any = snapshot.val()
      const removedKey = getKeyString(x, y)
      let coinscop = JSON.parse(JSON.stringify(coins))
      delete coinscop[removedKey]
      setcoins(coinscop)
    })

    onChildRemoved(allPlayersRef, (snapshot) => {
      const removedKey = snapshot.val().id
      let playerscop = JSON.parse(JSON.stringify(players))
      delete playerscop[removedKey]
      setplayers(playerscop)
    })

    placeCoin()
  }

  const toggleOpenText = () => {
    if (typingStateRef.current) {
      return
    }
    //@ts-ignore
    messageInputRef.current.value = ''
    setOpenTextState(!openTextStateRef.current)
  }

  useEffect(() => {
    openTextStateRef.current ? setTypingState(true) : setTypingState(false)
  }, [openTextStateRef.current])

  const changeColor = () => {
    let currentcolor = players[playerid].color
    let newcolor = randomFromArray(playerColors)
    if (newcolor === currentcolor) {
      changeColor()
    } else {
      update(ref(db, 'players/' + playerid), { color: newcolor })
    }
  }

  const isSolid = (x: number, y: number) => {
    if (mapData.blockedSpaces.includes(getKeyString(x, y))) {
      return false
    }
    if (
      x < mapData.minX ||
      x >= mapData.maxX ||
      y < mapData.minY ||
      y >= mapData.maxY
    ) {
      return false
    }
    return true
  }

  const sendMessage = (e: FormEvent) => {
    e.preventDefault()
    //@ts-ignore
    if (!messageInputRef.current.value||!playerid) {
      return
    }
    push(ref(db, 'messages'), {
      senderid: playerid,
      //@ts-ignore
      message: messageInputRef.current.value,
      pastcolor:players[playerid].color,
      pastname:players[playerid].name
    })
    //@ts-ignore
    messageInputRef.current.value = ''
  }

  const handleMovement = (
    xchange: number = 0,
    ychange: number = 0,
    uid: string
  ) => {
    if (typingStateRef.current) {
      return
    }
    let newx = players[uid].x + xchange
    let newy = players[uid].y + ychange

    if (isSolid(newx, newy)) {
      players[uid].y = newy
      players[uid].x = newx

      if (xchange === 1) {
        players[uid].direction = 'right'
      }
      if (xchange === -1) {
        players[uid].direction = 'left'
      }
      update(ref(db, 'players/' + uid), {
        x: players[uid].x,
        y: players[uid].y,
        direction: players[uid].direction,
      })
      tryToEat(newx, newy, uid)
    }
  }

  useEffect(() => {
    signIn()
  }, [])

  return (
    <>
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
        {Object.keys(coins).map((coin: any) => {
          const left = 16 * coins[coin].x
          const top = 16 * coins[coin].y - 3
          return (
            <div
              key={coin}
              style={{ transform: `translate3d(${left}px,${top}px,0)` }}
              className="absolute"
            >
              <div className="Coin_shadow grid-cell"></div>
              <div className="Coin_sprite grid-cell"></div>
            </div>
          )
        })}
      </div>
      <div className="player-info absolute">
        <div className="">
          <label htmlFor="player-name">Your Name</label>
          <input
            disabled={openTextStateRef.current}
            defaultValue={name}
            className="name"
            onChange={(e) => {
              setname(e.target.value || createName())
            }}
            onFocus={() => setTypingState(true)}
            onBlur={() => setTypingState(false)}
            type="text"
            maxLength={100}
            id="player-name"
          />
        </div>
        <div className="">
          <button onClick={changeColor}>Change Color</button>
        </div>
      </div>
      <div
        className={`absolute flex items-end ${
          openTextStateRef.current ? 'h-[70%] p-2' : 'h-[0%]'
        } top-0  right-0 w-full transition-all`}
      >
        <div
          className={`absolute top-0 left-0 h-full w-full bg-black opacity-70`}
        ></div>

        <div className="z-10 w-full">
          <div className="overflow-y-scroll">
            {messages.map((message:{message:string,senderid:string,pastcolor:string,pastname:string},i:number)=>{
              return(
              <p key={i} className='text-white'>
                <span className='font-bold' style={{color:`${players[message.senderid]?players[message.senderid].color:message.pastcolor}`}}>{players[message.senderid]?players[message.senderid].name:message.pastname}:</span><span> {message.message}</span>
              </p>
              )
            })}
          </div>
          <form onSubmit={(e)=>sendMessage(e)}>
            <input
              autoFocus
              ref={messageInputRef}
              type="text"
              placeholder="Start Typing..."
              className="w-full appearance-none border-b-[5px] border-dashed border-b-white bg-transparent p-2 pb-0 text-white placeholder:text-white focus:outline-none sm:w-[80%]"
            />
          </form>
          <div
            onClick={() => setOpenTextState(!openTextStateRef.current)}
            className="group absolute right-5 top-0 h-10 w-8 rounded-b-md bg-yellow-700 text-2xl text-white transition-all ease-in-out hover:h-12 active:h-8"
          >
            {openTextStateRef.current ? (
              <XIcon className="transition-all group-hover:pt-2 group-active:pt-0 " />
            ) : (
              <ChatIcon className="px-1 pt-1 transition-all group-hover:pt-2 group-active:pt-0 " />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Home
