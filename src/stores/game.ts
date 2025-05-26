import { defineStore } from 'pinia';
import { ref } from 'vue';
import { last } from 'lodash-es';
import type { Game, PlusGame } from '@/api/game';

export type GamePreload = {
  game?: PlusGame
  preload: Game | PlusGame
}

export const useGameStore = defineStore('game', () => {
  const lastsGames = new Map<string, GamePreload>()
  const game = ref<GamePreload>({
    game: undefined,
    preload: {} as GamePreload['preload'],
  })
  const $setupPreload = (v: GamePreload['preload']) => {
    lastsGames.delete(v._id)
    lastsGames.set(v._id, game.value = lastsGames.get(v._id) ?? {
      game: undefined,
      preload: v,
    })
  }
  const $setupGame = (v: NonNullable<GamePreload['game']>) => {
    lastsGames.delete(v._id)
    lastsGames.set(v._id, game.value = lastsGames.get(v._id) ?? {
      game: v,
      preload: v
    })
  }
  const $getLatest = () => last([...lastsGames.values()])
  const $setGame = (v: NonNullable<GamePreload['game']>) => {
    game.value.game = game.value.preload = v
    return game.value.game!
  }
  const $load = (v: GamePreload) => game.value = v
  return { lastsGames, game, $setupPreload, $setupGame, $getLatest, $setGame, $load }
})
