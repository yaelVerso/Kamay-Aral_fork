import type { SubModule } from '@/content/types'
import { videoUrl, imageUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'alphabet-a-to-g',
  moduleId: 'alphabet',
  title: 'Letters A to G',
  shortTitle: 'A–G',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    {
      id: 'letter-a',
      label: 'A',
      videoPath: videoUrl('/videos/alphabet/a.mp4'),
      imagePath: imageUrl('/images/alphabet/a.jpg'),
      acceptedAnswers: ['a'],
    },
    {
      id: 'letter-b',
      label: 'B',
      videoPath: videoUrl('/videos/alphabet/b.mp4'),
      imagePath: imageUrl('/images/alphabet/b.png'),
      acceptedAnswers: ['b'],
    },
    {
      id: 'letter-c',
      label: 'C',
      videoPath: videoUrl('/videos/alphabet/c.mp4'),
      imagePath: imageUrl('/images/alphabet/c.png'),
      acceptedAnswers: ['c'],
    },
    {
      id: 'letter-d',
      label: 'D',
      videoPath: videoUrl('/videos/alphabet/d.mp4'),
      imagePath: imageUrl('/images/alphabet/d.png'),
      acceptedAnswers: ['d'],
    },
    {
      id: 'letter-e',
      label: 'E',
      videoPath: videoUrl('/videos/alphabet/e.mp4'),
      imagePath: imageUrl('/images/alphabet/e.png'),
      acceptedAnswers: ['e'],
    },
    {
      id: 'letter-f',
      label: 'F',
      videoPath: videoUrl('/videos/alphabet/f.mp4'),
      imagePath: imageUrl('/images/alphabet/f.png'),
      acceptedAnswers: ['f'],
    },
    {
      id: 'letter-g',
      label: 'G',
      videoPath: videoUrl('/videos/alphabet/g.mp4'),
      imagePath: imageUrl('/images/alphabet/g.png'),
      acceptedAnswers: ['g'],
    },
  ],
}

export default submodule
