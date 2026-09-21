'use client'

import { useState } from 'react'
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
import { Video, Trash2, Plus } from 'lucide-react'
import { recordAuditLog } from '@/app/actions/audit'
import { parseVideoUrl } from '@/lib/videoEmbed'

interface Variation {
  id: string
  video_url: string
  label: string | null
}

interface Props {
  signId: string
  signLabel: string
  nextOrder: number
  variations: Variation[]
}

/**
 * Manages extra video variations for an admin sign (e.g. a different signer
 * or regional variant) — the sign's own video_url stays the primary/default,
 * untouched by anything here. Mirrors SignVideoVariationsDialog (teacher).
 */
export default function AdminSignVideoVariationsDialog({ signId, signLabel, nextOrder, variations }: Props) {
  const [open, setOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const parsedVideo = videoUrl.trim() ? parseVideoUrl(videoUrl) : null

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!videoUrl.trim()) return
    if (!parseVideoUrl(videoUrl).embedUrl) {
      toast.error('Video link must be a YouTube link')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('admin_sign_videos').insert({
        sign_id: signId,
        video_url: videoUrl.trim(),
        label: label.trim() || null,
        order: nextOrder,
      })
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'admin_sign.add_variation', description: `added a video variation for "${signLabel}"` })
      setVideoUrl('')
      setLabel('')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add variation')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(variationId: string) {
    setDeletingId(variationId)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('admin_sign_videos').delete().eq('id', variationId)
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'admin_sign.remove_variation', description: `removed a video variation from "${signLabel}"` })
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove variation')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon-xs" onClick={() => setOpen(true)} aria-label="Manage video variations">
        <Video className="h-3.5 w-3.5" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Video Variations — {signLabel}</DialogTitle>
          <DialogDescription>
            Extra videos students can switch to in Learn mode (e.g. a different signer). The sign&apos;s main video is unaffected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {variations.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{v.label ?? 'Variation'}</p>
                <p className="text-xs text-muted-foreground truncate">{v.video_url}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDelete(v.id)}
                disabled={deletingId === v.id}
                aria-label="Remove variation"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
          {variations.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">No extra variations yet.</p>
          )}
        </div>

        <form onSubmit={handleAdd} className="space-y-3 border-t pt-3">
          <div className="space-y-1">
            <Label htmlFor="admin-variation-label">Label</Label>
            <Input id="admin-variation-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Signer 2, Region: Cebu" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="admin-variation-video">Video link (YouTube)</Label>
            <Input id="admin-variation-video" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." required />
            {videoUrl.trim() && (
              <p className={`text-xs ${parsedVideo?.embedUrl ? 'text-emerald-600' : 'text-amber-600'}`}>
                {parsedVideo?.embedUrl ? 'Recognized as YouTube link' : '⚠ Not a recognized YouTube link'}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving || !videoUrl.trim()} className="gap-1.5 bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
              <Plus className="h-4 w-4" />
              {saving ? 'Adding…' : 'Add Variation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
