import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('deve renderizar o texto corretamente', () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByText('Clique aqui')).toBeInTheDocument();
  });

  it('deve chamar a função onClick quando clicado', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Ação</Button>);
    
    // In React Aria, often standard click triggers onPress
    fireEvent.click(screen.getByText('Ação'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
