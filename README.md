# Sistema de Sensado y Monitoreo - Interfaz Web

## 📋 Descripción del Proyecto

Este repositorio contiene la implementación de una interfaz web interactiva para el sistema de sensado y monitoreo desarrollado como parte del proyecto de investigación. 
La interfaz permite la visualización en tiempo real de datos de sensores, configuración de parámetros del sistema y generación de reportes.

## 🎯 Objetivos

- Proporcionar una interfaz web intuitiva para el monitoreo de sensores
- Visualizar datos de sensores en tiempo real mediante gráficos interactivos
- Permitir la configuración remota de parámetros del sistema
- Generar reportes y análisis históricos de los datos capturados
- Ofrecer una experiencia de usuario responsiva en diferentes dispositivos

## 🚀 Características Principales

### Visualización de Datos
- **Dashboard principal** con métricas en tiempo real
- **Gráficos interactivos** para análisis temporal de datos
- **Indicadores visuales** de estado de sensores
- **Alertas automáticas** cuando se detectan valores anómalos

### Funcionalidades de Control
- **Configuración de sensores** mediante interfaz web
- **Calibración remota** de parámetros
- **Control de intervalos** de muestreo
- **Gestión de umbrales** de alarma

### Análisis y Reportes
- **Exportación de datos** en formato CSV/JSON
- **Gráficos históricos** con diferentes rangos temporales
- **Estadísticas descriptivas** de las mediciones
- **Comparación entre sensores** y períodos

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica y moderna
- **CSS3**: Estilos responsivos con Flexbox/Grid
- **JavaScript (ES6+)**: Lógica de interfaz y manejo de datos

### Librerías y Frameworks
- **Chart.js**: Para la generación de gráficos interactivos
- **Bootstrap**: Framework CSS para diseño responsivo
- **Axios**: Cliente HTTP para comunicación con APIs
- **Moment.js**: Manejo y formateo de fechas/horas

## 📁 Estructura del Proyecto

```
sistema-sensado-web/
├── README.md                 # Este archivo
├── index.html               # Página principal de la interfaz
├── css/
│   ├── styles.css          # Estilos principales
│   └── responsive.css      # Estilos para diferentes dispositivos
├── js/
│   ├── main.js            # Funciones principales de la aplicación
│   ├── sensors.js         # Manejo de datos de sensores
│   ├── charts.js          # Configuración y rendering de gráficos
│   └── utils.js           # Funciones utilitarias
├── images/
│   ├── icons/             # Iconos de la interfaz
│   └── screenshots/       # Capturas de pantalla
└── docs/
    └── api-documentation.md # Documentación de la API
```

## 🔧 Instalación y Configuración

### Prerrequisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional para desarrollo)
- Conexión a internet (para librerías CDN)

### Instalación Local
1. Clone o descargue este repositorio
2. Abra el archivo `index.html` directamente en su navegador, o
3. Utilice un servidor web local para mejor funcionalidad:
   ```bash
   # Con Python
   python -m http.server 8000
   
   # Con Node.js (http-server)
   npx http-server
   ```

### Configuración de Conexión
1. Edite el archivo `js/sensors.js`
2. Modifique la variable `API_BASE_URL` con la dirección de su sistema:
   ```javascript
   const API_BASE_URL = 'http://tu-direccion-ip:puerto';
   ```

## 📊 Uso de la Interfaz

### Panel Principal
- **Métricas en tiempo real**: Visualización de los valores actuales de todos los sensores
- **Estado del sistema**: Indicadores de conectividad y funcionamiento
- **Gráficos principales**: Tendencias de las últimas horas

### Configuración de Sensores
1. Acceda a la pestaña "Configuración"
2. Seleccione el sensor a configurar
3. Ajuste los parámetros según sus necesidades
4. Guarde los cambios y reinicie el sensor si es necesario

### Generación de Reportes
1. Vaya a la sección "Reportes"
2. Seleccione el rango de fechas deseado
3. Elija los sensores a incluir
4. Descargue el reporte en el formato preferido

## 📋 Descripción de Archivos

### HTML (index.html)
- **Estructura semántica** con secciones claramente definidas
- **Elementos interactivos** para control de la interfaz
- **Contenedores** para gráficos y datos dinámicos
- **Formularios** para configuración de parámetros

### CSS
- **styles.css**: Estilos principales, paleta de colores, tipografía
- **responsive.css**: Adaptaciones para tablets y móviles

### JavaScript
- **main.js**: Inicialización de la app, manejo de eventos principales
- **sensors.js**: Comunicación con sensores, procesamiento de datos
- **charts.js**: Configuración de gráficos, actualización en tiempo real
- **utils.js**: Funciones auxiliares, formateo de datos

## 🔌 Comunicación con el Sistema

La interfaz se comunica con el sistema de sensores mediante:

- **WebSockets**: Para datos en tiempo real
- **REST API**: Para configuración y comandos
- **Polling**: Como fallback para conexiones inestables

### Endpoints Principales
```
GET  /api/sensors/data     - Obtener datos actuales
POST /api/sensors/config   - Configurar parámetros
GET  /api/history          - Datos históricos
POST /api/calibrate        - Calibrar sensores
```

## 🎨 Personalización

### Colores y Temas
Modifique las variables CSS en `styles.css`:
```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
}
```

### Gráficos
Configure los tipos de gráficos en `charts.js`:
```javascript
const chartConfig = {
  type: 'line',        // line, bar, doughnut, etc.
  responsive: true,
  maintainAspectRatio: false
};
```

## 🐛 Solución de Problemas

### Problemas Comunes
1. **No se cargan los datos**: Verificar conexión con el sistema de sensores
2. **Gráficos no aparecen**: Comprobar que Chart.js se carga correctamente
3. **Interfaz no responsiva**: Revisar viewport meta tag en HTML

### Debug
Abra las herramientas de desarrollador (F12) y revise:
- Console: Errores de JavaScript
- Network: Problemas de conectividad
- Elements: Problemas de CSS/HTML

## 👥 Contribuciones

Este proyecto forma parte de una investigación académica. Para sugerencias o mejoras:

1. Documente claramente el problema o mejora propuesta
2. Incluya ejemplos de código si es aplicable
3. Mantenga consistencia con el estilo de código existente

## 📄 Licencia

Este proyecto es desarrollado con fines académicos y de investigación.

## 📞 Contacto

- **Desarrollador**: [Sebastian Castillo]
- **Institución**: [Universidad del Cauca]
- **Email**: [sebastiancastilloc20021@gmail.com]
- **Proyecto**: Sistema de Sensado y Monitoreo

## 📝 Historial de Versiones

### v1.0.0 (Fecha Actual)
- ✅ Implementación inicial de la interfaz web
- ✅ Dashboard con visualización en tiempo real
- ✅ Sistema de configuración de sensores
- ✅ Generación básica de reportes
- ✅ Diseño responsivo para múltiples dispositivos

---

**Nota**: Esta interfaz web es parte integral del sistema de sensado y monitoreo desarrollado. Para obtener el manual completo del sistema y documentación adicional, consulte los anexos del proyecto principal.
