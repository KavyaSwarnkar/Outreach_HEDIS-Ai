import SignupForm from '@/components/SignupForm';

export const metadata = {
  title: 'Sign Up - HEDIS.Ai',
};

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="w-full px-4">
        <SignupForm />
      </div>
    </div>
  );
}
