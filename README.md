# Mis Gastos

Aplicación personal de finanzas con Next.js, React, Tailwind CSS, Recharts y Supabase.

## Desarrollo

1. Instala Node.js 22 o superior.
2. Copia `.env.example` a `.env.local` y define la URL y la publishable key del proyecto de Supabase.
3. En Supabase Authentication > Sign In / Providers, desactiva **Allow new users to sign up**. En Auth > Password Security, configura un mínimo de 10 caracteres y habilita la protección frente a contraseñas filtradas cuando tu plan lo permita. Para mayor protección de la cuenta, habilita MFA.
4. En el SQL Editor del proyecto Supabase, ejecuta `supabase/migrations/0001_initial_schema.sql`.
5. En Supabase Authentication > Users > Add user > Create new user, crea tu usuario con correo y contraseña y activa **Auto Confirm User**. El trigger ya instalado crea sus categorías iniciales.
6. En Supabase Auth > URL Configuration, configura `http://localhost:3000` como Site URL en el proyecto de desarrollo. Añade únicamente las rutas de callback exactas a Redirect URLs (por ejemplo `http://localhost:3000/auth/confirm` y `http://localhost:3000/reset-password`). En producción, usa el dominio real y añade solo las rutas exactas correspondientes; no uses comodines amplios como `/**`.
7. En Authentication > Email Templates > Reset Password, pega el contenido de `supabase/templates/recovery.html` y cambia también el asunto a **Restablece tu contraseña de Mis Gastos**. La plantilla dirige siempre a `{{ .SiteURL }}/reset-password`, sin aceptar destinos de redirección enviados por el cliente. Usa proyectos Supabase separados para desarrollo y producción para que cada uno tenga su propio Site URL. La aplicación verifica el token al guardar la nueva contraseña, para que los analizadores automáticos de enlaces no lo consuman.
8. Ejecuta `npm run dev`.

### SMTP de Supabase con Resend

El SMTP predeterminado de Supabase sirve solo para pruebas: limita el envío y puede restringir los destinatarios a miembros de la organización. Para enviar correos de recuperación a cualquier dirección, configura un proveedor SMTP propio.

1. En Resend, añade un dominio o subdominio que controles (por ejemplo, `auth.tu-dominio.com`) y publica en DNS los registros SPF y DKIM indicados por Resend. Añade DMARC y espera a que el dominio aparezca verificado.
2. Crea una API key de envío restringida a ese dominio.
3. En Supabase > Authentication > Emails > SMTP Settings, habilita SMTP e introduce host `smtp.resend.com`, puerto `465`, usuario `resend`, la API key como contraseña y un remitente del dominio verificado (por ejemplo, `no-reply@auth.tu-dominio.com`) con nombre `Mis Gastos`.
4. En el proyecto Supabase de producción, comprueba que Site URL apunta al dominio de producción y que Redirect URLs contiene solo las rutas exactas de producción. Mantén localhost y las rutas de desarrollo exclusivamente en el proyecto Supabase de desarrollo.

La integración SMTP de Resend y los límites del plan gratuito pueden cambiar; consulta los valores actuales en Resend antes de configurarlo. La configuración del proveedor se realiza en los paneles de Resend y Supabase, no mediante variables de entorno de esta aplicación.

La migración inicial crea RLS por usuario, categorías iniciales al crear manualmente el usuario, funciones de estadísticas y la tarea diaria de movimientos recurrentes con `pg_cron`. Si Supabase informa que la extensión `pg_cron` ya existe en otro esquema, elimina esa primera sentencia `create extension if not exists pg_cron with schema extensions;` antes de ejecutar el resto (o deja que la extensión habilitada por el panel sea usada tal cual). La aplicación no ofrece registro público; desactivar **Allow new users to sign up** también bloquea altas a través de la API pública.

## Comandos

- `npm run dev` — servidor local con Turbopack.
- `npm run lint` — ESLint.
- `npm run typecheck` — TypeScript.
- `npm run build` — build de producción.
- `npm test` — tests unitarios de utilidades y filtros.
- `npm run test:coverage` — tests con informe de cobertura V8.
- `npm run db:types` — genera tipos con Supabase CLI. Define `SUPABASE_PROJECT_ID` y autentícate con `supabase login` primero.

### Supabase: endurecimiento y tipos

Aplica, en este orden, `supabase/migrations/0002_hardening.sql` y `supabase/migrations/20261015165338_finance_integrity_and_recurring_dates.sql` en **Supabase → SQL Editor** antes del siguiente release de producción. La 0002 revoca la ejecución directa de la función que crea categorías, recupera ocurrencias recurrentes pendientes según `Europe/Madrid` y mueve el cron diario a las 02:05 UTC. La migración nueva fija el cálculo de fechas ancladas, añade reglas de integridad, agrega gastos sin categoría a Estadísticas y pagina consultas grandes. No cambia movimientos existentes.

