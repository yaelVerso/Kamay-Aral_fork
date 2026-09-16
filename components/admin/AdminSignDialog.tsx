'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Pencil, Upload } from 'lucide-react'
import { recordAuditLog } from '@/app/actions/audit'
import { uploadAdminSignVideoAction, uploadAdminSignImageAction, pruneAdminSignMediaAction } from '@/app/actions/adminContent'
import { parseVideoUrl } from '@/lib/videoEmbed'
import { cn } from '@/lib/utils'

interface EditingSign {
  id: string
  label: string
  label_fil: string | null
  description: string | null
  video_url: string
  image_url: string | null
  accepted_answers: string[]
}

interface Props {
  submoduleId: string
  nextOrder: number
  editingSign?: EditingSign
}

type MediaMode = 'link' | 'upload'

function ModeToggle({ mode, onChange }: { mode: MediaMode; onChange: (m: MediaMode) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border p-0.5 w-fit">
      {(['link', 'upload'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            mode === m ? 'bg-[var(--brand-secondary)] text-white' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {m === 'link' ? 'Paste link' : 'Upload file'}
        </button>
      ))}
    </div>
  )
}

export default function AdminSignDialog({ submoduleId, nextOrder, editingSign }: Props) {
  const isEdit = !!editingSign
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState(editingSign?.label ?? '')
  const [labelFil, setLabelFil] = useState(editingSign?.label_fil ?? '')
  const [description, setDescription] = useState(editingSign?.description ?? '')
  const [videoUrl, setVideoUrl] = useState(editingSign?.video_url ?? '')
  const [imageUrl, setImageUrl] = useState(editingSign?.image_url ?? '')
  const [acceptedAnswers, setAcceptedAnswers] = useState(editingSign?.accepted_answers?.join(', ') ?? '')
  const [videoMode, setVideoMode] = useState<MediaMode>('link')
  const [imageMode, setImageMode] = useState<MediaMode>('link')
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // A new sign's id doesn't exist until insert, but uploads need somewhere
  // to live before that — generated once up front and used consistently for
  // both the upload path and the eventual insert's explicit id.
  const pendingSignIdRef = useRef(editingSign?.id ?? crypto.randomUUID())

  const parsedVideo = videoMode === 'link' && videoUrl.trim() ? parseVideoUrl(videoUrl) : null

  function resetForm() {
    setLabel(editingSign?.label ?? '')
    setLabelFil(editingSign?.label_fil ?? '')
    setDescription(editingSign?.description ?? '')
    setVideoUrl(editingSign?.video_url ?? '')
    setImageUrl(editingSign?.image_url ?? '')
    setAcceptedAnswers(editingSign?.accepted_answers?.join(', ') ?? '')
    // An existing sign's video/image might have come from an upload rather
    // than a pasted link — default to whichever mode matches what's already
    // there, so re-saving without changes doesn't trip the "must be a
    // YouTube link" validation for a sign that was never a link to begin with.
    setVideoMode(editingSign && !parseVideoUrl(editingSign.video_url).embedUrl ? 'upload' : 'link')
    setImageMode('link')
    if (!editingSign) pendingSignIdRef.current = crypto.randomUUID()
  }

  async function handleVideoFile(file: File) {
    setUploadingVideo(true)
    try {
      const formData = new FormData()
      formData.set('signId', pendingSignIdRef.current)
      formData.set('file', file)
      const url = await uploadAdminSignVideoAction(formData)
      setVideoUrl(url)
      toast.success('Video uploaded')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload video')
    } finally {
      setUploadingVideo(false)
    }
  }

  async function handleImageFile(file: File) {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.set('signId', pendingSignIdRef.current)
      formData.set('file', file)
      const url = await uploadAdminSignImageAction(formData)
      setImageUrl(url)
      toast.success('Image uploaded')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !videoUrl.trim()) return
    if (videoMode === 'link' && !parseVideoUrl(videoUrl).embedUrl) {
      toast.error('Video link must be a YouTube link')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const answers = acceptedAnswers.split(',').map((a) => a.trim()).filter(Boolean)
      const payload = {
        label: label.trim(),
        label_fil: labelFil.trim() || null,
        description: description.trim() || null,
        video_url: videoUrl.trim(),
        image_url: imageUrl.trim() || null,
        accepted_answers: answers.length > 0 ? answers : [label.trim()],
      }

      if (isEdit) {
        const { error } = await supabase.from('admin_signs').update(payload).eq('id', editingSign.id)
        if (error) throw new Error(error.message)
        await recordAuditLog({ action: 'admin_sign.update', description: `updated sign "${payload.label}"` })
        toast.success('Sign updated')
      } else {
        const { error } = await supabase.from('admin_signs').insert({
          ...payload,
          id: pendingSignIdRef.current,
          submodule_id: submoduleId,
          order: nextOrder,
        })
        if (error) throw new Error(error.message)
        await recordAuditLog({ action: 'admin_sign.create', description: `added sign "${payload.label}"` })
        toast.success(`Sign "${payload.label}" added`)
      }

      // best-effort — cleans up anything left over from a since-abandoned
      // format/link switch (e.g. uploaded .mp4, then replaced with .webm,
      // or uploaded a file then switched back to a pasted YouTube link)
      const signId = isEdit ? editingSign.id : pendingSignIdRef.current
      await pruneAdminSignMediaAction(signId, [payload.video_url, payload.image_url]).catch(() => {})

      if (!isEdit) {
        setLabel('')
        setLabelFil('')
        setDescription('')
        setVideoUrl('')
        setImageUrl('')
        setAcceptedAnswers('')
        pendingSignIdRef.current = crypto.randomUUID()
      }
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save sign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) resetForm() }}>
      {isEdit ? (
        <Button variant="ghost" size="icon-xs" onClick={() => setOpen(true)} aria-label="Edit sign">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)} className="gap-1.5 bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
          <Plus className="h-4 w-4" />
          Add Sign
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Sign' : 'Add Sign'}</DialogTitle>
          <DialogDescription>
            Paste a YouTube link or upload a video file. This content is visible to every student, school-wide.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="admin-sign-label">Sign name</Label>
              <Input id="admin-sign-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Apple" required />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="admin-sign-label-fil">Filipino translation</Label>
              <Input id="admin-sign-label-fil" value={labelFil} onChange={(e) => setLabelFil(e.target.value)} placeholder="e.g. Mansanas" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="admin-sign-description">Description</Label>
            <textarea
              id="admin-sign-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this sign"
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Video</Label>
              <ModeToggle mode={videoMode} onChange={setVideoMode} />
            </div>
            {videoMode === 'link' ? (
              <>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." required />
                {videoUrl.trim() && (
                  <p className={`text-xs ${parsedVideo?.embedUrl ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {parsedVideo?.embedUrl ? 'Recognized as YouTube link' : '⚠ Not a recognized YouTube link'}
                  </p>
                )}
              </>
            ) : (
              <>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  disabled={uploadingVideo}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoFile(f) }}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
                />
                <p className="text-xs text-muted-foreground">mp4 or webm, up to 50MB.</p>
                {uploadingVideo && <p className="text-xs text-muted-foreground">Uploading…</p>}
                {!uploadingVideo && videoUrl.trim() && videoMode === 'upload' && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1"><Upload className="h-3 w-3" /> Video uploaded</p>
                )}
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Image (optional)</Label>
              <ModeToggle mode={imageMode} onChange={setImageMode} />
            </div>
            {imageMode === 'link' ? (
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            ) : (
              <>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingImage}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
                />
                <p className="text-xs text-muted-foreground">jpg, png, or webp, up to 5MB.</p>
                {uploadingImage && <p className="text-xs text-muted-foreground">Uploading…</p>}
                {!uploadingImage && imageUrl.trim() && imageMode === 'upload' && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1"><Upload className="h-3 w-3" /> Image uploaded</p>
                )}
              </>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="admin-sign-answers">Accepted spelling answers</Label>
            <Input
              id="admin-sign-answers"
              value={acceptedAnswers}
              onChange={(e) => setAcceptedAnswers(e.target.value)}
              placeholder="e.g. apple, mansanas (comma-separated)"
            />
            <p className="text-xs text-muted-foreground">Used for the Spelling activity. Leave blank to just use the sign name.</p>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading || uploadingVideo || uploadingImage || !label.trim() || !videoUrl.trim()}
              className="bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]"
            >
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Sign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
