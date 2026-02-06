import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: salon, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !salon) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    return NextResponse.json({ salon })
  } catch (error) {
    console.error('Error in GET /api/admin/salons/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = createAdminClient()

    // Verify salon exists
    const { data: existingSalon, error: checkError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingSalon) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    // Prepare update object (only update provided fields)
    const updateData: any = {}

    if (body.name !== undefined) {
      updateData.name = body.name
    }

    if (body.email !== undefined) {
      updateData.email = body.email
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone
    }

    if (body.description !== undefined) {
      updateData.description = body.description || null
    }

    if (body.logo_url !== undefined) {
      updateData.logo_url = body.logo_url || null
    }

    if (body.accent_color !== undefined) {
      updateData.accent_color = body.accent_color || null
    }

    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active
    }

    if (body.admin_notes !== undefined) {
      updateData.admin_notes = body.admin_notes || null
    }

    // Update salon
    const { data: salon, error: updateError } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating salon:', updateError)
      return NextResponse.json(
        { error: 'Greška pri ažuriranju salona' },
        { status: 500 }
      )
    }

    return NextResponse.json({ salon })
  } catch (error) {
    console.error('Error in PUT /api/admin/salons/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Verify salon exists
    const { data: existingSalon, error: checkError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingSalon) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    // Note: Due to CASCADE DELETE in database schema, deleting the tenant will
    // automatically delete all related records (services, working_hours, bookings, etc.)

    // Get all users associated with this tenant
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .eq('tenant_id', id)

    // Delete auth users first (before deleting from users table due to FK constraints)
    if (users && users.length > 0) {
      for (const user of users) {
        try {
          // Delete from Supabase Auth
          await supabase.auth.admin.deleteUser(user.id)
          console.log(`Deleted auth user: ${user.email}`)
        } catch (authDeleteError) {
          console.error(`Failed to delete auth user ${user.email}:`, authDeleteError)
        }
      }
    }

    // Delete users from users table
    await supabase
      .from('users')
      .delete()
      .eq('tenant_id', id)

    // Delete salon (CASCADE will handle other related records)
    const { error: deleteError } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting salon:', deleteError)
      return NextResponse.json(
        { error: 'Greška pri brisanju salona' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/salons/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
