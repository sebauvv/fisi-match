# FISI Match - Portal Web

> **Aplicación web interactiva estructurada como Single Page Application (SPA) para que los estudiantes exploren profesores, carguen sus perfiles académicos y soliciten recomendaciones inteligentes.**

---

## Stack Tecnológico

*   **Librería Principal**: **React 19** (con soporte para transiciones y hooks concurrentes modernos).
*   **Lenguaje**: **TypeScript** (con tipado estricto para modelos de datos de profesores, publicaciones y tesis).
*   **Herramienta de Construcción (Bundler)**: **Vite** (para compilación instantánea y recarga en caliente superrápida).
*   **Estilos y UI**: **Tailwind CSS v4** integrado vía `@tailwindcss/vite` (lo que elimina la necesidad del archivo tradicional `tailwind.config.js` y permite definir configuraciones directamente dentro de `src/index.css` usando directivas `@theme`).
*   **Navegación**: **React Router Dom** para la orquestación limpia de rutas y protección de accesos.

---

## Estructura de Directorios del Frontend

```
frontend/
├── src/
│   ├── main.tsx                # Punto de entrada y renderizado de la aplicación
│   ├── App.tsx                 # Enrutador principal y estructura base del Layout
│   ├── index.css               # Estilos globales y configuración del diseño con Tailwind v4
│   ├── assets/                 # Imágenes, iconos y recursos estáticos
│   ├── api/                    # Capa de comunicación HTTP con Axios hacia el Backend
│   ├── components/             # Componentes de UI modulares y reutilizables (Botones, Tarjetas, Loaders)
│   ├── context/                # Contexto de autenticación y estado del estudiante (AuthContext)
│   ├── data/                   # Datos locales y mocks estáticos para pruebas rápidas
│   ├── types/                  # Definición de interfaces TypeScript para entidades de dominio
│   └── pages/                  # Las 11 Páginas que definen los flujos de la aplicación
├── package.json                # Configuración de dependencias de npm
├── vite.config.ts              # Configuración de Vite con el plugin de Tailwind CSS v4
├── tsconfig.json               # Configuración base de TypeScript
└── eslint.config.js            # Configuración de formateo y linting de código
```

---

## Flujo de Navegación y Detalle de Páginas (Las 11 Páginas)

La interfaz se divide de manera modular en las siguientes vistas enriquecidas con micro-animaciones y layouts premium:

### 1. Panel Principal e Ingreso
*   **`LoginPage.tsx` / `RegisterPage.tsx`**: Interfaces premium para inicio de sesión y registro de estudiantes de pregrado, conectadas a la capa de persistencia mediante JWT.
*   **`HomePage.tsx`**: Dashboard de bienvenida interactivo que muestra estadísticas rápidas (número de asesores disponibles, tesis registradas, publicaciones totales) y accesos directos a los flujos clave.

### 2. Gestión de Perfil Académico
*   **`ProfilePage.tsx`**: Perfil del estudiante donde especifica su idea inicial de tesis. Cuenta con un módulo de carga interactivo (`drag and drop`) para subir:
    *   *Historial Académico (PDF)*
    *   *Reporte de Matrícula (PDF)*
    *   *CV del Estudiante (PDF)*
    Visualiza el estado de procesamiento de los documentos.

### 3. Motor de Recomendación y Perfil de Profesores
*   **`AdvisorRecommendationPage.tsx`**: Interfaz de entrada para la idea de investigación. Cuenta con un cargador progresivo dinámico mientras espera la respuesta RAG de la Lambda y despliega el ranking final ordenado por coincidencia semántica.
*   **`AdvisorProfilePage.tsx`**: Ficha detallada del profesor. Muestra su biografía, ORCID, listado de tesis históricas supervisadas, publicaciones indexadas y, críticamente, **la justificación inteligente basada en evidencia** de por qué el sistema lo recomienda para el tema de tesis seleccionado.
*   **`AdvisorExplorerPage.tsx`**: Buscador avanzado que permite buscar profesores por nombre y filtrar dinámicamente por palabras clave o áreas específicas de investigación de forma instantánea.

### 4. Evaluación de Alineamiento y Alternativas
*   **`AlignmentEvaluatorPage.tsx`**: Visualizador del reporte de alineación académica (Fase 6). Presenta de forma gráfica e interactiva las fortalezas del estudiante, sus brechas de conocimiento técnico respecto a los requerimientos inferidos del tema y su puntaje global de alineación (Alta / Media / Baja).
*   **`AlternativeRecommenderPage.tsx`**: Sugiere temas de tesis alternativos y áreas específicas a reforzar basados en las brechas del perfil, ofreciendo cursos y microproyectos de recomendación automática de la Lambda (Fase 7).

### 5. Exploradores Especializados
*   **`PublicationExplorerPage.tsx`**: Buscador independiente para explorar todas las publicaciones científicas registradas de la facultad.
*   **`ThesisExplorerPage.tsx`**: Buscador para explorar el catálogo completo de tesis universitarias previas, permitiendo analizar líneas académicas previas.

---

## Convenciones de Diseño y Tailwind CSS v4

La aplicación adopta las guías modernas de **Tailwind CSS v4**:
**Sin `tailwind.config.js`**: Toda la personalización de temas (colores institucionales, fuentes modernas, sombras premium, bordes) se declara directamente en `src/index.css` a través de variables de tema CSS estándar dentro de `@theme`:
    ```css
    @import "tailwindcss";

    @theme {
      --color-brand-primary: oklch(0.45 0.19 250);
      --color-brand-secondary: oklch(0.65 0.22 140);
      --font-display: "Outfit", sans-serif;
    }
    ```
---

## Instrucciones para Ejecución Local

1.  **Dependencias**:
    ```bash
    cd frontend
    npm install
    ```
2.  **Servidor de Desarrollo**:
    ```bash
    npm run dev
    ```
    *Vite levantará la aplicación web local en `http://localhost:5173`.*
3.  **Compilación para Producción**:
    ```bash
    npm run build
    ```
    *Este comando compilará y optimizará el bundle de producción en el directorio `dist/`.*

4.  **Linter**:
    ```bash
    npm run lint
    ```
