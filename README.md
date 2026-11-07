# Nova Salud

Sistema web de gestión para la botica **Nova Salud**. Permite administrar las ventas del mostrador, inventario, clientes y órdenes de reposición desde una sola aplicación.

> Proyecto académico desarrollado como trabajo final del curso Fullstack Developer Software (SENATI).

## Funcionalidades

- **Dashboard:** resumen de ventas, alertas de stock, productos por vencer y ventas semanales.
- **Punto de venta:** búsqueda por nombre o código, carrito, cálculo de IGV (18 %), descuentos, métodos de pago y registro de comprobantes.
- **Inventario:** consulta, búsqueda y filtros de productos; alertas por bajo stock, agotados y próximos a vencer.
- **Clientes:** consulta de datos e historial de compras.
- **Reposición:** creación de órdenes agrupadas por proveedor y recepción de pedidos con actualización de stock.
- **Acceso protegido:** inicio de sesión y API con autenticación JWT.

## Tecnologías

- React 19, Vite 8 y React Router 7
- Node.js y Express 5
- SQLite integrado para desarrollo y caché local
- Supabase (PostgreSQL) como almacenamiento remoto opcional
- JWT y bcryptjs para autenticación y contraseñas
- Recharts, Bootstrap y Lucide React

## Requisitos

- Node.js **22.5 o superior** y npm
- Una instancia de Supabase es opcional. Sin configurar Supabase, la API usa SQLite local y crea `server/novasalud.db` automáticamente.

## Instalación y ejecución local

```bash
git clone https://github.com/Magidark00/NovaSalud.git
cd NovaSalud
npm install
```

En una terminal, inicia la API:

```bash
npm run server
```

En otra terminal, inicia la interfaz:

```bash
npm run dev
```

Abre la URL que muestra Vite, normalmente `http://localhost:5173`. La API local se ejecuta en `http://localhost:3001`; su endpoint de estado es `/api/health`.

### Configuración opcional de Supabase

La API detecta Supabase cuando están definidas `SUPABASE_URL` y `SUPABASE_KEY`. Puedes definirlas en el entorno antes de iniciar el servidor. `SUPABASE_KEY` puede ser una clave con permisos adecuados para las operaciones que realiza la API. No publiques claves secretas ni las incluyas en el repositorio.

El esquema y los datos de ejemplo para PostgreSQL están en [`server/supabase_schema.sql`](server/supabase_schema.sql). El script elimina y vuelve a crear las tablas existentes; ejecútalo únicamente en una base de datos de desarrollo cuyos datos puedas reemplazar.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo de Vite. |
| `npm run server` | Inicia la API Express local. |
| `npm run build` | Genera la compilación de producción en `dist/`. |
| `npm run preview` | Sirve localmente la compilación de producción. |
| `npm run lint` | Ejecuta ESLint. |

## API

La API ofrece rutas para autenticación, dashboard, productos, ventas, clientes y reposición. Las rutas principales están bajo `/api`:

| Recurso | Rutas |
| --- | --- |
| Sesión | `/api/auth/login`, `/api/auth/me` |
| Dashboard | `/api/dashboard` |
| Productos | `/api/productos` |
| Ventas | `/api/ventas` |
| Clientes | `/api/clientes` |
| Reposición | `/api/reposicion` |
| Estado | `/api/health` |

Las rutas que requieren sesión reciben el token JWT en `Authorization: Bearer <token>`.

## Modelo de datos

El esquema SQL completo, incluidas restricciones, relaciones y datos iniciales, se mantiene en [`server/supabase_schema.sql`](server/supabase_schema.sql). Las tablas están descritas a continuación; `PK` indica clave primaria, `FK` clave foránea y `Único` una restricción de unicidad.

| Tabla | Columnas principales |
| --- | --- |
| `usuarios` | `id` (PK), `username` (Único), `nombre`, `rol`, `iniciales`, `password_hash`, `activo`, `creado_en` |
| `productos` | `id` (PK), `codigo` (Único), `nombre`, `presentacion`, `categoria`, `proveedor`, `precio`, `stock`, `stock_minimo`, `vence`, `activo`, `actualizado_en` |
| `clientes` | `id` (PK), `dni` (Único), `nombre`, `telefono` (opcional), `email` (opcional), `direccion` (opcional), `compras`, `ultima_compra` (opcional), `total_gastado`, `ultimas_compras_json`, `creado_en` |
| `ventas` | `id` (PK), `numero_boleta` (Único), `codigo_boleta` (Único), `tipo_comprobante`, `documento_cliente`, `cliente_id` (FK opcional), `cliente_nombre`, `usuario_id` (FK opcional), `metodo_pago`, `subtotal`, `igv`, `descuento`, `total`, `recibido` (opcional), `vuelto` (opcional), `fecha` |
| `detalle_ventas` | `id` (PK), `venta_id` (FK), `producto_id` (FK opcional), `producto_nombre`, `cantidad`, `precio_unitario`, `importe` |
| `ventas_semanales_resumen` | `id` (PK), `dia` (Único), `orden`, `ventas` |
| `ordenes_reposicion` | `id` (PK), `codigo` (Único), `proveedor`, `fecha`, `estado`, `usuario_id` (FK opcional), `observaciones` (opcional) |
| `detalle_reposicion` | `id` (PK), `orden_id` (FK), `producto_id` (FK opcional), `producto_nombre`, `cantidad` |

Relaciones principales: un cliente y un usuario pueden asociarse a muchas ventas; cada venta contiene líneas en `detalle_ventas`. Las líneas pueden apuntar a productos. Una orden de reposición agrupa sus líneas en `detalle_reposicion`, que pueden referenciar productos. Las referencias opcionales conservan el registro aunque se elimine el cliente, usuario o producto asociado.

## Estructura

```text
NovaSalud/
├── api/                 Adaptador de API para despliegue serverless
├── public/              Recursos estáticos
├── server/
│   ├── middleware/      Seguridad y autenticación
│   ├── routes/          Rutas de la API
│   ├── app.js            Configuración de Express
│   ├── db.js             SQLite y datos iniciales
│   └── supabase_schema.sql
└── src/
    ├── componentes/      Componentes de interfaz por módulo
    ├── context/          Estado compartido y sesión
    ├── pages/            Pantallas de la aplicación
    ├── services/         Comunicación con la API
    └── utils/            Formato y exportación
```

## Despliegue

El repositorio incluye configuración para Vercel (`vercel.json`). Configura las variables de entorno necesarias para el backend en el proyecto de despliegue. Para persistir los datos entre ejecuciones, configura Supabase; el archivo SQLite local o temporal no es almacenamiento persistente en un entorno serverless.

## Equipo

- Matias Melendez Asencio

## Licencia

Proyecto académico con fines educativos.
