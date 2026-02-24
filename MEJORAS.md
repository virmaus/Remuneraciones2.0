# Plan de Mejoras y Optimización - RemunPro Analytics

## 1. Arquitectura y Código
- **Componentización**: El archivo `App.tsx` es actualmente demasiado grande (monolítico). Se debe dividir en componentes funcionales reutilizables (Sidebar, Modals, Views específicos).
- **Hooks Personalizados**: Extraer la lógica de datos a hooks como `useEmployees`, `usePayroll`, etc., para separar la lógica de negocio de la presentación.
- **Validación de Datos**: Implementar validaciones robustas para RUT chileno, correos electrónicos y montos numéricos.
- **Manejo de Errores**: Implementar un sistema de notificaciones (Toasts) en lugar de `alert()`.

## 2. Funcionalidades de Remuneraciones
- **Cálculo de Horas Extras**: Implementar el cálculo automático de horas extras al 50%.
- **Gestión de Préstamos**: Automatizar el descuento de cuotas de préstamos en la liquidación.
- **Libro de Remuneraciones Electrónico (LRE)**: Generar el archivo CSV compatible con la Dirección del Trabajo (DT).
- **Previred**: Exportación de archivo para carga masiva en Previred.

## 3. Integración con Contabilidad25
- **Centralización Contable**: Generar comprobantes de centralización (Vouchers) automáticos.
- **Resumen de Nómina**: Exportar el objeto `PayrollSummary` para alimentar los KPIs de la aplicación de contabilidad.
- **Mapeo de Cuentas**: Permitir al usuario configurar a qué cuenta contable va cada concepto (Sueldo Base -> Gasto Sueldos, AFP -> Retenciones Previsionales, etc.).
- **Exportación Directa**: Crear un endpoint o formato de intercambio JSON que la aplicación de Contabilidad pueda importar directamente.

## 4. UI/UX
- **Dashboard Avanzado**: Incluir más indicadores clave (KPIs) como costo empresa total, rotación de personal y comparativa mensual.
- **Modo Oscuro**: Implementar soporte para temas.
- **Diseño Responsivo**: Optimizar las tablas y modales para dispositivos móviles.

## 5. Persistencia y Seguridad
- **Sincronización Cloud**: Opción de respaldar la base de datos SQLite en la nube (Firebase/Supabase).
- **Roles y Permisos**: Si se escala a multi-usuario, definir niveles de acceso.
