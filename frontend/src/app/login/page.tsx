import LoginForm from '@/components/LoginForm';

export const metadata = {
  title: 'Login - HEDIS.Ai',
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="w-full px-4">
        <LoginForm />
      </div>
    </div>
  );
}
