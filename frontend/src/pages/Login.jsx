import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const Login = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await login(data);
      toast.success('Bienvenida de vuelta');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-6">
          <h1 className="font-mono text-xl text-neon-blue mb-1">&gt; entrar</h1>
          <p className="font-mono text-xs text-gray-600 mb-6">
            o postea sin cuenta si prefieres el anonimato
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register('email', { required: 'Email requerido' })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', { required: 'Password requerido' })}
            />

            <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">
              entrar
            </Button>
          </form>

          <p className="font-mono text-xs text-gray-600 text-center mt-4">
            ¿no tienes cuenta?{' '}
            <Link to="/register" className="text-neon-blue hover:underline">
              registrarse
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;