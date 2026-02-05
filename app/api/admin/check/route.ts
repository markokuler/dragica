import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAdmin()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      email: user.email
    })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
