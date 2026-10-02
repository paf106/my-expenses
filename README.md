# Mis Gastos

Aplicación personal de finanzas con Next.js, React, Tailwind CSS, Recharts y Supabase.

## Desarrollo

1. Instala Node.js 20.9 o superior.
2. Copia `.env.example` a `.env.local` y define la URL y la publishable key del proyecto de Supabase.
3. En Supabase Authentication > Sign In / Providers, desactiva **Allow new users to sign up**.
4. En el SQL Editor del proyecto Supabase, ejecuta `supabase/migrations/0001_initial_schema.sql`.
5. En Supabase Authentication > Users > Add user > Create new user, crea tu usuario con correo y contraseña y activa **Auto Confirm User**. El trigger ya instalado crea sus categorías iniciales.
6. En Supabase Auth > URL Configuration, configura la Site URL de desarrollo como `http://localhost:3000` y añade `http://localhost:3000/**` a Redirect URLs.
7. En Authentication > Email Templates > Reset Password, usa `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password` como enlace de recuperación.
8. Ejecuta `npm run dev`.

La migración crea RLS por usuario, categorías iniciales al crear manualmente el usuario, funciones de estadísticas y la tarea diaria de movimientos recurrentes con `pg_cron`. Si Supabase informa que la extensión `pg_cron` ya existe en otro esquema, elimina esa primera sentencia `create extension if not exists pg_cron with schema extensions;` antes de ejecutar el resto (o deja que la extensión habilitada por el panel sea usada tal cual). La aplicación no ofrece registro público; desactivar **Allow new users to sign up** también bloquea altas a través de la API pública.

## Comandos

- `npm run dev` — servidor local con Turbopack.
- `npm run lint` — ESLint.
- `npm run typecheck` — TypeScript.
- `npm run build` — build de producción.
- `npm test` — tests unitarios de utilidades y filtros.
- `npm run db:types` — genera tipos con Supabase CLI. Define `SUPABASE_PROJECT_ID` y autentícate con `supabase login` primero.

### Supabase: endurecimiento y tipos

La migración `supabase/migrations/0002_hardening.sql` revoca la ejecución directa de la función que crea categorías al registrar el usuario, hace que el cron recupere ocurrencias recurrentes pendientes usando la fecha de `Europe/Madrid` y mueve la ejecución diaria a las 02:05 UTC para evitar adelantar la fecha local. Aplica el contenido en **Supabase → SQL Editor** antes del siguiente release de producción. No modifica movimientos existentes.

Para generar tipos actualizados desde el proyecto conectado, instala y autentica Supabase CLI. Después, en PowerShell, define la referencia del proyecto y ejecuta:

```powershell
supabase login
$env:SUPABASE_PROJECT_ID = "<project-ref>"
npm run db:types
```

El CLI escribe temporalmente y reemplaza el archivo de tipos solo si termina correctamente.

## CI/CD y despliegues

GitHub Actions ejecuta lint, comprobación de tipos, tests unitarios, auditoría de dependencias de producción y build en cada pull request y en cada push a `main`. Los despliegues de producción solo se inician al subir un tag semver con formato `v*.*.*` (por ejemplo, `v0.1.0`). El flujo exige que el commit del tag esté en `main` y que el número de versión de `package.json` coincida con el tag. La integración de despliegue Git de Vercel está desactivada para evitar despliegues automáticos por push.

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
