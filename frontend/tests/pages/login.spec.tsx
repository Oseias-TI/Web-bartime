import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';

// Mock do useRouter do Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock do AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn().mockResolvedValue(true),
  }),
}));

describe('Login Page', () => {
  it('deve renderizar o título BarberFlow', () => {
    render(<LoginPage />);
    expect(screen.getByText('BarberFlow')).toBeInTheDocument();
  });

  it('deve mostrar erros de validação se submetido em branco', async () => {
    render(<LoginPage />);
    
    // Clica no botão de submit
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));
    
    // Zod validator should show validation messages
    await waitFor(() => {
      expect(screen.getByText(/inválido/i)).toBeInTheDocument();
      expect(screen.getByText(/mínimo 6 caracteres/i)).toBeInTheDocument();
    });
  });
});

