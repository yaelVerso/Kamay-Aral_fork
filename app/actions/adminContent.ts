'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { recordAuditLog } from '@/app/actions/audit'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Not authorized')
  }
}

const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const ALLOWED_VIDEO_TYPES: Record<string, string> = { 'video/mp4': 'mp4', 'video/webm': 'webm' }

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/**
 * Uploads a sign's video file to the sign-media bucket, keyed by the
 * sign's own id — an alternative to pasting a YouTube link. upsert:true
 * means re-uploading for the same sign just overwrites in place, no
 * separate delete-then-upload step needed.
 */
export async function uploadAdminSignVideoAction(formData: FormData): Promise<string> {
  await requireAdmin()

  const signId = formData.get('signId')
  const file = formData.get('file')
  if (typeof signId !== 'string' || !signId) throw new Error('Missing sign id')
  if (!(file instanceof File) || file.size === 0) throw new Error('No file provided')

  const ext = ALLOWED_VIDEO_TYPES[file.type]
  if (!ext) throw new Error('Only mp4 or webm video files are allowed')
  if (file.size > MAX_VIDEO_BYTES) throw new Error('Video must be under 50MB')

  const admin = createAdminClient()
  const path = `${signId}/video.${ext}`
  const { error } = await admin.storage.from('sign-media').upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)

  const { data } = admin.storage.from('sign-media').getPublicUrl(path)
  await recordAuditLog({ action: 'admin_sign.upload_video', description: 'uploaded a video file for a sign' })
  return data.publicUrl
}

export async function uploadAdminSignImageAction(formData: FormData): Promise<string> {
  await requireAdmin()

  const signId = formData.get('signId')
  const file = formData.get('file')
  if (typeof signId !== 'string' || !signId) throw new Error('Missing sign id')
  if (!(file instanceof File) || file.size === 0) throw new Error('No file provided')

  const ext = ALLOWED_IMAGE_TYPES[file.type]
  if (!ext) throw new Error('Only jpg, png, or webp image files are allowed')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Image must be under 5MB')

  const admin = createAdminClient()
  const path = `${signId}/image.${ext}`
  const { error } = await admin.storage.from('sign-media').upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)

  const { data } = admin.storage.from('sign-media').getPublicUrl(path)
  await recordAuditLog({ action: 'admin_sign.upload_image', description: 'uploaded an image file for a sign' })
  return data.publicUrl
}

/** Removes every uploaded file under a sign's folder — called when the sign itself is deleted. */
export async function deleteAdminSignMediaAction(signId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: files } = await admin.storage.from('sign-media').list(signId)
  if (files && files.length > 0) {
    await admin.storage.from('sign-media').remove(files.map((f) => `${signId}/${f.name}`))
  }
}

/**
 * Removes any file under a sign's folder that isn't one of its current
 * video/image URLs — called after every save. Covers the cases upsert alone
 * doesn't: replacing an uploaded file with a different format (old extension
 * never gets overwritten) or switching from an upload to a pasted link
 * (the uploaded file has nothing left pointing at it at all).
 */
export async function pruneAdminSignMediaAction(signId: string, keepUrls: (string | null)[]) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: files } = await admin.storage.from('sign-media').list(signId)
  if (!files || files.length === 0) return

  const keepNames = new Set(
    keepUrls
      .filter((u): u is string => !!u)
      .map((u) => u.split(`/sign-media/${signId}/`).pop())
      .filter((name): name is string => !!name),
  )

  const toDelete = files.filter((f) => !keepNames.has(f.name)).map((f) => `${signId}/${f.name}`)
  if (toDelete.length > 0) {
    await admin.storage.from('sign-media').remove(toDelete)
  }
}
