import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../context/AuthContext';

type LoginFormInputs = {
    username: string;
    password: string;
};

const validation = Yup.object().shape({
    username: Yup.string()
        .required("Username is required")
        .min(3, "Username must be at least 3 characters"),
    password: Yup.string()
        .required("Password is required")
        .min(3, "Password must be at least 6 characters"),
});

export default function Login() {
    const navigate = useNavigate();
    const { login, error, loading } = useAuth();
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginFormInputs>({ resolver: yupResolver(validation) });

    const handleLogin = async (formData: LoginFormInputs) => {
        try {
            console.log('Login form submitted with:', { username: formData.username }); // Debug log
            await login(formData.username, formData.password);
            console.log('Login successful, navigating to dashboard'); // Debug log
            toast.success('Login successful!');
            navigate('/mis/dashboard');
        } catch (err: any) {
            console.error('Login error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                headers: err.response?.headers
            }); // Debug log
            toast.error(err.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="login-container flex justify-center items-center h-screen bg-[#f5f7fa]">
            <div className="login-card py-10 px-8 md:w-sm w-2xs rounded-sm bg-white shadow-md">
                <h2 className="mb-4 text-2xl text-center text-(--primary-color)">
                    Management Information System
                </h2>
                
                <form onSubmit={handleSubmit(handleLogin)} className="login-form flex flex-col">
                    <div className="">
                        <div className="form-group my-4">
                            <Label htmlFor="username" className="my-2">
                                Username
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                className={errors.username ? "border-red-500" : ""}
                                {...register("username")}
                            />
                            {errors.username && (
                                <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                            )}
                        </div>
                        <div className="form-group my-4">
                            <Label htmlFor="password" className="my-2">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                className={errors.password ? "border-red-500" : ""}
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <Button 
                                type="submit" 
                                className="mt-4"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex justify-center items-center">
                                        <div className="flex space-x-2">
                                            <div className="h-2.5 w-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="h-2.5 w-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="h-2.5 w-2.5 bg-white rounded-full animate-bounce"></div>
                                        </div>
                                    </div>
                                ) : (
                                    "Login"
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
