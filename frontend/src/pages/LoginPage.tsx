import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FiFileText, FiCheckCircle, FiClock, FiTrendingUp, FiUser } from 'react-icons/fi';
import authService from '../services/auth.service';
import { useBranding } from '../contexts/BrandingContext';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const { branding, getLogoUrl } = useBranding();

  const getLoginBgStyle = (): React.CSSProperties => {
    if (branding.loginBgType === 'image' && branding.loginBgImageUrl) {
      return {
        backgroundImage: `url(${getLogoUrl(branding.loginBgImageUrl)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    if (branding.loginBgType === 'color') {
      return { backgroundColor: branding.loginBgValue };
    }
    // Default: gradient (uses Tailwind classes)
    return {};
  };

  const loginBgClass = branding.loginBgType === 'gradient'
    ? `min-h-screen bg-gradient-to-br ${branding.loginBgValue} relative overflow-hidden flex items-center justify-center p-4`
    : 'min-h-screen relative overflow-hidden flex items-center justify-center p-4';

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setLoadingStep(0);
    
    setTimeout(() => setLoadingStep(1), 500);
    setTimeout(() => setLoadingStep(2), 1500);
    
    setTimeout(() => {
      window.location.href = authService.getGoogleAuthUrl();
    }, 2500);
  };

  const steps = [
    { icon: FiUser, text: 'Conectando con Google', color: 'from-blue-500 to-blue-600' },
    { icon: FiFileText, text: 'Verificando permisos', color: 'from-purple-500 to-purple-600' },
    { icon: FiCheckCircle, text: 'Redirigiendo...', color: 'from-green-500 to-green-600' },
  ];

  return (
    <div className={loginBgClass} style={getLoginBgStyle()}>
      {/* Overlay para imágenes de fondo */}
      {branding.loginBgType === 'image' && (
        <div className="absolute inset-0 bg-black/50 z-0"></div>
      )}
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Tickets */}
        <div className="absolute top-20 left-10 animate-float">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500">
            <FiFileText className="text-4xl" style={{ color: `${branding.primaryColor}99` }} />
          </div>
        </div>
        
        <div className="absolute top-40 right-20 animate-float-delayed">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-2xl transform -rotate-12 hover:rotate-0 transition-transform duration-500">
            <FiCheckCircle className="text-4xl text-green-300" />
          </div>
        </div>
        
        <div className="absolute bottom-32 left-1/4 animate-float-slow">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-500">
            <FiClock className="text-4xl" style={{ color: `${branding.secondaryColor}99` }} />
          </div>
        </div>
        
        <div className="absolute bottom-20 right-1/3 animate-float">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-500">
            <FiTrendingUp className="text-4xl text-orange-300" />
          </div>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: `${branding.primaryColor}4D` }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow" style={{ backgroundColor: `${branding.secondaryColor}4D` }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Info */}
        <div className="text-center lg:text-left space-y-8">
          <div className="space-y-4">
            <div className="inline-block">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/90 text-sm font-medium">Sistema en línea</span>
              </div>
            </div>
            
            <h1 className="text-6xl lg:text-7xl font-black text-white mb-4 leading-tight">
              Sistema de Control de Tickets
              <span className="block bg-clip-text text-transparent animate-gradient" style={{ backgroundImage: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor}, ${branding.primaryColor})`, backgroundSize: '200% 200%' }}>
                SCOT
              </span>
            </h1>
            
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-xs text-gray-300">Uptime</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-xs text-gray-300">Soporte</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-3xl font-bold text-white mb-1">100%</div>
              <div className="text-xs text-gray-300">Seguro</div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-3xl blur-2xl opacity-20 animate-pulse-slow" style={{ background: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }}></div>
          
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-12 border border-white/20">
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xl rounded-3xl z-50 flex items-center justify-center">
                <div className="w-full max-w-md px-6">
                  {/* Animated Icon */}
                  <div className="flex justify-center mb-8">
                    <div className="relative">
                      {/* Rotating Circle */}
                      <div className="absolute inset-0 animate-spin-slow">
                        <div className="w-24 h-24 rounded-full border-4 border-transparent" style={{ borderTopColor: branding.primaryColor, borderRightColor: branding.secondaryColor }}></div>
                      </div>
                      
                      {/* Center Icon */}
                      <div className="relative w-24 h-24 bg-brand-gradient rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                        <FiClock className="text-4xl text-white animate-bounce-slow" />
                      </div>
                      
                      {/* Floating Particles */}
                      <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: branding.primaryColor }}></div>
                      <div className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: branding.secondaryColor, animationDelay: '0.5s' }}></div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
                    Iniciando sesión...
                  </h3>

                  {/* Progress Steps */}
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                          index <= loadingStep
                            ? 'border-2 scale-100'
                            : 'bg-gray-50 border-2 border-gray-200 scale-95 opacity-50'
                        }`}
                        style={index <= loadingStep ? { backgroundColor: `${branding.primaryColor}15`, borderColor: `${branding.primaryColor}40` } : undefined}
                      >
                        <div className={`w-10 h-10 bg-brand-gradient rounded-lg flex items-center justify-center flex-shrink-0 shadow-md ${
                          index <= loadingStep ? 'animate-bounce-slow' : ''
                        }`}>
                          {index < loadingStep ? (
                            <FiCheckCircle className="text-xl text-white" />
                          ) : (
                            <step.icon className="text-xl text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <p className="text-gray-900 font-semibold text-sm">{step.text}</p>
                          {index === loadingStep && (
                            <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-gradient rounded-full animate-progress"></div>
                            </div>
                          )}
                        </div>

                        {index < loadingStep && (
                          <div className="flex-shrink-0">
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Fun Message */}
                  <div className="mt-6 text-center">
                    <p className="text-sm animate-pulse" style={{ color: branding.primaryColor }}>
                      ✨ Preparando tu acceso seguro...
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="text-center mb-8">
              {branding.logoUrl ? (
                <img
                  src={getLogoUrl(branding.logoUrl) || ''}
                  alt={branding.appName}
                  className="h-20 mx-auto mb-6 object-contain"
                />
              ) : (
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg transform hover:rotate-12 transition-transform duration-300" style={{ background: `linear-gradient(to bottom right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
                  <FiFileText className="text-4xl text-white" />
                </div>
              )}
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bienvenido de vuelta
              </h2>
              <p className="text-gray-600">
                Inicia sesión para acceder a tu panel de control
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="group w-full relative overflow-hidden bg-white border-2 border-gray-200 text-gray-700 font-semibold py-5 px-6 rounded-2xl transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
              style={{ '--hover-border': branding.primaryColor } as any}
              onMouseEnter={e => (e.currentTarget.style.borderColor = branding.primaryColor)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{ background: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }}></div>
              <div className="relative flex items-center justify-center gap-3">
                <FcGoogle className="text-3xl" />
                <span className="text-lg">Continuar con Google</span>
              </div>
            </button>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Conexión segura con OAuth 2.0</span>
              </div>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: `${branding.primaryColor}10` }}>
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-xs font-medium text-gray-700">Acceso Rápido</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: `${branding.secondaryColor}10` }}>
                <div className="text-2xl mb-1">🔒</div>
                <div className="text-xs font-medium text-gray-700">100% Seguro</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(12deg); }
          50% { transform: translateY(-20px) rotate(12deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(-12deg); }
          50% { transform: translateY(-30px) rotate(-12deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(6deg); }
          50% { transform: translateY(-15px) rotate(6deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
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
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
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
      `}</style>
    </div>
  );
}
