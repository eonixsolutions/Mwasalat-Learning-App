import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { authService } from '../../services/auth.service.js';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: ({ email }) => authService.forgotPassword(email),
    onSuccess: () => setSent(true),
    onError: (err) => toast.error(err.response?.data?.message || 'Something went wrong'),
  });

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Email sent</h3>
        <p className="text-gray-500 text-sm">
          If that email exists, you'll receive a password reset link shortly.
        </p>
        <Link to="/login" className="inline-block mt-6 text-sm text-primary-600 font-medium hover:text-primary-700">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h2>
      <p className="text-gray-500 text-sm mb-6">We'll send you a reset link</p>

      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <Button type="submit" loading={isPending} className="w-full">
          Send Reset Link
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Back to login
        </Link>
      </p>
    </div>
  );
}
