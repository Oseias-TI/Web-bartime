import type { Config } from 'jest'
import nextJest from 'next/jest.js'
 
const createJestConfig = nextJest({
  // Define o diretório base da aplicação Next.js para carregar o next.config.js e .env em testes
  dir: './',
})
 
// Adicione configurações personalizadas para o Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Executado antes de cada teste para configurar coisas como o @testing-library/jest-dom
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Alias de módulos para o Jest entender (mesmo do tsconfig.json)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
 
// createJestConfig é exportado desta forma para garantir que o Next.js possa carregar configurações assíncronas
export default createJestConfig(config)
