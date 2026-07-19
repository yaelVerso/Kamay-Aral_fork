import type { Module } from '@/content/types'
import basicGreetings from './submodules/01-basic-greetings'
import thanksAndWishes from './submodules/02-thanks-and-wishes'
import yesNoAndFarewells from './submodules/03-yes-no-and-farewells'
import loveAndCelebrations from './submodules/04-love-and-celebrations'

const module: Module = {
  id: 'greetings',
  order: 3,
  title: 'Greetings and Polite Expressions',
  description: 'Learn common FSL greetings and polite everyday expressions.',
  icon: '👋',
  subModules: [basicGreetings, thanksAndWishes, yesNoAndFarewells, loveAndCelebrations],
  color: 'bg-[#BBE587] shadow-[0_4px_0_#82B740] hover:bg-[#A6E05F]'
}

export default module
