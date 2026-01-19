import { useState } from 'react';
import { 
  validateNoXSS, 
  validateNoSQLInjection, 
  validateSecureString,
  validateForm,
  userSchema,
  departmentSchema
} from '../utils/validationSchemas';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';

interface TestResult {
  input: string;
  xss: boolean;
  sql: boolean;
  secure: boolean;
}

export default function SecurityTestPage() {
  const [testInput, setTestInput] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);

  // Casos de prueba predefinidos
  const testCases = [
    { label: '✅ Texto Normal', value: 'Juan Pérez García' },
    { label: '❌ XSS Script', value: '<script>alert("XSS")</script>' },
    { label: '❌ SQL Injection', value: '\' OR \'1\'=\'1' },
    { label: '❌ Event Handler', value: '<img src=x onerror=alert(1)>' },
    { label: '❌ SQL DROP', value: 'DROP TABLE users; --' },
    { label: '❌ JavaScript URL', value: 'javascript:alert(1)' },
    { label: '❌ PHP Tag', value: '<?php echo "hack"; ?>' },
    { label: '❌ SQL UNION', value: '1 UNION SELECT * FROM users' },
  ];

  const runTest = (input: string) => {
    const result: TestResult = {
      input,
      xss: validateNoXSS(input),
      sql: validateNoSQLInjection(input),
      secure: validateSecureString(input)
    };
    setResults([result, ...results]);
  };

  const testUserSchema = () => {
    const testData = {
      name: testInput,
      email: 'test@ejemplo.com',
      roleType: 'REQUESTER' as const
    };
    
    const result = validateForm(userSchema, testData);
    
    if (result.success) {
      alert('✅ Validación exitosa: Los datos son seguros');
    } else {
      alert(`❌ Validación fallida:\n${JSON.stringify(result.errors, null, 2)}`);
    }
  };

  const testDepartmentSchema = () => {
    const testData = {
      name: testInput,
      prefix: 'TEST',
      description: 'Prueba de seguridad'
    };
    
    const result = validateForm(departmentSchema, testData);
    
    if (result.success) {
      alert('✅ Validación exitosa: Los datos son seguros');
    } else {
      alert(`❌ Validación fallida:\n${JSON.stringify(result.errors, null, 2)}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="🔒 Pruebas de Seguridad"
        description="Valida que las protecciones contra XSS y SQL Injection funcionen correctamente"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Pruebas */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Probar Input
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Texto a validar
              </label>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Escribe o pega código para probar..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => runTest(testInput)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Validar
              </button>
              <button
                onClick={testUserSchema}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Test User Schema
              </button>
              <button
                onClick={testDepartmentSchema}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Test Dept Schema
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Casos de Prueba Rápidos
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {testCases.map((testCase, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setTestInput(testCase.value);
                      runTest(testCase.value);
                    }}
                    className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    {testCase.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Resultados */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resultados de Validación
          </h3>
          
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay resultados aún. Prueba algún input.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2 break-all">
                    {result.input}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      result.xss 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      XSS: {result.xss ? '✅ Seguro' : '❌ Bloqueado'}
                    </span>
                    <span className={`px-2 py-1 rounded ${
                      result.sql 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      SQL: {result.sql ? '✅ Seguro' : '❌ Bloqueado'}
                    </span>
                    <span className={`px-2 py-1 rounded ${
                      result.secure 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      Total: {result.secure ? '✅ SEGURO' : '❌ PELIGROSO'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Documentación */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📚 Patrones Bloqueados
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              🛡️ Protección XSS
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Tags HTML: &lt;script&gt;, &lt;iframe&gt;, &lt;object&gt;</li>
              <li>• Event handlers: onclick, onerror, onload</li>
              <li>• URLs peligrosas: javascript:, vbscript:</li>
              <li>• Funciones: eval(), template literals</li>
              <li>• Tags de servidor: &lt;?php, &lt;%</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              🛡️ Protección SQL Injection
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Comandos: SELECT, INSERT, UPDATE, DELETE, DROP</li>
              <li>• Comentarios: --, /* */</li>
              <li>• Patrones: OR 1=1, ' OR '1'='1</li>
              <li>• UNION attacks</li>
              <li>• EXEC, DECLARE</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
