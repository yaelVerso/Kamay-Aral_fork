'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'

interface Props {
  id: string
  resendAction: (id: string) => Promise<void>
}

export default function ResendInviteButton({ id, resendAction }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleResend() {
    setLoading(true)
    try {
      await resendAction(id)
      toast.success('Invite email resent')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend invite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" className="gap-1.5" onClick={handleResend} disabled={loading}>
      <Mail className="h-4 w-4" />
      {loading ? 'Sending…' : 'Resend Invite'}
    </Button>
  )
}
