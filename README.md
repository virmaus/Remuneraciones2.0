
# RemunPro Analytics - Guía de Configuración Local

Si estás intentando ejecutar este proyecto en tu entorno local (Localhost) usando Visual Studio Code, sigue estos pasos para asegurar que todo funcione correctamente.

## Requisitos Previos

1.  **Node.js**: Asegúrate de tener instalada una versión reciente de Node.js (v18 o superior recomendada).
2.  **Editor**: Visual Studio Code es recomendado.

## Pasos para la Instalación

1.  **Instalar Dependencias**:
    Abre una terminal en la carpeta raíz del proyecto y ejecuta:
    ```bash
    npm install
    ```

2.  **Iniciar el Servidor de Desarrollo**:
    Para ejecutar la aplicación con soporte para TypeScript y recarga en vivo (HMR), usa Vite:
    ```bash
    npm run dev
    ```
    Esto levantará la aplicación usualmente en `http://localhost:3000`.

## Notas Importantes para Entorno Local

*   **No abras el archivo index.html directamente**: Esta es una aplicación de React/Vite. Si intentas abrir el archivo `index.html` con el navegador (usando `file://`), no funcionará. Debes usar el comando `npm run dev`.
*   **SQL.js y WebAssembly**: La aplicación utiliza una base de datos SQLite que corre en el navegador. Requiere conexión a internet para cargar la librería desde el CDN de Cloudflare o que configures los archivos `.wasm` localmente.
*   **Compatibilidad de UUID**: Hemos implementado un generador de UUID personalizado (`utils/uuid.ts`) para asegurar que la aplicación funcione incluso si accedes a través de una IP local (contexto no seguro) donde `crypto.randomUUID()` podría no estar disponible.

## Estructura del Proyecto

*   `App.tsx`: Componente principal.
*   `payroll-engine/`: Motor de cálculo de remuneraciones centralizado y exacto.
*   `store/sqliteEngine.ts`: Persistencia de datos usando SQLite en el navegador (LocalStorage).
*   `utils/rutUtils.ts`: Validaciones de RUT chileno.
*   `utils/payslipGenerator.ts`: Generación de liquidaciones de sueldo en PDF.
