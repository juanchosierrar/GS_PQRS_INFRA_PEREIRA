# **PROMPT MAESTRO: SISTEMA DE GESTIÓN "INFRA-PQR" (GovTech) \- Versión Final Funcional**

**Rol:** Actúa como un **Lead Full-Stack Engineer** y **Arquitecto de Datos Senior** especializado en administración pública.

**Objetivo:** Desarrollar el código base completo de "InfraPQR", una PWA para la Secretaría de Infraestructura. La aplicación debe ser **totalmente funcional** desde el despliegue, incluyendo un set de datos de prueba realistas para validar flujos.

## **1\. STACK TECNOLÓGICO (ESTRICTO)**

* **Frontend:** Next.js 14+ (App Router, Server Actions).  
* **Lenguaje:** TypeScript (Strict Mode).  
* **Estilos:** Tailwind CSS \+ Shadcn/UI. Iconos: Lucide React.  
* **Mapas:** react-leaflet \+ leaflet (OpenStreetMap). *Nota: Usar importación dinámica (ssr: false) para evitar errores de ventana.*  
* **Backend & DB:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).  
* **Gestión de Estado:** React Query (TanStack Query) \+ Zustand.  
* **Formularios:** React Hook Form \+ Zod.  
* **Fechas:** date-fns (Para visualización) y PostgreSQL Triggers (Para cálculo lógico).

## **2\. ARQUITECTURA DE BASE DE DATOS**

Genera el script SQL completo. Usa **Foreign Keys** estrictas.

### **A. Tablas Maestras (Catálogos)**

1. **dependencias**: id (UUID, PK), nombre, codigo.  
2. **tipos\_tramite**: id (Serial, PK), nombre (Text), dias\_sla (Int).  
3. **tipos\_solicitante**: id (Serial, PK), nombre.  
4. **clases\_juridicas**: id (Serial, PK), nombre.  
5. **categorias**: id (Serial, PK), nombre.

### **B. Tablas Core**

6. **profiles**:  
   * id (FK auth.users, PK).  
   * email (Text), full\_name (Text).  
   * role (ENUM: 'GENERAL', 'GESTOR\_DEP', 'TECNICO').  
   * dependencia\_id (FK dependencias, Nullable).  
   * telefono (Text).  
7. **solicitudes\_pqr**:  
   * id (UUID, PK, Default gen\_random\_uuid).  
   * radicado (Text, Unique, Default: Generar secuencia tipo 'PQR-2024-001').  
   * tipo\_tramite\_id (FK), tipo\_solicitante\_id (FK), clase\_juridica\_id (FK), categoria\_id (FK).  
   * dependencia\_id (FK, Nullable), tecnico\_id (FK, Nullable).  
   * estado (ENUM: 'NUEVA', 'POR\_ASIGNAR', 'EN\_PROCESO', 'EN\_REVISION', 'RESUELTA', 'DEVUELTA').  
   * asunto (Text), descripcion (Text).  
   * solicitante\_info (JSONB: {nombre, cedula, direccion, email}).  
   * fecha\_creacion (Timestamp Default Now).  
   * fecha\_vencimiento (Timestamp). *Se calculará vía Trigger*.  
8. **visitas\_tecnicas**:  
   * id (UUID, PK).  
   * solicitud\_id (FK), tecnico\_id (FK).  
   * latitud (Decimal), longitud (Decimal).  
   * foto\_antes (Text URL), foto\_despues (Text URL).  
   * observaciones (Text).  
   * fecha\_visita (Timestamp).

## **3\. LÓGICA DE NEGOCIO (AUTOMATIZACIÓN)**

### **A. Trigger de Cálculo de SLA (SQL)**

Crea una función y un trigger en PostgreSQL que se ejecute BEFORE INSERT en solicitudes\_pqr.

* Debe buscar los dias\_sla en la tabla tipos\_tramite según el ID seleccionado.  
* Debe sumar esos días a NOW() y asignarlo a fecha\_vencimiento.

### **B. Trigger de Generación de Radicado (SQL)**

Crea una secuencia y un trigger para generar radicados legibles (Ej: "INF-2026-0001", "INF-2026-0002") automáticamente al insertar.

## **4\. DATOS DE PRUEBA (MOCK DATA \- CRÍTICO)**

Para que la app sea funcional inmediatamente, genera un script SQL de **Seed Data** que inserte lo siguiente en este orden exacto:

1. **Catálogos:** Inserta los valores reales (Secretarías, Tipos de Trámite: Petición/15 días, Queja/15 días, Denuncia/10 días, etc. basados en las imágenes provistas).  
2. **Usuarios Ficticios (Auth Placeholder):**  
   * Crea entradas en profiles para simular usuarios (Nota: En producción se vinculan a Auth, pero para desarrollo, crea perfiles que podamos vincular manualmente luego):  
     * admin@infra.gov (Rol: GENERAL)  
     * director.parques@infra.gov (Rol: GESTOR\_DEP, Dep: Parques)  
     * tecnico.perez@infra.gov (Rol: TECNICO, Dep: Parques)  
3. **PQRs de Prueba (Casos de Uso Real):**  
   * *Caso 1 (Vencida):* Una "Queja" sobre "Hueco peligroso en Av. Circunvalar", estado 'NUEVA', creada hace 20 días (Para probar semáforo Rojo).  
   * *Caso 2 (Por Vencer):* Una "Petición" de "Poda de árbol en Colegio Nacional", estado 'EN\_PROCESO', creada hace 12 días (Para probar semáforo Amarillo).  
   * *Caso 3 (A tiempo):* Una "Denuncia" de "Robo de tapas de alcantarilla", estado 'POR\_ASIGNAR', creada hoy (Semáforo Verde).

## **5\. REQUERIMIENTOS DE UI/UX (DETALLE)**

### **A. Dashboard y Filtros**

* Implementa Shadcn Datatable con filtros por columnas (Estado, Dependencia, Tipo).  
* **Semáforos:** La celda de "Fecha Vencimiento" debe tener un Badge de color dinámico según la fecha actual vs vencimiento.

### **B. Formularios Inteligentes**

* Usa Combobox (Select con búsqueda) para elegir "Clase Jurídica" y "Categoría", ya que son listas largas.  
* Al seleccionar "Dependencia", el select de "Técnico" debe recargarse mostrando solo los técnicos de esa dependencia específica.

### **C. Módulo Técnico (Mobile First)**

* Diseño responsivo estricto. Botones grandes.  
* Input de coordenadas bloqueado (readonly), que se llena solo al pulsar un botón "📍 Obtener mi ubicación GPS".  
* Validación: No permitir enviar el reporte sin las 2 fotos y la ubicación.

## **6\. INSTRUCCIONES DE GENERACIÓN PASO A PASO**

1. Escribe el **Schema SQL** completo (Tablas \+ Triggers \+ RLS).  
2. Escribe el **Script de Seed Data** (Catálogos \+ Datos Ficticios).  
3. Configura el cliente Supabase y los tipos TypeScript (Database Definitions).  
4. Crea la estructura de carpetas app/(dashboard)/....  
5. Desarrolla el **Formulario de Radicación** (Vista General).  
6. Desarrolla el **Kanban/Tabla de Gestión** (Vista Dependencia).  
7. Desarrolla el **Formulario de Campo** (Vista Técnico) con lógica de GPS.

¡Empieza generando el código SQL para la base de datos\!

Conecta los cambios realizados con GItHub del proyecto y que se actualice igualmente en hostinger