La migración nueva inicializa `anchor_date` con la fecha `next_run` que ya tiene cada recurrente. **Revisa manualmente las reglas mensuales/anuales que ya se hubieran desplazado**: para corregir una, actualiza tanto `next_run` como `anchor_date` a la fecha correcta. La migración no intenta inferir el día original. También deja como `NOT VALID` las comprobaciones que podrían encontrar datos históricos inconsistentes; después de revisar categorías duplicadas, tipos de categoría y rangos de fechas, valida las constraints pendientes desde SQL Editor. Si hay nombres duplicados que solo difieren en mayúsculas/espacios, el índice único normalizado se omite y muestra un aviso hasta que se resuelvan.

Para revisar inconsistencias antes de validarlas, ejecuta las consultas siguientes y corrige las filas afectadas según tus datos:

```sql
select user_id, lower(btrim(name)) as normalized_name, type, count(*)
from public.categories group by user_id, lower(btrim(name)), type having count(*) > 1;

select t.id, t.type as transaction_type, c.type as category_type
from public.transactions t join public.categories c on c.id = t.category_id and c.user_id = t.user_id
where t.type <> c.type;

select r.id, r.type as recurring_type, c.type as category_type
from public.recurring_transactions r join public.categories c on c.id = r.category_id and c.user_id = r.user_id
where r.type <> c.type;

select id, name, icon from public.categories
where char_length(btrim(name)) not between 1 and 48 or char_length(icon) not between 1 and 32;

select id, date from public.transactions where date < date '1900-01-01';

select id, next_run, end_date from public.recurring_transactions
where next_run < date '1900-01-01' or (end_date is not null and (end_date < date '1900-01-01' or end_date < next_run));
```

Una vez corregidos los datos históricos, valida las restricciones con:

```sql
alter table public.categories validate constraint categories_name_not_blank;
alter table public.categories validate constraint categories_icon_length;
alter table public.transactions validate constraint transactions_date_reasonable;
alter table public.transactions validate constraint transaction_category_type_owner;
alter table public.recurring_transactions validate constraint recurring_date_order;
alter table public.recurring_transactions validate constraint recurring_dates_reasonable;
alter table public.recurring_transactions validate constraint recurring_category_type_owner;
```

Si la migración avisó que omitió el índice de nombres normalizados, créalo después de resolver duplicados:

```sql
create unique index categories_user_name_type_ci_idx
on public.categories (user_id, lower(btrim(name)), type);
```

La política CSP se genera por respuesta en `src/proxy.ts`: usa un hash SHA-256 para el script de tema y un nonce para los scripts inline que Next.js emite al hidratar la aplicación. Next.js genera `integrity` SHA-256 para los bundles. Como resultado, el renderizado es dinámico; no se permite `unsafe-inline` para scripts.

Para generar tipos actualizados desde el proyecto conectado, instala y autentica Supabase CLI. Después, en PowerShell, define la referencia del proyecto y ejecuta:

```powershell
supabase login
$env:SUPABASE_PROJECT_ID = "<project-ref>"
npm run db:types
```

El CLI escribe temporalmente y reemplaza el archivo de tipos solo si termina correctamente.

## CI/CD y despliegues

GitHub Actions ejecuta lint, comprobación de tipos, tests unitarios, auditoría de dependencias de producción y build en cada pull request y en cada push a `main`. Las acciones de GitHub están fijadas por SHA. Los despliegues de producción solo se inician al subir un tag semver con formato `v*.*.*` (por ejemplo, `v0.1.0`). El flujo exige que el commit del tag esté en `main` y que el número de versión de `package.json` coincida con el tag. La integración de despliegue Git de Vercel está desactivada para evitar despliegues automáticos por push. Configura el entorno `production` con revisores requeridos y protege la creación de tags de release.

Para preparar Vercel, enlaza el proyecto con `npx vercel link` y configura en Production las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. En GitHub, configura el secret `VERCEL_TOKEN` y las variables `VERCEL_TEAM_ID` y `VERCEL_PROJECT_ID` en **Settings > Secrets and variables > Actions**. El CI usa valores ficticios de Supabase para compilar y no necesita credenciales reales.

Para publicar una versión, actualiza `version` en `package.json`, sube el cambio a `main` y crea/empuja el tag correspondiente, por ejemplo:

```bash
git tag v0.1.0
git push origin v0.1.0
```

El flujo valida todo y despliega a producción mediante Vercel CLI. Configura también el dominio de producción de Vercel en Supabase Auth > URL Configuration (Site URL y Redirect URLs).

## Diseño responsive

La aplicación está optimizada para móvil y desktop. Inicio y Estadísticas reorganizan sus tarjetas en una columna en viewports con espacio limitado (incluido desktop con sidebar) y pasan a dos columnas en pantallas anchas. Los controles tienen objetivos táctiles de al menos 40–44 px y las categorías se adaptan a dos filas en móvil.

## Skills

Las skills del agente están instaladas en `.agents/skills/` y el manifiesto de instalación queda en `skills-lock.json`.
