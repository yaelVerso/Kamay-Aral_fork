import type { Module } from '@/content/types'
import oneToTen from './submodules/01-0-to-10'
import elevenToTwenty from './submodules/02-11-to-20'
import thirtyToHundred from './submodules/03-30-to-100'
import quantityAndOrder from './submodules/04-quantity-and-order'

const module: Module = {
  id: 'numbers',
  order: 2,
  title: 'Numbers and Counting',
  description: 'Learn to sign numbers and count in Filipino Sign Language.',
  icon: '🔢',
  subModules: [oneToTen, elevenToTwenty, thirtyToHundred, quantityAndOrder],
  color: 'bg-[#63B6F5] shadow-[0_4px_0_#2087D5] hover:bg-[#43AAF9]'
}

export default module
