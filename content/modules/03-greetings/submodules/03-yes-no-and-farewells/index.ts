import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'greetings-yes-no-and-farewells',
  moduleId: 'greetings',
  title: 'Yes, No, and Farewells',
  shortTitle: 'Yes/No & Farewells',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'greeting-yes', label: 'Yes', videoPath: videoUrl('/videos/greetings/yes.mp4'), acceptedAnswers: ['yes'] },
    { id: 'greeting-no', label: 'No', videoPath: videoUrl('/videos/greetings/no.mp4'), acceptedAnswers: ['no'] },
    { id: 'greeting-okay', label: 'Okay', videoPath: videoUrl('/videos/greetings/okay.mp4'), acceptedAnswers: ['okay', 'ok'] },
    { id: 'greeting-i-dont-know', label: "I Don't Know", videoPath: videoUrl('/videos/greetings/i-dont-know.mp4'), acceptedAnswers: ["i don't know", 'i dont know'] },
    { id: 'greeting-excuse-me', label: 'Excuse Me', videoPath: videoUrl('/videos/greetings/excuse-me.mp4'), acceptedAnswers: ['excuse me'] },
    { id: 'greeting-see-you-later', label: 'See You Later', videoPath: videoUrl('/videos/greetings/see-you-later.mp4'), acceptedAnswers: ['see you later'] },
    { id: 'greeting-see-you-tomorrow', label: 'See You Tomorrow', videoPath: videoUrl('/videos/greetings/see-you-tomorrow.mp4'), acceptedAnswers: ['see you tomorrow'] },
  ],
}

export default submodule
