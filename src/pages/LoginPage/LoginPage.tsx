import { LoginForm } from '@/components/LoginForm'

type LoginPageProps = {
  onSignIn: (email: string, password: string) => Promise<void>
}

export const LoginPage = ({ onSignIn }: LoginPageProps) => <LoginForm onSignIn={onSignIn} />
