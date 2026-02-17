import { useState, useEffect, useRef } from 'react';
import { FiSave, FiUpload, FiImage, FiDroplet, FiType, FiMonitor, FiTrash2, FiSidebar } from 'react-icons/fi';
import { useBranding } from '../contexts/BrandingContext';
import { usePageTitle } from '../hooks/usePageTitle';
import brandingService, { BrandingConfig } from '../services/branding.service';
import { compressImage } from '../utils/imageCompression';
import { toast } from 'sonner';

export default function BrandingPage() {
  usePageTitle('Personalización');
  const { branding, refreshBranding, getLogoUrl } = useBranding();
  const [form, setForm] = useState<Partial<BrandingConfig>>({});
  const [saving, setSaving] = useState(false);
  const [_uploading, setUploading] = useState(false);

  const logoRef = useRef<HTMLInputElement>(null);
  const logoSmallRef = useRef<HTMLInputElement>(null);
  const loginBgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
      appName: branding.appName,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      sidebarBgColor: branding.sidebarBgColor,
      sidebarTextColor: branding.sidebarTextColor,
      loginBgType: branding.loginBgType,
      loginBgValue: branding.loginBgValue,
      logoUrl: branding.logoUrl,
      logoSmallUrl: branding.logoSmallUrl,
      loginBgImageUrl: branding.loginBgImageUrl,
    });
  }, [branding]);

  const handleUpload = async (field: 'logo' | 'logoSmall' | 'loginBgImage', file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 400, quality: 0.85 });
      const formData = new FormData();
      formData.append(field, compressed);

      const result = await brandingService.uploadLogo(formData);

      if (field === 'logo' && result.logoUrl) {
        setForm(prev => ({ ...prev, logoUrl: result.logoUrl }));
      } else if (field === 'logoSmall' && result.logoSmallUrl) {
        setForm(prev => ({ ...prev, logoSmallUrl: result.logoSmallUrl }));
      } else if (field === 'loginBgImage' && result.loginBgImageUrl) {
        setForm(prev => ({ ...prev, loginBgImageUrl: result.loginBgImageUrl }));
      }

      toast.success('Imagen subida correctamente');
    } catch (err) {
      toast.error('Error al subir la imagen');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('[BrandingPage] Saving form data:', JSON.stringify(form, null, 2));
      const result = await brandingService.updateBranding(form);
      console.log('[BrandingPage] Save result:', JSON.stringify(result, null, 2));
      await refreshBranding();
      toast.success('Branding actualizado correctamente');
    } catch (err: any) {
      console.error('[BrandingPage] Save error:', err?.response?.data || err?.message || err);
      toast.error('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Personalización</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configura la apariencia del sistema</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          style={{ background: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }}
        >
          <FiSave className="text-lg" />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Nombre de la app */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${branding.primaryColor}20` }}>
            <FiType className="text-xl" style={{ color: branding.primaryColor }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nombre de la aplicación</h2>
            <p className="text-sm text-gray-500">Se muestra en el sidebar y navbar</p>
          </div>
        </div>
        <input
          type="text"
          value={form.appName || ''}
          onChange={e => setForm(prev => ({ ...prev, appName: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:outline-none"
          style={{ focusRingColor: branding.primaryColor } as any}
          placeholder="Nombre de la app"
        />
      </div>

      {/* Logos */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${branding.primaryColor}20` }}>
            <FiImage className="text-xl" style={{ color: branding.primaryColor }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Logos</h2>
            <p className="text-sm text-gray-500">Logo principal (sidebar) y logo pequeño (navbar)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo principal */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo principal (Sidebar)</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
              {form.logoUrl ? (
                <div className="space-y-3">
                  <img
                    src={getLogoUrl(form.logoUrl) || ''}
                    alt="Logo"
                    className="h-16 mx-auto object-contain"
                  />
                  <button
                    onClick={() => setForm(prev => ({ ...prev, logoUrl: null }))}
                    className="text-red-500 text-sm flex items-center gap-1 mx-auto hover:text-red-700"
                  >
                    <FiTrash2 /> Eliminar
                  </button>
                </div>
              ) : (
                <div
                  className="cursor-pointer"
                  onClick={() => logoRef.current?.click()}
                >
                  <FiUpload className="text-3xl text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click para subir logo</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP (max 5MB)</p>
                </div>
              )}
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleUpload('logo', e.target.files[0])}
            />
          </div>

          {/* Logo pequeño */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo pequeño (Navbar)</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
              {form.logoSmallUrl ? (
                <div className="space-y-3">
                  <img
                    src={getLogoUrl(form.logoSmallUrl) || ''}
                    alt="Logo pequeño"
                    className="h-16 mx-auto object-contain"
                  />
                  <button
                    onClick={() => setForm(prev => ({ ...prev, logoSmallUrl: null }))}
                    className="text-red-500 text-sm flex items-center gap-1 mx-auto hover:text-red-700"
                  >
                    <FiTrash2 /> Eliminar
                  </button>
                </div>
              ) : (
                <div
                  className="cursor-pointer"
                  onClick={() => logoSmallRef.current?.click()}
                >
                  <FiUpload className="text-3xl text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click para subir logo</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP (max 5MB)</p>
                </div>
              )}
            </div>
            <input
              ref={logoSmallRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleUpload('logoSmall', e.target.files[0])}
            />
          </div>
        </div>
      </div>

      {/* Colores */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${branding.primaryColor}20` }}>
            <FiDroplet className="text-xl" style={{ color: branding.primaryColor }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Colores</h2>
            <p className="text-sm text-gray-500">Colores primario y secundario del sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color primario</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primaryColor || '#9333ea'}
                onChange={e => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-12 h-12 rounded-xl cursor-pointer border-0"
              />
              <input
                type="text"
                value={form.primaryColor || ''}
                onChange={e => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="#9333ea"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color secundario</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.secondaryColor || '#2563eb'}
                onChange={e => setForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                className="w-12 h-12 rounded-xl cursor-pointer border-0"
              />
              <input
                type="text"
                value={form.secondaryColor || ''}
                onChange={e => setForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="#2563eb"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-500 mb-3">Vista previa</p>
          <div className="flex items-center gap-4">
            <button
              className="px-6 py-2.5 text-white rounded-xl shadow-lg"
              style={{ background: `linear-gradient(to right, ${form.primaryColor}, ${form.secondaryColor})` }}
            >
              Botón primario
            </button>
            <div
              className="h-10 w-10 rounded-xl"
              style={{ background: form.primaryColor }}
            />
            <div
              className="h-10 w-10 rounded-xl"
              style={{ background: form.secondaryColor }}
            />
            <span
              className="font-bold text-lg bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, ${form.primaryColor}, ${form.secondaryColor})` }}
            >
              {form.appName || 'SCOT'}
            </span>
          </div>
        </div>
      </div>

      {/* Color de fondo del Sidebar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${branding.primaryColor}20` }}>
            <FiSidebar className="text-xl" style={{ color: branding.primaryColor }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fondo del Sidebar</h2>
            <p className="text-sm text-gray-500">Color de fondo del menú lateral (solo tema claro)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.sidebarBgColor || '#ffffff'}
            onChange={e => setForm(prev => ({ ...prev, sidebarBgColor: e.target.value }))}
            className="w-12 h-12 rounded-xl cursor-pointer border-0"
          />
          <input
            type="text"
            value={form.sidebarBgColor || ''}
            onChange={e => setForm(prev => ({ ...prev, sidebarBgColor: e.target.value }))}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="#ffffff"
          />
        </div>

        <div className="space-y-3 mt-6">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color de texto (no seleccionado)</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.sidebarTextColor || '#4b5563'}
              onChange={e => setForm(prev => ({ ...prev, sidebarTextColor: e.target.value }))}
              className="w-12 h-12 rounded-xl cursor-pointer border-0"
            />
            <input
              type="text"
              value={form.sidebarTextColor || ''}
              onChange={e => setForm(prev => ({ ...prev, sidebarTextColor: e.target.value }))}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="#4b5563"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-500 mb-3">Vista previa</p>
          <div
            className="w-48 rounded-lg p-3 space-y-2 shadow-sm border border-gray-200"
            style={{ backgroundColor: form.sidebarBgColor || '#ffffff' }}
          >
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-white text-xs font-medium" style={{ background: `linear-gradient(to right, ${form.primaryColor}, ${form.secondaryColor})` }}>
              <span>Dashboard</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium" style={{ color: form.sidebarTextColor || '#4b5563' }}>
              <span>Tickets</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium" style={{ color: form.sidebarTextColor || '#4b5563' }}>
              <span>Usuarios</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fondo del Login */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${branding.primaryColor}20` }}>
            <FiMonitor className="text-xl" style={{ color: branding.primaryColor }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fondo del Login</h2>
            <p className="text-sm text-gray-500">Personaliza el fondo de la página de inicio de sesión</p>
          </div>
        </div>

        {/* Tipo de fondo */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { value: 'gradient', label: 'Gradiente', icon: '🎨' },
            { value: 'color', label: 'Color sólido', icon: '🟣' },
            { value: 'image', label: 'Imagen', icon: '🖼️' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setForm(prev => ({ ...prev, loginBgType: opt.value as any }))}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                form.loginBgType === opt.value
                  ? 'border-current shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
              style={form.loginBgType === opt.value ? { borderColor: branding.primaryColor, color: branding.primaryColor } : undefined}
            >
              <span className="text-2xl block mb-1">{opt.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Configuración según tipo */}
        {form.loginBgType === 'gradient' && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Clases de Tailwind para el gradiente</label>
            <input
              type="text"
              value={form.loginBgValue || ''}
              onChange={e => setForm(prev => ({ ...prev, loginBgValue: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="from-slate-900 via-purple-900 to-slate-900"
            />
            <p className="text-xs text-gray-400">Ejemplo: from-slate-900 via-purple-900 to-slate-900</p>
          </div>
        )}

        {form.loginBgType === 'color' && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color de fondo</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.loginBgValue || '#1e1b4b'}
                onChange={e => setForm(prev => ({ ...prev, loginBgValue: e.target.value }))}
                className="w-12 h-12 rounded-xl cursor-pointer border-0"
              />
              <input
                type="text"
                value={form.loginBgValue || ''}
                onChange={e => setForm(prev => ({ ...prev, loginBgValue: e.target.value }))}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="#1e1b4b"
              />
            </div>
          </div>
        )}

        {form.loginBgType === 'image' && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Imagen de fondo</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
              {form.loginBgImageUrl ? (
                <div className="space-y-3">
                  <img
                    src={getLogoUrl(form.loginBgImageUrl) || ''}
                    alt="Fondo login"
                    className="h-32 mx-auto object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setForm(prev => ({ ...prev, loginBgImageUrl: null }))}
                    className="text-red-500 text-sm flex items-center gap-1 mx-auto hover:text-red-700"
                  >
                    <FiTrash2 /> Eliminar
                  </button>
                </div>
              ) : (
                <div
                  className="cursor-pointer"
                  onClick={() => loginBgRef.current?.click()}
                >
                  <FiUpload className="text-3xl text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click para subir imagen de fondo</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP (max 5MB)</p>
                </div>
              )}
            </div>
            <input
              ref={loginBgRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleUpload('loginBgImage', e.target.files[0])}
            />
          </div>
        )}
      </div>
    </div>
  );
}
