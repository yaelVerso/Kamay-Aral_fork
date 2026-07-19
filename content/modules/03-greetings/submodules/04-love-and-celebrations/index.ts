import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'greetings-love-and-celebrations',
  moduleId: 'greetings',
  title: 'Love and Celebrations',
  shortTitle: 'Love & Celebrations',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'greeting-i-love-you', label: 'I Love You', videoPath: videoUrl('/videos/greetings/i-love-you.mp4'), acceptedAnswers: ['i love you'] },
    { id: 'greeting-i-like-you', label: 'I Like You', videoPath: videoUrl('/videos/greetings/i-like-you.mp4'), acceptedAnswers: ['i like you'] },
    { id: 'greeting-happy-birthday', label: 'Happy Birthday', videoPath: videoUrl('/videos/greetings/happy-birthday.mp4'), acceptedAnswers: ['happy birthday'] },
    { id: 'greeting-congratulations', label: 'Congratulations', videoPath: videoUrl('/videos/greetings/congratulations.mp4'), acceptedAnswers: ['congratulations', 'congrats'] },
  ],
}

export default submodule
