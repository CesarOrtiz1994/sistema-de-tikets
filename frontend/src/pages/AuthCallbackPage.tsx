import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FiFileText, FiCheckCircle, FiClock, FiUser } from 'react-icons/fi';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens, loadUser } = useAuthStore();
  const [loadingStep, setLoadingStep] = useState(0);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Solo ejecutar una vez
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (error) {
        console.error('Authentication error:', error);
        navigate('/login?error=' + error);
        return;
      }

      if (accessToken && refreshToken) {
        setLoadingStep(1);
        setTokens(accessToken, refreshToken);
        
        setLoadingStep(2);
        await loadUser();
        
        setLoadingStep(3);
        navigate('/');
      } else {
        navigate('/login?error=no_tokens');
      }
    };

    handleCallback();
  }, []);

  const steps = [
    { icon: FiUser, text: 'Verificando identidad', color: 'from-blue-500 to-blue-600' },
    { icon: FiFileText, text: 'Cargando información', color: 'from-purple-500 to-purple-600' },
    { icon: FiCheckCircle, text: 'Preparando dashboard', color: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full mx-4">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          {/* Animated Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Rotating Circle */}
              <div className="absolute inset-0 animate-spin-slow">
                <div className="w-32 h-32 rounded-full border-4 border-transparent border-t-purple-500 border-r-blue-500"></div>
              </div>
              
              {/* Center Icon */}
              <div className="relative w-32 h-32 bg-brand-gradient rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <FiClock className="text-5xl text-white animate-bounce-slow" />
              </div>
              
              {/* Floating Particles */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-white text-center mb-3">
            Iniciando sesión...
          </h2>
          <p className="text-purple-200 text-center mb-8">
            Estamos preparando todo para ti
          </p>

          {/* Progress Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                  index <= loadingStep
                    ? 'bg-white/20 border-2 border-white/30 scale-100'
                    : 'bg-white/5 border-2 border-white/10 scale-95 opacity-50'
                }`}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                  index <= loadingStep ? 'animate-bounce-slow' : ''
                }`}>
                  {index < loadingStep ? (
                    <FiCheckCircle className="text-2xl text-white" />
                  ) : (
                    <step.icon className="text-2xl text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="text-white font-semibold">{step.text}</p>
                  {index === loadingStep && (
                    <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-progress"></div>
                    </div>
                  )}
                </div>

                {index < loadingStep && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Fun Message */}
          <div className="mt-8 text-center">
            <p className="text-purple-200 text-sm animate-pulse">
              ✨ Configurando tu experiencia personalizada...
            </p>
          </div>
        </div>

        {/* Bottom Decorative Elements */}
        <div className="mt-6 flex justify-center gap-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
