import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole, getEffectiveTenantId } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserWithRole()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await getEffectiveTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant access' }, { status: 403 })
    }
    const supabase = createAdminClient()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo' or 'banner'

    if (!file) {
      return NextResponse.json({ error: 'Fajl je obavezan' }, { status: 400 })
    }

    if (!['logo', 'banner'].includes(type)) {
      return NextResponse.json({ error: 'Neispravan tip fajla' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Dozvoljeni formati: JPG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Maksimalna veličina fajla je 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const fileName = `${tenantId}/${type}-${Date.now()}.${ext}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('salon-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Greška pri uploadovanju fajla' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('salon-assets')
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    // Update tenant record
    const updateField = type === 'logo' ? 'logo_url' : 'banner_url'
    const { error: updateError } = await supabase
      .from('tenants')
      .update({ [updateField]: publicUrl })
      .eq('id', tenantId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Greška pri ažuriranju salona' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Error in POST /api/dashboard/upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
