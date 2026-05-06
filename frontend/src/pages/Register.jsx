import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const Register = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
      toast.success('Cuenta creada');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrarse');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-6">
          <h1 className="font-mono text-xl text-neon-blue mb-1">&gt; registrarse</h1>
          <p className="font-mono text-xs text-gray-600 mb-6">
            crea una identidad persistente. o no.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Username"
              placeholder="anon_user"
              error={errors.username?.message}
              {...register('username', { required: 'Username requerido', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
            />
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
              {...register('password', { required: 'Password requerido', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
            />

            <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">
              crear cuenta
            </Button>
          </form>

          <p className="font-mono text-xs text-gray-600 text-center mt-4">
            ¿ya tienes cuenta?{' '}
            <Link to="/login" className="text-neon-blue hover:underline">
              entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;