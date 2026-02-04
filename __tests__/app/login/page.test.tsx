import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/login/page'
import { createClient } from '@/lib/supabase/client'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

describe('Login Page', () => {
  const mockPush = jest.fn()
  const mockSignIn = jest.fn()
  const mockFrom = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(createClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
      from: mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    })
  })

  test('should render login form', () => {
    render(<LoginPage />)

    expect(screen.getByText('Dragica')).toBeInTheDocument()
    expect(screen.getByText('Prijavite se na vaš nalog')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Lozinka')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /prijavite se/i })).toBeInTheDocument()
  })

  test('should validate email is required', async () => {
    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /prijavite se/i })
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement

    // HTML5 validation will prevent submission
    expect(emailInput.required).toBe(true)
  })

  test('should validate password is required', async () => {
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText('Lozinka') as HTMLInputElement

    // HTML5 validation will prevent submission
    expect(passwordInput.required).toBe(true)
  })

  test('should show error for invalid credentials', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid credentials' },
    })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Lozinka')
    const submitButton = screen.getByRole('button', { name: /prijavite se/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Neispravna email adresa ili lozinka')).toBeInTheDocument()
    })
  })

  test('should disable form during submission', async () => {
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Lozinka')
    const submitButton = screen.getByRole('button', { name: /prijavite se/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Prijava...')).toBeInTheDocument()
    })
  })

  test('should redirect admin to /admin on successful login', async () => {
    const mockUser = { id: '123', email: 'admin@test.com' }

    mockSignIn.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })

    const mockSupabase = {
      auth: {
        signInWithPassword: mockSignIn,
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
            }),
          }),
        }),
      }),
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Lozinka')
    const submitButton = screen.getByRole('button', { name: /prijavite se/i })

    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })

  test('should redirect client to /dashboard on successful login', async () => {
    const mockUser = { id: '456', email: 'owner@test.com' }

    mockSignIn.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })

    const mockSupabase = {
      auth: {
        signInWithPassword: mockSignIn,
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'client' },
            }),
          }),
        }),
      }),
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Lozinka')
    const submitButton = screen.getByRole('button', { name: /prijavite se/i })

    fireEvent.change(emailInput, { target: { value: 'owner@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })
})
