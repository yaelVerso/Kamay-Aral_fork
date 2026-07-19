import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'greetings-thanks-and-wishes',
  moduleId: 'greetings',
  title: 'Thanks and Well-Wishes',
  shortTitle: 'Thanks & Wishes',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'greeting-sorry', label: 'Sorry', videoPath: videoUrl('/videos/greetings/sorry.mp4'), acceptedAnswers: ['sorry'] },
    { id: 'greeting-thank-you', label: 'Thank You', videoPath: videoUrl('/videos/greetings/thank-you.mp4'), acceptedAnswers: ['thank you', 'thanks'] },
    { id: 'greeting-youre-welcome', label: "You're Welcome", videoPath: videoUrl('/videos/greetings/youre-welcome.mp4'), acceptedAnswers: ["you're welcome", 'youre welcome'] },
    { id: 'greeting-how-are-you', label: 'How Are You?', videoPath: videoUrl('/videos/greetings/how-are-you.mp4'), acceptedAnswers: ['how are you', 'how are you?'] },
    { id: 'greeting-im-fine', label: "I'm Fine", videoPath: videoUrl('/videos/greetings/im-fine.mp4'), acceptedAnswers: ["i'm fine", 'im fine', 'fine'] },
    { id: 'greeting-goodbye', label: 'Goodbye', videoPath: videoUrl('/videos/greetings/goodbye.mp4'), acceptedAnswers: ['goodbye', 'bye'] },
  ],
}

export default submodule
