import { FiDownload, FiFile } from 'react-icons/fi';
import { Deliverable } from '../../types/deliverable';
import { formatFileSize } from '../../utils/imageCompression';

interface DeliverableFileListProps {
  deliverable: Deliverable;
  iconClassName?: string;
  itemClassName?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function DeliverableFileList({
  deliverable,
  iconClassName = 'text-purple-600',
  itemClassName = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
}: DeliverableFileListProps) {
  // Entregables antiguos sin registros en files: usar el archivo del propio entregable
  const files = deliverable.files?.length
    ? deliverable.files
    : [{
        id: deliverable.id,
        fileUrl: deliverable.fileUrl,
        fileName: deliverable.fileName,
        fileSize: deliverable.fileSize
      }];

  return (
    <ul className="space-y-2">
      {files.map(file => (
        <li
          key={file.id}
          className={`flex items-center gap-3 p-2 rounded-lg border ${itemClassName}`}
        >
          <FiFile className={`w-4 h-4 flex-shrink-0 ${iconClassName}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.fileName}>
              {file.fileName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.fileSize)}</p>
          </div>
          <a
            href={`${API_URL}${file.fileUrl}`}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Descargar"
          >
            <FiDownload className="w-4 h-4" />
          </a>
        </li>
      ))}
    </ul>
  );
}
