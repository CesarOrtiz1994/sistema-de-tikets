import { useState, useEffect } from 'react';
import { FiMail, FiEdit2, FiEye, FiToggleLeft, FiToggleRight, FiCode } from 'react-icons/fi';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ModalButtons from '../components/common/ModalButtons';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { emailTemplatesService, EmailTemplate, UpdateEmailTemplateData } from '../services/emailTemplates.service';
import { toast } from 'sonner';

const templateLabels: Record<string, string> = {
  TICKET_CREATED: 'Ticket Creado',
  TICKET_ASSIGNED: 'Ticket Asignado',
  TICKET_STATUS_CHANGED: 'Estado Cambiado',
  TICKET_RESOLVED: 'Ticket Resuelto',
  TICKET_CLOSED: 'Ticket Cerrado',
  TICKET_REOPENED: 'Ticket Reabierto',
  SLA_WARNING: 'Advertencia SLA',
  SLA_EXCEEDED: 'SLA Excedido',
  TICKET_RATED: 'Ticket Calificado',
  NEW_MESSAGE: 'Nuevo Mensaje',
  DELIVERABLE_UPLOADED: 'Entregable Subido',
  DELIVERABLE_APPROVED: 'Entregable Aprobado',
  DELIVERABLE_REJECTED: 'Entregable Rechazado'
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<EmailTemplate | null>(null);

  // Form state
  const [editSubject, setEditSubject] = useState('');
  const [editHtmlBody, setEditHtmlBody] = useState('');
  const [editTextBody, setEditTextBody] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await emailTemplatesService.listTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error al cargar los templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditSubject(template.subject);
    setEditHtmlBody(template.htmlBody);
    setEditTextBody(template.textBody || '');
    setEditMode(true);
    setPreviewMode(false);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    try {
      setSaving(true);
      const data: UpdateEmailTemplateData = {
        subject: editSubject,
        htmlBody: editHtmlBody,
        textBody: editTextBody || undefined
      };

      await emailTemplatesService.updateTemplate(selectedTemplate.id, data);
      toast.success('Template actualizado exitosamente');
      setEditMode(false);
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar el template');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!confirmToggle) return;
    try {
      await emailTemplatesService.updateTemplate(confirmToggle.id, {
        isActive: !confirmToggle.isActive
      });
      toast.success(`Template ${confirmToggle.isActive ? 'desactivado' : 'activado'}`);
      loadTemplates();
    } catch (error: any) {
      console.error('Error toggling template:', error);
      toast.error('Error al cambiar estado del template');
    } finally {
      setConfirmToggle(null);
    }
  };

  const handlePreview = async (template: EmailTemplate) => {
    try {
      // Generar variables de ejemplo
      const exampleVars: Record<string, string> = {};
      const vars = template.variables as string[] | null;
      if (vars && Array.isArray(vars)) {
        vars.forEach(v => {
          const examples: Record<string, string> = {
            ticket_number: 'TI-2026-001',
            ticket_title: 'Ejemplo de ticket',
            department_name: 'Soporte TI',
            ticket_priority: 'Alta',
            requester_name: 'Juan Pérez',
            assigned_to: 'María García',
            ticket_url: '#',
            new_status: 'En Progreso',
            changed_by: 'Admin',
            resolver_name: 'María García',
            closer_name: 'Admin',
            reopener_name: 'Juan Pérez',
            reopen_reason: 'Necesita más trabajo',
            rating: '5',
            rating_comment: 'Excelente servicio',
            sla_deadline: '2026-02-10 15:00',
            time_remaining: '2 horas',
            sender_name: 'Juan Pérez',
            message_preview: 'Hola, necesito ayuda con...',
            year: new Date().getFullYear().toString()
          };
          exampleVars[v] = examples[v] || `[${v}]`;
        });
      }

      const preview = await emailTemplatesService.previewTemplate(template.id, exampleVars);
      setPreviewHtml(preview.htmlBody);
      setSelectedTemplate(template);
      setPreviewMode(true);
      setEditMode(false);
    } catch (error: any) {
      console.error('Error previewing template:', error);
      toast.error('Error al generar preview');
    }
  };

  const closeModal = () => {
    setSelectedTemplate(null);
    setEditMode(false);
    setPreviewMode(false);
    setPreviewHtml('');
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Email Templates"
          description="Gestiona las plantillas de correo electrónico del sistema"
        />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Email Templates"
        description="Gestiona las plantillas de correo electrónico del sistema"
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={FiMail}
          title="No hay templates"
          description="No se encontraron plantillas de email. Ejecuta el seed para crearlas."
        />
      ) : (
        <div className="grid gap-4">
          {templates.map(template => (
            <Card key={template.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <FiMail className="text-xl text-purple-600 dark:text-purple-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {template.name}
                      </h3>
                      <Badge variant={template.isActive ? 'success' : 'gray'}>
                        {template.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FiCode className="text-xs" />
                        {template.code}
                      </span>
                      <span className="hidden sm:inline">|</span>
                      <span className="hidden sm:inline truncate">
                        Asunto: {template.subject}
                      </span>
                    </div>

                    {template.variables && Array.isArray(template.variables) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(template.variables as string[]).slice(0, 5).map(v => (
                          <span
                            key={v}
                            className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded font-mono"
                          >
                            {`{{${v}}}`}
                          </span>
                        ))}
                        {(template.variables as string[]).length > 5 && (
                          <span className="text-[10px] px-1.5 py-0.5 text-gray-400">
                            +{(template.variables as string[]).length - 5} más
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handlePreview(template)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                    title="Preview"
                  >
                    <FiEye className="text-lg" />
                  </button>

                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition"
                    title="Editar"
                  >
                    <FiEdit2 className="text-lg" />
                  </button>

                  <button
                    onClick={() => setConfirmToggle(template)}
                    className={`p-2 rounded-lg transition ${
                      template.isActive
                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={template.isActive ? 'Desactivar' : 'Activar'}
                  >
                    {template.isActive ? (
                      <FiToggleRight className="text-lg" />
                    ) : (
                      <FiToggleLeft className="text-lg" />
                    )}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Edición */}
      {selectedTemplate && (
        <Modal
          isOpen={editMode}
          onClose={closeModal}
          size="xl"
          title="Editar Template"
          subtitle={`${templateLabels[selectedTemplate.code] || selectedTemplate.code} — ${selectedTemplate.code}`}
          footer={
            <>
              <button
                onClick={() => {
                  const vars: Record<string, string> = {};
                  const templateVars = selectedTemplate.variables as string[] | null;
                  if (templateVars && Array.isArray(templateVars)) {
                    templateVars.forEach(v => {
                      const examples: Record<string, string> = {
                        ticket_number: 'TI-2026-001',
                        ticket_title: 'Ejemplo de ticket',
                        department_name: 'Soporte TI',
                        ticket_priority: 'Alta',
                        requester_name: 'Juan Pérez',
                        assigned_to: 'María García',
                        ticket_url: '#',
                        new_status: 'En Progreso',
                        changed_by: 'Admin',
                        resolver_name: 'María García',
                        closer_name: 'Admin',
                        reopener_name: 'Juan Pérez',
                        reopen_reason: 'Necesita más trabajo',
                        rating: '5',
                        rating_comment: 'Excelente servicio',
                        sla_deadline: '2026-02-10 15:00',
                        time_remaining: '2 horas',
                        sender_name: 'Juan Pérez',
                        message_preview: 'Hola, necesito ayuda con...',
                        year: new Date().getFullYear().toString()
                      };
                      vars[v] = examples[v] || `[${v}]`;
                    });
                  }
                  let html = editHtmlBody;
                  for (const [key, value] of Object.entries(vars)) {
                    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
                  }
                  setPreviewHtml(html);
                  setPreviewMode(true);
                  setEditMode(false);
                }}
                className="px-4 py-2 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors flex items-center gap-2"
              >
                <FiEye /> Preview
              </button>
              <ModalButtons
                onCancel={closeModal}
                onConfirm={handleSave}
                confirmText="Guardar"
                loading={saving}
              />
            </>
          }
        >
          <div>
            {/* Variables disponibles */}
            {selectedTemplate.variables && Array.isArray(selectedTemplate.variables) && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">Variables disponibles:</p>
                <div className="flex flex-wrap gap-1">
                  {(selectedTemplate.variables as string[]).map(v => (
                    <button
                      key={v}
                      onClick={() => {
                        navigator.clipboard.writeText(`{{${v}}}`);
                        toast.success(`Copiado: {{${v}}}`);
                      }}
                      className="text-xs px-2 py-1 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 rounded font-mono border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition cursor-pointer"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Asunto
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={e => setEditSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* HTML Body */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Cuerpo HTML
                </label>
                <textarea
                  value={editHtmlBody}
                  onChange={e => setEditHtmlBody(e.target.value)}
                  rows={16}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Text Body */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Cuerpo Texto (opcional, fallback sin HTML)
                </label>
                <textarea
                  value={editTextBody}
                  onChange={e => setEditTextBody(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

          </div>
        </Modal>
      )}

      {/* Modal de Preview */}
      {selectedTemplate && (
        <Modal
          isOpen={previewMode}
          onClose={closeModal}
          size="xl"
          title={`Preview: ${templateLabels[selectedTemplate.code] || selectedTemplate.code}`}
          subtitle="Vista previa con datos de ejemplo"
          footer={
            <button
              onClick={() => {
                setPreviewMode(false);
                handleEdit(selectedTemplate);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition flex items-center gap-2"
            >
              <FiEdit2 /> Editar
            </button>
          }
        >
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white">
            <iframe
              srcDoc={previewHtml}
              className="w-full min-h-[500px] border-0"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </Modal>
      )}

      {/* Confirm Dialog para toggle activo/inactivo */}
      <ConfirmDialog
        isOpen={!!confirmToggle}
        title={confirmToggle?.isActive ? 'Desactivar Template' : 'Activar Template'}
        message={confirmToggle?.isActive
          ? `¿Estás seguro de desactivar el template "${confirmToggle?.name}"? Los correos de este tipo dejarán de enviarse.`
          : `¿Deseas activar el template "${confirmToggle?.name}"? Se reanudarán los envíos de este tipo de correo.`
        }
        confirmText={confirmToggle?.isActive ? 'Desactivar' : 'Activar'}
        type={confirmToggle?.isActive ? 'warning' : 'info'}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmToggle(null)}
      />
    </div>
  );
}
