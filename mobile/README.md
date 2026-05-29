# FISI Match - Mobile (Expo App)

## **Aún bajo desarrollo**

> **Cliente móvil multiplataforma nativo desarrollado para iOS y Android que replica los flujos del sistema de recomendación semántica y alineación académica.**

---

## Stack Tecnológico

*   **Framework**: **Expo (SDK 51+)** con arquitectura moderna basada en Expo Router.
*   **Lenguaje**: **TypeScript** con tipados sincronizados con la API central.
*   **Estilos (CSS en React Native)**: **Uniwind** (la solución más eficiente para aplicar clases de Tailwind CSS v4 con variables en React Native, optimizando transiciones y sombras nativas).
*   **Navegación**: **Expo Router** (Navegación basada en carpetas y archivos con soporte nativo para stacks y tabulación).
*   **Gestor de Paquetes**: Compatible con **npm**, **yarn** o **bun** (este último usado como opción ultrarrápida en el entorno local).

---

## Estructura de Directorios de la App Móvil

```
mobile/
├── app/                        # Carpetas y archivos de rutas (Expo Router)
│   ├── (auth)/                 # Rutas públicas de autenticación
│   │   ├── _layout.tsx         # Configuración del Stack de Auth
│   │   ├── login.tsx           # Formulario de inicio de sesión móvil
│   │   └── register.tsx        # Formulario de registro de estudiante
│   ├── (app)/                  # Rutas protegidas (Requieren autenticación)
│   │   ├── _layout.tsx         # Layout con el Stack de Navegación y Cabeceras
│   │   ├── home.tsx            # Dashboard móvil interactivo
│   │   ├── explorador.tsx      # Buscador táctil de profesores y perfiles
│   │   ├── recomendacion.tsx   # Ingreso de idea de tesis y visualización kNN
│   │   ├── alineamiento.tsx    # Visualización clara del reporte de alineación
│   │   ├── alternativos.tsx    # Pantalla de temas recomendados y habilidades sugeridas
│   │   └── perfil.tsx          # Gestión de documentos PDF cargados a S3
│   ├── index.tsx               # Redirección inteligente inicial (Auth vs App)
│   └── _layout.tsx             # Proveedor global de contexto (Auth / Tema)
├── api/                        # Capa de servicios que encapsula los llamados HTTP al Backend
│   ├── config.ts               # Configuración del cliente HTTP y URL base de la API
│   ├── authApi.ts              # Servicios de Login y Registro
│   ├── advisorApi.ts           # Servicios de carga y detalle de profesores
│   ├── studentApi.ts           # Gestión de datos específicos del estudiante
│   ├── profileApi.ts           # Carga de documentos de notas/CV
│   ├── recommendationApi.ts    # Invocación de recomendación vectorial kNN
│   └── alignmentApi.ts         # Evaluación de alineación académica
├── components/                 # Componentes móviles nativos customizados
├── context/                    # Contexto global de autenticación móvil
├── hooks/                      # Custom hooks reutilizables
├── lib/                        # Clientes y configuraciones de terceros
└── package.json                # Configuración de dependencias móviles
```

---

## Pantallas Implementadas y Flujos Móviles

La navegación táctil se divide en dos bloques principales orquestados nativamente:

### 1. Bloque de Autenticación (`(auth)`)
*   **`login.tsx`**: Formulario móvil elegante con validación en tiempo real y soporte para visibilidad de contraseñas.
*   **`register.tsx`**: Registro secuencial optimizado para pantallas táctiles donde el alumno ingresa su información básica.

### 2. Bloque Principal (`(app)`)
*   **`home.tsx`**: Panel dinámico con barra de estado que muestra el avance en el procesamiento del perfil del alumno, indicadores de recomendación y accesos directos táctiles.
*   **`explorador.tsx`**: Buscador avanzado optimizado con filtrado instantáneo tipo *pills* de áreas de interés y barras de búsqueda rápida de docentes.
*   **`recomendacion.tsx`**: Espacio donde el estudiante escribe la idea de su tesis. Cuenta con un feedback animado e interactivo de carga nativa y muestra las tarjetas del ranking de asesores.
*   **`alineamiento.tsx`**: Interfaz visualmente atractiva con tarjetas informativas de colores semánticos (verde, amarillo, rojo) según el nivel de alineación de competencias del estudiante respecto a su tema.
*   **`alternativos.tsx`**: Pantalla que proporciona recomendaciones estructuradas en listas deslizantes con microproyectos y cursos para subsanar brechas.
*   **`perfil.tsx`**: Sección táctil para visualizar el estado de carga y procesamiento de los PDFs (Historial Académico, Matrícula, CV).

---

## Integración de Diseño: Uniwind

Para no perder rendimiento de renderizado en hilos nativos, se utiliza **Uniwind**:
1.  **Tailwind CSS v4 en React Native**: Permite utilizar estilos atómicos con `className` sobre los componentes nativos de React Native (como `View`, `Text`, `TouchableOpacity`).
2.  **Soporte de Variables**: Permite sincronizar y modificar variables del tema en tiempo de ejecución (como los modos claro/oscuro) de forma nativa.
3.  **Seguridad de Layout**: Uso de utilidades de área segura nativas (`SafeAreaView`) para que las cabeceras e interfaces esquiven los sensores táctiles (notches) en dispositivos móviles modernos.

---

## Instrucciones para Levantar Localmente

### Importante: Conexión con la API Local
Si ejecutas la app móvil en un **dispositivo físico real** o un **emulador externo**, `localhost:8000` fallará debido al direccionamiento de red. Debes configurar la URL de tu backend apuntando a la **dirección IP de red local de tu computadora** (ejemplo: `192.168.1.45`) o usar un túnel en `mobile/api/config.ts`:

```typescript
// mobile/api/config.ts
export const API_BASE_URL = 'http://192.168.1.45:8000'; // Tu IP local
```

### Comandos de Ejecución:

1.  **Instala dependencias**:
    ```bash
    cd mobile
    npm install # o bun install
    ```
2.  **Inicia Expo**:
    ```bash
    npx expo start
    ```
3.  **Monta la aplicación**:
    *   **Android (Emulador)**: Presiona `a` en la terminal.
    *   **iOS (Simulador)**: Presiona `i` en la terminal.
    *   **Dispositivo Físico**: Escanea el código QR proyectado en la terminal con la cámara de tu celular (iOS) o la app Expo Go (Android).
