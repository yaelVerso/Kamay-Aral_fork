'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { MAX_IMAGE_BYTES } from '@/lib/signImagePolicy'

const BUCKET = 'sign-images'

async function replaceImage(prefix: string, formData: FormData) {
  const admin = createAdminClient()

  const file = formData.get('image')
  if (!(file instanceof File) || file.size === 0) throw new Error('No file provided')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Image must be 3MB or smaller')

  const ext = file.name.split('.').pop() || 'png'
  const path = `${prefix}-${Date.now()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) throw new Error(uploadError.message)

  const { data: publicUrl } = admin.storage.from(BUCKET).getPublicUrl(path)

  const previousUrl = formData.get('previousUrl')
  if (typeof previousUrl === 'string' && previousUrl.includes(`/${BUCKET}/`)) {
    const oldPath = previousUrl.split(`/${BUCKET}/`).pop()
    if (oldPath) await admin.storage.from(BUCKET).remove([oldPath])
  }

  return publicUrl.publicUrl
}

export async function uploadAdminSignImageAction(formData: FormData): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') throw new Error('Not authorized')

  return replaceImage('admin-sign', formData)
}

export async function uploadCustomSignImageAction(formData: FormData): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'teacher') throw new Error('Not authorized')

  return replaceImage('custom-sign', formData)
}
